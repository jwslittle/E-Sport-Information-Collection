import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    try {
        // 1. Fetch Quests and Achievements
        const quests = await (prisma as any).quest.findMany({
            include: {
                userQuests: {
                    where: { userId }
                }
            }
        })

        const achievements = await (prisma as any).achievement.findMany({
            include: {
                userAchievements: {
                    where: { userId }
                }
            }
        })

        // 2. Format Response
        const formattedQuests = quests.map(q => {
            const userQuest = q.userQuests[0]
            return {
                ...q,
                progress: userQuest?.progress || 0,
                isCompleted: userQuest?.isCompleted || false,
                isClaimed: userQuest?.isClaimed || false,
            }
        })

        const formattedAchievements = achievements.map(a => {
            const userAchievement = a.userAchievements[0]
            return {
                ...a,
                progress: userAchievement?.progress || 0,
                isCompleted: userAchievement?.isCompleted || false,
                isClaimed: userAchievement?.isClaimed || false,
            }
        })

        return NextResponse.json({
            quests: formattedQuests,
            achievements: formattedAchievements
        })

    } catch (error) {
        console.error('Failed to fetch quests:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { type, id } = await request.json() // type: 'QUEST' | 'ACHIEVEMENT'

    try {
        let rewardPoints = 0

        if (type === 'QUEST') {
            const userQuest = await (prisma as any).userQuest.findUnique({
                where: { userId_questId: { userId, questId: id } },
                include: { quest: true }
            })

            if (!userQuest || !userQuest.isCompleted || userQuest.isClaimed) {
                return NextResponse.json({ error: 'Cannot claim reward' }, { status: 400 })
            }

            rewardPoints = userQuest.quest.rewardPoints

            await prisma.$transaction([
                (prisma as any).userQuest.update({
                    where: { id: userQuest.id },
                    data: { isClaimed: true }
                }),
                prisma.user.update({
                    where: { id: userId },
                    data: { points: { increment: rewardPoints } }
                })
            ])
        } else if (type === 'ACHIEVEMENT') {
            const userAchievement = await (prisma as any).userAchievement.findUnique({
                where: { userId_achievementId: { userId, achievementId: id } },
                include: { achievement: true }
            })

            if (!userAchievement || !userAchievement.isCompleted || userAchievement.isClaimed) {
                return NextResponse.json({ error: 'Cannot claim reward' }, { status: 400 })
            }

            rewardPoints = userAchievement.achievement.rewardPoints

            await prisma.$transaction([
                (prisma as any).userAchievement.update({
                    where: { id: userAchievement.id },
                    data: { isClaimed: true }
                }),
                prisma.user.update({
                    where: { id: userId },
                    data: { points: { increment: rewardPoints } }
                })
            ])
        }

        return NextResponse.json({ success: true, rewardPoints })

    } catch (error) {
        console.error('Failed to claim reward:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
