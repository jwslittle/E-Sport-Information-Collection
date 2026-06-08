/**
 * POST /api/quests/progress
 * 특정 액션이 발생했을 때 퀘스트 진행도 업데이트
 *
 * Body: { action: string }
 * 클라이언트 허용 액션: "LOGIN" | "PREDICT" | "CHECK_MATCH" | "CHECK_PLAYER" |
 *                      "AI_CHAT" | "CHECK_HISTORY" | "GET_COSMETIC" | "DAILY_QUIZ" |
 *                      "COMMUNITY_POST" | "COMMUNITY_COMMENT" | "FOLLOW_USER"
 * 서버 전용 액션 (클라이언트 차단): "PREDICT_CORRECT" | "QUIZ_CORRECT"
 *   → prediction-process.service.ts, quiz/route.ts 에서 직접 updateQuestProgress() 호출
 * (미구현 예정: "GACHA")
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateQuestProgress, ACTION_QUEST_MAP } from '@/lib/quest-utils'

export const dynamic = 'force-dynamic'

// ✅ 보안: 클라이언트에서 직접 호출하면 퀘스트 어뷰징 가능한 서버 전용 액션
// 이 액션들은 서버 내부(prediction-process.service.ts 등)에서 직접 호출해야 함
const SERVER_ONLY_ACTIONS = new Set(['PREDICT_CORRECT', 'QUIZ_CORRECT'])

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const { action } = await req.json().catch(() => ({ action: '' }))
    if (!action || !ACTION_QUEST_MAP[action]) {
        return NextResponse.json({ error: 'Unknown action', updated: 0 })
    }

    // ✅ 보안: 서버 전용 액션은 클라이언트 직접 호출 차단 (퀘스트 어뷰징 방지)
    if (SERVER_ONLY_ACTIONS.has(action)) {
        return NextResponse.json({ error: 'Forbidden', updated: 0 }, { status: 403 })
    }

    // ✅ 보안: amount는 서버에서 1로 고정 — 클라이언트 조작으로 퀘스트 즉시 완료 불가
    const amount = 1

    const completedQuests = await updateQuestProgress(userId, action, amount)

    return NextResponse.json({ success: true, updated: completedQuests.length, completedQuests })
}
