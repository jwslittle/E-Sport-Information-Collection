import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const userId = (session.user as any).id

        // 1. Find all unprocessed predictions for this user where the match is COMPLETED
        const unprocessedPredictions = await prisma.matchPrediction.findMany({
            where: {
                userId,
                isProcessed: false,
                match: {
                    status: 'COMPLETED',
                    winnerId: { not: null } // Ensure winner is set
                }
            },
            include: {
                match: {
                    include: {
                        winner: true
                    }
                }
            }
        })

        if (unprocessedPredictions.length === 0) {
            return NextResponse.json({ message: 'No new predictions to process', processed: 0 })
        }

        let totalPointsEarned = 0
        const processedIds = []

        // 2. Process each prediction
        for (const pred of unprocessedPredictions) {
            let isCorrect = false
            let points = 0

            if (pred.type === 'WINNER') {
                // Check if target (TeamCode) matches Winner's Code
                if (pred.match.winner && pred.match.winner.code === pred.target) {
                    isCorrect = true
                    points = 50 // Fixed 50 points reward
                }
            }

            // Update Prediction Record
            await prisma.matchPrediction.update({
                where: { id: pred.id },
                data: {
                    isProcessed: true,
                    isCorrect,
                    pointsEarned: points
                }
            })

            if (isCorrect && points > 0) {
                totalPointsEarned += points
            }
            processedIds.push(pred.id)
        }

        // 3. Award points to user
        if (totalPointsEarned > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    gp: { increment: totalPointsEarned }
                }
            })
        }

        return NextResponse.json({
            success: true,
            processed: processedIds.length,
            pointsEarned: totalPointsEarned
        })
    } catch (error) {
        console.error('Error processing predictions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
