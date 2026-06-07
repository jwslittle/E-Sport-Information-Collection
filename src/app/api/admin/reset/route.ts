import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ADMIN_EMAILS } from '@/lib/config/admin'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // ✅ HTTP 상태 코드 수정: 비로그인 → 401, 로그인했지만 권한 없음 → 403
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const isAdmin = (session.user as any)?.role === 'ADMIN'
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ✅ 이중 확인: RESET_SECRET 환경변수 필수 — 우발적 실행 방지
    const body = await req.json().catch(() => ({}))
    const { confirmSecret } = body as { confirmSecret?: string }
    const RESET_SECRET = process.env.RESET_SECRET
    if (!RESET_SECRET) {
        return NextResponse.json(
            { error: 'RESET_SECRET 환경변수가 설정되지 않았습니다. Vercel 대시보드에서 설정하세요.' },
            { status: 500 }
        )
    }
    if (confirmSecret !== RESET_SECRET) {
        return NextResponse.json(
            { error: 'RESET_SECRET이 일치하지 않습니다.' },
            { status: 403 }
        )
    }

    try {
        // ✅ L-2 수정: 이메일 직접 로그 제거 → id만 기록 (Sentry 이메일 캡처 방지)
        const adminId = (session?.user as any)?.id ?? 'unknown'
        console.log(`--- Admin Initiated: FULL USER RESET by userId=${adminId} ---`)

        // ✅ 복수 관리자 모두 보호 (ADMIN_EMAILS Set 사용)
        const adminEmailList = [...ADMIN_EMAILS]
        if (adminEmailList.length === 0) {
            return NextResponse.json({ error: 'ADMIN_EMAILS 환경변수가 설정되지 않았습니다.' }, { status: 500 })
        }

        const deleteResult = await prisma.user.deleteMany({
            where: {
                email: { notIn: adminEmailList }
            }
        })

        // ✅ M-1 수정: 관리자 이메일 목록 평문 로그 금지 (Vercel 로그 노출 방지)
        console.log(`Deleted ${deleteResult.count} users (protected ${adminEmailList.length}명 admin 계정 제외)`)

        // Sentry로 실행 알림 (감사 추적)
        Sentry.captureMessage(
            `[Admin Reset] ${deleteResult.count}명 삭제 — 실행자: ${(session?.user as any)?.id ?? 'unknown'}`,
            'warning'
        )

        return NextResponse.json({
            success: true,
            message: `User reset successful. Deleted ${deleteResult.count} users.`,
            deletedCount: deleteResult.count
        })

    } catch (error) {
        // ✅ 내부 에러 메시지 노출 방지
        console.error('User Reset Error:', error)
        return NextResponse.json({ error: '초기화 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
