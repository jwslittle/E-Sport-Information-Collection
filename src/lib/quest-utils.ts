/**
 * Quest progress utility
 * API route에서 직접 호출하는 서버사이드 함수 (HTTP 오버헤드 없음)
 */
import prisma from '@/lib/prisma'
import { getISOWeek, getYear } from 'date-fns'

// KST(Asia/Seoul) 기준 날짜 문자열 반환 — 대시보드·퀴즈와 동일한 기준
const kstDateStr = (d: Date) =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d)

function getPeriodKey(type: string): string {
    const now = new Date()
    const kst = kstDateStr(now)          // e.g. "2026-06-06"
    if (type === 'DAILY') return kst
    if (type === 'WEEKLY') {
        // KST 날짜 기준 ISO 주차: "YYYY-Www"
        const kstDate = new Date(kst)    // UTC 자정으로 파싱 → 주차 계산에 안전
        const w = String(getISOWeek(kstDate)).padStart(2, '0')
        return `${getYear(kstDate)}-W${w}`
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
    GET_COSMETIC:        ['ach-cosmetic-first', 'ach-shop-first', 'ach-shop-5'],

    // ── 소셜
    FOLLOW_USER:         ['ach-follow-first'],
    COMMUNITY_POST:      ['dq-community-post', 'wq-community-5', 'ach-post-10'],
    COMMUNITY_COMMENT:   ['dq-community-comment', 'wq-community-5'],
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

    // N+1 방지: 루프 전에 해당 퀘스트들의 progress를 한 번에 조회
    const allProgress = await prisma.userQuestProgress.findMany({
        where: {
            userId,
            questId: { in: quests.map(q => q.id) },
        },
    })
    // Map key: "questId-periodKey"
    const progressMap = new Map(allProgress.map(p => [`${p.questId}-${p.periodKey}`, p]))

    for (const quest of quests) {
        const periodKey = getPeriodKey(quest.type)

        const existing = progressMap.get(`${quest.id}-${periodKey}`) ?? null

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

        // ✅ 동시성 안전: DB 레벨 원자적 증분으로 경쟁 조건 방지
        // 클라이언트에서 progress를 계산하던 방식(read → compute → write)은
        // 동시 요청이 같은 값을 읽어 중복 완료 이벤트가 발생하는 문제가 있었음
        const row = await prisma.userQuestProgress.upsert({
            where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } },
            create: { userId, questId: quest.id, periodKey, progress: amount, isCompleted: false },
            update: { progress: { increment: amount } },  // ← DB 레벨 원자적 증분
        })

        // ✅ 완료 처리를 updateMany 조건부 업데이트로 안전하게 처리
        // isCompleted: false 조건 덕분에 동시 요청 중 단 하나만 성공(count > 0)
        if (row.progress >= quest.targetCount) {
            const claim = await prisma.userQuestProgress.updateMany({
                where: {
                    userId,
                    questId: quest.id,
                    periodKey,
                    progress: { gte: quest.targetCount },
                    isCompleted: false,
                },
                data: { isCompleted: true },
            })
            if (claim.count > 0) {
                completed.push(quest.id)
            }
        }
    }

    return completed
}
