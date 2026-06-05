/**
 * LCK 경기 데이터 동기화 서비스
 * LoL Esports API → PostgreSQL (캐싱)
 *
 * 캐시 정책:
 *  - 기본: 4시간마다 자동 동기화
 *  - 오류 시: 30분 후 재시도
 */

import prisma from '@/lib/prisma'
import { fetchLckCurrentSeason, transformEventToMatch, getSeasonKeyFromDate } from './lolesports.service'
import { CURRENT_SEASON } from '@/lib/config/season'

const STALE_HOURS = 4
const ERROR_RETRY_MINUTES = 30

export interface SyncResult {
    synced: boolean
    matchesUpserted: number
    fromCache: boolean
    error?: string
    dataSource?: string
}

function isStale(lastSync: Date, hours: number): boolean {
    const ageMs = Date.now() - lastSync.getTime()
    return ageMs > hours * 60 * 60 * 1000
}

/** 동기화 필요 여부 확인 */
export async function needsSync(seasonKey: string): Promise<boolean> {
    const log = await prisma.dataSyncLog.findUnique({
        where: { dataType: `LCK_${seasonKey}` },
    })
    if (!log) return true
    if (log.status === 'ERROR') {
        const ageMs = Date.now() - log.updatedAt.getTime()
        return ageMs > ERROR_RETRY_MINUTES * 60 * 1000
    }
    return isStale(log.lastSyncAt, STALE_HOURS)
}

/** LCK 동기화 강제 초기화 (관리자용) — seasonKey에 해당하는 로그만 삭제 */
export async function resetSyncLog(seasonKey: string): Promise<void> {
    // ✅ M-4 수정: 파라미터를 실제로 사용 (이전에는 전체 LCK_ 로그를 삭제하던 버그)
    const dataType = `LCK_${seasonKey}`
    await prisma.dataSyncLog.deleteMany({
        where: { dataType },
    })
    console.log(`[LckSync] Reset sync log: ${dataType}`)
}

/**
 * 현재 시즌 LCK 데이터 동기화 (LoL Esports API 사용)
 * @param maxPages API 페이지 수 (기본 2 = 크론 안전 범위 / 관리자 수동 시 4 권장)
 */
export async function syncCurrentSeason(
    year = 2026,
    forceRefresh = false,
    maxPages = 2,
): Promise<SyncResult> {
    // 주요 시즌 키 (현재 시즌은 season.ts에서 관리)
    const seasonKey = year === 2026 ? CURRENT_SEASON : `${year}-SPRING`
    const dataType = `LCK_${seasonKey}`

    if (!forceRefresh) {
        const shouldSync = await needsSync(seasonKey)
        if (!shouldSync) {
            return { synced: false, fromCache: true, matchesUpserted: 0 }
        }
    }

    console.log(`[LckSync] Syncing LCK season ${seasonKey} via LoL Esports API`)

    try {
        // LoL Esports API에서 현재 시즌 경기 가져오기 (페이지 수 조절)
        const events = await fetchLckCurrentSeason(maxPages)

        if (events.length === 0) {
            // 데이터 없음 - 오류로 처리
            await prisma.dataSyncLog.upsert({
                where: { dataType },
                create: { dataType, lastSyncAt: new Date(), status: 'ERROR', details: 'No events returned from LoL Esports API' },
                update: { lastSyncAt: new Date(), status: 'ERROR', details: 'No events returned from LoL Esports API' },
            })
            return { synced: false, fromCache: false, matchesUpserted: 0, error: 'No events returned' }
        }

        console.log(`[LckSync] Got ${events.length} LCK events from LoL Esports API`)

        let matchesUpserted = 0

        for (const event of events) {
            const matchData = transformEventToMatch(event)

            await prisma.lckRealMatch.upsert({
                where: { externalId: matchData.externalId },
                create: {
                    externalId: matchData.externalId,
                    tournament: matchData.tournament,
                    displayName: matchData.displayName,
                    season: matchData.season,
                    patch: null,
                    team1: matchData.team1,
                    team2: matchData.team2,
                    team1Name: matchData.team1Name,
                    team2Name: matchData.team2Name,
                    team1Logo: matchData.team1Logo,
                    team2Logo: matchData.team2Logo,
                    team1Score: matchData.team1Score,
                    team2Score: matchData.team2Score,
                    winner: matchData.winner,
                    bestOf: matchData.bestOf,
                    scheduledAt: matchData.scheduledAt,
                    completedAt: matchData.completedAt,
                    status: matchData.status,
                    syncedAt: new Date(),
                },
                update: {
                    team1Name: matchData.team1Name,
                    team2Name: matchData.team2Name,
                    team1Logo: matchData.team1Logo,
                    team2Logo: matchData.team2Logo,
                    team1Score: matchData.team1Score,
                    team2Score: matchData.team2Score,
                    winner: matchData.winner,
                    status: matchData.status,
                    completedAt: matchData.completedAt,
                    syncedAt: new Date(),
                },
            })
            matchesUpserted++
        }

        // 성공 로그
        await prisma.dataSyncLog.upsert({
            where: { dataType },
            create: { dataType, lastSyncAt: new Date(), status: 'OK', details: `${matchesUpserted} matches synced` },
            update: { lastSyncAt: new Date(), status: 'OK', details: `${matchesUpserted} matches synced` },
        })

        console.log(`[LckSync] Done: ${matchesUpserted} matches upserted`)

        return {
            synced: true,
            fromCache: false,
            matchesUpserted,
            dataSource: 'LoL Esports API',
        }
    } catch (err: any) {
        const errMsg = String(err)
        await prisma.dataSyncLog.upsert({
            where: { dataType },
            create: { dataType, lastSyncAt: new Date(), status: 'ERROR', details: errMsg },
            update: { lastSyncAt: new Date(), status: 'ERROR', details: errMsg },
        }).catch(() => {})

        console.error('[LckSync] Error:', err)
        return {
            synced: false,
            fromCache: false,
            matchesUpserted: 0,
            error: errMsg,
        }
    }
}

/**
 * DB에서 경기 목록 조회 (필터 포함)
 *
 * includeGames: false (기본) → 경기 헤더 정보만 반환 (가볍고 빠름)
 * includeGames: true         → games + playerStats까지 포함
 *   (경기 탭 상세 뷰처럼 선수 스탯이 필요한 경우에만 사용)
 *
 * 200경기 × 3게임 × 10선수 ≒ 6,000 rows — 불필요한 호출에서 생략하면 비용이 크게 줄어듦
 */
export async function getMatchesFromDb(options: {
    season?: string
    status?: string
    team?: string
    limit?: number
    offset?: number
    includeGames?: boolean
}) {
    const { season, status, team, limit = 100, offset = 0, includeGames = false } = options

    const where: any = {}
    if (season) where.season = season
    if (status) where.status = status
    if (team) where.OR = [{ team1: team }, { team2: team }]

    return prisma.lckRealMatch.findMany({
        where,
        ...(includeGames ? {
            include: {
                games: {
                    orderBy: { gameNumber: 'asc' },
                    include: {
                        playerStats: { orderBy: [{ team: 'asc' }, { kills: 'desc' }] },
                    },
                },
            },
        } : {}),
        orderBy: { scheduledAt: 'asc' },
        take: limit,
        skip: offset,
    })
}

/** 동기화 상태 조회 */
export async function getSyncStatus(): Promise<{
    status: string
    lastSyncAt: Date | null
    details: string | null
    matchCount: number
} | null> {
    const logs = await prisma.dataSyncLog.findMany({
        where: { dataType: { startsWith: 'LCK_' } },
        orderBy: { lastSyncAt: 'desc' },
    })

    if (logs.length === 0) return null

    const latest = logs[0]
    const matchCount = await prisma.lckRealMatch.count()

    return {
        status: latest.status,
        lastSyncAt: latest.lastSyncAt,
        details: latest.details,
        matchCount,
    }
}
