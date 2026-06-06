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
        hint: 'LCK 실제 팀/선수 데이터 시딩은 npx tsx prisma/seed.ts 또는 /api/admin/cosmetics/seed (코스메틱) 사용',
    })
}
