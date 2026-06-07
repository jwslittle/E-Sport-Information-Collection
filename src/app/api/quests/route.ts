/**
 * GET  /api/quests  — 내 퀘스트 목록 + 진행 상황
 * POST /api/quests  — 퀘스트 보상 수령 { questId }
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getISOWeek, getYear } from 'date-fns'
import { INITIAL_QUESTS } from '@/lib/quest-data'

export const dynamic = 'force-dynamic'

// ─── 기간 키 헬퍼 (KST 기준 — 퀴즈·대시보드와 동일) ──────────────────
function getPeriodKey(type: string): string {
    const now = new Date()
    // KST(Asia/Seoul) 날짜 문자열: "2026-06-06"
    const kst = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now)
    if (type === 'DAILY') return kst
    if (type === 'WEEKLY') {
        const kstDate = new Date(kst)
        const week = getISOWeek(kstDate)
        const year = getYear(kstDate)
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
        // ✅ 설명 문구가 변경된 퀘스트 DB 업데이트 (description은 createMany로 갱신 불가)
        // ach-quiz-7: "7일 연속" → "7일 이상" (누적 카운트 로직과 일치)
        // 퀘스트 수가 맞으면 이미 패치된 것이므로 건너뜀 — 매 GET마다 불필요한 DB 왕복 제거
        await prisma.quest.updateMany({
            where: { id: 'ach-quiz-7', description: '7일 연속 오늘의 퀴즈를 풀어보세요.' },
            data: { description: '오늘의 퀴즈를 7일 이상 풀어보세요.' },
        }).catch(() => {})
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

    // ✅ 인터랙티브 트랜잭션으로 race condition 방지
    // findUnique + isClaimed 체크를 트랜잭션 내부에서 재확인하여 이중 지급 불가
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 트랜잭션 안에서 진행 상황 재조회 (동시 요청 차단)
            const prog = await tx.userQuestProgress.findUnique({
                where: { userId_questId_periodKey: { userId, questId, periodKey } },
            })

            if (!prog?.isCompleted) throw new Error('NOT_COMPLETED')
            if (prog.isClaimed)     throw new Error('ALREADY_CLAIMED')

            await tx.userQuestProgress.update({
                where: { id: prog.id },
                data: { isClaimed: true },
            })

            return tx.user.update({
                where: { id: userId },
                data: { gp: { increment: quest.rewardGp } },
            })
        })

        return NextResponse.json({ success: true, rewardGp: quest.rewardGp, newGp: updatedUser.gp })
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (err.message === 'NOT_COMPLETED') {
                return NextResponse.json({ error: '퀘스트가 완료되지 않았습니다.' }, { status: 400 })
            }
            if (err.message === 'ALREADY_CLAIMED') {
                return NextResponse.json({ error: '이미 수령한 보상입니다.' }, { status: 400 })
            }
        }
        throw err
    }
}
