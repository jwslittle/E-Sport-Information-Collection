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
        // 1. Get Game State
        let gameState = await (prisma as any).gameState.findFirst()
        if (!gameState) {
            // Should not happen if initialized correctly, but fallback
            const teams = ['T1', 'GEN', 'HLE', 'DK', 'KT', 'KDF', 'FOX', 'NS', 'DRX', 'BRO']
            const shuffled = teams.sort(() => 0.5 - Math.random())
            const upcomingMatches = []
            for (let i = 0; i < shuffled.length; i += 2) {
                if (i + 1 < shuffled.length) {
                    upcomingMatches.push({ team1: shuffled[i], team2: shuffled[i + 1] })
                }
            }
            gameState = await (prisma as any).gameState.create({
                data: { currentRound: 0, isRoundActive: false, upcomingMatches: JSON.stringify(upcomingMatches) }
            })
        }

        const currentRound = gameState.currentRound + 1
        const matches = gameState.upcomingMatches ? JSON.parse(gameState.upcomingMatches) : []

        const allPlayers = await prisma.player.findMany()
        const playersByTeam: Record<string, any[]> = {}

        // Group by Team
        allPlayers.forEach(p => {
            if (!playersByTeam[p.team]) playersByTeam[p.team] = []
            playersByTeam[p.team].push(p)
        })

        const roundStats: Record<string, any> = {}

        // Helper function to simulate a team's performance and calculate points
        async function simulateTeam(teamPlayers: any[], isWin: boolean, totalKills: number, objectives: any, teamName: string) {
            const performances = teamPlayers.map(p => ({
                player: p,
                stats: simulatePlayerPerformance(p, isWin, { totalKills })
            }))

            const maxDamage = Math.max(...performances.map(tp => tp.stats.damageDealt))
            const teamLogDetails: any[] = []

            for (const { player, stats } of performances) {
                let points = 0

                // Base Points (Different weights per position)
                if (player.position === 'SUPPORT') {
                    points += (stats.kills * 2.0) // Lower Kill points
                    points += (stats.deaths * -0.5) // Lower Death penalty
                    points += (stats.assists * 3.0) // Higher Assist points
                    points += (stats.visionScore * 0.3) // Higher Vision points
                } else if (player.position === 'JUNGLE') {
                    points += (stats.kills * 3.0)
                    points += (stats.deaths * -1.0)
                    points += (stats.assists * 2.5) // Higher Assist points
                    points += (stats.visionScore * 0.1)
                    // Jungle Objective Bonus
                    points += (objectives.baron * 2)
                    points += (objectives.dragon * 1)
                } else if (player.position === 'MID' || player.position === 'ADC') {
                    points += (stats.kills * 3.5) // Higher Kill points (Carry)
                    points += (stats.deaths * -1.0)
                    points += (stats.assists * 2.0)
                    points += (stats.visionScore * 0.1)
                } else { // TOP
                    points += (stats.kills * 3.0)
                    points += (stats.deaths * -1.0)
                    points += (stats.assists * 2.0)
                    points += (stats.visionScore * 0.1)
                }

                // Common Points
                points += (stats.cs * POINTS.CS)
                points += (isWin ? POINTS.WIN : 0)
                points += stats.multiKillPoints

                // Support doesn't get objective points directly unless Jungle
                if (player.position !== 'JUNGLE') {
                    points += (objectives.baron * POINTS.BARON)
                    points += (objectives.dragon * POINTS.DRAGON)
                }

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

                // Update Player's Season Stats
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

                const logEntry = {
                    name: player.name,
                    team: teamName,
                    position: player.position,
                    stats: {
                        ...stats,
                        baron: objectives.baron,
                        dragon: objectives.dragon,
                        isWin
                    },
                    points,
                    bonuses: {
                        multiKill: stats.multiKillLog,
                        kda: kdaBonus > 0,
                        carry: carryBonus > 0
                    }
                }

                roundStats[player.id] = logEntry
                teamLogDetails.push(logEntry)
            }
            return teamLogDetails
        }

        // Simulate Matches
        for (const match of matches) {
            const team1Name = match.team1
            const team2Name = match.team2
            const team1Players = playersByTeam[team1Name] || []
            const team2Players = playersByTeam[team2Name] || []

            // Determine Winner
            // Simple logic: Random for now, but could be based on average player stats
            const isTeam1Win = Math.random() > 0.5
            const winner = isTeam1Win ? team1Name : team2Name

            // Simulate Team 1
            const t1Kills = isTeam1Win ? Math.floor(15 + Math.random() * 15) : Math.floor(5 + Math.random() * 10)
            const t1Objectives = {
                baron: isTeam1Win ? Math.floor(Math.random() * 2) : 0,
                dragon: isTeam1Win ? Math.floor(2 + Math.random() * 3) : Math.floor(Math.random() * 2)
            }
            const t1Performances = await simulateTeam(team1Players, isTeam1Win, t1Kills, t1Objectives, team1Name)

            // Simulate Team 2
            const t2Kills = !isTeam1Win ? Math.floor(15 + Math.random() * 15) : Math.floor(5 + Math.random() * 10)
            const t2Objectives = {
                baron: !isTeam1Win ? Math.floor(Math.random() * 2) : 0,
                dragon: !isTeam1Win ? Math.floor(2 + Math.random() * 3) : Math.floor(Math.random() * 2)
            }
            const t2Performances = await simulateTeam(team2Players, !isTeam1Win, t2Kills, t2Objectives, team2Name)

            // Create Match Log
            await (prisma as any).matchLog.create({
                data: {
                    round: currentRound,
                    team1: team1Name,
                    team2: team2Name,
                    winner: winner,
                    details: JSON.stringify([...t1Performances, ...t2Performances])
                }
            })
        }

        // Update MyTeam Points & Save History
        const finalizedTeams = await prisma.myTeam.findMany({
            where: { lastFinalizedRound: { not: -1 } }, // Only teams that finalized roster? Or all?
```
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
        // 1. Get Game State
        let gameState = await (prisma as any).gameState.findFirst()
        if (!gameState) {
            // Should not happen if initialized correctly, but fallback
            const teams = ['T1', 'GEN', 'HLE', 'DK', 'KT', 'KDF', 'FOX', 'NS', 'DRX', 'BRO']
            const shuffled = teams.sort(() => 0.5 - Math.random())
            const upcomingMatches = []
            for (let i = 0; i < shuffled.length; i += 2) {
                if (i + 1 < shuffled.length) {
                    upcomingMatches.push({ team1: shuffled[i], team2: shuffled[i + 1] })
                }
            }
            gameState = await (prisma as any).gameState.create({
                data: { currentRound: 0, isRoundActive: false, upcomingMatches: JSON.stringify(upcomingMatches) }
            })
        }

        const currentRound = gameState.currentRound + 1
        const matches = gameState.upcomingMatches ? JSON.parse(gameState.upcomingMatches) : []

        const allPlayers = await prisma.player.findMany()
        const playersByTeam: Record<string, any[]> = {}
        const playerMap = new Map<string, any>() // Map playerId to player object

        // Group by Team and create player map
        allPlayers.forEach(p => {
            if (!playersByTeam[p.team]) playersByTeam[p.team] = []
            playersByTeam[p.team].push(p)
            playerMap.set(p.id, p)
        })

        const allPerformances: any[] = [] // Collect all player performances for the round

        // Helper function to simulate a team's performance and calculate points
        async function simulateTeam(teamPlayers: any[], isWin: boolean, totalKills: number, objectives: any, teamName: string) {
            const performances = teamPlayers.map(p => ({
                player: p,
                stats: simulatePlayerPerformance(p, isWin, { totalKills })
            }))

            const maxDamage = Math.max(...performances.map(tp => tp.stats.damageDealt))
            const teamLogDetails: any[] = []

            for (const { player, stats } of performances) {
                // Calculate points using the new calculatePoints function
                const { points, bonuses } = calculatePoints(stats, isWin, player.position, objectives, maxDamage, stats.damageDealt)

                // Update Player's Season Stats
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

                const logEntry = {
                    name: player.name,
                    team: teamName,
                    position: player.position,
                    stats: {
                        ...stats,
                        baron: objectives.baron,
                        dragon: objectives.dragon,
                        isWin
                    },
                    points,
                    bonuses: {
                        multiKill: bonuses.multiKill,
                        kda: bonuses.kda,
                        carry: bonuses.carry
                    }
                }

                allPerformances.push(logEntry) // Add to global list of all performances
                teamLogDetails.push(logEntry)
            }
            return teamLogDetails
        }

        // Simulate Matches
        for (const match of matches) {
            const team1Name = match.team1
            const team2Name = match.team2
            const team1Players = playersByTeam[team1Name] || []
            const team2Players = playersByTeam[team2Name] || []

            // Determine Winner
            // Simple logic: Random for now, but could be based on average player stats
            const isTeam1Win = Math.random() > 0.5
            const winner = isTeam1Win ? team1Name : team2Name

            // Simulate Team 1
            const t1Kills = isTeam1Win ? Math.floor(15 + Math.random() * 15) : Math.floor(5 + Math.random() * 10)
            const t1Objectives = {
                baron: isTeam1Win ? Math.floor(Math.random() * 2) : 0,
                dragon: isTeam1Win ? Math.floor(2 + Math.random() * 3) : Math.floor(Math.random() * 2)
            }
            const t1Performances = await simulateTeam(team1Players, isTeam1Win, t1Kills, t1Objectives, team1Name)

            // Simulate Team 2
            const t2Kills = !isTeam1Win ? Math.floor(15 + Math.random() * 15) : Math.floor(5 + Math.random() * 10)
            const t2Objectives = {
                baron: !isTeam1Win ? Math.floor(Math.random() * 2) : 0,
                dragon: !isTeam1Win ? Math.floor(2 + Math.random() * 3) : Math.floor(Math.random() * 2)
            }
            const t2Performances = await simulateTeam(team2Players, !isTeam1Win, t2Kills, t2Objectives, team2Name)

            // Create Match Log
            await (prisma as any).matchLog.create({
                data: {
                    round: currentRound,
                    team1: team1Name,
                    team2: team2Name,
                    winner: winner,
                    details: JSON.stringify([...t1Performances, ...t2Performances])
                }
            })
        }

        // Update MyTeam Points & Save History
        // Select ALL teams that have completed the initial team building (isFinalized: true)
        // This ensures that even if they didn't explicitly "finalize" for this specific round,
        // their current roster state (default or last saved) is used.
        const finalizedTeams = await prisma.myTeam.findMany({
            where: { isFinalized: true },
            include: { players: true }
        })

        for (const team of finalizedTeams) {
            let roundPoints = 0
            const teamDetails: Record<string, number> = {}

            for (const teamPlayer of team.players) {
                if (!teamPlayer.isStarter) continue

                const performance = allPerformances.find(p => p.name === playerMap.get(teamPlayer.playerId)?.name)
                if (performance) {
                    roundPoints += performance.points
                    teamDetails[teamPlayer.playerId] = performance.points
                }
            }

            // Update Total Points
            await prisma.myTeam.update({
                where: { id: team.id },
                data: { totalPoints: { increment: Math.floor(roundPoints) } }
            })

            // Save Round History
            await (prisma as any).myTeamRoundScore.create({
                data: {
                    teamId: team.id,
                    round: currentRound,
                    points: Math.floor(roundPoints),
                    details: JSON.stringify(teamDetails)
                }
            })
        }

        // 5. Generate Next Round Matchups
        const teams = ['T1', 'GEN', 'HLE', 'DK', 'KT', 'KDF', 'FOX', 'NS', 'DRX', 'BRO']
        const shuffled = teams.sort(() => 0.5 - Math.random())
        const nextMatches = []
        for (let i = 0; i < teams.length; i += 2) {
            nextMatches.push({ team1: shuffled[i], team2: shuffled[i + 1] })
        }

        // Update Game State
        await (prisma as any).gameState.update({
            where: { id: gameState.id },
            data: {
                currentRound: currentRound,
                isRoundActive: true, // Lock rosters (though we allow updates between rounds)
                nextMatchDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                upcomingMatches: JSON.stringify(nextMatches)
            }
        })

        return NextResponse.json({ success: true, currentRound, nextMatches })
    } catch (error) {
        console.error('Simulation Error:', error)
        return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
    }
}

function calculatePoints(stats: any, isWin: boolean, role: string, objectives: any, maxDamage: number, playerDamage: number) {
    let points = 0
    
    // Base Points
    points += stats.kills * 3
    points += stats.deaths * -1
    points += stats.assists * 2
    points += stats.cs * 0.02
    points += stats.visionScore * 0.1
    
    // Win Bonus
    if (isWin) points += 5

    // Role-specific objective points
    if (role === 'JUNGLE') {
        points += (objectives.baron * 2) // Higher for Jungler
        points += (objectives.dragon * 1) // Higher for Jungler
    } else {
        points += (objectives.baron * 1) // Standard for others
        points += (objectives.dragon * 0.5) // Standard for others
    }

    const bonuses: any = { multiKill: [], kda: false, carry: false }

    // Multi Kill
    const kills = stats.kills
    if (kills >= 5) { points += 10; bonuses.multiKill.push('펜타킬') }
    else if (kills >= 4) { points += 5; bonuses.multiKill.push('쿼드라킬') }
    else if (kills >= 3) { points += 3; bonuses.multiKill.push('트리플킬') }
    else if (kills >= 2 && Math.random() > 0.7) { points += 1; bonuses.multiKill.push('더블킬') } // Random for double kill

    // KDA Bonus
    const kda = (stats.kills + stats.assists) / Math.max(1, stats.deaths)
    if (kda >= 5) { points += 3; bonuses.kda = true }

    // Carry Bonus (High Kill Participation or Damage)
    if (playerDamage === maxDamage && playerDamage > 0) { // Top damage dealer
        points += 5; bonuses.carry = true
    } else if (role === 'ADC' && stats.cs >= 300) { // High CS for ADC
        points += 3; bonuses.carry = true
    }

    return { points, bonuses }
}
```
