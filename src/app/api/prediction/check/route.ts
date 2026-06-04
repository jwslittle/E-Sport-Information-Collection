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

        // 미정산 예측 조회 (완료된 경기만)
        const unprocessedPredictions = await prisma.matchPrediction.findMany({
            where: {
                userId,
                isProcessed: false,
                match: {
                    status: 'COMPLETED',
                    winnerId: { not: null }
                }
            },
            include: {
                match: { include: { winner: true } }
            }
        })

        if (unprocessedPredictions.length === 0) {
            return NextResponse.json({ message: '정산할 예측이 없습니다.', processed: 0 })
        }

        let totalPointsEarned = 0
        const processedIds: string[] = []

        for (const pred of unprocessedPredictions) {
            let isCorrect = false
            let points = 0

            if (pred.type === 'WINNER') {
                if (pred.match.winner && pred.match.winner.code === pred.target) {
                    isCorrect = true
                    points = 50
                }
            }

            try {
                // ✅ 인터랙티브 트랜잭션 — isProcessed 재확인으로 이중 정산 방지
                await prisma.$transaction(async (tx) => {
                    const current = await tx.matchPrediction.findUnique({
                        where: { id: pred.id },
                        select: { isProcessed: true },
                    })
                    if (current?.isProcessed) return // 이미 처리됨 → 건너뜀

                    await tx.matchPrediction.update({
                        where: { id: pred.id },
                        data: { isProcessed: true, isCorrect, pointsEarned: points },
                    })

                    if (isCorrect && points > 0) {
                        await tx.user.update({
                            where: { id: userId },
                            data: { gp: { increment: points } },
                        })
                    }
                })

                if (isCorrect && points > 0) totalPointsEarned += points
                processedIds.push(pred.id)
            } catch (err) {
                console.error(`[prediction/check] 정산 오류 (predId: ${pred.id}):`, err)
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedIds.length,
            pointsEarned: totalPointsEarned
        })
    } catch (error) {
        console.error('Error processing predictions:', error)
        return NextResponse.json({ error: '예측 정산 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
