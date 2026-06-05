/**
 * GET /api/cron/sync
 * Vercel Cron Job — LCK 경기 데이터 자동 동기화
 *
 * 수동 동기화 전용 엔드포인트 — Admin 페이지 → "지금 동기화" 버튼 또는 직접 호출
 * (vercel.json cron 스케줄 없음 — 자동 실행은 /api/cron/daily 에서 담당)
 * 보안: Authorization: Bearer <CRON_SECRET> 헤더 또는 Admin 세션 필요
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncCurrentSeason } from '@/lib/services/lck-sync.service'
import { CURRENT_YEAR } from '@/lib/config/season'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel 함수 최대 실행시간 (Pro: 300s)

const CRON_SECRET = process.env.CRON_SECRET

// ✅ M-7 수정: Admin 세션 또는 CRON_SECRET 둘 다 허용 (admin 페이지에서 직접 호출 가능)
async function isAuthorized(req: Request): Promise<boolean> {
    const session = await getServerSession(authOptions)
    if (session?.user?.role === 'ADMIN') return true
    if (!CRON_SECRET) {
        console.error('[Cron/Sync] CRON_SECRET 환경변수가 설정되지 않았습니다.')
        return false
    }
    return req.headers.get('authorization') === `Bearer ${CRON_SECRET}`
}

export async function GET(req: Request) {
    if (!(await isAuthorized(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron/Sync] LCK 경기 데이터 동기화 시작')
    const startedAt = Date.now()

    try {
        const result = await syncCurrentSeason(CURRENT_YEAR, false)

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
        return NextResponse.json({ ok: false, error: '동기화 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
