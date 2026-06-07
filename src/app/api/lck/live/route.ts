/**
 * GET /api/lck/live
 *
 * 현재 진행 중인 LCK 경기 실시간 스코어
 *
 * ── 데이터 흐름 ─────────────────────────────────────────────
 * 이 엔드포인트는 DB 조회만 한다. 외부 API 호출 없음.
 *
 * 실시간 갱신은 Vercel Cron (매 1분) → /api/cron/live 가 담당:
 *   LoL Esports getLive API → DB lckRealMatch 업데이트
 *
 * 클라이언트는 60초마다 이 엔드포인트를 폴링 → DB에서 최신 스코어 반환
 * 최대 지연: 크론 갱신 간격(60s) + 클라이언트 폴링 간격(60s) = ~2분
 *
 * ── 인증 ────────────────────────────────────────────────────
 * 공개 (인증 불필요) — 라이브 스코어는 공개 정보
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const matches = await prisma.lckRealMatch.findMany({
            where: { status: 'LIVE' },
            select: {
                id: true,
                externalId: true,
                team1: true,
                team2: true,
                team1Name: true,
                team2Name: true,
                team1Logo: true,
                team2Logo: true,
                team1Score: true,
                team2Score: true,
                bestOf: true,
                scheduledAt: true,
            },
            orderBy: { scheduledAt: 'asc' },
        })

        return NextResponse.json({ matches, liveCount: matches.length })
    } catch (err) {
        console.error('[/api/lck/live]', err)
        return NextResponse.json({ matches: [], liveCount: 0 })
    }
}
