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
    if (!session?.user?.email) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, gp: true },
    })
    if (!user) {
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    const body = await req.json()
    const { quizId, selectedAnswer } = body as { quizId: string; selectedAnswer: string }

    if (!quizId || !selectedAnswer) {
        return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    const validAnswers = ['A', 'B', 'C', 'D']
    if (!validAnswers.includes(selectedAnswer)) {
        return NextResponse.json({ error: '유효하지 않은 답변입니다.' }, { status: 400 })
    }

    // KST(Asia/Seoul) 기준 날짜 키 — "2026-06-02" 형식
    const dateKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())

    // 오늘 이미 답했는지 확인
    const existing = await prisma.userDailyQuizAnswer.findFirst({
        where: { userId: user.id, dateKey },
    })
    if (existing) {
        return NextResponse.json({ error: '오늘은 이미 퀴즈에 응답했습니다.', alreadyAnswered: true }, { status: 409 })
    }

    // 퀴즈 조회
    const quiz = await prisma.dailyQuiz.findUnique({
        where: { id: quizId },
    })
    if (!quiz || !quiz.isActive) {
        return NextResponse.json({ error: '퀴즈를 찾을 수 없습니다.' }, { status: 404 })
    }

    const isCorrect = selectedAnswer === quiz.answer
    const gpEarned = isCorrect ? quiz.gpReward : 0

    // 트랜잭션: 응답 저장 + GP 지급
    const [quizAnswer] = await prisma.$transaction([
        prisma.userDailyQuizAnswer.create({
            data: {
                userId: user.id,
                quizId: quiz.id,
                dateKey,
                selectedAnswer,
                isCorrect,
                gpEarned,
            },
        }),
        ...(gpEarned > 0
            ? [prisma.user.update({
                where: { id: user.id },
                data: { gp: { increment: gpEarned } },
            })]
            : []),
    ])

    // 퀘스트 진행도 업데이트 (fire-and-forget, 오류 무시)
    updateQuestProgress(user.id, 'DAILY_QUIZ').catch(() => {})
    if (isCorrect) {
        updateQuestProgress(user.id, 'QUIZ_CORRECT').catch(() => {})
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
