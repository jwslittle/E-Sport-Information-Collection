import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * GET /api/lck/predictions/leaderboard
 * 예측 적중률 기반 리더보드
 * 최소 3경기 예측한 유저만 포함
 */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

    // 유저별 예측 집계
    const aggregated = await prisma.lckPrediction.groupBy({
        by: ['userId'],
        where: { isProcessed: true },
        _count: { id: true },
        _sum: { gpEarned: true },
    })

    // 최소 3경기 예측한 유저만 필터
    const eligible = aggregated.filter(a => a._count.id >= 3)

    if (eligible.length === 0) {
        return NextResponse.json({ leaderboard: [], myRank: null })
    }

    // 유저별 정답 수 집계
    const correctCounts = await prisma.lckPrediction.groupBy({
        by: ['userId'],
        where: {
            isProcessed: true,
            winnerCorrect: true,
            userId: { in: eligible.map(e => e.userId) }
        },
        _count: { id: true },
    })
    const correctMap = Object.fromEntries(correctCounts.map(c => [c.userId, c._count.id]))

    // 유저 정보 조회
    const users = await prisma.user.findMany({
        where: {
            id: { in: eligible.map(e => e.userId) },
            role: { not: 'ADMIN' },
        },
        select: {
            id: true,
            name: true,
            image: true,
            profile: {
                select: { displayTitle: true, favoriteTeam: true }
            },
            userTeams: {
                where: { type: 'REAL' },
                take: 1,
                select: { name: true }
            }
        }
    })
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))

    // 리더보드 계산
    interface RowType {
        userId: string
        user: (typeof users)[number]
        total: number
        correct: number
        accuracy: number
        gpEarned: number
    }

    const rows: RowType[] = eligible
        .map(agg => {
            const user = userMap[agg.userId]
            if (!user) return null
            const total = agg._count.id
            const correct = correctMap[agg.userId] ?? 0
            const accuracy = Math.round((correct / total) * 100)
            const gpEarned = agg._sum.gpEarned ?? 0
            return { userId: agg.userId, user, total, correct, accuracy, gpEarned }
        })
        .filter((r): r is RowType => r !== null)

    // 정렬: 적중률 내림차순 → 예측 수 많을수록 우선
    rows.sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)

    const currentUserId = (session?.user as any)?.id

    const leaderboard = rows.slice(0, limit).map((row, idx) => ({
        rank: idx + 1,
        userId: row.userId,
        userName: row.user.name ?? null,
        image: row.user.image ?? null,
        teamName: row.user.userTeams[0]?.name ?? null,
        title: row.user.profile?.displayTitle ?? null,
        favoriteTeam: row.user.profile?.favoriteTeam ?? null,
        total: row.total,
        correct: row.correct,
        accuracy: row.accuracy,
        gpEarned: row.gpEarned,
        isMe: row.userId === currentUserId,
    }))

    // 내 순위 찾기 (상위 limit에 없을 경우)
    let myRank = null
    if (currentUserId) {
        const myIdx = rows.findIndex(r => r.userId === currentUserId)
        if (myIdx !== -1) {
            const myRow = rows[myIdx]
            myRank = {
                rank: myIdx + 1,
                total: myRow.total,
                correct: myRow.correct,
                accuracy: myRow.accuracy,
                gpEarned: myRow.gpEarned,
            }
        }
    }

    return NextResponse.json({ leaderboard, myRank, total: rows.length })
}
