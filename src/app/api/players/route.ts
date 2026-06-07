/**
 * GET /api/players — LCK 선수 목록 조회 (인증 불필요 — 공개 정보)
 * /players 페이지는 비로그인 접근 허용 → API도 공개로 맞춤
 */
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const players = await prisma.player.findMany({
            include: {
                team: { select: { code: true, name: true, primaryColor: true } },
            },
            orderBy: [{ position: 'asc' }, { basePrice: 'desc' }],
            take: 200,
        })
        return NextResponse.json(players)
    } catch (error) {
        console.error('Failed to fetch players:', error)
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
    }
}
