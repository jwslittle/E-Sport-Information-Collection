'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    Brain, CheckCircle2, XCircle, Coins, Lock,
    ChevronLeft, Sparkles, RotateCcw, TrendingUp
} from 'lucide-react'

// ─── 타입 ─────────────────────────────────────────────────────────────────

interface DailyQuiz {
    id: string
    question: string
    optionA: string
    optionB: string
    optionC?: string | null
    optionD?: string | null
    answer?: string    // 답변 후에만 공개
    explanation?: string | null
    category: string
    difficulty: string
    gpReward: number
}

interface MyAnswer {
    selectedAnswer: string
    isCorrect: boolean
    gpEarned: number
}

type AnswerKey = 'A' | 'B' | 'C' | 'D'

const CATEGORY_LABELS: Record<string, string> = {
    RULES: '규칙',
    TRIVIA: '상식',
    TEAMS: '팀 정보',
    HISTORY: '역사',
}

const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: 'bg-green-500/20 text-green-400 border-green-500/30',
    NORMAL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    HARD: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const DIFFICULTY_LABELS: Record<string, string> = {
    EASY: '쉬움',
    NORMAL: '보통',
    HARD: '어려움',
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────

export default function QuizPage() {
    const { data: session, status } = useSession()
    const [quiz, setQuiz] = useState<DailyQuiz | null>(null)
    const [myAnswer, setMyAnswer] = useState<MyAnswer | null>(null)
    const [answered, setAnswered] = useState(false)
    const [dateKey, setDateKey] = useState('')
    const [loading, setLoading] = useState(true)

    // 답변 상태
    const [selected, setSelected] = useState<AnswerKey | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitResult, setSubmitResult] = useState<{
        isCorrect: boolean
        correctAnswer: string
        explanation: string | null
        gpEarned: number
    } | null>(null)

    useEffect(() => {
        fetchQuiz()
    }, [status])

    const fetchQuiz = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/quiz/today')
            const data = await res.json()
            setQuiz(data.quiz)
            setMyAnswer(data.myAnswer)
            setAnswered(data.answered)
            setDateKey(data.dateKey)
            if (data.myAnswer) {
                setSelected(data.myAnswer.selectedAnswer as AnswerKey)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!selected || !quiz) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/quiz/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quizId: quiz.id, selectedAnswer: selected }),
            })
            const data = await res.json()
            if (res.ok) {
                setSubmitResult(data.result)
                setAnswered(true)
                // 퀴즈 정답/해설 업데이트
                setQuiz(prev => prev ? {
                    ...prev,
                    answer: data.result.correctAnswer,
                    explanation: data.result.explanation,
                } : prev)
            } else {
                alert(data.error ?? '오류가 발생했습니다.')
            }
        } catch (e) {
            console.error(e)
            alert('제출 중 오류가 발생했습니다.')
        } finally {
            setSubmitting(false)
        }
    }

    // 날짜 포맷
    const formattedDate = dateKey
        ? new Date(dateKey + 'T00:00:00+09:00').toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        })
        : ''

    // 로딩
    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 space-y-4">
                <div className="h-8 w-48 bg-zinc-800 rounded-xl animate-pulse" />
                <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-400" />
                        데일리 퀴즈
                    </h1>
                    <p className="text-zinc-500 text-sm">{formattedDate}</p>
                </div>
                <Link href="/ranking">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white text-xs gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        랭킹
                    </Button>
                </Link>
            </div>

            {/* 퀴즈 없음 */}
            {!quiz && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center space-y-3">
                    <Brain className="w-10 h-10 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500">오늘의 퀴즈를 불러오지 못했습니다.</p>
                    <Button size="sm" variant="outline" onClick={fetchQuiz} className="gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" /> 다시 시도
                    </Button>
                </div>
            )}

            {/* 퀴즈 카드 */}
            {quiz && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    {/* 상단 배지 */}
                    <div className="px-6 pt-6 pb-4 flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs border', DIFFICULTY_COLORS[quiz.difficulty])}>
                            {DIFFICULTY_LABELS[quiz.difficulty] ?? quiz.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs border border-zinc-700 text-zinc-400">
                            {CATEGORY_LABELS[quiz.category] ?? quiz.category}
                        </Badge>
                        <div className="ml-auto flex items-center gap-1 text-yellow-400 text-xs font-bold">
                            <Coins className="w-3.5 h-3.5" />
                            정답 시 +{quiz.gpReward} GP
                        </div>
                    </div>

                    {/* 질문 */}
                    <div className="px-6 pb-6">
                        <p className="text-white text-lg font-bold leading-relaxed">
                            {quiz.question}
                        </p>
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* 선택지 */}
                    <div className="p-6 space-y-3">
                        {(['A', 'B', 'C', 'D'] as AnswerKey[]).map((key) => {
                            const optionText = quiz[`option${key}` as keyof DailyQuiz] as string | undefined
                            if (!optionText) return null

                            const isSelected = selected === key
                            const isCorrect = quiz.answer === key
                            const showResult = answered || !!submitResult

                            let optionStyle = 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-500 hover:bg-zinc-800'
                            let labelStyle = 'bg-zinc-700 text-zinc-300'

                            if (showResult) {
                                if (isCorrect) {
                                    optionStyle = 'border-green-500/60 bg-green-500/10'
                                    labelStyle = 'bg-green-500 text-white'
                                } else if (isSelected && !isCorrect) {
                                    optionStyle = 'border-red-500/60 bg-red-500/10'
                                    labelStyle = 'bg-red-500 text-white'
                                }
                            } else if (isSelected) {
                                optionStyle = 'border-yellow-500/60 bg-yellow-500/10'
                                labelStyle = 'bg-yellow-500 text-black'
                            }

                            return (
                                <button
                                    key={key}
                                    onClick={() => !answered && !submitResult && setSelected(key)}
                                    disabled={answered || !!submitResult}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left',
                                        optionStyle,
                                        !answered && !submitResult && 'cursor-pointer',
                                    )}
                                >
                                    <span className={cn(
                                        'w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 transition-colors',
                                        labelStyle,
                                    )}>
                                        {key}
                                    </span>
                                    <span className="text-sm text-zinc-200 flex-1">{optionText}</span>
                                    {showResult && isCorrect && (
                                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    )}
                                    {showResult && isSelected && !isCorrect && (
                                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* 해설 (답변 후) */}
                    {(answered || submitResult) && quiz.explanation && (
                        <div className="mx-6 mb-4 p-4 bg-zinc-800/60 rounded-xl border border-zinc-700">
                            <p className="text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                해설
                            </p>
                            <p className="text-sm text-zinc-300 leading-relaxed">{quiz.explanation}</p>
                        </div>
                    )}

                    {/* 결과 배너 (방금 제출) */}
                    {submitResult && (
                        <div className={cn(
                            'mx-6 mb-6 p-4 rounded-xl border flex items-center gap-3',
                            submitResult.isCorrect
                                ? 'bg-green-500/10 border-green-500/40'
                                : 'bg-red-500/10 border-red-500/40'
                        )}>
                            {submitResult.isCorrect
                                ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                                : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                            }
                            <div className="flex-1">
                                <p className={cn('font-bold text-sm', submitResult.isCorrect ? 'text-green-400' : 'text-red-400')}>
                                    {submitResult.isCorrect ? '정답입니다!' : '오답입니다!'}
                                </p>
                                {submitResult.isCorrect && (
                                    <p className="text-zinc-400 text-xs mt-0.5 flex items-center gap-1">
                                        <Coins className="w-3 h-3 text-yellow-400" />
                                        <span className="text-yellow-400 font-bold">+{submitResult.gpEarned} GP</span> 적립!
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 이미 답변한 경우 배너 */}
                    {answered && !submitResult && myAnswer && (
                        <div className={cn(
                            'mx-6 mb-6 p-4 rounded-xl border flex items-center gap-3',
                            myAnswer.isCorrect
                                ? 'bg-green-500/10 border-green-500/40'
                                : 'bg-zinc-800/60 border-zinc-700'
                        )}>
                            {myAnswer.isCorrect
                                ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                                : <XCircle className="w-5 h-5 text-red-400" />
                            }
                            <div>
                                <p className="text-sm text-zinc-300 font-medium">오늘 퀴즈 완료</p>
                                {myAnswer.isCorrect && myAnswer.gpEarned > 0 && (
                                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                        <Coins className="w-3 h-3 text-yellow-400" />
                                        <span className="text-yellow-400 font-bold">+{myAnswer.gpEarned} GP</span> 적립 완료
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 제출 버튼 (미답변 상태) */}
                    {!answered && !submitResult && (
                        <div className="px-6 pb-6">
                            {!session ? (
                                <Link href="/auth/signin">
                                    <Button className="w-full gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                                        <Lock className="w-4 h-4" />
                                        로그인하고 참여하기
                                    </Button>
                                </Link>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!selected || submitting}
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold disabled:opacity-40"
                                >
                                    {submitting ? '제출 중...' : selected ? '정답 제출' : '답변을 선택하세요'}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 안내 카드 */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2">
                <p className="text-zinc-400 text-sm font-bold">📌 퀴즈 안내</p>
                <ul className="space-y-1.5 text-zinc-500 text-xs">
                    <li>• 매일 자정(KST) 새로운 문제로 교체됩니다</li>
                    <li>• 하루에 한 번만 참여 가능합니다</li>
                    <li>• 정답 시 <span className="text-yellow-400 font-bold">+{quiz?.gpReward ?? 15}~20 GP</span>를 획득합니다</li>
                    <li>• 문제 난이도에 따라 보상 GP가 다릅니다</li>
                </ul>
            </div>

            {/* 바로가기 */}
            <div className="flex gap-2">
                <Link href="/prediction" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs border-zinc-700 text-zinc-400 hover:text-white">
                        경기 예측하기
                    </Button>
                </Link>
                <Link href="/matches" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs border-zinc-700 text-zinc-400 hover:text-white">
                        경기 일정 보기
                    </Button>
                </Link>
            </div>
        </div>
    )
}
