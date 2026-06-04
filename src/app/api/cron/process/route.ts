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
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processLckPredictions } from '@/lib/services/prediction-process.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

// ✅ M-7 수정: Admin 세션 또는 CRON_SECRET 둘 다 허용 (admin 페이지에서 직접 호출 가능)
async function isAuthorized(req: Request): Promise<boolean> {
    const session = await getServerSession(authOptions)
    if (session?.user?.role === 'ADMIN') return true
    if (!CRON_SECRET) {
        console.error('[Cron/Process] CRON_SECRET 환경변수가 설정되지 않았습니다.')
        return false
    }
    return req.headers.get('authorization') === `Bearer ${CRON_SECRET}`
}

export async function GET(req: Request) {
    if (!(await isAuthorized(req))) {
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
        return NextResponse.json({ ok: false, error: '정산 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
