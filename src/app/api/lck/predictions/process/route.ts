import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { processLckPredictions } from '@/lib/services/prediction-process.service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/lck/predictions/process
 * 완료된 LCK 경기의 예측 결과를 정산하고 GP를 지급합니다.
 * 어드민 전용 (수동 실행)
 */
export async function POST() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: '관리자 전용' }, { status: 403 })
    }

    const result = await processLckPredictions(false)
    return NextResponse.json({ ok: true, ...result })
}

/**
 * GET /api/lck/predictions/process
 * 정산 현황 조회 (어드민)
 */
export async function GET() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: '관리자 전용' }, { status: 403 })
    }

    const [total, processed, pending, processLog] = await Promise.all([
        prisma.lckPrediction.count(),
        prisma.lckPrediction.count({ where: { isProcessed: true } }),
        prisma.lckPrediction.count({ where: { isProcessed: false } }),
        prisma.dataSyncLog.findUnique({ where: { dataType: 'PREDICTION_PROCESS' } }),
    ])

    return NextResponse.json({
        total,
        processed,
        pending,
        lastProcessedAt: processLog?.lastSyncAt ?? null,
        lastDetails: processLog?.details ? JSON.parse(processLog.details) : null,
    })
}
