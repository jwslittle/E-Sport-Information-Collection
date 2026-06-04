import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateQuestProgress } from '@/lib/quest-utils'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    // ✅ session.user.id 직접 사용 (email 경유 DB 조회 불필요)
    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const userId = session.user.id as string

    const body = await req.json()
    const { matchId, predictedWinner, predictedScore } = body

    if (!matchId || !predictedWinner) {
        return NextResponse.json({ error: 'matchId, predictedWinner는 필수입니다.' }, { status: 400 })
    }

    // 스코어 유효성 검사
    if (predictedScore && !['2:0', '2:1'].includes(predictedScore)) {
        return NextResponse.json({ error: '유효한 스코어: 2:0 또는 2:1' }, { status: 400 })
    }

    // 경기 존재 + 상태 확인
    const match = await prisma.lckRealMatch.findUnique({ where: { id: matchId } })
    if (!match) return NextResponse.json({ error: '경기를 찾을 수 없습니다.' }, { status: 404 })

    // COMPLETED 또는 LIVE 상태 예측 차단 (진행 중인 경기 포함)
    if (match.status === 'COMPLETED') {
        return NextResponse.json({ error: '이미 종료된 경기입니다.' }, { status: 400 })
    }
    if (match.status === 'LIVE' || match.status === 'INPROGRESS') {
        return NextResponse.json({ error: '경기가 이미 진행 중입니다. 예측은 경기 시작 전에만 가능합니다.' }, { status: 400 })
    }

    // 경기 시작 시간 체크 (시작 5분 전까지만 예측 가능)
    if (match.scheduledAt) {
        const cutoff = new Date(match.scheduledAt.getTime() - 5 * 60 * 1000)
        if (new Date() > cutoff) {
            return NextResponse.json({ error: '예측 마감 시간이 지났습니다. (경기 시작 5분 전까지)' }, { status: 400 })
        }
    } else {
        // scheduledAt이 없으면 예측 불가 — TBD 경기 차단
        return NextResponse.json({ error: '경기 일정이 확정되지 않았습니다. 일정 확정 후 예측 가능합니다.' }, { status: 400 })
    }

    // 팀 코드 유효성
    if (predictedWinner !== match.team1 && predictedWinner !== match.team2) {
        return NextResponse.json({ error: '올바른 팀 코드를 입력하세요.' }, { status: 400 })
    }

    // 중복 예측 방지
    const existing = await prisma.lckPrediction.findUnique({
        where: { userId_matchId: { userId, matchId } }
    })
    if (existing) {
        return NextResponse.json({ error: '이미 예측했습니다.' }, { status: 400 })
    }

    const prediction = await prisma.lckPrediction.create({
        data: {
            userId,
            matchId,
            predictedWinner,
            predictedScore: predictedScore || null,
        }
    })

    // 퀘스트 진행도 업데이트 (fire-and-forget, 오류 무시)
    updateQuestProgress(userId, 'PREDICT').catch(() => {})

    return NextResponse.json({ ok: true, prediction })
}
