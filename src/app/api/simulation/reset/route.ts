import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST() {
    try {
        console.log('Resetting simulation...')

        // 1. Reset Game State
        await (prisma as any).gameState.deleteMany()
        console.log('GameState deleted')

        // Generate Initial Matches (Round 1)
        const teams = ['T1', 'GEN', 'HLE', 'DK', 'KT', 'KDF', 'FOX', 'NS', 'DRX', 'BRO']
        const shuffled = teams.sort(() => 0.5 - Math.random())
        const upcomingMatches = []
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                upcomingMatches.push({ team1: shuffled[i], team2: shuffled[i + 1] })
            }
        }

        await (prisma as any).gameState.create({
            data: {
                currentRound: 0,
                isRoundActive: false,
                upcomingMatches: JSON.stringify(upcomingMatches)
            }
        })
        console.log('GameState recreated with matches:', upcomingMatches)

        // 2. Clear Match Logs
        const deleteLogs = await (prisma as any).matchLog.deleteMany()
        console.log('MatchLogs deleted:', deleteLogs)

        // 3. Reset Player Stats
        const players = await prisma.player.findMany()
        console.log('Resetting stats for', players.length, 'players')

        await Promise.all(players.map(player =>
            prisma.player.update({
                where: { id: player.id },
                data: {
                    seasonStats: JSON.stringify({
                        games: 0,
                        kills: 0,
                        deaths: 0,
                        assists: 0,
                        cs: 0,
                        baron: 0,
                        dragon: 0,
                        fantasyPoints: 0
                    })
                }
            })
        ))
        console.log('Player stats reset')

        // 4. Reset Team Points and Finalized Status
        await (prisma as any).myTeam.updateMany({
            data: {
                totalPoints: 0,
                lastFinalizedRound: -1
            }
        })

        // 5. Delete MyTeamRoundScore
        await (prisma as any).myTeamRoundScore.deleteMany()

        console.log('Team points reset')

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to reset simulation:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
