import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'global' // 'global' | 'friends'
    const leagueType = searchParams.get('leagueType') || 'REAL'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    try {
        let whereClause: any = {}
        let rankings: any[] = []
        let total = 0

        if (type === 'friends') {
            // Friends logic disabled
            rankings = []
            total = 0
        } else if (type === 'wealth') {
            // Exclude Admins
            whereClause.role = { not: 'ADMIN' }

            const [count, users] = await Promise.all([
                prisma.user.count({ where: whereClause }),
                prisma.user.findMany({
                    where: whereClause,
                    orderBy: { gp: 'desc' },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        gp: true,
                    }
                })
            ])
            total = count

            rankings = users.map((user, index) => {
                return {
                    rank: skip + index + 1,
                    id: user.id,
                    userName: user.name ?? null,
                    image: user.image ?? null,
                    totalPoints: user.gp,
                    isMe: user.id === (session.user as any).id,
                }
            })

        } else {
            // Global Rankings (Real or Sim)
            // Exclude Admins from UserTeam rankings
            if (!whereClause.user) whereClause.user = {}
            whereClause.user.role = { not: 'ADMIN' }

            // Filter by League Type
            whereClause.type = leagueType

            const [count, teams] = await Promise.all([
                prisma.userTeam.count({ where: whereClause }),
                prisma.userTeam.findMany({
                    where: whereClause,
                    orderBy: { totalPoints: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            }
                        }
                    }
                })
            ])
            total = count

            rankings = teams.map((team, index) => ({
                rank: skip + index + 1,
                id: team.id,
                name: team.name,
                image: null, // UserTeam has no image
                totalPoints: team.totalPoints,
                owner: {
                    id: team.user.id,
                    name: null, // Hide real name
                    image: null, // Hide Google Image
                    isMe: team.user.id === (session.user as any).id,
                    isFollowing: false // Follows disabled
                }
            }))
        }

        return NextResponse.json({
            data: rankings,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('Ranking API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
