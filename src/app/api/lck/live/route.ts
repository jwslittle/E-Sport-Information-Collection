/**
 * GET /api/lck/live
 *
 * 현재 진행 중인 LCK 경기 실시간 스코어
 * - LoL Esports getLive API를 직접 호출해 가장 최신 세트 스코어 반환
 * - 인증 불필요 (공개 정보)
 * - 클라이언트가 30초마다 폴링
 * - 배경에서 DB 상태/스코어도 갱신 (SCHEDULED → LIVE)
 *
 * ── 서버-사이드 인-메모리 캐시 (20초) ──────────────────────────────────
 * 유저가 N명이어도 LoL Esports 외부 API 호출은 20초당 최대 1회로 고정.
 * Vercel 람다 warm 인스턴스 재사용으로 캐시 공유됨.
 * (cold start 시 캐시 미스 → 외부 API 1회 호출 후 재캐시)
 */

import { NextResponse } from 'next/server'
import { fetchLiveLckMatches, transformEventToMatch } from '@/lib/services/lolesports.service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ── 서버-사이드 캐시 ────────────────────────────────────────────────────
interface CachedLivePayload {
    matches: {
        id: string | null
        externalId: string
        team1: string
        team2: string
        team1Name: string | null
        team2Name: string | null
        team1Logo: string | null
        team2Logo: string | null
        team1Score: number
        team2Score: number
        bestOf: number
        scheduledAt: Date | null
    }[]
    liveCount: number
    cachedAt: number
}

let liveCache: CachedLivePayload | null = null
const CACHE_TTL_MS = 20_000 // 20초: 30초 폴링보다 짧게 설정해 항상 신선한 데이터 보장

export async function GET() {
    const now = Date.now()

    // 캐시 유효하면 즉시 반환 (외부 API 호출 없음)
    if (liveCache && now - liveCache.cachedAt < CACHE_TTL_MS) {
        return NextResponse.json({
            matches: liveCache.matches,
            liveCount: liveCache.liveCount,
        })
    }

    try {
        const liveEvents = await fetchLiveLckMatches()

        if (liveEvents.length === 0) {
            // 라이브 없음 → 캐시도 빈 배열로 갱신
            liveCache = { matches: [], liveCount: 0, cachedAt: Date.now() }
            return NextResponse.json({ matches: [], liveCount: 0 })
        }

        // LoL Esports 이벤트 → 내부 포맷
        const transformed = liveEvents.map(e => transformEventToMatch(e))

        // DB에서 내부 ID 조회 (externalId 기준)
        const externalIds = transformed.map(m => m.externalId)
        const dbRows = await prisma.lckRealMatch.findMany({
            where: { externalId: { in: externalIds } },
            select: { id: true, externalId: true },
        })
        const idMap = new Map(dbRows.map(r => [r.externalId, r.id]))

        // 배경 DB 업데이트: status = LIVE + 최신 세트 스코어 반영 (캐시 미스 타이밍에만 실행)
        Promise.all(
            transformed.map(m =>
                prisma.lckRealMatch.updateMany({
                    where: { externalId: m.externalId },
                    data: {
                        status: 'LIVE',
                        team1Score: m.team1Score,
                        team2Score: m.team2Score,
                    },
                })
            )
        ).catch(err => console.error('[/api/lck/live] DB update error:', err))

        const matches = transformed.map(m => ({
            id: idMap.get(m.externalId) ?? null,
            externalId: m.externalId,
            team1: m.team1,
            team2: m.team2,
            team1Name: m.team1Name,
            team2Name: m.team2Name,
            team1Logo: m.team1Logo,
            team2Logo: m.team2Logo,
            team1Score: m.team1Score,
            team2Score: m.team2Score,
            bestOf: m.bestOf,
            scheduledAt: m.scheduledAt,
        }))

        // 캐시 갱신
        liveCache = { matches, liveCount: matches.length, cachedAt: Date.now() }

        return NextResponse.json({ matches, liveCount: matches.length })
    } catch (err) {
        console.error('[/api/lck/live]', err)
        // 실패 시 빈 배열 (graceful degradation — 라이브 섹션 미표시)
        return NextResponse.json({ matches: [], liveCount: 0 })
    }
}
