```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PLAYER_BASE_STATS, DEFAULT_STATS } from '@/lib/simulation-data'

export const dynamic = 'force-dynamic'

const POINTS = {
    KILL: 3,
    DEATH: -1,
    ASSIST: 2,
    CS: 0.1,
    BARON: 5,
    DRAGON: 2,
    WIN: 5,
    // Advanced
    MULTI_KILL: {
        DOUBLE: 1,
        TRIPLE: 3,
        QUADRA: 5,
        PENTA: 10
    },
    VISION: 0.1,
    KDA_BONUS: 2, // KDA >= 5.0
    CARRY_BONUS: 3 // Team DPM 1st
}

function simulatePlayerPerformance(player: any, isWin: boolean, teamStats: any) {
    const base = PLAYER_BASE_STATS[player.name] || DEFAULT_STATS
    
    // Win/Loss Multiplier (Winners perform better)
    const performanceFactor = isWin ? (1.1 + Math.random() * 0.4) : (0.6 + Math.random() * 0.4)

    // 1. Basic Stats
    const deaths = Math.floor(Math.random() * 5 * (isWin ? 0.5 : 1.5))
    // Kills & Assists based on Team Kills and KP%
    const participation = Math.min(1, base.kp * (0.8 + Math.random() * 0.4))
    const involvedKills = Math.floor(teamStats.totalKills * participation)
    
    // Distribute involved kills between Kills and Assists based on role
    let killShare = 0.2
    if (player.position === 'ADC' || player.position === 'MID') killShare = 0.6
    if (player.position === 'TOP') killShare = 0.4
    if (player.position === 'JUNGLE') killShare = 0.3
    if (player.position === 'SUPPORT') killShare = 0.05

    const kills = Math.floor(involvedKills * killShare)
    const assists = involvedKills - kills

    // CS & Vision
    const gameDuration = 25 + Math.random() * 15 // 25~40 min
    const cs = Math.floor(base.csm * gameDuration * performanceFactor)
    const visionScore = Math.floor(base.vision * gameDuration * performanceFactor)

    // DPM
    const dpm = Math.floor(base.dpm * performanceFactor * (0.9 + Math.random() * 0.2))
    const damageDealt = Math.floor(dpm * gameDuration)

    // 2. Advanced Events (Probabilistic)
    let multiKillPoints = 0
    const multiKillLog = []
    if (kills >= 2 && Math.random() > 0.7) {
        multiKillPoints += POINTS.MULTI_KILL.DOUBLE; multiKillLog.push('Double')
        if (kills >= 3 && Math.random() > 0.8) {
            multiKillPoints += POINTS.MULTI_KILL.TRIPLE; multiKillLog.push('Triple')
            if (kills >= 4 && Math.random() > 0.9) {
                multiKillPoints += POINTS.MULTI_KILL.QUADRA; multiKillLog.push('Quadra')
                if (kills >= 5 && Math.random() > 0.95) {
                    multiKillPoints += POINTS.MULTI_KILL.PENTA; multiKillLog.push('Penta')
                }
            }
        }
    }

    return {
        kills, deaths, assists, cs, visionScore, damageDealt,
        multiKillPoints, multiKillLog,
        gameDuration
    }
}

export async function POST() {
    try {
        const allPlayers = await prisma.player.findMany()
        const playersByTeam: Record<string, any[]> = {}
        
        // Group by Team
        allPlayers.forEach(p => {
            if (!playersByTeam[p.team]) playersByTeam[p.team] = []
            playersByTeam[p.team].push(p)
        })

        const roundStats: Record<string, any> = {}

        // Simulate Match for each Team
        for (const [teamName, players] of Object.entries(playersByTeam)) {
            // Simulate Match Result
            const isWin = Math.random() > 0.5
            const teamTotalKills = isWin ? Math.floor(15 + Math.random() * 15) : Math.floor(5 + Math.random() * 10)
            const teamObjectives = {
                baron: isWin ? Math.floor(Math.random() * 2) : 0,
                dragon: isWin ? Math.floor(2 + Math.random() * 3) : Math.floor(Math.random() * 2)
            }

            // Simulate Individual Performance
            const teamPerformances = players.map(p => ({
                player: p,
                stats: simulatePlayerPerformance(p, isWin, { totalKills: teamTotalKills })
            }))

            // Calculate Carry Bonus (Highest Damage)
            const maxDamage = Math.max(...teamPerformances.map(tp => tp.stats.damageDealt))

            for (const { player, stats } of teamPerformances) {
                // Calculate Points
                let points = 
                    (stats.kills * POINTS.KILL) +
                    (stats.deaths * POINTS.DEATH) +
                    (stats.assists * POINTS.ASSIST) +
                    (stats.cs * POINTS.CS) +
                    (stats.visionScore * POINTS.VISION) +
                    (teamObjectives.baron * POINTS.BARON) +
                    (teamObjectives.dragon * POINTS.DRAGON) +
                    (isWin ? POINTS.WIN : 0) +
                    stats.multiKillPoints

                // Bonuses
                const kda = (stats.kills + stats.assists) / Math.max(1, stats.deaths)
                let kdaBonus = 0
                if (kda >= 5.0) {
                    points += POINTS.KDA_BONUS
                    kdaBonus = POINTS.KDA_BONUS
                }

                let carryBonus = 0
                if (stats.damageDealt === maxDamage && stats.damageDealt > 0) {
                    points += POINTS.CARRY_BONUS
                    carryBonus = POINTS.CARRY_BONUS
                }

                // Update DB
                const currentSeasonStats = player.seasonStats ? JSON.parse(player.seasonStats as string) : {}
                const newStats = {
                    games: (currentSeasonStats.games || 0) + 1,
                    kills: (currentSeasonStats.kills || 0) + stats.kills,
                    deaths: (currentSeasonStats.deaths || 0) + stats.deaths,
                    assists: (currentSeasonStats.assists || 0) + stats.assists,
                    cs: (currentSeasonStats.cs || 0) + stats.cs,
                    wins: (currentSeasonStats.wins || 0) + (isWin ? 1 : 0),
                    fantasyPoints: (currentSeasonStats.fantasyPoints || 0) + points
                }

                await prisma.player.update({
                    where: { id: player.id },
                    data: { seasonStats: JSON.stringify(newStats) }
                })

                // Log for Response
                roundStats[player.id] = {
                    name: player.name,
                    team: player.team,
                    position: player.position,
                    stats: {
                        ...stats,
                        baron: teamObjectives.baron,
                        dragon: teamObjectives.dragon,
                        isWin
                    },
                    points,
                    bonuses: {
                        multiKill: stats.multiKillLog,
                        kda: kdaBonus > 0,
                        carry: carryBonus > 0
                    }
                }
            }
        }

        // Update MyTeam Points
        const finalizedTeams = await prisma.myTeam.findMany({
            where: { isFinalized: true },
            include: { players: true }
        })

        for (const team of finalizedTeams) {
            let roundPoints = 0
            for (const teamPlayer of team.players) {
                const pStat = roundStats[teamPlayer.playerId]
                if (pStat) roundPoints += pStat.points
            }
            
            await prisma.myTeam.update({
                where: { id: team.id },
                data: { totalPoints: { increment: Math.floor(roundPoints) } }
            })
        }

        return NextResponse.json({ success: true, roundStats })

    } catch (error) {
        console.error('Simulation failed:', error)
        return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
    }
}
```
