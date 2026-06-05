import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { INITIAL_QUIZ_QUESTIONS } from '@/lib/quiz-data'

/**
 * POST /api/quiz/seed
 * 초기 퀴즈 문항을 DB에 삽입합니다. (어드민 전용)
 * 이미 존재하는 문항은 건너뜁니다.
 *
 * GET /api/quiz/seed
 * 현재 퀴즈 문항 수와 오늘의 퀴즈 정보를 반환합니다.
 */

export async function POST() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: '관리자만 접근 가능합니다.' }, { status: 403 })
    }

    // orderIndex 기준 중복 방지 (기존 문항 수와 무관하게 빠진 문항만 추가)
    const existingIndices = await prisma.dailyQuiz.findMany({
        select: { orderIndex: true },
    })
    const existingSet = new Set(existingIndices.map(q => q.orderIndex))

    const toCreate = INITIAL_QUIZ_QUESTIONS.filter(q => !existingSet.has(q.orderIndex))

    if (toCreate.length === 0) {
        return NextResponse.json({
            message: `정적 문항이 모두 등록되어 있습니다. (총 ${existingSet.size}개)`,
            created: 0,
            total: existingSet.size,
        })
    }

    await prisma.dailyQuiz.createMany({ data: toCreate, skipDuplicates: true })

    return NextResponse.json({
        message: `${toCreate.length}개의 정적 문항이 등록되었습니다.`,
        created: toCreate.length,
        total: existingSet.size + toCreate.length,
    })
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: '관리자만 접근 가능합니다.' }, { status: 403 })
    }

    const count = await prisma.dailyQuiz.count()
    const answers = await prisma.userDailyQuizAnswer.count()

    // ✅ Q-2 수정: quiz/today와 동일한 해시 방식으로 "오늘의 퀴즈" 계산
    // (이전: dayNum % total 방식은 실제 선택 로직과 불일치)
    const dateKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
    const quizzes = await prisma.dailyQuiz.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
        select: { id: true, question: true, orderIndex: true },
    })
    // 비로그인(anon) 기준 오늘의 퀴즈 — quiz/today와 동일한 로직
    let hash = 0
    const seed = `anon-${dateKey}`
    for (const c of seed) hash = (Math.imul(31, hash) + c.charCodeAt(0)) | 0
    const todayQuiz = quizzes.length > 0 ? quizzes[Math.abs(hash) % quizzes.length] : null

    return NextResponse.json({ quizCount: count, totalAnswers: answers, todayQuiz })
}
