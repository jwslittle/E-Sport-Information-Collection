import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ADMIN_EMAILS } from '@/lib/config/admin'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    const isAdmin = (session?.user as any)?.role === 'ADMIN'
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log(`--- Admin Initiated: FULL USER RESET by ${session?.user?.email} ---`)

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

        console.log(`Deleted ${deleteResult.count} users (protected: ${adminEmailList.join(', ')})`)

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
