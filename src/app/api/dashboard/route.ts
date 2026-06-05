import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    // 로그인 필수 — 통계 데이터 보호
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        // KST(Asia/Seoul) 기준 날짜 키 — 퀴즈 시스템과 동일한 기준 사용
        const todayKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now)

        const [recentPredictionCount, topAccuracyUsers, todayQuizCount] = await Promise.all([
            // 1. 최근 7일 LCK 예측 참여 수
            prisma.lckPrediction.count({
                where: { createdAt: { gte: sevenDaysAgo } },
            }),

            // 2. 예측 정확도 상위 5명 (최소 3경기 이상, isCorrect 기준)
            prisma.lckPrediction.groupBy({
                by: ['userId'],
                where: { isProcessed: true },
                _count: { _all: true },
                _sum: { gpEarned: true },
            }).then(async (rows) => {
                const filtered = rows.filter(r => r._count._all >= 3)

                // 정답 수 집계
                const correctCounts = await prisma.lckPrediction.groupBy({
                    by: ['userId'],
                    where: { isProcessed: true, isCorrect: true },
                    _count: { _all: true },
                })
                const correctMap = new Map(correctCounts.map(r => [r.userId, r._count._all]))

                const withAccuracy = filtered.map(r => {
                    const correct = correctMap.get(r.userId) ?? 0
                    const accuracy = Math.round((correct / r._count._all) * 100)
                    return { userId: r.userId, total: r._count._all, correct, accuracy, gpEarned: r._sum.gpEarned ?? 0 }
                })
                .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)
                .slice(0, 5)

                // 유저 정보 조회
                const userIds = withAccuracy.map(r => r.userId)
                const users = await prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true, name: true, image: true },
                })
                const userMap = new Map(users.map(u => [u.id, u]))

                return withAccuracy.map((r, i) => ({
                    rank: i + 1,
                    userId: r.userId,
                    userName: userMap.get(r.userId)?.name ?? '익명',
                    image: userMap.get(r.userId)?.image ?? null,
                    total: r.total,
                    correct: r.correct,
                    accuracy: r.accuracy,
                    gpEarned: r.gpEarned,
                    isMe: r.userId === session.user.id,
                }))
            }),

            // 3. 오늘의 퀴즈 참여자 수
            prisma.userDailyQuizAnswer.count({
                where: { dateKey: todayKey },
            }),
        ])

        return NextResponse.json({
            recentPredictionCount,
            topAccuracyUsers,
            todayQuizCount,
        })

    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
