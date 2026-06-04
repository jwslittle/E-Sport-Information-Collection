import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * 완료된 경기의 예측을 자동 정산하고 GP 지급
 * 해당 유저의 예측만 처리 (보안상 본인 것만)
 */
async function autoProcess(userId: string) {
    const unprocessed = await prisma.lckPrediction.findMany({
        where: { userId, isProcessed: false },
        include: {
            match: {
                select: {
                    status: true,
                    winner: true,
                    team1Score: true,
                    team2Score: true,
                    team1: true,
                    team2: true,
                }
            }
        }
    })

    let gpTotal = 0

    for (const pred of unprocessed) {
        const match = pred.match
        if (match.status !== 'COMPLETED' || !match.winner) continue

        const winnerCorrect = pred.predictedWinner === match.winner

        let scoreCorrect = false
        if (pred.predictedScore && winnerCorrect) {
            const [winPredicted, losePredicted] = pred.predictedScore.split(':').map(Number)
            const actualWinScore = pred.predictedWinner === match.team1 ? match.team1Score : match.team2Score
            const actualLoseScore = pred.predictedWinner === match.team1 ? match.team2Score : match.team1Score
            scoreCorrect = actualWinScore === winPredicted && actualLoseScore === losePredicted
        }

        let gpEarned = 0
        if (winnerCorrect) gpEarned += 10
        if (scoreCorrect) gpEarned += 20

        await prisma.lckPrediction.update({
            where: { id: pred.id },
            data: {
                isProcessed: true,
                winnerCorrect,
                scoreCorrect,
                isCorrect: winnerCorrect,
                gpEarned,
            }
        })

        if (gpEarned > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: { gp: { increment: gpEarned } }
            })
            gpTotal += gpEarned
        }
    }

    return gpTotal
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

    // 완료된 경기 자동 정산
    await autoProcess(user.id)

    const predictions = await prisma.lckPrediction.findMany({
        where: { userId: user.id },
        include: {
            match: {
                select: {
                    id: true,
                    team1: true,
                    team2: true,
                    team1Name: true,
                    team2Name: true,
                    team1Logo: true,
                    team2Logo: true,
                    team1Score: true,
                    team2Score: true,
                    winner: true,
                    status: true,
                    scheduledAt: true,
                    bestOf: true,
                    season: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    // 통계 계산
    const processed = predictions.filter(p => p.isProcessed)
    const correct = processed.filter(p => p.winnerCorrect).length
    const accuracy = processed.length > 0 ? Math.round((correct / processed.length) * 100) : 0
    const totalGp = predictions.reduce((sum, p) => sum + p.gpEarned, 0)

    // 연속 적중 스트릭 계산
    let streak = 0
    const sortedProcessed = [...processed].sort(
        (a, b) => new Date(b.match.scheduledAt ?? 0).getTime() - new Date(a.match.scheduledAt ?? 0).getTime()
    )
    for (const p of sortedProcessed) {
        if (p.winnerCorrect) streak++
        else break
    }

    return NextResponse.json({
        predictions,
        stats: {
            total: predictions.length,
            processed: processed.length,
            correct,
            accuracy,
            totalGp,
            streak,
        }
    })
}
