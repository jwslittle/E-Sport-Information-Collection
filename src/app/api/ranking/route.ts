import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'global' // 'global' or 'friends'

    const session = await getServerSession(authOptions)

    if (type === 'friends') {
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                following: true
            }
        })

        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const friendIds = currentUser.following.map(f => f.followingId)
        friendIds.push(currentUser.id) // Include self

        const rankings = await prisma.myTeam.findMany({
            where: {
                userId: { in: friendIds },
                isFinalized: true
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: {
                totalPoints: 'desc'
            }
        })

        return NextResponse.json(rankings)
    } else {
        // Global ranking
        const rankings = await prisma.myTeam.findMany({
            where: {
                isFinalized: true
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: {
                totalPoints: 'desc'
            },
            take: 100
        })

        return NextResponse.json(rankings)
    }
}
