/**
 * Quest progress utility
 * API route에서 직접 호출하는 서버사이드 함수 (HTTP 오버헤드 없음)
 */
import prisma from '@/lib/prisma'
import { format, getISOWeek, getYear } from 'date-fns'

function getPeriodKey(type: string): string {
    const now = new Date()
    if (type === 'DAILY') return format(now, 'yyyy-MM-dd')
    if (type === 'WEEKLY') {
        const w = String(getISOWeek(now)).padStart(2, '0')
        return `${getYear(now)}-W${w}`
    }
    return 'LIFETIME'
}

// ✅ 연속(streak) 퀘스트 ID 목록 — 틀렸을 때 progress 초기화
const STREAK_QUEST_IDS = new Set([
    'ach-correct-streak-5',
    'ach-correct-streak-10',
])

export const ACTION_QUEST_MAP: Record<string, string[]> = {
    // ── 방문 / 출석
    LOGIN:               ['dq-login', 'wq-login-5', 'ach-login-7', 'ach-login-30', 'ach-login-100'],

    // ── 승부 예측
    PREDICT:             ['dq-predict-1', 'dq-predict-3', 'wq-predict-5', 'ach-predict-first', 'ach-predict-10', 'ach-predict-50', 'ach-predict-100'],
    PREDICT_CORRECT:     ['wq-predict-correct', 'wq-predict-correct-5', 'ach-correct-streak-5', 'ach-correct-streak-10'],

    // ── 탐색 / 정보
    CHECK_MATCH:         ['dq-check-match'],
    CHECK_PLAYER:        ['dq-check-player'],
    CHECK_HISTORY:       ['wq-check-history'],

    // ── AI / 퀴즈
    AI_CHAT:             ['dq-ai-chat', 'ach-ai-10', 'wq-ai-chat-3'],
    DAILY_QUIZ:          ['dq-daily-quiz', 'ach-quiz-7', 'ach-quiz-30days'],
    QUIZ_CORRECT:        ['ach-quiz-correct-10', 'ach-quiz-correct-30'],

    // ── 예측 틀림 → 연속 적중 streak 초기화
    PREDICT_WRONG:       ['ach-correct-streak-5', 'ach-correct-streak-10'],

    // ── 코스메틱 / 상점
    GET_COSMETIC:        ['ach-cosmetic-first'],

    // ── 소셜
    FOLLOW_USER:         ['ach-follow-first'],
    COMMUNITY_POST:      ['dq-community-post', 'wq-community-5', 'ach-post-10'],
    COMMUNITY_COMMENT:   ['dq-community-comment', 'wq-community-5'],

    // ── 가챠
    GACHA:               ['dq-gacha-1', 'wq-gacha-3', 'ach-gacha-first', 'ach-gacha-10'],
}

/**
 * 퀘스트 진행도를 업데이트합니다.
 * 이미 완료된 퀘스트는 중복 카운트되지 않습니다.
 * @returns 새로 완료된 퀘스트 id 목록
 */
export async function updateQuestProgress(
    userId: string,
    action: string,
    amount = 1
): Promise<string[]> {
    const questIds = ACTION_QUEST_MAP[action]
    if (!questIds?.length) return []

    const quests = await prisma.quest.findMany({
        where: { id: { in: questIds }, isActive: true },
    })
    if (quests.length === 0) return []

    const completed: string[] = []

    for (const quest of quests) {
        const periodKey = getPeriodKey(quest.type)

        const existing = await prisma.userQuestProgress.findUnique({
            where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } },
        })

        // 이미 완료된 퀘스트 스킵
        if (existing?.isCompleted) continue

        // ✅ PREDICT_WRONG 처리: streak 퀘스트는 progress를 0으로 초기화
        if (action === 'PREDICT_WRONG' && STREAK_QUEST_IDS.has(quest.id)) {
            if (existing && existing.progress > 0) {
                await prisma.userQuestProgress.update({
                    where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } },
                    data: { progress: 0, isCompleted: false },
                })
            }
            continue
        }

        const newProgress = Math.min((existing?.progress ?? 0) + amount, quest.targetCount)
        const isCompleted = newProgress >= quest.targetCount

        await prisma.userQuestProgress.upsert({
            where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } },
            create: { userId, questId: quest.id, periodKey, progress: newProgress, isCompleted },
            // updateMany 대신 update 사용 — isCompleted 재확인은 isClaimed 보호 레이어에서 처리
            update: { progress: newProgress, isCompleted },
        })

        if (isCompleted && !existing?.isCompleted) {
            completed.push(quest.id)
        }
    }

    return completed
}
