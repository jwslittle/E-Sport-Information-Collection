import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: List active auctions
export async function GET(request: Request) {
    try {
        const auctions = await (prisma as any).auction.findMany({
            where: {
                status: 'ACTIVE',
                endTime: { gt: new Date() }
            },
            include: {
                card: {
                    include: { player: true }
                },
                seller: {
                    select: { name: true, image: true }
                },
                highestBidder: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ auctions })
    } catch (error) {
        console.error('Failed to fetch auctions:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Create a new auction
export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { cardId, minPrice, durationHours } = await request.json()

    try {
        // 1. Verify Card Ownership and Status
        const userCard = await prisma.userCard.findUnique({
            where: { id: cardId },
            include: { auction: true } as any
        })

        if (!userCard || userCard.userId !== userId) {
            return NextResponse.json({ error: 'Card not found or not owned' }, { status: 404 })
        }

        if ((userCard as any).isLocked || (userCard as any).auction) {
            return NextResponse.json({ error: 'Card is locked or already in auction' }, { status: 400 })
        }

        // 2. Create Auction
        const endTime = new Date()
        endTime.setHours(endTime.getHours() + (durationHours || 24))

        const auction = await (prisma as any).auction.create({
            data: {
                sellerId: userId,
                cardId: cardId,
                minPrice: minPrice || 100,
                currentPrice: minPrice || 100,
                endTime: endTime,
                status: 'ACTIVE'
            }
        })

        return NextResponse.json({ success: true, auction })

    } catch (error) {
        console.error('Failed to create auction:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
