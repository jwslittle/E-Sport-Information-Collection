import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            following: {
                include: {
                    following: true
                }
            },
            followedBy: {
                include: {
                    follower: true
                }
            }
        }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
        following: user.following.map(f => f.following),
        followers: user.followedBy.map(f => f.follower)
    })
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetUserId } = await req.json()
    if (!targetUserId) {
        return NextResponse.json({ error: 'Target user ID required' }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (currentUser.id === targetUserId) {
        return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    try {
        await prisma.follows.create({
            data: {
                followerId: currentUser.id,
                followingId: targetUserId
            }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Already following or invalid user' }, { status: 400 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetUserId } = await req.json()

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    try {
        await prisma.follows.delete({
            where: {
                followerId_followingId: {
                    followerId: currentUser.id,
                    followingId: targetUserId
                }
            }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Not following' }, { status: 400 })
    }
}
