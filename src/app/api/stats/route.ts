/**
 * GET /api/stats
 * 연도별 팀/선수 통계를 반환합니다.
 * - 2014~2025: JSON 파일 기반 (Oracle's Elixir 데이터)
 * - 2026~:     DB 기반 라이브 쿼리 (LckRealMatch + LckGameStat + LckPlayerGameStat)
 */
import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import prisma from '@/lib/prisma'

const HISTORY_DIR = path.join(process.cwd(), 'src/data/history')

// ─── JSON 기반 헬퍼 ────────────────────────────────────────────────────────

function getAvailableYears(): string[] {
    if (!fs.existsSync(HISTORY_DIR)) return []
    return fs.readdirSync(HISTORY_DIR)
        .filter(f => f.startsWith('stats_') && f.endsWith('.json'))
        .map(f => f.replace('stats_', '').replace('.json', ''))
        .sort()
}

function loadStats(year: string, type: 'team' | 'player', tournament: string): any[] {
    if (!year || year === 'all') {
        return getAvailableYears().flatMap(y => loadStats(y, type, tournament))
    }
    const filePath = path.join(HISTORY_DIR, `stats_${year}.json`)
    if (!fs.existsSync(filePath)) return []
    try {
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const slice = json.stats[tournament || 'all']
        if (!slice) return []
        return type === 'team' ? (slice.teams ?? []) : (slice.players ?? [])
    } catch { return [] }
}

function loadStatsRange(yearFrom: string, yearTo: string, type: 'team' | 'player', tournament: string): any[] {
    return getAvailableYears()
        .filter(y => y >= yearFrom && y <= yearTo)
        .flatMap(y => loadStats(y, type, tournament))
}

// ─── 2026+ DB 라이브 헬퍼 ─────────────────────────────────────────────────

/** "MM:SS" → 분(float) */
function parseDurationMins(dur: string | null): number {
    if (!dur) return 30
    const parts = dur.split(':').map(Number)
    return (parts[0] ?? 0) + (parts[1] ?? 0) / 60
}

/** DB matches → 팀 통계 배열
 *  게임별 스탯이 없으면(게임 수 = 0) 매치 결과(team1Score/team2Score)로 집계 */
function buildTeamStats(
    matches: any[],
    teamNameMap: Record<string, string>,
    tournamentLabel: string,
): any[] {
    const map: Record<string, any> = {}

    const ensureTeam = (tc: string) => {
        if (!map[tc]) map[tc] = {
            teamName: teamNameMap[tc] ?? tc,
            year: 2026,
            tournament: tournamentLabel,
            games: 0, wins: 0, losses: 0,
            totalKills: 0, totalDeaths: 0, totalAssists: 0, totalDamage: 0,
        }
    }

    for (const m of matches) {
        if (!m.team1 || !m.team2) continue

        const hasGameStats = (m.games?.length ?? 0) > 0

        if (hasGameStats) {
            // 게임별 통계 집계 (detail level)
            for (const game of m.games) {
                for (const tc of [m.team1, m.team2]) {
                    ensureTeam(tc)
                    const s = map[tc]
                    s.games++
                    if (game.winner === tc) s.wins++
                    else if (game.winner) s.losses++
                    for (const ps of game.playerStats ?? []) {
                        if (ps.team === tc) {
                            s.totalKills   += ps.kills
                            s.totalDeaths  += ps.deaths
                            s.totalAssists += ps.assists
                            s.totalDamage  += ps.damage
                        }
                    }
                }
            }
        } else if (m.winner) {
            // 매치 결과만 있는 경우 (score 기반 집계)
            ensureTeam(m.team1); ensureTeam(m.team2)
            const s1 = map[m.team1], s2 = map[m.team2]
            const score1 = m.team1Score ?? 0, score2 = m.team2Score ?? 0
            s1.games += score1 + score2; s1.wins += score1; s1.losses += score2
            s2.games += score1 + score2; s2.wins += score2; s2.losses += score1
        }
    }
    return Object.values(map)
}

/** DB matches → 선수 통계 배열 */
function buildPlayerStats(
    matches: any[],
    teamNameMap: Record<string, string>,
    tournamentLabel: string,
): any[] {
    const map: Record<string, any> = {}
    for (const m of matches) {
        const label = tournamentLabel
        for (const game of m.games ?? []) {
            const dur = parseDurationMins(game.duration)
            for (const ps of game.playerStats ?? []) {
                const key = `${ps.playerName}__${ps.team}`
                if (!map[key]) {
                    map[key] = {
                        playerName: ps.playerName,
                        teamName: teamNameMap[ps.team] ?? ps.team,
                        position: ps.position ?? 'UNKNOWN',
                        year: 2026,
                        tournament: label,
                        games: 0, wins: 0, losses: 0,
                        totalKills: 0, totalDeaths: 0, totalAssists: 0,
                        totalDamage: 0, totalDurMin: 0, totalVisionScore: 0,
                    }
                }
                const p = map[key]
                p.games++
                if (game.winner === ps.team) p.wins++
                else if (game.winner) p.losses++
                p.totalKills       += ps.kills
                p.totalDeaths      += ps.deaths
                p.totalAssists     += ps.assists
                p.totalDamage      += ps.damage
                p.totalDurMin      += dur
                p.totalVisionScore += ps.visionScore
            }
        }
    }
    return Object.values(map).map((p: any) => ({
        playerName: p.playerName,
        teamName: p.teamName,
        position: p.position,
        year: p.year,
        tournament: p.tournament,
        games: p.games, wins: p.wins, losses: p.losses,
        totalKills: p.totalKills, totalDeaths: p.totalDeaths,
        totalAssists: p.totalAssists, totalDamage: p.totalDamage,
        averageKDA: p.totalDeaths > 0
            ? (p.totalKills + p.totalAssists) / p.totalDeaths
            : (p.totalKills + p.totalAssists),
        averageDPM: p.totalDurMin > 0 ? p.totalDamage / p.totalDurMin : 0,
        averageVisionScore: p.games > 0 ? p.totalVisionScore / p.games : 0,
    }))
}

/** "LCK 2026 Spring" → "2026-SPLIT1" 역매핑 */
function displayNameToSeason(display: string): string | null {
    const m = display.match(/LCK (\d{4}) (.+)/)
    if (!m) return null
    const codes: Record<string, string> = {
        'Spring': 'SPLIT1', 'Summer': 'SPLIT2', 'Fall': 'SPLIT3',
        'Playoffs': 'PLAYOFFS', 'Kickoff': 'KICKOFF', 'Cup': 'CUP', 'Worlds': 'WORLDS',
    }
    return `${m[1]}-${codes[m[2]] ?? m[2].toUpperCase()}`
}

/**
 * DB에서 2026 라이브 통계를 집계합니다.
 * lookupKey 예시: 'all_1', 'all_korea_1', 'LCK 2026 Spring'
 */
async function loadLiveStats(type: 'team' | 'player', lookupKey: string): Promise<any[]> {
    // 국제/기타 카테고리는 DB에 없음
    const baseKey = lookupKey.replace(/_\d+$/, '')   // "all_korea_1" → "all_korea"
    if (baseKey === 'all_intl' || baseKey === 'all_others') return []

    const isAll = baseKey.startsWith('all')
    const specificTournament = isAll ? null : lookupKey  // 특정 대회명 (e.g. "LCK 2026 Spring")
    const seasonCode = specificTournament ? displayNameToSeason(specificTournament) : null

    // ✅ M-3 수정: player 타입만 games+playerStats 포함 (team 타입은 match-level fallback 사용)
    // buildTeamStats에는 m.winner 기반 폴백(team1Score/team2Score)이 이미 구현되어 있음
    // buildPlayerStats는 game.playerStats 필수 → player 타입에서만 include
    const matches = await prisma.lckRealMatch.findMany({
        where: {
            season: seasonCode
                ? { equals: seasonCode }
                : { startsWith: '2026' },
        },
        ...(type === 'player' ? {
            include: { games: { include: { playerStats: true } } },
        } : {}),
        orderBy: { scheduledAt: 'asc' },
    })

    if (matches.length === 0) return []

    // 팀 코드 → 팀명 맵
    const teamNameMap: Record<string, string> = {}
    for (const m of matches) {
        if (m.team1 && m.team1Name) teamNameMap[m.team1] = m.team1Name
        if (m.team2 && m.team2Name) teamNameMap[m.team2] = m.team2Name
    }

    const label = isAll ? 'LCK 2026 국내 통합' : (specificTournament ?? 'LCK 2026')

    return type === 'team'
        ? buildTeamStats(matches, teamNameMap, label)
        : buildPlayerStats(matches, teamNameMap, label)
}

// ─── GET 핸들러 ───────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const type        = (searchParams.get('type') || 'team') as 'team' | 'player'
    const year        = searchParams.get('year')
    const yearFrom    = searchParams.get('yearFrom')
    const yearTo      = searchParams.get('yearTo')
    const tournament  = searchParams.get('tournament') || 'all'
    const sort        = searchParams.get('sort')  || 'wins'
    const order       = searchParams.get('order') || 'desc'
    const search      = searchParams.get('search') || ''
    const division    = searchParams.get('division') || '1'

    try {
        // ── 1. lookupKey 구성 ────────────────────────────────────────
        let lookupKey = tournament
        if (lookupKey.startsWith('all')) {
            lookupKey = lookupKey + '_' + division
        }

        // ── 2. 데이터 로드 ───────────────────────────────────────────
        const liveJsonPath = path.join(HISTORY_DIR, 'stats_2026.json')
        const has2026Json  = fs.existsSync(liveJsonPath)

        let data: any[]

        if (yearFrom && yearTo) {
            // 범위 쿼리
            data = loadStatsRange(yearFrom, yearTo, type, lookupKey)
            // 범위에 2026이 포함되고 JSON 파일이 없으면 DB에서 추가
            if (yearTo >= '2026' && !has2026Json) {
                const live = await loadLiveStats(type, lookupKey)
                data = data.concat(live)
            }
        } else if ((year === '2026' || !year) && !has2026Json && (year === '2026')) {
            // 2026 단일 선택 & JSON 없음 → DB 라이브
            data = await loadLiveStats(type, lookupKey)
        } else {
            data = loadStats(year || '2025', type, lookupKey)
        }

        // ── 3. 디비전 필터 ───────────────────────────────────────────
        const div2Regex = /LCK CL|LCKC|Challengers|NLB|\bCK\b|Academy|LDL|LCSA|CBLOLA|LJLCS|NACL|EU CS|NA CS|LSPL|ASCI|EUM|\bEM\b|BRCC|OCS|TCS|\bLFL\b|\bPRM\b|\bNLC\b|\bEBL\b|\bUL\b|\bLPLOL\b|\bPGN\b|\bHM\b|\bGLL\b|\bLIT\b/i
        if (division === '1') data = data.filter((d: any) => !div2Regex.test(d.tournament ?? ''))
        else                  data = data.filter((d: any) =>  div2Regex.test(d.tournament ?? ''))

        // ── 4. 검색 필터 ─────────────────────────────────────────────
        if (search) {
            const term = search.toLowerCase()
            data = data.filter((d: any) => {
                const name = type === 'team' ? d.teamName : d.playerName
                return name?.toLowerCase().includes(term)
            })
        }

        // ── 5. 정렬 ──────────────────────────────────────────────────
        const dir = order === 'asc' ? 1 : -1
        data.sort((a: any, b: any) => {
            let va: any = 0, vb: any = 0
            switch (sort) {
                case 'name':
                    va = type === 'team' ? a.teamName : a.playerName
                    vb = type === 'team' ? b.teamName : b.playerName
                    return (va ?? '').localeCompare(vb ?? '') * dir
                case 'position': {
                    const pm: Record<string, number> = { TOP:1, JUNGLE:2, MID:3, BOTTOM:4, ADC:4, SUPPORT:5 }
                    return ((pm[a.position]||99) - (pm[b.position]||99)) * dir
                }
                case 'team':
                    return (a.teamName ?? '').localeCompare(b.teamName ?? '') * dir
                case 'wins':   va = a.wins;   vb = b.wins;   break
                case 'losses': va = a.losses; vb = b.losses; break
                case 'kda':    va = a.averageKDA; vb = b.averageKDA; break
                case 'damage':
                    va = type === 'team' ? a.totalDamage : a.averageDPM
                    vb = type === 'team' ? b.totalDamage : b.averageDPM
                    break
                case 'winRate':
                    va = a.games > 0 ? a.wins / a.games : 0
                    vb = b.games > 0 ? b.wins / b.games : 0
                    break
                default: va = a.wins; vb = b.wins
            }
            return va > vb ? dir : va < vb ? -dir : 0
        })

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching stats:', error)
        return NextResponse.json([], { status: 500 })
    }
}
