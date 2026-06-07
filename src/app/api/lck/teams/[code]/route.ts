import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/lck/teams/[code]
 * 특정 LCK 팀의 상세 데이터 (시즌 기록, 최근 폼, H2H, 선수 스탯)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params
    const teamCode = code.toUpperCase()

    // 팀 코드 형식 검증: 2~6자 영문·숫자만 허용
    if (!/^[A-Z0-9]{2,6}$/.test(teamCode)) {
        return NextResponse.json({ error: 'Invalid team code' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const season = searchParams.get('season') ?? '2026-SPLIT2'

    // 해당 팀의 모든 경기 조회
    const matches = await prisma.lckRealMatch.findMany({
        where: {
            season: season === 'ALL' ? undefined : season,
            OR: [{ team1: teamCode }, { team2: teamCode }],
        },
        take: 200,
        include: {
            games: {
                include: {
                    playerStats: {
                        where: { team: teamCode },
                    },
                },
            },
        },
        orderBy: { scheduledAt: 'desc' },
    })

    if (matches.length === 0) {
        return NextResponse.json({ error: '팀 데이터가 없습니다.' }, { status: 404 })
    }

    // 팀 기본 정보 (가장 최근 경기에서 추출)
    const latestMatch = matches[0]
    const isTeam1 = latestMatch.team1 === teamCode
    const teamInfo = {
        code: teamCode,
        name: isTeam1 ? latestMatch.team1Name : latestMatch.team2Name,
        logo: isTeam1 ? latestMatch.team1Logo : latestMatch.team2Logo,
    }

    // 시즌 통계 계산
    const completed = matches.filter(m => m.status === 'COMPLETED' && m.winner)
    let wins = 0, losses = 0, gameWins = 0, gameLosses = 0

    for (const m of completed) {
        const isWinner = m.winner === teamCode
        if (isWinner) {
            wins++
            gameWins += (m.team1 === teamCode ? m.team1Score : m.team2Score)
            gameLosses += (m.team1 === teamCode ? m.team2Score : m.team1Score)
        } else {
            losses++
            gameLosses += (m.team1 === teamCode ? m.team1Score : m.team2Score)
            gameWins += (m.team1 === teamCode ? m.team2Score : m.team1Score)
        }
    }
    const total = wins + losses
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

    // H2H 계산
    const h2hMap: Record<string, { wins: number; losses: number; opponentName: string | null; opponentLogo: string | null }> = {}
    for (const m of completed) {
        const isHome = m.team1 === teamCode
        const opponent = isHome ? m.team2 : m.team1
        const opponentName = isHome ? m.team2Name : m.team1Name
        const opponentLogo = isHome ? m.team2Logo : m.team1Logo
        if (!h2hMap[opponent]) h2hMap[opponent] = { wins: 0, losses: 0, opponentName, opponentLogo }
        if (m.winner === teamCode) h2hMap[opponent].wins++
        else h2hMap[opponent].losses++
    }

    // 선수 스탯 집계 (완료된 경기의 playerStats)
    const playerStatMap: Record<string, {
        playerName: string
        position: string | null
        games: number
        kills: number
        deaths: number
        assists: number
        cs: number
        damage: number
    }> = {}

    for (const m of completed) {
        for (const game of m.games) {
            for (const ps of game.playerStats) {
                if (!playerStatMap[ps.playerName]) {
                    playerStatMap[ps.playerName] = {
                        playerName: ps.playerName,
                        position: ps.position,
                        games: 0,
                        kills: 0,
                        deaths: 0,
                        assists: 0,
                        cs: 0,
                        damage: 0,
                    }
                }
                const p = playerStatMap[ps.playerName]
                p.games++
                p.kills += ps.kills
                p.deaths += ps.deaths
                p.assists += ps.assists
                p.cs += ps.cs
                p.damage += ps.damage
                // 포지션 업데이트 (첫 번째로 발견된 것 사용)
                if (!p.position && ps.position) p.position = ps.position
            }
        }
    }

    const POSITION_ORDER = ['top', 'jng', 'jg', 'jungle', 'mid', 'bot', 'adc', 'sup', 'support']
    const playerStats = Object.values(playerStatMap)
        .map(p => ({
            ...p,
            kda: p.deaths > 0
                ? Math.round(((p.kills + p.assists) / p.deaths) * 100) / 100
                : Math.round((p.kills + p.assists) * 100) / 100,
            avgKills: Math.round((p.kills / p.games) * 10) / 10,
            avgDeaths: Math.round((p.deaths / p.games) * 10) / 10,
            avgAssists: Math.round((p.assists / p.games) * 10) / 10,
            avgCs: Math.round(p.cs / p.games),
            avgDamage: Math.round(p.damage / p.games),
        }))
        .sort((a, b) => {
            const ai = POSITION_ORDER.indexOf((a.position ?? '').toLowerCase())
            const bi = POSITION_ORDER.indexOf((b.position ?? '').toLowerCase())
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        })

    // 최근 매치 (완료 기준 최근 10개)
    const recentMatches = completed.slice(0, 10).map(m => ({
        id: m.id,
        team1: m.team1,
        team2: m.team2,
        team1Name: m.team1Name,
        team2Name: m.team2Name,
        team1Logo: m.team1Logo,
        team2Logo: m.team2Logo,
        team1Score: m.team1Score,
        team2Score: m.team2Score,
        winner: m.winner,
        scheduledAt: m.scheduledAt,
        completedAt: m.completedAt,
        bestOf: m.bestOf,
        isWin: m.winner === teamCode,
        opponent: m.team1 === teamCode ? m.team2 : m.team1,
        opponentName: m.team1 === teamCode ? m.team2Name : m.team1Name,
        opponentLogo: m.team1 === teamCode ? m.team2Logo : m.team1Logo,
        myScore: m.team1 === teamCode ? m.team1Score : m.team2Score,
        opponentScore: m.team1 === teamCode ? m.team2Score : m.team1Score,
    }))

    // 최근 폼 (completed 최근 5)
    const form = recentMatches.slice(0, 5).map(m => m.isWin ? 'W' : 'L').reverse()

    // 예정 경기
    const upcoming = matches
        .filter(m => m.status === 'SCHEDULED')
        .reverse()
        .slice(0, 5)
        .map(m => ({
            id: m.id,
            opponent: m.team1 === teamCode ? m.team2 : m.team1,
            opponentName: m.team1 === teamCode ? m.team2Name : m.team1Name,
            opponentLogo: m.team1 === teamCode ? m.team2Logo : m.team1Logo,
            scheduledAt: m.scheduledAt,
            bestOf: m.bestOf,
        }))

    return NextResponse.json({
        teamInfo,
        seasonStats: { wins, losses, winRate, total, gameWins, gameLosses },
        form,
        h2h: h2hMap,
        recentMatches,
        upcoming,
        playerStats,
    })
}
