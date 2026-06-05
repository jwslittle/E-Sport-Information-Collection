/**
 * POST /api/lck/sync
 * Admin: LoL Esports API에서 최신 LCK 데이터 강제 동기화
 *
 * Body (JSON):
 *   year  - number (default: 2026)
 *   reset - boolean (default: false) - sync log 초기화 후 재동기화
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncCurrentSeason, resetSyncLog } from '@/lib/services/lck-sync.service'
import { CURRENT_SEASON, CURRENT_YEAR } from '@/lib/config/season'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const year: number = body.year ?? CURRENT_YEAR
    const reset: boolean = body.reset ?? false

    if (reset) {
        await resetSyncLog(CURRENT_SEASON)
    }

    // ✅ Q-4: 관리자 수동 동기화는 4페이지 조회 — 시즌 전체 커버
    const result = await syncCurrentSeason(year, true, 4)

    return NextResponse.json(result)
}
