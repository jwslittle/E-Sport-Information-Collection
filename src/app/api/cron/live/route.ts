/**
 * GET /api/cron/live
 *
 * Vercel Cron — 1분마다 LCK 실시간 경기 스코어 자동 동기화
 *
 * ── 동작 흐름 ───────────────────────────────────────────────
 * 1) LoL Esports getLive API 호출 (외부 API)
 * 2a) 라이브 경기 있음 → DB lckRealMatch 스코어 + status=LIVE 갱신
 * 2b) 라이브 없음 + DB에 LIVE가 남아있음 → 경기 종료 감지
 *      → syncCurrentSeason(force) 실행 → LIVE → COMPLETED 전환
 * 2c) 라이브 없음 + DB도 비어있음 → no-op
 *
 * ── 클라이언트 영향 ──────────────────────────────────────────
 * /api/lck/live 는 이 크론이 갱신한 DB를 읽을 뿐,
 * 더 이상 LoL Esports API를 직접 호출하지 않는다.
 *
 * ── 인증 ────────────────────────────────────────────────────
 * Vercel Cron은 Authorization: Bearer <CRON_SECRET> 헤더를 자동 포함
 * vercel.json cron schedule: "* * * * *"  (매 1분, Pro plan 필요)
 */

import { NextResponse } from 'next/server'
import { fetchLiveLckMatches, transformEventToMatch } from '@/lib/services/lolesports.service'
import { syncCurrentSeason } from '@/lib/services/lck-sync.service'
import prisma from '@/lib/prisma'
import { CURRENT_YEAR } from '@/lib/config/season'

export const dynamic = 'force-dynamic'
export const maxDuration = 30  // Vercel 최대 실행시간 (초)

const CRON_SECRET = process.env.CRON_SECRET

function isAuthorized(req: Request): boolean {
    if (!CRON_SECRET) {
        console.error('[Cron/Live] CRON_SECRET 환경변수가 설정되지 않았습니다.')
        return false
    }
    return req.headers.get('authorization') === `Bearer ${CRON_SECRET}`
}

export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startedAt = Date.now()

    try {
        // 1. LoL Esports getLive API 호출 (외부 API 호출 발생 지점 — 크론만 여기 진입)
        const liveEvents = await fetchLiveLckMatches()

        // 2. DB에 현재 LIVE 상태로 남아있는 경기 수 확인
        const liveInDbCount = await prisma.lckRealMatch.count({
            where: { status: 'LIVE' },
        })

        // ── 케이스 2b: 경기 종료 감지 ───────────────────────────────
        // API에는 더 이상 라이브가 없지만 DB에 LIVE가 남아있음
        // → 경기 종료된 것이므로 풀 동기화로 LIVE → COMPLETED 전환
        if (liveEvents.length === 0 && liveInDbCount > 0) {
            console.log(`[Cron/Live] 경기 종료 감지 (DB LIVE: ${liveInDbCount}건) — 풀 동기화 실행`)
            const syncResult = await syncCurrentSeason(CURRENT_YEAR, true)
            return NextResponse.json({
                ok: true,
                liveCount: 0,
                action: 'full-sync-after-match-end',
                matchesUpserted: syncResult.matchesUpserted,
                elapsedMs: Date.now() - startedAt,
                timestamp: new Date().toISOString(),
            })
        }

        // ── 케이스 2c: 라이브 없음, DB도 비어있음 ───────────────────
        if (liveEvents.length === 0) {
            return NextResponse.json({
                ok: true,
                liveCount: 0,
                action: 'no-op',
                elapsedMs: Date.now() - startedAt,
                timestamp: new Date().toISOString(),
            })
        }

        // ── 케이스 2a: 라이브 경기 스코어 갱신 ─────────────────────
        const transformed = liveEvents.map(e => transformEventToMatch(e))

        await Promise.all(
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
        )

        const elapsed = Date.now() - startedAt
        console.log(
            `[Cron/Live] ${transformed.length}경기 스코어 업데이트 완료, ${elapsed}ms — ` +
            transformed.map(m => `${m.team1} ${m.team1Score}:${m.team2Score} ${m.team2}`).join(' / ')
        )

        return NextResponse.json({
            ok: true,
            liveCount: transformed.length,
            action: 'scores-updated',
            matches: transformed.map(m => ({
                externalId: m.externalId,
                score: `${m.team1} ${m.team1Score}:${m.team2Score} ${m.team2}`,
            })),
            elapsedMs: elapsed,
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Cron/Live] 오류:', msg)
        return NextResponse.json(
            { ok: false, error: '라이브 동기화 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
