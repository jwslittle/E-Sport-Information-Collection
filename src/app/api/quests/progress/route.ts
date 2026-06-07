/**
 * POST /api/quests/progress
 * 특정 액션이 발생했을 때 퀘스트 진행도 업데이트
 *
 * Body: { action: string, amount?: number }
 * action: "LOGIN" | "PREDICT" | "PREDICT_CORRECT" | "CHECK_MATCH" |
 *         "CHECK_PLAYER" | "AI_CHAT" | "CHECK_HISTORY" |
 *         "GET_COSMETIC" | "DAILY_QUIZ" | "QUIZ_CORRECT"
 * (미구현 예정: "FOLLOW_USER" | "COMMUNITY_POST" | "GACHA")
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateQuestProgress, ACTION_QUEST_MAP } from '@/lib/quest-utils'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const { action } = await req.json().catch(() => ({ action: '' }))
    if (!action || !ACTION_QUEST_MAP[action]) {
        return NextResponse.json({ error: 'Unknown action', updated: 0 })
    }
    // ✅ 보안: amount는 서버에서 1로 고정 — 클라이언트 조작으로 퀘스트 즉시 완료 불가
    const amount = 1

    const completedQuests = await updateQuestProgress(userId, action, amount)

    return NextResponse.json({ success: true, updated: completedQuests.length, completedQuests })
}
