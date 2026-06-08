/**
 * GET /api/stats/champions
 *
 * 선수별 챔피언 풀 통계를 반환합니다.
 *
 * Query Params:
 *   year        - 단일 연도 (2014~2026)
 *   yearFrom    - 범위 시작 연도
 *   yearTo      - 범위 끝 연도
 *   tournament  - 카테고리 키 (all_1, all_korea_1 등) — 기본값: all_korea_1
 *   player      - 특정 선수 필터 (없으면 전체 반환)
 *   position    - 포지션 필터 (TOP/JUNGLE/MID/BOTTOM/SUPPORT)
 *   limit       - 선수당 최대 챔피언 수 (기본: 20, 최대: 30)
 *
 * 2026+: DB (LckPlayerGameStat) 에서 실시간 집계
 * 2014~2025: champions_YEAR.json 파일에서 읽음
 */
import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const HISTORY_DIR = path.join(process.cwd(), 'src/data/history')

/** "MM:SS" → 분(float) */
function parseMins(dur: string | null): number {
    if (!dur) return 30
    const parts = dur.split(':').map(Number)
    return (parts[0] ?? 0) + (parts[1] ?? 0) / 60
}

// ── 히스토리 JSON 읽기 ──────────────────────────────────────────────────────

function readChampionsJson(year: string, catKey: string): Record<string, any[]> | null {
    const filePath = path.join(HISTORY_DIR, `champions_${year}.json`)
    if (!fs.existsSync(filePath)) return null
    try {
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        return json[catKey] ?? null
    } catch { return null }
}

/** 단일 연도 챔피언 데이터 로드 */
function loadChampions(year: string, catKey: string): Record<string, any[]> {
    const data = readChampionsJson(year, catKey)
    return data ?? {}
}

/** 범위 연도 챔피언 데이터 로드 및 합산 */
function loadChampionsRange(yearFrom: string, yearTo: string, catKey: string): Record<string, any[]> {
    const merged: Record<string, Record<string, any>> = {}

    for (let y = parseInt(yearFrom); y <= parseInt(yearTo); y++) {
        const data = readChampionsJson(String(y), catKey)
        if (!data) continue

        for (const [playerName, champList] of Object.entries(data)) {
            if (!merged[playerName]) merged[playerName] = {}
            for (const c of champList as any[]) {
                const existing = merged[playerName][c.champion]
                if (!existing) {
                    merged[playerName][c.champion] = { ...c }
                } else {
                    // 합산 (가중 평균)
                    const totalGames = existing.games + c.games
                    merged[playerName][c.champion] = {
                        champion: c.champion,
                        games:   totalGames,
                        wins:    existing.wins + c.wins,
                        losses:  existing.losses + c.losses,
                        avgKDA:      (existing.avgKDA  * existing.games + c.avgKDA  * c.games) / totalGames,
                        avgDPM:      (existing.avgDPM  * existing.games + c.avgDPM  * c.games) / totalGames,
                        avgCSPM:     (existing.avgCSPM * existing.games + c.avgCSPM * c.games) / totalGames,
                        avgDmgShare: (existing.avgDmgShare * existing.games + c.avgDmgShare * c.games) / totalGames,
                    }
                }
            }
        }
    }

    // 각 선수별 정렬 + 반올림
    const result: Record<string, any[]> = {}
    for (const [playerName, champMap] of Object.entries(merged)) {
        result[playerName] = Object.values(champMap)
            .map((c: any) => ({
                ...c,
                avgKDA:      +c.avgKDA.toFixed(2),
                avgDPM:      Math.round(c.avgDPM),
                avgCSPM:     +c.avgCSPM.toFixed(2),
                avgDmgShare: +c.avgDmgShare.toFixed(4),
            }))
            .sort((a: any, b: any) => b.games - a.games)
            .slice(0, 30)
    }
    return result
}

// ── 2026 DB 라이브 집계 ──────────────────────────────────────────────────────

async function load2026Champions(seasonFilter?: string): Promise<Record<string, any[]>> {
    const matches = await prisma.lckRealMatch.findMany({
        where: { season: seasonFilter ? { equals: seasonFilter } : { startsWith: '2026' } },
        include: {
            games: {
                include: { playerStats: true },
            },
        },
        take: 500,
    })

    const champMap: Record<string, Record<string, any>> = {}

    for (const m of matches) {
        for (const game of m.games) {
            const dur = parseMins(game.duration)
            const teamKills: Record<string, number>  = {}
            const teamDamage: Record<string, number> = {}
            const teamGold: Record<string, number>   = {}

            for (const ps of game.playerStats) {
                teamKills[ps.team]  = (teamKills[ps.team]  || 0) + ps.kills
                teamDamage[ps.team] = (teamDamage[ps.team] || 0) + ps.damage
                teamGold[ps.team]   = (teamGold[ps.team]   || 0) + ps.gold
            }

            for (const ps of game.playerStats) {
                if (!ps.champion) continue
                const key  = ps.playerName
                const champ = ps.champion.trim()

                if (!champMap[key]) champMap[key] = {}
                if (!champMap[key][champ]) {
                    champMap[key][champ] = {
                        champion: champ,
                        games: 0, wins: 0,
                        kills: 0, deaths: 0, assists: 0,
                        sumDPM: 0, sumCSPM: 0,
                        sumDmgShare: 0, dmgShareCount: 0,
                    }
                }
                const c = champMap[key][champ]
                c.games++
                if (game.winner === ps.team) c.wins++
                c.kills   += ps.kills
                c.deaths  += ps.deaths
                c.assists += ps.assists
                if (dur > 0) {
                    c.sumDPM  += ps.damage / dur
                    c.sumCSPM += ps.cs     / dur
                }
                if (teamDamage[ps.team] > 0) {
                    c.sumDmgShare += ps.damage / teamDamage[ps.team]
                    c.dmgShareCount++
                }
            }
        }
    }

    const result: Record<string, any[]> = {}
    for (const [playerName, playerChamps] of Object.entries(champMap)) {
        result[playerName] = Object.values(playerChamps)
            .filter((c: any) => c.games >= 1)
            .map((c: any) => ({
                champion:    c.champion,
                games:       c.games,
                wins:        c.wins,
                losses:      c.games - c.wins,
                avgKDA:      c.deaths > 0 ? +((c.kills + c.assists) / c.deaths).toFixed(2) : +(c.kills + c.assists).toFixed(2),
                avgDPM:      c.games > 0 ? Math.round(c.sumDPM  / c.games) : 0,
                avgCSPM:     c.games > 0 ? +(c.sumCSPM / c.games).toFixed(2) : 0,
                avgDmgShare: c.dmgShareCount > 0 ? +(c.sumDmgShare / c.dmgShareCount).toFixed(4) : 0,
            }))
            .sort((a: any, b: any) => b.games - a.games)
            .slice(0, 30)
    }
    return result
}

// ── GET 핸들러 ──────────────────────────────────────────────────────────────

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const year      = searchParams.get('year')
    const yearFrom  = searchParams.get('yearFrom')
    const yearTo    = searchParams.get('yearTo')
    const tournament = searchParams.get('tournament') || 'all_korea_1'
    const playerFilter = searchParams.get('player')?.trim().slice(0, 100)
    const positionFilter = searchParams.get('position')?.toUpperCase()
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    try {
        let data: Record<string, any[]> = {}

        // ── 2026 라이브 ──────────────────────────────────────────────
        if (year === '2026' || (yearTo && yearTo >= '2026')) {
            const liveData = await load2026Champions()
            data = { ...data, ...liveData }
        }

        // ── 히스토리 ─────────────────────────────────────────────────
        if (yearFrom && yearTo) {
            const fromYear = yearFrom < '2026' ? yearFrom : ''
            const toYear   = yearTo   < '2026' ? yearTo   : '2025'
            if (fromYear) {
                const hist = loadChampionsRange(fromYear, toYear, tournament)
                // 합산 (2026 포함 범위)
                for (const [pn, champs] of Object.entries(hist)) {
                    if (!data[pn]) {
                        data[pn] = champs
                    } else {
                        // 합산
                        const mergeMap: Record<string, any> = {}
                        for (const c of [...data[pn], ...champs]) {
                            const ex = mergeMap[c.champion]
                            if (!ex) {
                                mergeMap[c.champion] = { ...c }
                            } else {
                                const tg = ex.games + c.games
                                mergeMap[c.champion] = {
                                    champion:    c.champion,
                                    games:       tg,
                                    wins:        ex.wins + c.wins,
                                    losses:      ex.losses + c.losses,
                                    avgKDA:      +(( ex.avgKDA * ex.games      + c.avgKDA * c.games)      / tg).toFixed(2),
                                    avgDPM:      Math.round((ex.avgDPM * ex.games   + c.avgDPM * c.games)   / tg),
                                    avgCSPM:     +((ex.avgCSPM * ex.games + c.avgCSPM * c.games) / tg).toFixed(2),
                                    avgDmgShare: +((ex.avgDmgShare * ex.games + c.avgDmgShare * c.games) / tg).toFixed(4),
                                }
                            }
                        }
                        data[pn] = Object.values(mergeMap).sort((a: any, b: any) => b.games - a.games).slice(0, 30)
                    }
                }
            }
        } else if (year && year !== '2026') {
            data = { ...data, ...loadChampions(year, tournament) }
        }

        // ── 필터 적용 ─────────────────────────────────────────────────
        // player 필터 (선수별 데이터 반환)
        if (playerFilter) {
            const key = Object.keys(data).find(k => k.toLowerCase() === playerFilter.toLowerCase())
            if (!key) return NextResponse.json([])
            const champs = data[key] || []
            return NextResponse.json(
                champs.map(c => ({ ...c, playerName: key })).slice(0, limit)
            )
        }

        // 전체 반환: 선수별 TOP 챔피언 flat list (통계 탭에서 챔피언 분포 보기에 사용)
        // position 필터는 stats API를 통해 선수 목록을 가져온 후 클라이언트에서 적용
        const result: any[] = []
        for (const [playerName, champs] of Object.entries(data)) {
            const limited = champs.slice(0, limit)
            for (const c of limited) {
                result.push({ playerName, ...c })
            }
        }

        // 정렬: 게임 수 DESC
        result.sort((a, b) => b.games - a.games)

        return NextResponse.json(result)
    } catch (error) {
        console.error('[/api/stats/champions] Error:', error)
        return NextResponse.json([], { status: 500 })
    }
}
