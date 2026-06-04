/**
 * POST /api/prediction/submit
 * 경기 결과 예측 제출
 *
 * Body: { matchId: string, type: 'WINNER', target: string (팀 코드) }
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateQuestProgress } from '@/lib/quest-utils'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { matchId, type = 'WINNER', target } = await req.json()
    if (!matchId || !target) {
        return NextResponse.json({ error: 'matchId, target 필요' }, { status: 400 })
    }

    // 경기 존재 여부 확인
    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) return NextResponse.json({ error: '경기를 찾을 수 없습니다.' }, { status: 404 })
    if (match.status === 'COMPLETED') {
        return NextResponse.json({ error: '이미 종료된 경기입니다.' }, { status: 400 })
    }
    if (match.status === 'LIVE' || match.status === 'INPROGRESS') {
        return NextResponse.json({ error: '경기가 이미 진행 중입니다. 예측은 경기 시작 전에만 가능합니다.' }, { status: 400 })
    }

    // 중복 예측 방지
    const existing = await prisma.matchPrediction.findFirst({ where: { userId, matchId, type } })
    if (existing) {
        return NextResponse.json({ error: '이미 예측한 경기입니다.' }, { status: 400 })
    }

    const prediction = await prisma.matchPrediction.create({
        data: { userId, matchId, type, target },
    })

    // 퀘스트 진행 (비동기)
    updateQuestProgress(userId, 'PREDICT').catch(console.error)

    return NextResponse.json({ success: true, prediction })
}
