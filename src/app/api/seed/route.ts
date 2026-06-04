/**
 * POST /api/seed  — 긴급 시드용 API (어드민 전용)
 * 일반적으로는 npx tsx prisma/seed.ts 를 사용하세요.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
        message: '시드는 서버 터미널에서 "npx tsx prisma/seed.ts" 명령어로 실행하세요.',
        hint: '가상 팀 10개 + 가상 선수 50명 + 시뮬레이션 일정 45경기',
    })
}
