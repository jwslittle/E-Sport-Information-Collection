import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { INITIAL_QUIZ_QUESTIONS } from '@/lib/quiz-data'

/**
 * GET /api/quiz/today
 * 오늘의 데일리 퀴즈를 반환합니다.
 *
 * ─ 선택 방식 ─
 *  - 로그인 유저: userId + dateKey 해시 기반 → 개인마다 다른 문제 (하루 중 동일 유지)
 *  - 비로그인:   dateKey 해시 기반 → 날짜별 고정 (IP별 개인화 없음)
 *  - 어제 푼 문제 제외: 같은 문제가 이틀 연속 나오지 않도록 처리
 *
 * ─ 자동 시딩 ─
 *  - DB에 퀴즈가 INITIAL_QUIZ_QUESTIONS 개수보다 적으면 자동으로 시딩
 */
export async function GET() {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // KST(Asia/Seoul) 기준 날짜 키 — "2026-06-05" 형식
    const now = new Date()
    const kstFmt = (d: Date) =>
        new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d)
    const dateKey = kstFmt(now)

    // ── 퀴즈 목록 조회 (자동 시딩 포함) ──────────────────────────────────────
    let quizzes = await prisma.dailyQuiz.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
        take: 500,
    })

    // DB에 퀴즈가 없거나 부족하면 자동 시딩 (최초 1회 또는 신규 문항 추가 시)
    if (quizzes.length < INITIAL_QUIZ_QUESTIONS.length) {
        await prisma.dailyQuiz.createMany({ data: INITIAL_QUIZ_QUESTIONS, skipDuplicates: true })
        quizzes = await prisma.dailyQuiz.findMany({
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
            take: 500,
        })
    }

    if (quizzes.length === 0) {
        return NextResponse.json({ quiz: null, dateKey })
    }

    // ── 어제 푼 퀴즈 ID 조회 (이틀 연속 동일 문제 방지) ────────────────────
    let excludeId: string | undefined
    if (userId) {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayKey = kstFmt(yesterday)
        const ya = await prisma.userDailyQuizAnswer.findFirst({
            where: { userId, dateKey: yesterdayKey },
            select: { quizId: true },
        })
        excludeId = ya?.quizId ?? undefined
    }

    // ── 풀 결정: 어제 문제 제외 (풀이 1개뿐이면 어쩔 수 없이 재사용) ─────────
    const pool = excludeId
        ? quizzes.filter(q => q.id !== excludeId)
        : quizzes
    const finalPool = pool.length > 0 ? pool : quizzes

    // ── 개인별 + 날짜별 결정론적 선택 ─────────────────────────────────────────
    // 동일 유저 동일 날짜 → 항상 같은 문제 / 유저마다 다른 문제
    const seed = (userId ?? 'anon') + '-' + dateKey
    let hash = 0
    for (const c of seed) hash = (Math.imul(31, hash) + c.charCodeAt(0)) | 0
    const idx = Math.abs(hash) % finalPool.length
    const quiz = finalPool[idx]

    // ── 정답 필드 제거 (미응답 상태) ─────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { answer, explanation, ...quizPublic } = quiz

    // ── 로그인 유저: 오늘 이미 답했는지 확인 ────────────────────────────────
    let myAnswer = null
    if (userId) {
        myAnswer = await prisma.userDailyQuizAnswer.findFirst({
            where: { userId, dateKey },
        })
    }

    // 이미 답한 경우 → 정답 + 해설 공개
    if (myAnswer) {
        // 오늘 실제로 푼 퀴즈 ID로 찾아서 반환 (today 선택과 다를 수 있음)
        const answeredQuiz = quizzes.find(q => q.id === myAnswer!.quizId)
        if (answeredQuiz) {
            return NextResponse.json({
                quiz: answeredQuiz,
                myAnswer,
                dateKey,
                answered: true,
            })
        }
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
