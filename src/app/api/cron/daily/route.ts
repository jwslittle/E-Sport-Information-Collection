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
 * ⚠️ Hobby 플랜 타임아웃 방어 전략
 * Hobby 플랜은 함수 최대 실행시간 10초 고정.
 * → 전체 예산 8.5초 배분: sync 최대 4초 / process 최대 4초 / 나머지 오버헤드
 * → 각 단계에 withTimeout() 래퍼 적용, 초과 시 TIMEOUT 오류로 조기 종료
 * → 타임아웃 발생 시 Sentry 알림 → 다음날 자동 재시도 or 관리자 수동 실행
 *
 * Pro 플랜($20/월) 업그레이드 시 maxDuration=300 적용 → 여유 실행 가능
 */
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { syncCurrentSeason } from '@/lib/services/lck-sync.service'
import { processLckPredictions } from '@/lib/services/prediction-process.service'

export const dynamic = 'force-dynamic'
// Vercel Pro 플랜에서만 적용됨 (Hobby: 10초 고정)
export const maxDuration = 300

// ── 타임아웃 상수 ────────────────────────────────────────────────────────────
const TOTAL_BUDGET_MS = 8500   // 전체 예산 8.5초 (Hobby 10초 - 오버헤드 1.5초)
const SYNC_BUDGET_MS  = 4000   // sync 최대 4초
const MIN_PROCESS_MS  = 500    // process 실행 최소 여유 (이 이하면 스킵)

/**
 * Promise에 타임아웃을 씌웁니다.
 * 초과 시 Error('TIMEOUT:<label>') 를 throw합니다.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`TIMEOUT:${label}`)), ms)
        ),
    ])
}

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
    console.log('[Cron/Daily] === 일일 크론잡 시작 (Hobby 예산: 8.5초) ===')

    const report: {
        sync: { ok: boolean; result?: unknown; error?: string; elapsedMs: number; timedOut?: boolean }
        process: { ok: boolean; result?: unknown; error?: string; elapsedMs: number; timedOut?: boolean; skipped?: boolean }
    } = {
        sync:    { ok: false, elapsedMs: 0 },
        process: { ok: false, elapsedMs: 0 },
    }

    // ── 1단계: LCK 경기 데이터 동기화 (최대 4초) ──────────────────────────
    console.log(`[Cron/Daily] [1/2] 동기화 시작 (최대 ${SYNC_BUDGET_MS}ms)`)
    const syncStart = Date.now()
    try {
        const result = await withTimeout(
            syncCurrentSeason(2026, false),
            SYNC_BUDGET_MS,
            'sync',
        )
        report.sync = { ok: true, result, elapsedMs: Date.now() - syncStart }
        console.log(`[Cron/Daily] [1/2] 동기화 완료: ${result.matchesUpserted}경기, ${report.sync.elapsedMs}ms`)
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        const isTimeout = msg.startsWith('TIMEOUT:')
        report.sync = { ok: false, error: msg, elapsedMs: Date.now() - syncStart, timedOut: isTimeout }
        if (isTimeout) {
            console.warn(`[Cron/Daily] [1/2] 동기화 타임아웃 (${SYNC_BUDGET_MS}ms 초과) — 정산은 계속 진행`)
        } else {
            console.error('[Cron/Daily] [1/2] 동기화 오류:', msg)
        }
        Sentry.captureException(err, { tags: { cron: 'daily', step: 'sync', timedOut: isTimeout } })
        // 동기화 실패/타임아웃이어도 정산은 계속 진행
    }

    // ── 2단계: 예측 정산 (잔여 예산 내) ──────────────────────────────────
    const elapsed = Date.now() - startedAt
    const processBudget = Math.min(TOTAL_BUDGET_MS - elapsed - 200, TOTAL_BUDGET_MS / 2)

    if (processBudget < MIN_PROCESS_MS) {
        // 시간이 너무 없으면 정산 스킵 (타임아웃 강제종료보다 클린하게 종료)
        report.process = { ok: false, error: '시간 초과로 스킵', elapsedMs: 0, skipped: true }
        console.warn(`[Cron/Daily] [2/2] 정산 스킵 — 잔여 예산 ${processBudget}ms 부족 (최소 ${MIN_PROCESS_MS}ms 필요)`)
        Sentry.captureMessage('[Cron/Daily] 정산 스킵 — Hobby 예산 초과', 'warning')
    } else {
        console.log(`[Cron/Daily] [2/2] 정산 시작 (최대 ${processBudget}ms)`)
        const processStart = Date.now()
        try {
            const result = await withTimeout(
                processLckPredictions(true),
                processBudget,
                'process',
            )
            report.process = { ok: true, result, elapsedMs: Date.now() - processStart }
            console.log(`[Cron/Daily] [2/2] 정산 완료: ${result.processed}건, ${result.gpAwarded} GP 지급, ${report.process.elapsedMs}ms`)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            const isTimeout = msg.startsWith('TIMEOUT:')
            report.process = { ok: false, error: msg, elapsedMs: Date.now() - processStart, timedOut: isTimeout }
            if (isTimeout) {
                console.warn(`[Cron/Daily] [2/2] 정산 타임아웃 (${processBudget}ms 초과)`)
            } else {
                console.error('[Cron/Daily] [2/2] 정산 오류:', msg)
            }
            Sentry.captureException(err, { tags: { cron: 'daily', step: 'process', timedOut: isTimeout } })
        }
    }

    const totalElapsed = Date.now() - startedAt
    const allOk = report.sync.ok && report.process.ok
    console.log(`[Cron/Daily] === 완료: ${totalElapsed}ms / 8500ms 예산 (${allOk ? '전체 성공' : '일부 오류'}) ===`)

    return NextResponse.json({
        ok: allOk,
        totalElapsedMs: totalElapsed,
        budgetMs: TOTAL_BUDGET_MS,
        timestamp: new Date().toISOString(),
        sync: report.sync,
        process: report.process,
    }, { status: allOk ? 200 : 207 }) // 207 Multi-Status: 일부 성공
}
