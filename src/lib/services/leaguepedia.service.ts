/**
 * Leaguepedia CargoQuery Service
 *
 * 데이터 출처: lol.fandom.com (Leaguepedia) — CC BY-SA 3.0
 * 비상업적 팬 프로젝트용으로만 사용합니다.
 * Rate limit: 10 req/min → 7초 간격 기본 설정
 */

const BASE_URL = 'https://lol.fandom.com/api.php'
const DELAY_MS = 7000

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function cargoQuery(
    tables: string,
    fields: string,
    where: string,
    options: {
        joinOn?: string
        orderBy?: string
        limit?: number
        offset?: number
    } = {}
): Promise<any[]> {
    const { joinOn, orderBy, limit = 50, offset = 0 } = options

    const params = new URLSearchParams({
        action: 'cargoquery',
        format: 'json',
        tables,
        fields,
        where,
        limit: String(Math.min(limit, 500)),
        offset: String(offset),
        origin: '*',
    })

    if (joinOn) params.append('join_on', joinOn)
    if (orderBy) params.append('order_by', orderBy)

    const url = `${BASE_URL}?${params}`
    let retries = 3

    while (retries > 0) {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'EsportSuperTeam/1.0 (non-commercial fan project; contact: jworks6365@gmail.com)',
                },
                next: { revalidate: 0 },
            })

            if (res.status === 429) {
                console.warn('[Leaguepedia] Rate limited, waiting 15s...')
                await sleep(15000)
                retries--
                continue
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`)

            const json = await res.json()
            if (json.error) {
                if (json.error.code === 'ratelimited') {
                    await sleep(15000)
                    retries--
                    continue
                }
                throw new Error(`Leaguepedia error: ${JSON.stringify(json.error)}`)
            }

            return (json.cargoquery ?? []).map((r: any) => r.title)
        } catch (e) {
            retries--
            if (retries === 0) throw e
            await sleep(5000)
        }
    }
    return []
}

/** 여러 페이지를 자동으로 순회하며 전체 결과 수집 */
async function cargoQueryAll(
    tables: string,
    fields: string,
    where: string,
    options: { joinOn?: string; orderBy?: string; pageSize?: number } = {}
): Promise<any[]> {
    const pageSize = options.pageSize ?? 100
    const all: any[] = []
    let offset = 0

    while (true) {
        const batch = await cargoQuery(tables, fields, where, {
            ...options,
            limit: pageSize,
            offset,
        })
        all.push(...batch)
        if (batch.length < pageSize) break
        offset += pageSize
        await sleep(DELAY_MS)
    }

    return all
}

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

export interface LpMatchScheduleRow {
    UniqueMatch: string
    Team1: string
    Team2: string
    DateTime_UTC: string
    Tournament: string
    BestOf: string
    Patch: string
}

export interface LpScoreboardGameRow {
    MatchId: string
    UniqueGame: string
    Tournament: string
    Team1: string
    Team2: string
    WinTeam: string
    DateTime_UTC: string
    Score1: string
    Score2: string
    Gamelength: string
    Patch: string
    GameId: string
}

export interface LpPlayerStatRow {
    GameId: string
    Name: string
    Team: string
    Role: string
    Champion: string
    Kills: string
    Deaths: string
    Assists: string
    CS: string
    Gold: string
    DamageToChampions: string
    VisionScore: string
}

/**
 * 예정된 경기 일정 가져오기 (MatchSchedule 테이블)
 * tournament 예: "LCK/2026 Season/Spring Season"
 */
export async function fetchSchedule(tournamentFilter: string): Promise<LpMatchScheduleRow[]> {
    const fields = 'UniqueMatch,Team1,Team2,DateTime_UTC,Tournament,BestOf,Patch'
    return cargoQueryAll('MatchSchedule', fields, `Tournament LIKE "${tournamentFilter}"`, {
        orderBy: 'DateTime_UTC ASC',
    }) as Promise<LpMatchScheduleRow[]>
}

/**
 * 완료된 경기 결과 가져오기 (ScoreboardGames 테이블)
 * MatchId = UniqueMatch from MatchSchedule
 */
export async function fetchCompletedGames(tournamentFilter: string): Promise<LpScoreboardGameRow[]> {
    const fields = 'MatchId,UniqueGame,Tournament,Team1,Team2,WinTeam,DateTime_UTC,Score1,Score2,Gamelength,Patch,GameId'
    return cargoQueryAll('ScoreboardGames', fields, `Tournament LIKE "${tournamentFilter}"`, {
        orderBy: 'DateTime_UTC DESC',
    }) as Promise<LpScoreboardGameRow[]>
}

/**
 * 특정 경기의 선수별 스탯 (ScoreboardPlayers 테이블)
 */
export async function fetchPlayerStatsForGames(gameIds: string[]): Promise<LpPlayerStatRow[]> {
    if (gameIds.length === 0) return []
    const idList = gameIds.map(id => `"${id}"`).join(',')
    const fields = 'GameId,Name,Team,Role,Champion,Kills,Deaths,Assists,CS,Gold,DamageToChampions,VisionScore'
    return cargoQuery('ScoreboardPlayers', fields, `GameId IN (${idList})`, {
        limit: gameIds.length * 10 + 10,
    }) as Promise<LpPlayerStatRow[]>
}

/**
 * LCK 현재 시즌 전체 데이터 (일정 + 결과 + 선수 스탯)
 * tournamentLike 예: "%LCK%2026%Spring%"
 */
export async function fetchFullSeason(tournamentLike: string) {
    console.log(`[Leaguepedia] Fetching full season: ${tournamentLike}`)

    // 1. 예정된 일정
    const schedule = await fetchSchedule(tournamentLike)
    await sleep(DELAY_MS)

    // 2. 완료된 경기 스코어
    const games = await fetchCompletedGames(tournamentLike)
    await sleep(DELAY_MS)

    // 3. 선수 스탯 (GameId 기준)
    const gameIds = [...new Set(games.map(g => g.GameId).filter(Boolean))]
    const playerStats: LpPlayerStatRow[] = []

    // 배치 처리 (50개씩)
    for (let i = 0; i < gameIds.length; i += 50) {
        const batch = gameIds.slice(i, i + 50)
        const batchStats = await fetchPlayerStatsForGames(batch)
        playerStats.push(...batchStats)
        if (i + 50 < gameIds.length) await sleep(DELAY_MS)
    }

    return { schedule, games, playerStats }
}

/**
 * 가용한 LCK 토너먼트 목록 조회 (최근 N년)
 */
export async function fetchAvailableTournaments(yearFrom = 2023): Promise<string[]> {
    const rows = await cargoQuery(
        'Tournaments',
        'Name,Year',
        `League="LCK" AND Year>=${yearFrom}`,
        { orderBy: 'Year DESC', limit: 50 }
    )
    return rows.map((r: any) => r.Name).filter(Boolean)
}

// 토너먼트 이름 변환 유틸
export function buildTournamentLike(year: number, split: 'Spring' | 'Summer' | 'Playoffs' | 'CUP'): string {
    return `%LCK%${year}%${split}%`
}

export function getSeasonKey(year: number, split: string): string {
    return `${year}-${split.toUpperCase()}`
}
