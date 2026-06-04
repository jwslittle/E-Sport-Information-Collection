/**
 * GET /api/cron/sync
 * Vercel Cron Job — LCK 경기 데이터 자동 동기화
 *
 * 스케줄: 매주 월요일 00:00 UTC (한국시간 09:00 KST)
 * 보안: Authorization: Bearer <CRON_SECRET> 헤더 확인
 * Vercel은 cron 요청 시 이 헤더를 자동으로 추가합니다.
 * 수동 동기화는 Admin 페이지 → "지금 동기화" 버튼으로 언제든 실행 가능합니다.
 */
import { NextResponse } from 'next/server'
import { syncCurrentSeason } from '@/lib/services/lck-sync.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel 함수 최대 실행시간 (Pro: 300s)

const CRON_SECRET = process.env.CRON_SECRET

function isAuthorized(req: Request): boolean {
    if (!CRON_SECRET) {
        console.error('[Cron/Sync] CRON_SECRET 환경변수가 설정되지 않았습니다. 요청을 거부합니다.')
        return false
    }
    const authHeader = req.headers.get('authorization')
    return authHeader === `Bearer ${CRON_SECRET}`
}

export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron/Sync] LCK 경기 데이터 동기화 시작')
    const startedAt = Date.now()

    try {
        const result = await syncCurrentSeason(2026, false)

        const elapsed = Date.now() - startedAt
        console.log(`[Cron/Sync] 완료: ${result.matchesUpserted}경기 동기화, ${elapsed}ms`)

        return NextResponse.json({
            ok: true,
            ...result,
            elapsedMs: elapsed,
            timestamp: new Date().toISOString(),
        })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Cron/Sync] 오류:', msg)
        return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
}
