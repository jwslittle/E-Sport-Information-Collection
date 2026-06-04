import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // 로그인 필수 — 통계 데이터 보호
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'REAL'

        // 1. Top Picked Players (Usage in UserTeams of specific type)
        // Note: Prisma groupBy doesn't support deep filtering easily in all versions, 
        // but we can filter where userTeam matches type.
        // Actually, for groupBy, we can use `where`.
        const topPicked = await prisma.userTeamPlayer.groupBy({
            by: ['playerId'],
            where: {
                userTeam: {
                    type: type
                }
            },
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

        // ✅ N+1 제거: topPickedDetails 중복 루프 제거, 단일 Promise.all만 사용
        const topPickedWithTeam = await Promise.all(
            topPicked.map(async (item) => {
                const player = await prisma.player.findUnique({
                    where: { id: item.playerId },
                    include: { team: true }
                })
                return {
                    name: player?.name || 'Unknown',
                    team: player?.team?.shortName || player?.team?.name || 'Unknown',
                    count: item._count._all
                }
            })
        )


        // 2 & 3. Stats (Points & Position Meta)
        let playerStatsMap: Record<string, number> = {}

        if (type === 'REAL') {
            // Use stored JSON stats
            const allPlayers = await prisma.player.findMany({ include: { team: true } })
            allPlayers.forEach(p => {
                const stats = p.stats ? (typeof p.stats === 'string' ? JSON.parse(p.stats) : p.stats) : {}
                // Schema says `stats Json?`. It might be object.
                // Safely handle json.
                const points = (stats as any)?.fantasyPoints || 0
                playerStatsMap[p.id] = points
            })
        } else {
            // SIMULATION: Aggregate from PlayerPerformance
            const performances = await prisma.playerPerformance.groupBy({
                by: ['playerId'],
                where: {
                    match: {
                        leagueType: 'SIMULATION'
                    }
                },
                _sum: {
                    fantasyPoints: true
                }
            })
            performances.forEach(p => {
                playerStatsMap[p.playerId] = p._sum.fantasyPoints || 0
            })
        }

        const allPlayers = await prisma.player.findMany({ include: { team: true } })

        const processedStats = allPlayers.map(p => ({
            name: p.name,
            team: p.team?.shortName || p.team?.name || 'Unknown',
            points: playerStatsMap[p.id] || 0,
            position: p.position
        }))

        // Chart 1: Top Points
        const topPoints = processedStats
            .sort((a, b) => b.points - a.points)
            .slice(0, 5)


        // Chart 2: Top Wildcard (Effective)
        const wildcardUsages = await prisma.userTeamPlayer.groupBy({
            by: ['playerId'],
            where: {
                position: 'WILDCARD',
                userTeam: { type: type }
            },
            _count: { playerId: true }
        })

        const topWildcardPoints = wildcardUsages.map(usage => {
            const player = processedStats.find(p => p.name === allPlayers.find(ap => ap.id === usage.playerId)?.name)
            if (!player) return null

            const wildcardPointsPerUser = player.points * 0.33
            const totalContribution = wildcardPointsPerUser * usage._count.playerId

            return {
                name: player.name,
                team: player.team,
                points: Math.round(totalContribution),
                count: usage._count.playerId
            }
        })
            .filter(p => p !== null)
            .sort((a, b) => (b?.points || 0) - (a?.points || 0))
            .slice(0, 5)


        // 3. Position Meta
        const positionStats: Record<string, { totalPoints: number, count: number }> = {}
        processedStats.forEach(p => {
            if (!positionStats[p.position]) {
                positionStats[p.position] = { totalPoints: 0, count: 0 }
            }
            positionStats[p.position].totalPoints += p.points
            positionStats[p.position].count += 1
        })

        const positionMeta = Object.entries(positionStats).map(([position, data]) => ({
            position,
            avgPoints: Math.round(data.totalPoints / Math.max(1, data.count))
        })).sort((a, b) => b.avgPoints - a.avgPoints)


        return NextResponse.json({
            topPicked: topPickedWithTeam,
            topPoints,
            topWildcardPoints,
            positionMeta
        })

    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
