/**
 * POST /api/users/onboard — 최초 로그인 시 닉네임 설정
 * 닉네임을 User.name에 저장하고 isOnboarded = true로 설정
 * ✅ PIPA 제15조: termsAgreed=true 전달 시 termsAgreedAt(동의 시각)을 DB에 기록
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 허용 문자: 한글, 영문, 숫자, 언더스코어 (2~15자)
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,15}$/

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const { nickname, termsAgreed, privacyAgreed, ageConfirmed } = body as {
        nickname?: string
        termsAgreed?: boolean
        privacyAgreed?: boolean
        ageConfirmed?: boolean
    }

    // ✅ PIPA 제22조의2: 서버사이드 만 14세 미만 차단 (클라이언트 체크박스만으로는 우회 가능)
    if (!ageConfirmed) {
        return NextResponse.json({ error: '만 14세 이상 확인이 필요합니다.' }, { status: 400 })
    }
    // ✅ PIPA 제22조: 이용약관·개인정보 동의 서버사이드 검증
    if (!termsAgreed || !privacyAgreed) {
        return NextResponse.json({ error: '이용약관 및 개인정보 처리방침 동의가 필요합니다.' }, { status: 400 })
    }

    if (!nickname?.trim()) {
        return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 })
    }

    const trimmed = nickname.trim()

    if (!NICKNAME_REGEX.test(trimmed)) {
        return NextResponse.json(
            { error: '닉네임은 한글·영문·숫자·언더스코어만 사용 가능하며, 2~15자여야 합니다.' },
            { status: 400 }
        )
    }

    // 중복 닉네임 체크 (본인 제외)
    const existing = await prisma.user.findFirst({
        where: { name: trimmed, id: { not: userId } },
        select: { id: true },
    })
    if (existing) {
        return NextResponse.json(
            { error: '이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.' },
            { status: 409 }
        )
    }

    // 닉네임 저장 + 온보딩 완료 처리
    // ✅ PIPA 제15조: termsAgreed=true면 이용약관 동의 시각 기록
    // ✅ PIPA 제22조: privacyAgreed=true면 개인정보처리방침 동의 시각 기록 (법적 증거 보존)
    const now = new Date()
    await prisma.user.update({
        where: { id: userId },
        data: {
            name: trimmed,
            isOnboarded: true,
            ...(termsAgreed ? { termsAgreedAt: now } : {}),
            ...(privacyAgreed ? { privacyAgreedAt: now } : {}),
        },
    })

    return NextResponse.json({ success: true, nickname: trimmed })
}
