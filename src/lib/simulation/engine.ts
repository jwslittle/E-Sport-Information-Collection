
import { Player, Team } from '@prisma/client'

interface PlayerStats {
    kda: number
    avgKills: number
    avgDeaths: number
    avgAssists: number
    rating: number // 0-100
}

import { calculateFantasyPoints } from '@/lib/fantasy-point-system'

export interface SimulationResult {
    winnerId: string
    score: string // "2-0", "2-1"
    team1Score: number
    team2Score: number
    games: GameResult[]
}

export interface GameResult {
    winnerId: string
    duration: string
    stats: Record<string, { name: string, teamId: string, kills: number, deaths: number, assists: number, cs: number, vision: number, damage: number, points: number }>
}

// Calculate player rating based on seeded CSV stats
export function calculatePlayerRating(player: Player): PlayerStats {
    // Default stats
    let stats: PlayerStats = { kda: 3.0, avgKills: 3, avgDeaths: 3, avgAssists: 6, rating: 75 }

    // Cast to any to avoid TS error if types are stale
    const p = player as any
    if (p.stats) {
        try {
            // Prisma JSON is already an object, no need to parse if typed correctly, 
            // but for safety we cast it.
            const s = player.stats as any

            if (s.kda) stats.kda = Number(s.kda)
            if (s.avgKills) stats.avgKills = Number(s.avgKills)
            if (s.avgDeaths) stats.avgDeaths = Number(s.avgDeaths)
            if (s.avgAssists) stats.avgAssists = Number(s.avgAssists)

            // Rating Formula: Base 70 + (KDA * 5)
            // Cap at 99, Min 50
            stats.rating = Math.min(99, Math.max(50, 60 + (stats.kda * 6)))
        } catch (e) {
            console.error('Error parsing stats for', player.name, e)
        }
    }

    // Add random variance for "Form" (+- 5)
    stats.rating += (Math.random() * 10 - 5)

    return stats
}

export function simulateSeries(team1: Team, team1Players: Player[], team2: Team, team2Players: Player[]): SimulationResult {
    const t1Rating = team1Players.reduce((acc, p) => acc + calculatePlayerRating(p).rating, 0) / 5
    const t2Rating = team2Players.reduce((acc, p) => acc + calculatePlayerRating(p).rating, 0) / 5

    // Win Probability based on rating diff (Elo-like)
    const ratingDiff = t1Rating - t2Rating
    const t1WinProb = 1 / (1 + Math.pow(10, -ratingDiff / 40)) // Divisor 40 makes it less volatile than 20

    let t1Wins = 0
    let t2Wins = 0
    const games: GameResult[] = []

    // Best of 3
    while (t1Wins < 2 && t2Wins < 2) {
        // Simulate single game
        const rand = Math.random()
        const isT1Win = rand < t1WinProb

        if (isT1Win) t1Wins++
        else t2Wins++

        games.push(generateGameStats(
            isT1Win ? team1 : team2,
            isT1Win ? team2 : team1,
            isT1Win ? team1Players : team2Players,
            isT1Win ? team2Players : team1Players
        ))
    }

    return {
        winnerId: t1Wins > t2Wins ? team1.id : team2.id,
        score: `${t1Wins}-${t2Wins}`,
        team1Score: t1Wins,
        team2Score: t2Wins,
        games
    }
}

function generateGameStats(winner: Team, loser: Team, winnerPlayers: Player[], loserPlayers: Player[]): GameResult {
    const durationMin = 25 + Math.floor(Math.random() * 20) // 25-45 mins
    const duration = `${durationMin}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`

    const gameStats: Record<string, any> = {}

    // Winner Kills: 15-30
    const winnerKillsTotal = 15 + Math.floor(Math.random() * 15)
    // Loser Kills: 5-15
    const loserKillsTotal = 5 + Math.floor(Math.random() * 10)

    // Helper to distribute stats based on position
    const distribute = (players: Player[], totalKills: number, totalDeaths: number, isWin: boolean) => {
        players.forEach(player => {
            const p = player as any
            const s = p.stats as any || {}
            // Base ratios from historical stats or defaults
            const killRatio = (s.avgKills || 3) / 15
            const deathRatio = (s.avgDeaths || 3) / 15
            const assistRatio = (s.avgAssists || 6) / 15

            let kills = Math.floor(totalKills * killRatio * (0.8 + Math.random() * 0.4))
            let deaths = Math.floor(totalDeaths * deathRatio * (0.8 + Math.random() * 0.4))
            let assists = Math.floor(totalKills * assistRatio * (0.8 + Math.random() * 0.4)) // Assists correlate with team kills

            // CS & Vision
            let cs = Math.floor((s.avgCS || 200) * (durationMin / 30)) // Scale by duration
            let vision = Math.floor((s.avgVision || 30))
            let damage = Math.floor((s.avgDamage || 15000) * (durationMin / 30))

            // Fantasy Points Calculation (Weighted)
            // Penta/Quadra Simulation (Simple probability if high kills)
            let pentaKills = 0
            let quadraKills = 0
            if (kills >= 5) {
                if (Math.random() < 0.3) pentaKills = 1
                else quadraKills = 1
            } else if (kills === 4) {
                if (Math.random() < 0.5) quadraKills = 1
            }

            let points = calculateFantasyPoints({
                kills, deaths, assists, cs, vision, damage,
                win: isWin,
                pentaKills,
                quadraKills
            }, p.position)



            gameStats[p.id] = {
                name: p.name,
                teamId: p.teamId,
                kills, deaths, assists, cs, vision, damage, points
            }
        })
    }

    distribute(winnerPlayers, winnerKillsTotal, loserKillsTotal, true) // Winner gets kills, few deaths
    distribute(loserPlayers, loserKillsTotal, winnerKillsTotal, false) // Loser gets few kills, many deaths

    return {
        winnerId: winner.id,
        duration,
        stats: gameStats
    }
}
