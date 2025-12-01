import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // 1. Top Picked Players (Most owned cards)
        const topPicked = await prisma.card.groupBy({
            by: ['playerId'],
            _count: {
                _all: true
            },
            orderBy: {
                _count: {
                    playerId: 'desc'
                }
            },
            take: 5
        })

        // Fetch player details for top picked
        const topPickedDetails = await Promise.all(
            topPicked.map(async (item) => {
                const player = await prisma.player.findUnique({
                    where: { id: item.playerId }
                })
                return {
                    name: player?.name || 'Unknown',
                    team: player?.team || 'Unknown',
                    count: item._count._all
                }
            })
        )

        // 2. Highest Win Rate Players (Based on Season Stats)
        const allPlayers = await prisma.player.findMany()
        const winRateStats = allPlayers
            .map(p => {
                const stats = p.seasonStats ? JSON.parse(p.seasonStats) : {}
                const games = stats.games || 0
                const wins = stats.wins || 0
                return {
                    name: p.name,
                    team: p.team,
                    winRate: games > 0 ? Math.round((wins / games) * 100) : 0,
                    games
                }
            })
            .filter(p => p.games >= 5) // Minimum 5 games
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, 5)

        // 3. Position Meta (Average Points by Position)
        const positionStats: Record<string, { totalPoints: number, count: number }> = {}

        allPlayers.forEach(p => {
            const stats = p.seasonStats ? JSON.parse(p.seasonStats) : {}
            const points = stats.fantasyPoints || 0

            if (!positionStats[p.position]) {
                positionStats[p.position] = { totalPoints: 0, count: 0 }
            }
            positionStats[p.position].totalPoints += points
            positionStats[p.position].count += 1
        })

        const positionMeta = Object.entries(positionStats).map(([position, data]) => ({
            position,
            avgPoints: Math.round(data.totalPoints / Math.max(1, data.count))
        })).sort((a, b) => b.avgPoints - a.avgPoints)

        return NextResponse.json({
            topPicked: topPickedDetails,
            winRates: winRateStats,
            positionMeta
        })

    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
