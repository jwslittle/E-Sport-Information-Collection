/**
 * GET /api/cron/daily
 * Vercel Cron Job — LCK 데이터 동기화 + 예측 정산 통합 엔드포인트
 *
 * 스케줄: 매일 21:00 UTC = 오전 06:00 KST
 * 보안: Authorization: Bearer <CRON_SECRET> 헤더 확인
 *
 * Vercel Hobby 플랜은 크론잡 1개만 허용하므로
 * sync + process를 하나의 엔드포인트로 통합했습니다.
 * Pro 플랜 업그레이드 시 각각 /api/cron/sync, /api/cron/process 로 분리 가능.
 *
 * ⚠️ Hobby 플랜 함수 최대 실행시간: 10초
 * 두 작업이 10초 내에 완료되지 않으면 Vercel이 강제 종료합니다.
 * Pro 플랜($20/월) 업그레이드 시 최대 300초로 늘어납니다.
 */
import { NextResponse } from 'next/server'
import { syncCurrentSeason } from '@/lib/services/lck-sync.service'
import { processLckPredictions } from '@/lib/services/prediction-process.service'

export const dynamic = 'force-dynamic'
// Vercel Pro 플랜에서만 적용됨 (Hobby: 10초 고정)
export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET

function isAuthorized(req: Request): boolean {
    if (!CRON_SECRET) {
        console.error('[Cron/Daily] CRON_SECRET 환경변수가 설정되지 않았습니다. 요청을 거부합니다.')
        return false
    }
    return req.headers.get('authorization') === `Bearer ${CRON_SECRET}`
}

export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startedAt = Date.now()
    console.log('[Cron/Daily] === 일일 크론잡 시작 ===')

    const report: {
        sync: { ok: boolean; result?: unknown; error?: string; elapsedMs: number }
        process: { ok: boolean; result?: unknown; error?: string; elapsedMs: number }
    } = {
        sync: { ok: false, elapsedMs: 0 },
        process: { ok: false, elapsedMs: 0 },
    }

    // ── 1단계: LCK 경기 데이터 동기화 ──────────────────────────────────────
    console.log('[Cron/Daily] [1/2] LCK 데이터 동기화 시작')
    const syncStart = Date.now()
    try {
        const result = await syncCurrentSeason(2026, false)
        report.sync = { ok: true, result, elapsedMs: Date.now() - syncStart }
        console.log(`[Cron/Daily] [1/2] 동기화 완료: ${result.matchesUpserted}경기, ${report.sync.elapsedMs}ms`)
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        report.sync = { ok: false, error: msg, elapsedMs: Date.now() - syncStart }
        console.error('[Cron/Daily] [1/2] 동기화 오류:', msg)
        // 동기화 실패해도 정산은 계속 진행
    }

    // ── 2단계: 예측 정산 ─────────────────────────────────────────────────
    console.log('[Cron/Daily] [2/2] 예측 정산 시작')
    const processStart = Date.now()
    try {
        const result = await processLckPredictions(true)
        report.process = { ok: true, result, elapsedMs: Date.now() - processStart }
        console.log(`[Cron/Daily] [2/2] 정산 완료: ${result.processed}건, ${result.gpAwarded} GP 지급, ${report.process.elapsedMs}ms`)
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        report.process = { ok: false, error: msg, elapsedMs: Date.now() - processStart }
        console.error('[Cron/Daily] [2/2] 정산 오류:', msg)
    }

    const totalElapsed = Date.now() - startedAt
    const allOk = report.sync.ok && report.process.ok
    console.log(`[Cron/Daily] === 완료: ${totalElapsed}ms (${allOk ? '전체 성공' : '일부 오류'}) ===`)

    return NextResponse.json({
        ok: allOk,
        totalElapsedMs: totalElapsed,
        timestamp: new Date().toISOString(),
        sync: report.sync,
        process: report.process,
    }, { status: allOk ? 200 : 207 }) // 207 Multi-Status: 일부 성공
}
