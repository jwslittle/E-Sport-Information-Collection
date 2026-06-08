
/**
 * generate-history.ts
 * Oracle's Elixir CSV → stats_YEAR.json + champions_YEAR.json 생성
 *
 * 사용법:
 *   npx ts-node scripts/generate-history.ts
 *
 * stats_YEAR.json : 팀/선수 집계 통계 (20+ 신규 지표 포함)
 * champions_YEAR.json : 선수별 챔피언 풀 데이터 (aggregate 카테고리만)
 */

const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

const DATA_DIR  = path.join(__dirname, '../과거데이터')
const OUTPUT_DIR = path.join(__dirname, '../src/data/history')

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────

/** 숫자 파싱 (NaN → 0) */
function num(v: any): number {
    const n = Number(v)
    return isNaN(n) ? 0 : n
}

/** 숫자 파싱 (유효하지 않으면 null) */
function numOrNull(v: any): number | null {
    if (v === '' || v === null || v === undefined) return null
    const n = Number(v)
    return isNaN(n) ? null : n
}

// ── 통계 집계 함수 ─────────────────────────────────────────────────────────────

interface ChampEntry {
    champion: string
    games: number; wins: number
    kills: number; deaths: number; assists: number
    sumKDA: number; sumDPM: number; sumCSPM: number; sumDmgShare: number
}

function processSlice(
    sliceRecords: any[],
    tNameOverride: string | null,
    yearOverride: number,
    includeChampions = false,
) {
    const teamStats:   Record<string, any> = {}
    const playerStats: Record<string, any> = {}
    const championStats: Record<string, Record<string, ChampEntry>> | null =
        includeChampions ? {} : null

    for (const row of sliceRecords) {
        const tournament = tNameOverride ?? `${row.league} ${row.split || 'Season'}`
        const isWin      = num(row.result) === 1

        // ── 팀 로우 (position === 'team') ──────────────────────────────
        if (row.position === 'team') {
            const key = row.teamname
            if (!teamStats[key]) {
                teamStats[key] = {
                    teamName: row.teamname, year: yearOverride, tournament,
                    games: 0, wins: 0, losses: 0,
                    totalKills: 0, totalDeaths: 0, totalAssists: 0, totalDamage: 0,
                    // NEW accumulators
                    sumGameLength: 0,
                    blueSideGames: 0, blueSideWins: 0,
                    redSideGames:  0, redSideWins:  0,
                    firstBloods: 0, firstDragons: 0, firstBarons: 0, firstTowers: 0,
                    sumDragons: 0, sumBarons: 0, sumTowers: 0, sumHeralds: 0,
                    sumGoldDiff15: 0, goldDiff15Count: 0,
                    sumGoldDiff10: 0, goldDiff10Count: 0,
                    sumKpm: 0,  // 팀 킬/분
                }
            }
            const t = teamStats[key]
            t.games++
            if (isWin) t.wins++; else t.losses++
            t.totalKills   += num(row.kills)
            t.totalDeaths  += num(row.deaths)
            t.totalAssists += num(row.assists)
            t.totalDamage  += num(row.damagetochampions || 0)

            // 게임 길이 (초)
            t.sumGameLength += num(row.gamelength)

            // 사이드
            if (row.side === 'Blue') {
                t.blueSideGames++
                if (isWin) t.blueSideWins++
            } else if (row.side === 'Red') {
                t.redSideGames++
                if (isWin) t.redSideWins++
            }

            // 오브젝트 기록 (1 = 이 팀이 먼저 획득)
            if (num(row.firstblood)  === 1) t.firstBloods++
            if (num(row.firstdragon) === 1) t.firstDragons++
            if (num(row.firstbaron)  === 1) t.firstBarons++
            if (num(row.firsttower)  === 1) t.firstTowers++
            t.sumDragons += num(row.dragons)
            t.sumBarons  += num(row.barons)
            t.sumTowers  += num(row.towers)
            t.sumHeralds += num(row.heralds)

            // 골드 차이
            const gd15 = numOrNull(row.golddiffat15)
            if (gd15 !== null) { t.sumGoldDiff15 += gd15; t.goldDiff15Count++ }
            const gd10 = numOrNull(row.golddiffat10)
            if (gd10 !== null) { t.sumGoldDiff10 += gd10; t.goldDiff10Count++ }

            // 킬/분
            if (row.gamelength && num(row.gamelength) > 0) {
                const mins = num(row.gamelength) / 60
                t.sumKpm += num(row.kills) / mins
            }

        // ── 선수 로우 ──────────────────────────────────────────────────
        } else if (row.playername && row.playername.trim() !== '') {
            const pKey = row.playername
            if (!playerStats[pKey]) {
                playerStats[pKey] = {
                    playerName: row.playername,
                    teamName:   row.teamname,
                    position:   (row.position || 'UNKNOWN').toUpperCase(),
                    year: yearOverride, tournament,
                    games: 0, wins: 0, losses: 0,
                    totalKills: 0, totalDeaths: 0, totalAssists: 0, totalDamage: 0,
                    totalVision: 0,
                    sumKDA: 0, sumDPM: 0,
                    // NEW accumulators
                    sumCSPM: 0, cspmCount: 0,
                    sumEarnedGPM: 0, gpmCount: 0,
                    sumDmgShare: 0, dmgShareCount: 0,
                    sumGoldShare: 0, goldShareCount: 0,
                    sumKillParticipation: 0, kpCount: 0,
                    sumVSPM: 0,
                    totalCS: 0,
                    doublekills: 0, triplekills: 0, quadrakills: 0, pentakills: 0,
                    firstBloods: 0,
                    sumGoldDiff15: 0, goldDiff15Count: 0,
                    sumGoldDiff10: 0, goldDiff10Count: 0,
                }
            }
            const p = playerStats[pKey]
            p.games++
            if (isWin) p.wins++; else p.losses++
            p.teamName = row.teamname  // 마지막 팀 기준

            p.totalKills   += num(row.kills)
            p.totalDeaths  += num(row.deaths)
            p.totalAssists += num(row.assists)
            p.totalDamage  += num(row.damagetochampions || 0)
            p.totalVision  += num(row.visionscore || 0)

            const kda = (num(row.kills) + num(row.assists)) / Math.max(1, num(row.deaths))
            p.sumKDA += kda
            p.sumDPM += num(row.dpm || 0)

            // CSPM
            const cspm = numOrNull(row.cspm)
            if (cspm !== null && cspm > 0) { p.sumCSPM += cspm; p.cspmCount++ }

            // 획득 골드/분 (earned gpm 컬럼은 공백 포함)
            const egpm = numOrNull(row['earned gpm']) ?? numOrNull(row.earnedgpm)
            if (egpm !== null && egpm > 0) { p.sumEarnedGPM += egpm; p.gpmCount++ }

            // 피해 비중 (damageshare: 0~1)
            const dShare = numOrNull(row.damageshare)
            if (dShare !== null && dShare > 0) { p.sumDmgShare += dShare; p.dmgShareCount++ }

            // 골드 비중 (earnedgoldshare: 0~1)
            const gShare = numOrNull(row.earnedgoldshare)
            if (gShare !== null && gShare > 0) { p.sumGoldShare += gShare; p.goldShareCount++ }

            // 킬 관여율 (kills+assists / teamkills)
            const teamKills = num(row.teamkills)
            if (teamKills > 0) {
                p.sumKillParticipation += (num(row.kills) + num(row.assists)) / teamKills
                p.kpCount++
            }

            // 시야/분
            p.sumVSPM += num(row.vspm || 0)

            // 총 CS (컬럼명에 공백 있음)
            p.totalCS += num(row['total cs'] || row.totalcs || 0)

            // 멀티킬
            p.doublekills += num(row.doublekills)
            p.triplekills += num(row.triplekills)
            p.quadrakills += num(row.quadrakills)
            p.pentakills  += num(row.pentakills)

            // 퍼스트 블러드 관여
            if (num(row.firstblood) === 1) p.firstBloods++

            // 골드 차이
            const gd15 = numOrNull(row.golddiffat15)
            if (gd15 !== null) { p.sumGoldDiff15 += gd15; p.goldDiff15Count++ }
            const gd10 = numOrNull(row.golddiffat10)
            if (gd10 !== null) { p.sumGoldDiff10 += gd10; p.goldDiff10Count++ }

            // ── 챔피언 통계 (includeChampions=true 일 때만) ──
            if (includeChampions && championStats && row.champion?.trim()) {
                const champ = row.champion.trim()
                if (!championStats[pKey]) championStats[pKey] = {}
                if (!championStats[pKey][champ]) {
                    championStats[pKey][champ] = {
                        champion: champ,
                        games: 0, wins: 0,
                        kills: 0, deaths: 0, assists: 0,
                        sumKDA: 0, sumDPM: 0, sumCSPM: 0, sumDmgShare: 0,
                    }
                }
                const c = championStats[pKey][champ]
                c.games++
                if (isWin) c.wins++
                c.kills   += num(row.kills)
                c.deaths  += num(row.deaths)
                c.assists += num(row.assists)
                c.sumKDA  += kda
                c.sumDPM  += num(row.dpm || 0)
                if (cspm !== null) c.sumCSPM += cspm
                if (dShare !== null) c.sumDmgShare += dShare
            }
        }
    }

    // ── 팀 출력 포맷팅 ──────────────────────────────────────────────────────
    const teamData = Object.values(teamStats).map((t: any) => ({
        teamName:    t.teamName,
        year:        t.year,
        tournament:  t.tournament,
        games:       t.games,
        wins:        t.wins,
        losses:      t.losses,
        totalKills:  t.totalKills,
        totalDeaths: t.totalDeaths,
        totalAssists:t.totalAssists,
        totalDamage: t.totalDamage,
        // NEW
        avgGameLengthSeconds: t.games > 0 ? Math.round(t.sumGameLength / t.games) : 0,
        blueSideGames: t.blueSideGames,
        blueSideWins:  t.blueSideWins,
        redSideGames:  t.redSideGames,
        redSideWins:   t.redSideWins,
        firstBloodRate:  t.games > 0 ? +(t.firstBloods  / t.games).toFixed(4) : 0,
        firstDragonRate: t.games > 0 ? +(t.firstDragons / t.games).toFixed(4) : 0,
        firstBaronRate:  t.games > 0 ? +(t.firstBarons  / t.games).toFixed(4) : 0,
        firstTowerRate:  t.games > 0 ? +(t.firstTowers  / t.games).toFixed(4) : 0,
        avgDragons: t.games > 0 ? +(t.sumDragons / t.games).toFixed(2) : 0,
        avgBarons:  t.games > 0 ? +(t.sumBarons  / t.games).toFixed(2) : 0,
        avgTowers:  t.games > 0 ? +(t.sumTowers  / t.games).toFixed(2) : 0,
        avgHeralds: t.games > 0 ? +(t.sumHeralds / t.games).toFixed(2) : 0,
        avgGoldDiff15: t.goldDiff15Count > 0 ? Math.round(t.sumGoldDiff15 / t.goldDiff15Count) : null,
        avgGoldDiff10: t.goldDiff10Count > 0 ? Math.round(t.sumGoldDiff10 / t.goldDiff10Count) : null,
        avgKillsPerMin: t.games > 0 ? +(t.sumKpm / t.games).toFixed(2) : 0,
    }))

    // ── 선수 출력 포맷팅 ──────────────────────────────────────────────────────
    const playerData = Object.values(playerStats).map((p: any) => ({
        playerName:  p.playerName,
        teamName:    p.teamName,
        position:    p.position,
        year:        p.year,
        tournament:  p.tournament,
        games:       p.games,
        wins:        p.wins,
        losses:      p.losses,
        totalKills:  p.totalKills,
        totalDeaths: p.totalDeaths,
        totalAssists:p.totalAssists,
        totalDamage: p.totalDamage,
        averageKDA:  p.games > 0 ? p.sumKDA / p.games : 0,
        averageDPM:  p.games > 0 ? p.sumDPM / p.games : 0,
        averageVisionScore: p.games > 0 ? p.totalVision / p.games : 0,
        // NEW
        avgCSPM:           p.cspmCount > 0        ? +(p.sumCSPM / p.cspmCount).toFixed(3)              : 0,
        avgEarnedGPM:      p.gpmCount > 0          ? +(p.sumEarnedGPM / p.gpmCount).toFixed(1)          : 0,
        avgDamageShare:    p.dmgShareCount > 0     ? +(p.sumDmgShare  / p.dmgShareCount).toFixed(4)     : 0,
        avgGoldShare:      p.goldShareCount > 0    ? +(p.sumGoldShare  / p.goldShareCount).toFixed(4)   : 0,
        avgKillParticipation: p.kpCount > 0        ? +(p.sumKillParticipation / p.kpCount).toFixed(4)  : 0,
        avgVSPM:           p.games > 0             ? +(p.sumVSPM / p.games).toFixed(3)                 : 0,
        totalCS:     p.totalCS,
        doublekills: p.doublekills,
        triplekills: p.triplekills,
        quadrakills: p.quadrakills,
        pentakills:  p.pentakills,
        firstBloodRate:  p.games > 0 ? +(p.firstBloods  / p.games).toFixed(4) : 0,
        avgGoldDiff15:   p.goldDiff15Count > 0 ? Math.round(p.sumGoldDiff15 / p.goldDiff15Count) : null,
        avgGoldDiff10:   p.goldDiff10Count > 0 ? Math.round(p.sumGoldDiff10 / p.goldDiff10Count) : null,
    }))

    // ── 챔피언 풀 포맷팅 ──────────────────────────────────────────────────────
    let championPool: Record<string, any[]> | null = null
    if (includeChampions && championStats) {
        championPool = {}
        for (const [playerName, champMap] of Object.entries(championStats)) {
            championPool[playerName] = Object.values(champMap)
                .filter((c: any) => c.games >= 1)
                .map((c: any) => ({
                    champion:     c.champion,
                    games:        c.games,
                    wins:         c.wins,
                    losses:       c.games - c.wins,
                    avgKDA:       c.games > 0 ? +(c.sumKDA  / c.games).toFixed(2) : 0,
                    avgDPM:       c.games > 0 ? Math.round(c.sumDPM  / c.games)  : 0,
                    avgCSPM:      c.games > 0 ? +(c.sumCSPM / c.games).toFixed(2) : 0,
                    avgDmgShare:  c.games > 0 ? +(c.sumDmgShare / c.games).toFixed(4) : 0,
                }))
                .sort((a: any, b: any) => b.games - a.games)
                .slice(0, 30)  // 최대 30개 챔피언
        }
    }

    return { teams: teamData, players: playerData, champions: championPool }
}

// ── 메인 로직 ──────────────────────────────────────────────────────────────────

async function main() {
    console.log('📜 Generating Historical Data JSONs (Extended Statistics)...\n')

    const years = Array.from({ length: 12 }, (_, i) => 2014 + i)  // 2014-2025

    const div2Regex = /LCK CL|LCKC|Challengers|NLB|\bCK\b|Academy|LDL|LCSA|CBLOLA|LJLCS|NACL|EU CS|NA CS|LSPL|ASCI|EUM|\bEM\b|BRCC|OCS|TCS|\bLFL\b|\bPRM\b|\bNLC\b|\bEBL\b|\bUL\b|\bLPLOL\b|\bPGN\b|\bHM\b|\bGLL\b|\bLIT\b/i

    const categories = [
        { id: 'all',        name: '전체 통합 (Total)',          filter: () => true },
        { id: 'all_korea',  name: '국내 통합 (LCK/KR)',         filter: (t: string) => /LCK|KeSPA|Korea|NLB/i.test(t) },
        { id: 'all_intl',   name: '국제 대회 (International)',  filter: (t: string) => /World|MSI|Rift Rivals|Asian Games|Mid-Season|WLDs/i.test(t) },
        { id: 'all_others', name: '기타 (Others)',              filter: (t: string) => !/LCK|KeSPA|Korea|NLB|World|MSI|Rift Rivals|Asian Games|Mid-Season|WLDs/i.test(t) },
    ]

    for (const year of years) {
        const csvFile = path.join(DATA_DIR, `${year}_LoL_esports_match_data_from_OraclesElixir.csv`)
        if (!fs.existsSync(csvFile)) continue

        console.log(`Processing ${year}...`)
        const fileContent = fs.readFileSync(csvFile, 'utf8')
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            // bom 처리
            bom: true,
        })
        console.log(`  - Rows: ${records.length}`)

        // 토너먼트 목록 수집
        const validTournaments = new Set<string>()
        for (const row of records) {
            validTournaments.add(`${row.league} ${row.split || 'Season'}`)
        }
        const tournamentList = Array.from(validTournaments).sort()

        const resultStats: Record<string, any> = {}
        const championsByCategory: Record<string, Record<string, any[]>> = {}

        // ── 집계 카테고리 (Division 1 & 2) ─────────────────────────
        for (const cat of categories) {
            // Division 1 (includes champion tracking)
            const div1Recs = records.filter((r: any) => {
                const t = `${r.league} ${r.split || 'Season'}`
                return cat.filter(t) && !div2Regex.test(t)
            })
            const d1Key = `${cat.id}_1`
            const d1 = processSlice(div1Recs, cat.name, year, true)  // champions=true
            resultStats[d1Key] = { teams: d1.teams, players: d1.players }
            if (d1.champions) championsByCategory[d1Key] = d1.champions

            // Division 2
            const div2Recs = records.filter((r: any) => {
                const t = `${r.league} ${r.split || 'Season'}`
                return cat.filter(t) && div2Regex.test(t)
            })
            const d2Key = `${cat.id}_2`
            const d2 = processSlice(div2Recs, `${cat.name} (CL/2nd)`, year, false)
            resultStats[d2Key] = { teams: d2.teams, players: d2.players }
        }

        // ── 개별 토너먼트 ─────────────────────────────────────────
        for (const t of tournamentList) {
            const tRecs = records.filter((r: any) => `${r.league} ${r.split || 'Season'}` === t)
            const result = processSlice(tRecs, t, year, false)
            resultStats[t] = { teams: result.teams, players: result.players }
        }

        // ── stats_YEAR.json 저장 ───────────────────────────────────
        const statsOutput = {
            meta: {
                tournaments: tournamentList,
                categories: categories.map(c => ({ id: c.id, name: c.name })),
                fields: {
                    team: ['games','wins','losses','totalKills','totalDeaths','totalAssists','totalDamage',
                           'avgGameLengthSeconds','blueSideGames','blueSideWins','redSideGames','redSideWins',
                           'firstBloodRate','firstDragonRate','firstBaronRate','firstTowerRate',
                           'avgDragons','avgBarons','avgTowers','avgHeralds',
                           'avgGoldDiff15','avgGoldDiff10','avgKillsPerMin'],
                    player: ['games','wins','losses','totalKills','totalDeaths','totalAssists','totalDamage',
                             'averageKDA','averageDPM','averageVisionScore',
                             'avgCSPM','avgEarnedGPM','avgDamageShare','avgGoldShare',
                             'avgKillParticipation','avgVSPM','totalCS',
                             'doublekills','triplekills','quadrakills','pentakills',
                             'firstBloodRate','avgGoldDiff15','avgGoldDiff10'],
                },
            },
            stats: resultStats,
        }
        const statsPath = path.join(OUTPUT_DIR, `stats_${year}.json`)
        fs.writeFileSync(statsPath, JSON.stringify(statsOutput, null, 0))  // minified
        const statsMB = (fs.statSync(statsPath).size / 1024 / 1024).toFixed(2)
        console.log(`  ✅ stats_${year}.json  (${statsMB} MB)`)

        // ── champions_YEAR.json 저장 ───────────────────────────────
        const champsPath = path.join(OUTPUT_DIR, `champions_${year}.json`)
        fs.writeFileSync(champsPath, JSON.stringify(championsByCategory, null, 0))
        const champsMB = (fs.statSync(champsPath).size / 1024 / 1024).toFixed(2)
        console.log(`  ✅ champions_${year}.json (${champsMB} MB)`)
    }

    console.log('\n✅ Done!')
}

main().catch(err => { console.error('❌', err); process.exit(1) })
