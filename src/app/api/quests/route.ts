/**
 * GET  /api/quests  — 내 퀘스트 목록 + 진행 상황
 * POST /api/quests  — 퀘스트 보상 수령 { questId }
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { format, getISOWeek, getYear } from 'date-fns'
import { INITIAL_QUESTS } from '@/lib/quest-data'

export const dynamic = 'force-dynamic'

// ─── 기간 키 헬퍼 ────────────────────────────────────────────────────
function getPeriodKey(type: string): string {
    const now = new Date()
    if (type === 'DAILY') return format(now, 'yyyy-MM-dd')
    if (type === 'WEEKLY') {
        const week = getISOWeek(now)
        const year = getYear(now)
        return `${year}-W${String(week).padStart(2, '0')}`
    }
    return 'LIFETIME'
}

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    // 퀘스트 수가 INITIAL_QUESTS보다 적으면 자동 시딩 (새 퀘스트 추가 시 자동 반영)
    const questCount = await prisma.quest.count({ where: { isActive: true } })
    if (questCount < INITIAL_QUESTS.length) {
        await prisma.quest.createMany({ data: INITIAL_QUESTS, skipDuplicates: true })
        // 카드/판타지 시스템 제거로 인해 더 이상 사용하지 않는 카테고리 비활성화
        await prisma.quest.updateMany({
            where: { category: { in: ['COLLECTION', 'FANTASY'] } },
            data: { isActive: false },
        })
    }

    // 카테고리 패치: GENERAL → QUIZ (dq-daily-quiz, ach-quiz-7 재분류)
    // DB에 이미 존재하는 레코드를 올바른 카테고리로 마이그레이션
    const quizCategoryPatch = await prisma.quest.count({
        where: { id: { in: ['dq-daily-quiz', 'ach-quiz-7'] }, category: 'GENERAL' }
    })
    if (quizCategoryPatch > 0) {
        await prisma.quest.updateMany({
            where: { id: { in: ['dq-daily-quiz', 'ach-quiz-7'] } },
            data: { category: 'QUIZ' },
        })
    }

    const allQuests = await prisma.quest.findMany({ where: { isActive: true }, orderBy: { type: 'asc' } })

    // 현재 기간 키 계산
    const dailyKey   = getPeriodKey('DAILY')
    const weeklyKey  = getPeriodKey('WEEKLY')

    // 유저 진행 상황 한번에 조회
    const userProgress = await prisma.userQuestProgress.findMany({
        where: {
            userId,
            questId: { in: allQuests.map(q => q.id) },
            periodKey: { in: [dailyKey, weeklyKey, 'LIFETIME'] },
        },
    })
    const progressMap = new Map(userProgress.map(p => [`${p.questId}-${p.periodKey}`, p]))

    const format_ = (q: (typeof allQuests)[0]) => {
        const key = getPeriodKey(q.type)
        const prog = progressMap.get(`${q.id}-${key}`)
        return {
            id: q.id,
            title: q.title,
            description: q.description,
            type: q.type,
            category: q.category,
            icon: q.icon,
            targetCount: q.targetCount,
            rewardGp: q.rewardGp,
            progress: prog?.progress ?? 0,
            isCompleted: prog?.isCompleted ?? false,
            isClaimed: prog?.isClaimed ?? false,
        }
    }

    return NextResponse.json({
        daily: allQuests.filter(q => q.type === 'DAILY').map(format_),
        weekly: allQuests.filter(q => q.type === 'WEEKLY').map(format_),
        achievements: allQuests.filter(q => q.type === 'ACHIEVEMENT').map(format_),
        meta: { dailyKey, weeklyKey },
    })
}

// ─── POST (보상 수령) ────────────────────────────────────────────────
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const { questId } = await req.json()
    if (!questId) return NextResponse.json({ error: 'questId required' }, { status: 400 })

    const quest = await prisma.quest.findUnique({ where: { id: questId } })
    if (!quest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 })

    const periodKey = getPeriodKey(quest.type)
    const progress = await prisma.userQuestProgress.findUnique({
        where: { userId_questId_periodKey: { userId, questId, periodKey } },
    })

    if (!progress?.isCompleted) return NextResponse.json({ error: '퀘스트가 완료되지 않았습니다.' }, { status: 400 })
    if (progress.isClaimed)     return NextResponse.json({ error: '이미 수령한 보상입니다.' },         { status: 400 })

    // 트랜잭션: 수령 처리 + GP 지급
    const [, updatedUser] = await prisma.$transaction([
        prisma.userQuestProgress.update({
            where: { id: progress.id },
            data: { isClaimed: true },
        }),
        prisma.user.update({
            where: { id: userId },
            data: { gp: { increment: quest.rewardGp } },
        }),
    ])

    return NextResponse.json({ success: true, rewardGp: quest.rewardGp, newGp: updatedUser.gp })
}
