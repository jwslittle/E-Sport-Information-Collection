import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { INITIAL_QUIZ_QUESTIONS } from '@/lib/quiz-data'

/**
 * GET /api/quiz/today
 * 오늘의 데일리 퀴즈를 반환합니다.
 * - 날짜 기반으로 매일 문제가 교체됩니다.
 * - 이미 답한 경우 결과 포함 반환
 * - 답하지 않은 경우 정답 필드 제외 반환
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    // KST(Asia/Seoul) 기준 날짜 키 — "2026-06-02" 형식
    const now = new Date()
    const dateKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now)

    // 활성화된 퀴즈 목록 (orderIndex 순)
    let quizzes = await prisma.dailyQuiz.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
    })

    // 퀴즈가 없으면 초기 데이터 자동 삽입 (최초 1회)
    if (quizzes.length === 0) {
        await prisma.dailyQuiz.createMany({ data: INITIAL_QUIZ_QUESTIONS, skipDuplicates: true })
        quizzes = await prisma.dailyQuiz.findMany({
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
        })
    }

    if (quizzes.length === 0) {
        return NextResponse.json({ quiz: null, dateKey })
    }

    // 날짜 기반 결정론적 선택 (같은 날은 모든 사용자에게 같은 문제)
    // KST 자정 기준 일 수로 계산 (9h offset 포함)
    const kstOffset = 9 * 60 * 60 * 1000
    const dayNum = Math.floor((now.getTime() + kstOffset) / 86400000)
    const quiz = quizzes[dayNum % quizzes.length]

    // 정답 제외 (미응답 상태에서는 숨김)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { answer, explanation, ...quizPublic } = quiz

    // 로그인한 경우 오늘 이미 답했는지 확인
    // ✅ session.user.id 직접 사용 (email→DB 조회 불필요)
    let myAnswer = null
    if (session?.user?.id) {
        myAnswer = await prisma.userDailyQuizAnswer.findFirst({
            where: { userId: session.user.id, dateKey },
        })
    }

    // 이미 답한 경우 정답 + 해설 공개
    if (myAnswer) {
        return NextResponse.json({
            quiz: { ...quizPublic, answer, explanation },
            myAnswer,
            dateKey,
            answered: true,
        })
    }

    return NextResponse.json({
        quiz: quizPublic,
        myAnswer: null,
        dateKey,
        answered: false,
    })
}
