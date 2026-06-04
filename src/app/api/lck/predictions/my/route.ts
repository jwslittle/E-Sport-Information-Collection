import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * 완료된 경기의 예측을 자동 정산하고 GP 지급
 * ✅ 각 예측을 트랜잭션으로 처리하여 이중 지급 방지
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

        const gpEarned = (winnerCorrect ? 10 : 0) + (scoreCorrect ? 20 : 0)

        try {
            // ✅ 인터랙티브 트랜잭션: isProcessed 재확인 후 업데이트 (이중 정산 방지)
            await prisma.$transaction(async (tx) => {
                const current = await tx.lckPrediction.findUnique({
                    where: { id: pred.id },
                    select: { isProcessed: true }
                })
                // 이미 처리된 예측은 건너뜀 (동시 요청 경쟁 방지)
                if (current?.isProcessed) return

                await tx.lckPrediction.update({
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
                    await tx.user.update({
                        where: { id: userId },
                        data: { gp: { increment: gpEarned } }
                    })
                }
            })

            gpTotal += gpEarned
        } catch (err) {
            console.error(`[autoProcess] 예측 정산 오류 (predId: ${pred.id}):`, err)
        }
    }

    return gpTotal
}

export async function GET() {
    const session = await getServerSession(authOptions)
    // ✅ session.user.id 사용 (email 기반 조회 제거)
    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const userId = session.user.id

    // DB에서 user 존재 확인 (id 기반)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

    // 완료된 경기 자동 정산 (원자적 트랜잭션)
    await autoProcess(userId)

    const predictions = await prisma.lckPrediction.findMany({
        where: { userId },
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

    // 연속 적중 스트릭 계산 (최근 예측부터 순서대로)
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
