/**
 * GET /api/lck/matches
 *
 * Query params:
 *   season   - "2026-SPLIT2" | "2026-SPLIT1" | "ALL" (default: 2026-SPLIT2)
 *   status   - "SCHEDULED" | "LIVE" | "COMPLETED" | "ALL" (default: ALL)
 *   team     - team code filter (e.g. "T1")
 *   limit    - number (default: 100)
 *   offset   - number (default: 0)
 *   sync     - "1" to force re-sync (admin only)
 *   reset    - "1" to reset sync log (admin only)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
    syncCurrentSeason,
    getMatchesFromDb,
    needsSync,
    resetSyncLog,
    getSyncStatus,
} from '@/lib/services/lck-sync.service'
import { CURRENT_SEASON, CURRENT_YEAR } from '@/lib/config/season'

export const dynamic = 'force-dynamic'

const DEFAULT_SEASON = CURRENT_SEASON

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const season = searchParams.get('season') ?? DEFAULT_SEASON
    const status = searchParams.get('status') ?? undefined
    const team = searchParams.get('team') ?? undefined
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)
    const offset = Math.max(0, Math.min(parseInt(searchParams.get('offset') ?? '0') || 0, 10000))
    const forceSync = searchParams.get('sync') === '1'
    const resetSync = searchParams.get('reset') === '1'
    // games=1 일 때만 게임 상세(playerStats) 포함 — 경기 탭 전용, 기본 생략으로 쿼리 최적화
    const includeGames = searchParams.get('games') === '1'

    // 관리자 전용 파라미터 확인
    if (forceSync || resetSync) {
        const session = await getServerSession(authOptions)
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    }

    try {
        // 동기화 로그 초기화 (관리자)
        if (resetSync) {
            await resetSyncLog(DEFAULT_SEASON)
        }

        // 현재 시즌이면 자동 동기화 체크
        const isCurrentSeason = season === DEFAULT_SEASON || season === 'ALL'
        if (isCurrentSeason) {
            const shouldSync = forceSync || (await needsSync(DEFAULT_SEASON))
            if (shouldSync) {
                const hasData = await getMatchesFromDb({ season: DEFAULT_SEASON, limit: 1 }).then(r => r.length > 0)
                if (!hasData || forceSync) {
                    // 첫 로드이거나 강제 동기화 시 await
                    await syncCurrentSeason(CURRENT_YEAR, forceSync)
                } else {
                    // 이미 데이터 있으면 백그라운드 동기화
                    syncCurrentSeason(CURRENT_YEAR, false).catch(console.error)
                }
            }
        }

        // DB에서 경기 목록 조회
        const matches = await getMatchesFromDb({
            season: season === 'ALL' ? undefined : season,
            status: status === 'ALL' ? undefined : status,
            team,
            limit,
            offset,
            includeGames,
        })

        // 동기화 상태도 함께 반환
        const syncStatus = await getSyncStatus()

        return NextResponse.json({
            matches,
            season,
            total: matches.length,
            syncStatus,
        })
    } catch (err: unknown) {
        console.error('[API /lck/matches]', err)
        // ✅ 내부 에러 메시지 노출 금지
        return NextResponse.json({ error: '경기 데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
