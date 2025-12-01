import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const auctionId = params.id
    const { amount } = await request.json()

    try {
        // 1. Fetch Auction and User
        const auction = await (prisma as any).auction.findUnique({
            where: { id: auctionId }
        })

        if (!auction) return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
        if (auction.status !== 'ACTIVE' || new Date() > auction.endTime) {
            return NextResponse.json({ error: 'Auction ended' }, { status: 400 })
        }
        if (auction.sellerId === userId) {
            return NextResponse.json({ error: 'Cannot bid on your own auction' }, { status: 400 })
        }
        if (amount <= auction.currentPrice) {
            return NextResponse.json({ error: 'Bid must be higher than current price' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user || user.points < amount) {
            return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
        }

        // 2. Process Bid (Transaction)
        await prisma.$transaction(async (tx) => {
            // Refund previous highest bidder
            if (auction.highestBidderId) {
                await tx.user.update({
                    where: { id: auction.highestBidderId },
                    data: { points: { increment: auction.currentPrice } }
                })
            }

            // Deduct points from new bidder
            await tx.user.update({
                where: { id: userId },
                data: { points: { decrement: amount } }
            })

            // Update Auction
            await (tx as any).auction.update({
                where: { id: auctionId },
                data: {
                    currentPrice: amount,
                    highestBidderId: userId
                }
            })

            // Create Bid Record
            await (tx as any).bid.create({
                data: {
                    auctionId,
                    bidderId: userId,
                    amount
                }
            })
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Failed to place bid:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
