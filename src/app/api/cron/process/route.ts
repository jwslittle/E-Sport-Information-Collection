/**
 * GET /api/cron/process
 * Vercel Cron Job — LCK 예측 정산 자동화
 *
 * 스케줄: 매일 21:00 UTC = 오전 06:00 KST
 * 보안: Authorization: Bearer <CRON_SECRET> 헤더 확인
 * Vercel은 cron 요청 시 이 헤더를 자동으로 추가합니다.
 * 전날 완료된 경기의 예측을 정산하고 GP를 지급합니다.
 */
import { NextResponse } from 'next/server'
import { processLckPredictions } from '@/lib/services/prediction-process.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

function isAuthorized(req: Request): boolean {
    if (!CRON_SECRET) {
        console.error('[Cron/Process] CRON_SECRET 환경변수가 설정되지 않았습니다. 요청을 거부합니다.')
        return false
    }
    const authHeader = req.headers.get('authorization')
    return authHeader === `Bearer ${CRON_SECRET}`
}

export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron/Process] LCK 예측 정산 시작')
    const startedAt = Date.now()

    try {
        const result = await processLckPredictions(true)
        const elapsed = Date.now() - startedAt

        console.log(`[Cron/Process] 완료: ${result.processed}건 처리, ${result.gpAwarded} GP 지급, ${elapsed}ms`)

        return NextResponse.json({
            ok: true,
            ...result,
            elapsedMs: elapsed,
            timestamp: new Date().toISOString(),
        })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Cron/Process] 오류:', msg)
        return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
}
