/**
 * LCK 예측 정산 서비스
 * - 완료된 LCK 경기의 예측 결과를 정산하고 GP를 지급합니다.
 * - Admin API 라우트와 Cron 라우트에서 공통으로 사용합니다.
 */

import prisma from '@/lib/prisma'
import { updateQuestProgress } from '@/lib/quest-utils'

export interface ProcessResult {
    processed: number
    gpAwarded: number
    skipped: number     // 아직 완료되지 않은 경기
    fromCron?: boolean
}

export async function processLckPredictions(fromCron = false): Promise<ProcessResult> {
    // 완료됐지만 아직 미정산된 예측 조회 (배치 처리: 한 번에 최대 500건)
    const unprocessed = await prisma.lckPrediction.findMany({
        where: { isProcessed: false },
        take: 500,
        include: {
            match: {
                select: {
                    status: true,
                    winner: true,
                    team1Score: true,
                    team2Score: true,
                    team1: true,
                    team2: true,
                },
            },
        },
    })

    let processed = 0
    let gpAwarded = 0
    let skipped = 0

    for (const pred of unprocessed) {
        const match = pred.match

        // 경기가 아직 완료되지 않으면 건너뜀
        if (match.status !== 'COMPLETED' || !match.winner) {
            skipped++
            continue
        }

        const winnerCorrect = pred.predictedWinner === match.winner

        // 스코어 정산 (예측자 입장에서 "승팀:패팀" 형태)
        let scoreCorrect = false
        if (pred.predictedScore && winnerCorrect) {
            const [winPredicted, losePredicted] = pred.predictedScore.split(':').map(Number)
            const actualWinScore  = pred.predictedWinner === match.team1 ? match.team1Score : match.team2Score
            const actualLoseScore = pred.predictedWinner === match.team1 ? match.team2Score : match.team1Score
            scoreCorrect = actualWinScore === winPredicted && actualLoseScore === losePredicted
        }

        // GP 계산: 승팀 적중 +10 GP, 스코어까지 적중 +20 GP 추가
        let gpEarned = 0
        if (winnerCorrect) gpEarned += 10
        if (scoreCorrect)  gpEarned += 20

        // ✅ 인터랙티브 트랜잭션 — isProcessed 재확인으로 크론+어드민 동시 실행 시 이중 정산 방지
        let settled = false
        await prisma.$transaction(async (tx) => {
            const current = await tx.lckPrediction.findUnique({
                where: { id: pred.id },
                select: { isProcessed: true },
            })
            if (current?.isProcessed) return // 이미 처리됨

            await tx.lckPrediction.update({
                where: { id: pred.id },
                data: { isProcessed: true, winnerCorrect, scoreCorrect, isCorrect: winnerCorrect, gpEarned },
            })

            if (gpEarned > 0) {
                await tx.user.update({
                    where: { id: pred.userId },
                    data: { gp: { increment: gpEarned } },
                })
            }
            settled = true
        })

        if (!settled) { skipped++; continue }
        if (gpEarned > 0) gpAwarded += gpEarned

        // 퀘스트 업데이트 (트랜잭션 성공 후 fire-and-forget)
        if (winnerCorrect) {
            updateQuestProgress(pred.userId, 'PREDICT_CORRECT').catch(() => {})
        } else {
            // ✅ 틀린 예측 → 연속 적중 streak 초기화
            updateQuestProgress(pred.userId, 'PREDICT_WRONG').catch(() => {})
        }

        processed++
    }

    // 정산 실행 로그 갱신
    await prisma.dataSyncLog.upsert({
        where: { dataType: 'PREDICTION_PROCESS' },
        create: {
            dataType: 'PREDICTION_PROCESS',
            lastSyncAt: new Date(),
            status: 'OK',
            details: JSON.stringify({ processed, gpAwarded, skipped, fromCron }),
        },
        update: {
            lastSyncAt: new Date(),
            status: 'OK',
            details: JSON.stringify({ processed, gpAwarded, skipped, fromCron }),
        },
    })

    return { processed, gpAwarded, skipped, fromCron }
}
