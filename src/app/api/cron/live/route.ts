/**
 * GET /api/cron/live
 *
 * cron-job.org — 1분마다 LCK 실시간 경기 스코어 자동 동기화 + 경기 종료 시 즉시 예측 정산
 *
 * ── 동작 흐름 ───────────────────────────────────────────────
 * 1) LoL Esports getLive API 호출 (외부 API)
 * 2a) 라이브 경기 있음 → DB lckRealMatch 스코어 + status=LIVE 갱신
 * 2b) 라이브 없음 + DB에 LIVE가 남아있음 → 경기 종료 감지
 *      → syncCurrentSeason(force) 실행 → LIVE → COMPLETED 전환
 *      → processLckPredictions() 즉시 실행 → 경기 종료 직후 GP 지급
 * 2c) 라이브 없음 + DB도 비어있음 → no-op
 *
 * ── 예측 정산 중복 방지 ──────────────────────────────────────
 * processLckPredictions()는 isProcessed 플래그를 트랜잭션 내 재확인하므로
 * 이 크론과 일일 06:00 KST 크론이 동시에 실행되어도 이중 정산 없음.
 *
 * ── 클라이언트 영향 ──────────────────────────────────────────
 * /api/lck/live 는 이 크론이 갱신한 DB를 읽을 뿐,
 * 더 이상 LoL Esports API를 직접 호출하지 않는다.
 *
 * ── 인증 ────────────────────────────────────────────────────
 * Authorization: Bearer <CRON_SECRET> 헤더 필수 (cron-job.org 설정)
 */

import { NextResponse } from 'next/server'
import { fetchLiveLckMatches, transformEventToMatch } from '@/lib/services/lolesports.service'
import { syncCurrentSeason } from '@/lib/services/lck-sync.service'
import { processLckPredictions } from '@/lib/services/prediction-process.service'
import prisma from '@/lib/prisma'
import { CURRENT_YEAR } from '@/lib/config/season'

export const dynamic = 'force-dynamic'
export const maxDuration = 30  // Vercel 설정상 최댓값 (Hobby 플랜 실제 한도: 10초)

/**
 * ✅ Vercel Hobby 10초 제한 방어: 지정 시간 내 완료 안 되면 에러 throw
 * → 정산 실패해도 일일 크론(06:00 KST)이 안전망으로 재처리
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`[Timeout] ${label} exceeded ${ms}ms`)), ms)
    )
    return Promise.race([promise, timeout])
}

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
        // → 전환 즉시 예측 정산 실행 (일일 크론 06:00 KST 대기 불필요)
        if (liveEvents.length === 0 && liveInDbCount > 0) {
            console.log(`[Cron/Live] 경기 종료 감지 (DB LIVE: ${liveInDbCount}건) — 풀 동기화 + 즉시 예측 정산 실행`)

            // 1) 경기 결과 DB 반영 (LIVE → COMPLETED + winner 확정)
            // ✅ Hobby 10초 제한 고려: 동기화 5초, 정산 3초 budget 배분
            const syncResult = await withTimeout(
                syncCurrentSeason(CURRENT_YEAR, true),
                5000, 'syncCurrentSeason'
            )
            console.log(`[Cron/Live] 동기화 완료: ${syncResult.matchesUpserted}경기 갱신`)

            // 2) 즉시 예측 정산 — GP 지급
            let processResult = { processed: 0, gpAwarded: 0, skipped: 0 }
            try {
                processResult = await withTimeout(
                    processLckPredictions(true),
                    3000, 'processLckPredictions'
                )
                console.log(
                    `[Cron/Live] 즉시 예측 정산 완료: ` +
                    `${processResult.processed}건 정산, ${processResult.gpAwarded} GP 지급, ` +
                    `${processResult.skipped}건 스킵`
                )
            } catch (processErr) {
                // 정산 실패해도 동기화 성공 결과는 반환 (일일 크론이 재시도)
                console.error('[Cron/Live] 즉시 정산 오류 (일일 크론에서 재시도됩니다):', processErr)
            }

            return NextResponse.json({
                ok: true,
                liveCount: 0,
                action: 'match-ended-synced-and-processed',
                matchesUpserted: syncResult.matchesUpserted,
                predictionsProcessed: processResult.processed,
                gpAwarded: processResult.gpAwarded,
                predictionsSkipped: processResult.skipped,
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
