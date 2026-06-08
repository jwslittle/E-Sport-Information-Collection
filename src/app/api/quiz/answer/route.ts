import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateQuestProgress } from '@/lib/quest-utils'

/**
 * POST /api/quiz/answer
 * 오늘의 퀴즈에 답변을 제출합니다.
 * Body: { quizId: string, selectedAnswer: "A" | "B" | "C" | "D" }
 *
 * - 하루 1회 제한
 * - 정답 시 gpReward만큼 GP 지급
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    // ✅ session.user.id 사용 (email 기반 조회 제거)
    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const { quizId, selectedAnswer } = body as { quizId: string; selectedAnswer: string }

    if (!quizId || !selectedAnswer) {
        return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    const validAnswers = ['A', 'B', 'C', 'D']
    if (!validAnswers.includes(selectedAnswer)) {
        return NextResponse.json({ error: '유효하지 않은 답변입니다.' }, { status: 400 })
    }

    // 퀴즈 조회 (먼저 확인)
    const quiz = await prisma.dailyQuiz.findUnique({ where: { id: quizId } })
    if (!quiz || !quiz.isActive) {
        return NextResponse.json({ error: '퀴즈를 찾을 수 없습니다.' }, { status: 404 })
    }

    // KST(Asia/Seoul) 기준 날짜 키
    const dateKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())

    const isCorrect = selectedAnswer === quiz.answer
    const gpEarned = isCorrect ? quiz.gpReward : 0

    // ✅ 인터랙티브 트랜잭션 — 중복 체크 + 응답 저장 + GP 지급을 원자적으로 처리
    let quizAnswer: { id: string }
    try {
        quizAnswer = await prisma.$transaction(async (tx) => {
            // 트랜잭션 내부에서 중복 확인 (race condition 방지) — findUnique로 @@unique 인덱스 활용
            const existing = await tx.userDailyQuizAnswer.findUnique({
                where: { userId_dateKey: { userId, dateKey } },
            })
            if (existing) throw new Error('ALREADY_ANSWERED')

            const answer = await tx.userDailyQuizAnswer.create({
                data: { userId, quizId: quiz.id, dateKey, selectedAnswer, isCorrect, gpEarned },
            })

            if (gpEarned > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: { gp: { increment: gpEarned } },
                })
            }

            return answer
        })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'ALREADY_ANSWERED') {
            return NextResponse.json(
                { error: '오늘은 이미 퀴즈에 응답했습니다.', alreadyAnswered: true },
                { status: 409 }
            )
        }
        console.error('quiz/answer error:', err)
        return NextResponse.json({ error: '답변 제출 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 퀘스트 진행도 업데이트 (fire-and-forget)
    updateQuestProgress(userId, 'DAILY_QUIZ').catch(() => {})
    if (isCorrect) {
        updateQuestProgress(userId, 'QUIZ_CORRECT').catch(() => {})
    }

    return NextResponse.json({
        result: {
            isCorrect,
            selectedAnswer,
            correctAnswer: quiz.answer,
            explanation: quiz.explanation,
            gpEarned,
        },
        answerId: quizAnswer.id,
    })
}
