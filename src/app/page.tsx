'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Target, Trophy, Flame, TrendingUp, Calendar,
    ChevronRight, Coins, Clock, CheckCircle2, ArrowRight,
    Shield, Zap, Brain, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CURRENT_SEASON } from '@/lib/config/season'
import { TEAM_COLORS } from '@/lib/config/teams'

// ─── 타입 ────────────────────────────────────────────────────────────────
interface UpcomingMatch {
    id: string
    team1: string
    team2: string
    team1Name: string | null
    team2Name: string | null
    team1Logo: string | null
    team2Logo: string | null
    scheduledAt: string | null
    status: string
    bestOf: number
}

interface LiveMatch {
    id: string | null
    externalId: string
    team1: string
    team2: string
    team1Name: string | null
    team2Name: string | null
    team1Logo: string | null
    team2Logo: string | null
    team1Score: number
    team2Score: number
    bestOf: number
    scheduledAt: string | null
}

interface PredictionStats {
    total: number
    processed: number
    correct: number
    accuracy: number
    totalGp: number
    streak: number
}

interface TodayQuiz {
    id: string
    question: string
    optionA: string
    optionB: string
    optionC?: string | null
    optionD?: string | null
    category: string
    difficulty: string
    gpReward: number
}

interface QuizAnswer {
    selectedAnswer: string
    isCorrect: boolean
    gpEarned: number
}

// ─── 메인 홈 ─────────────────────────────────────────────────────────────
export default function Home() {
    const { data: session } = useSession()
    const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])
    const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
    const [myStats, setMyStats] = useState<PredictionStats | null>(null)
    const [userGp, setUserGp] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [now, setNow] = useState(new Date())

    // 데일리 퀴즈
    const [todayQuiz, setTodayQuiz] = useState<TodayQuiz | null>(null)
    const [quizAnswered, setQuizAnswered] = useState(false)
    const [quizAnswer, setQuizAnswer] = useState<QuizAnswer | null>(null)
    const [quizDateKey, setQuizDateKey] = useState('')

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(t)
    }, [])

    // 진행 중인 경기 폴링 (60초마다)
    // — 서버 크론(/api/cron/live)이 1분마다 LoL Esports API를 호출해 DB를 갱신
    // — 이 폴링은 DB 조회만 수행 (외부 API 호출 없음)
    useEffect(() => {
        const fetchLive = async () => {
            try {
                const res = await fetch('/api/lck/live')
                const data = await res.json()
                setLiveMatches(data.matches ?? [])
            } catch {
                // 실패 시 조용히 무시 — 현재 상태 유지
            }
        }
        fetchLive()
        const t = setInterval(fetchLive, 60000)
        return () => clearInterval(t)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [matchRes, quizRes] = await Promise.all([
                    fetch(`/api/lck/matches?season=${CURRENT_SEASON}&status=SCHEDULED&limit=5`),
                    fetch('/api/quiz/today'),
                ])
                const matchData = await matchRes.json()
                setUpcomingMatches(matchData.matches?.slice(0, 3) ?? [])

                const quizData = await quizRes.json()
                setTodayQuiz(quizData.quiz)
                setQuizAnswered(quizData.answered)
                setQuizAnswer(quizData.myAnswer)
                setQuizDateKey(quizData.dateKey)

                if (session) {
                    const [predRes, gpRes] = await Promise.all([
                        fetch('/api/lck/predictions/my'),
                        fetch('/api/users/me'),
                    ])
                    const predData = await predRes.json()
                    const gpData = await gpRes.json()
                    setMyStats(predData.stats ?? null)
                    if (gpData.gp !== undefined) setUserGp(gpData.gp)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [session])

    return (
        <div className="max-w-5xl mx-auto py-6 px-4 space-y-8">
            {/* ─── 히어로 ─────────────────────────────────────────── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700 p-8">
                {/* 배경 장식 */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="text-yellow-500 text-sm font-bold tracking-widest uppercase">LCK Fan Hub</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                            E-Sport<br />
                            <span className="text-yellow-400">Information Collection</span>
                        </h1>
                        <p className="text-zinc-400 text-base max-w-md">
                            실제 LCK 경기 일정을 확인하고, 결과를 예측해서 GP를 획득하세요.
                        </p>
                    </div>

                    {/* 사용자 GP 카드 */}
                    {session && userGp !== null && (
                        <div className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-5 min-w-[160px] text-center">
                            <Coins className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                            <p className="text-3xl font-black text-yellow-400">{userGp.toLocaleString()}</p>
                            <p className="text-zinc-500 text-sm mt-1">보유 GP</p>
                        </div>
                    )}

                    {!session && (
                        <div className="flex flex-col gap-3">
                            <Link href="/auth/signin">
                                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 h-12 rounded-xl">
                                    시작하기 <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                            <p className="text-zinc-600 text-xs text-center">Google 계정으로 1초 가입</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── 그리드 레이아웃 ──────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* 왼쪽 패널: 진행 중인 경기 + 다가오는 경기 (2/3) */}
                <div className="md:col-span-2 space-y-5">

                    {/* ── 진행 중인 경기 ────────────────────────────── */}
                    <div className="space-y-3">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                {liveMatches.length > 0 ? (
                                    <>
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                                    </>
                                ) : (
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-600" />
                                )}
                            </span>
                            진행 중인 경기
                        </h2>
                        {liveMatches.length === 0 ? (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center text-zinc-600 text-sm">
                                진행 중인 경기가 없습니다
                            </div>
                        ) : (
                            liveMatches.map(match => (
                                <LiveMatchCard key={match.externalId} match={match} />
                            ))
                        )}
                    </div>

                    {/* ── 다가오는 경기 ─────────────────────────────── */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-yellow-500" />
                                다가오는 경기
                            </h2>
                            <Link href="/matches" className="text-zinc-500 text-xs hover:text-white flex items-center gap-1 transition-colors">
                                전체 보기 <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (() => {
                            // 현재 라이브인 경기는 다가오는 경기 목록에서 제거
                            const filtered = upcomingMatches.filter(m =>
                                !liveMatches.some(l => l.team1 === m.team1 && l.team2 === m.team2)
                            )
                            return filtered.length === 0 ? (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-zinc-600 text-sm">
                                    예정된 경기가 없습니다
                                </div>
                            ) : (
                                filtered.slice(0, 3).map(match => (
                                    <UpcomingMatchCard key={match.id} match={match} now={now} />
                                ))
                            )
                        })()}
                    </div>
                </div>

                {/* 사이드 패널 (1/3) */}
                <div className="space-y-3">
                    {/* 내 예측 통계 */}
                    {session && myStats ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-yellow-500" />
                                    내 예측 현황
                                </h3>
                                <Link href="/prediction" className="text-zinc-600 text-xs hover:text-white transition-colors">
                                    예측하기 →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <StatBox
                                    label="적중률"
                                    value={myStats.processed > 0 ? `${myStats.accuracy}%` : '-'}
                                    color="text-green-400"
                                />
                                <StatBox
                                    label={myStats.streak > 0 ? `🔥 ${myStats.streak}연속` : '연속 적중'}
                                    value={myStats.streak > 0 ? '진행 중' : '-'}
                                    color="text-orange-400"
                                />
                                <StatBox
                                    label="예측 수"
                                    value={`${myStats.correct}/${myStats.processed}`}
                                    color="text-blue-400"
                                />
                                <StatBox
                                    label="획득 GP"
                                    value={`+${myStats.totalGp}`}
                                    color="text-yellow-400"
                                />
                            </div>
                            <Link href="/prediction">
                                <Button size="sm" className="w-full bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/30 text-xs">
                                    <Target className="w-3 h-3 mr-1" />
                                    경기 예측하러 가기
                                </Button>
                            </Link>
                        </div>
                    ) : session ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                <Target className="w-4 h-4 text-yellow-500" />
                                예측 리그
                            </h3>
                            <p className="text-zinc-500 text-xs">아직 예측한 경기가 없어요. 첫 예측으로 GP를 획득하세요!</p>
                            <Link href="/prediction">
                                <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs">
                                    첫 예측 시작하기
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-zinc-900 border border-yellow-800/30 rounded-xl p-4 space-y-3">
                            <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                                <Target className="w-4 h-4" />
                                예측 리그 참여
                            </h3>
                            <p className="text-zinc-500 text-xs">로그인하면 경기 결과를 예측하고 GP를 획득할 수 있어요.</p>
                            <Link href="/auth/signin">
                                <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs">
                                    로그인하기
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* 퀵 링크 */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                        <h3 className="text-sm font-bold text-zinc-400 mb-3">바로가기</h3>
                        {[
                            { href: '/matches', icon: <Calendar className="w-4 h-4" />, label: '경기 일정 & 순위', color: 'text-yellow-400' },
                            { href: '/prediction', icon: <Target className="w-4 h-4" />, label: '승부 예측', color: 'text-blue-400' },
                            { href: '/community', icon: <MessageSquare className="w-4 h-4" />, label: '커뮤니티', color: 'text-pink-400' },
                            { href: '/quiz', icon: <Brain className="w-4 h-4" />, label: '데일리 퀴즈', color: 'text-purple-400' },
                            { href: '/ranking', icon: <TrendingUp className="w-4 h-4" />, label: '예측 리더보드', color: 'text-green-400' },
                            { href: '/quests', icon: <Zap className="w-4 h-4" />, label: '퀘스트', color: 'text-orange-400' },
                        ].map(link => (
                            <Link key={link.href} href={link.href}>
                                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors group">
                                    <span className={link.color}>{link.icon}</span>
                                    <span className="text-zinc-400 group-hover:text-white text-sm transition-colors">{link.label}</span>
                                    <ChevronRight className="w-3 h-3 text-zinc-700 ml-auto group-hover:text-zinc-400 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── 데일리 퀴즈 위젯 ───────────────────────────────────── */}
            {todayQuiz && (
                <DailyQuizWidget
                    quiz={todayQuiz}
                    answered={quizAnswered}
                    myAnswer={quizAnswer}
                    dateKey={quizDateKey}
                    session={!!session}
                    onAnswered={(ans) => {
                        setQuizAnswered(true)
                        setQuizAnswer(ans)
                        if (ans.gpEarned > 0) {
                            setUserGp(prev => prev !== null ? prev + ans.gpEarned : prev)
                        }
                    }}
                />
            )}

            {/* ─── GP 보상 안내 ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: <Target className="w-5 h-5" />, title: '승팀 예측', gp: '+10 GP', color: 'border-blue-800/40 bg-blue-500/5', iconColor: 'text-blue-400' },
                    { icon: <CheckCircle2 className="w-5 h-5" />, title: '스코어까지', gp: '+30 GP', color: 'border-green-800/40 bg-green-500/5', iconColor: 'text-green-400' },
                    { icon: <Brain className="w-5 h-5" />, title: '데일리 퀴즈', gp: '+15~20 GP', color: 'border-purple-800/40 bg-purple-500/5', iconColor: 'text-purple-400' },
                    { icon: <Shield className="w-5 h-5" />, title: '퀘스트', gp: '+5~1,000 GP', color: 'border-orange-800/40 bg-orange-500/5', iconColor: 'text-orange-400' },
                ].map(item => (
                    <div key={item.title} className={cn('border rounded-xl p-4 text-center', item.color)}>
                        <div className={cn('flex justify-center mb-2', item.iconColor)}>{item.icon}</div>
                        <p className={cn('font-black text-sm', item.iconColor)}>{item.gp}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{item.title}</p>
                    </div>
                ))}
            </div>

            {/* ─── 면책 고지 ────────────────────────────────────────── */}
            <p className="text-center text-zinc-700 text-xs">
                비상업적 팬 프로젝트 · LCK 데이터 출처:{' '}
                <a href="https://lolesports.com" target="_blank" rel="noreferrer" className="underline hover:text-zinc-500">
                    LoL Esports
                </a>
                {' '}· Riot Games Fan Content Policy 준수
            </p>
        </div>
    )
}

// ─── 진행 중인 경기 카드 ────────────────────────────────────────────────

function LiveMatchCard({ match }: { match: LiveMatch }) {
    const [t1Err, setT1Err] = useState(false)
    const [t2Err, setT2Err] = useState(false)

    const t1Color = TEAM_COLORS[match.team1]
    const t2Color = TEAM_COLORS[match.team2]
    const t1Leading = match.team1Score > match.team2Score
    const t2Leading = match.team2Score > match.team1Score

    return (
        <div className="relative bg-gradient-to-br from-red-950/30 via-zinc-900 to-zinc-900 border border-red-900/50 rounded-xl overflow-hidden">
            {/* 상단 글로우 라인 */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            <div className="p-4">
                {/* 헤더: LIVE 뱃지 + BO */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-red-400 text-xs font-black tracking-widest">LIVE</span>
                    </div>
                    <span className="text-zinc-600 text-[10px]">BO{match.bestOf} · 세트 스코어</span>
                </div>

                {/* 팀 vs 스코어 vs 팀 */}
                <div className="flex items-center gap-2">
                    {/* Team 1 */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                        {match.team1Logo && !t1Err ? (
                            <img
                                src={match.team1Logo}
                                alt={match.team1Name ?? match.team1}
                                className="w-14 h-14 object-contain drop-shadow-lg"
                                onError={() => setT1Err(true)}
                            />
                        ) : (
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-xs font-black"
                                style={{ background: (t1Color ?? '#71717a') + '22', color: t1Color ?? '#71717a', border: `2px solid ${t1Color ?? '#71717a'}44` }}
                            >
                                {(match.team1Name ?? match.team1).slice(0, 3)}
                            </div>
                        )}
                        <span className="font-black text-sm" style={{ color: t1Color ?? '#fff' }}>
                            {match.team1Name ?? match.team1}
                        </span>
                    </div>

                    {/* 스코어 */}
                    <div className="flex items-center gap-1 px-2">
                        <span className={cn(
                            'text-5xl font-black tabular-nums transition-colors',
                            t1Leading ? 'text-white' : 'text-zinc-600'
                        )}>
                            {match.team1Score}
                        </span>
                        <span className="text-zinc-700 text-3xl font-black mx-1">:</span>
                        <span className={cn(
                            'text-5xl font-black tabular-nums transition-colors',
                            t2Leading ? 'text-white' : 'text-zinc-600'
                        )}>
                            {match.team2Score}
                        </span>
                    </div>

                    {/* Team 2 */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                        {match.team2Logo && !t2Err ? (
                            <img
                                src={match.team2Logo}
                                alt={match.team2Name ?? match.team2}
                                className="w-14 h-14 object-contain drop-shadow-lg"
                                onError={() => setT2Err(true)}
                            />
                        ) : (
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-xs font-black"
                                style={{ background: (t2Color ?? '#71717a') + '22', color: t2Color ?? '#71717a', border: `2px solid ${t2Color ?? '#71717a'}44` }}
                            >
                                {(match.team2Name ?? match.team2).slice(0, 3)}
                            </div>
                        )}
                        <span className="font-black text-sm" style={{ color: t2Color ?? '#fff' }}>
                            {match.team2Name ?? match.team2}
                        </span>
                    </div>
                </div>

                {/* 하단: 시청 링크 + 업데이트 주기 안내 */}
                <div className="mt-4 pt-3 border-t border-red-900/30 space-y-2.5">
                    {/* 공식 중계 링크 */}
                    <div className="flex gap-2 justify-center">
                        <a
                            href="https://www.youtube.com/@LCK/live"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors"
                        >
                            ▶ YouTube 시청
                        </a>
                        <a
                            href="https://www.sooplive.co.kr/lck"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-violet-800 hover:bg-violet-700 transition-colors"
                        >
                            ▶ 숲 시청
                        </a>
                    </div>
                    {/* 업데이트 주기 */}
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-600">
                        <span className="w-1 h-1 rounded-full bg-red-500/60 animate-pulse" />
                        60초마다 자동 업데이트
                        <Link href="/matches" className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-0.5">
                            경기 상세 <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── 다가오는 경기 카드 ─────────────────────────────────────────────────

function UpcomingMatchCard({ match, now }: { match: UpcomingMatch; now: Date }) {
    const [t1Err, setT1Err] = useState(false)
    const [t2Err, setT2Err] = useState(false)

    const scheduled = match.scheduledAt ? new Date(match.scheduledAt) : null
    const diffMs = scheduled ? scheduled.getTime() - now.getTime() : 0
    const isLive = match.status === 'LIVE'

    const timeStr = scheduled
        ? scheduled.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
        : '일정 미정'

    // 카운트다운
    let countdown = ''
    if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
        const h = Math.floor(diffMs / 3600000)
        const m = Math.floor((diffMs % 3600000) / 60000)
        countdown = h > 0 ? `${h}시간 ${m}분 후` : `${m}분 후`
    }

    const t1Color = TEAM_COLORS[match.team1]
    const t2Color = TEAM_COLORS[match.team2]

    return (
        <div className={cn(
            'bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 hover:border-zinc-600 transition-all',
            isLive ? 'border-red-500/40' : 'border-zinc-800'
        )}>
            {/* 날짜 */}
            <div className="text-left min-w-[80px]">
                {isLive ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        LIVE
                    </span>
                ) : countdown ? (
                    <span className="text-yellow-500 text-xs font-bold">{countdown}</span>
                ) : (
                    <span className="text-zinc-500 text-xs">{timeStr}</span>
                )}
                <p className="text-zinc-600 text-[10px] mt-0.5">BO{match.bestOf}</p>
            </div>

            {/* 팀1 */}
            <div className="flex items-center gap-2 flex-1 justify-end">
                {/* 표시 이름: team1Name(풀네임) 우선, 없으면 team1 코드 fallback */}
                <span className="font-black text-sm" style={{ color: t1Color ?? '#fff' }}>
                    {match.team1Name || match.team1}
                </span>
                {match.team1Logo && !t1Err ? (
                    <Image src={match.team1Logo} alt={match.team1Name || match.team1} width={32} height={32} className="object-contain"
                        onError={() => setT1Err(true)} />
                ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={{ background: (t1Color ?? '#71717a') + '22', color: t1Color ?? '#71717a', border: `1.5px solid ${t1Color ?? '#71717a'}` }}>
                        {(match.team1Name || match.team1).slice(0, 3)}
                    </div>
                )}
            </div>

            {/* VS */}
            <div className="text-zinc-600 font-mono text-sm px-2">vs</div>

            {/* 팀2 */}
            <div className="flex items-center gap-2 flex-1">
                {match.team2Logo && !t2Err ? (
                    <Image src={match.team2Logo} alt={match.team2Name || match.team2} width={32} height={32} className="object-contain"
                        onError={() => setT2Err(true)} />
                ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={{ background: (t2Color ?? '#71717a') + '22', color: t2Color ?? '#71717a', border: `1.5px solid ${t2Color ?? '#71717a'}` }}>
                        {(match.team2Name || match.team2).slice(0, 3)}
                    </div>
                )}
                {/* 표시 이름: team2Name(풀네임) 우선, 없으면 team2 코드 fallback */}
                <span className="font-black text-sm" style={{ color: t2Color ?? '#fff' }}>
                    {match.team2Name || match.team2}
                </span>
            </div>

            {/* 예측 버튼 */}
            <Link href="/prediction" className="shrink-0">
                <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1.5 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    예측
                </span>
            </Link>
        </div>
    )
}

// ─── 통계 박스 ─────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
            <p className={cn('font-black text-base', color)}>{value}</p>
            <p className="text-zinc-600 text-[10px] mt-0.5">{label}</p>
        </div>
    )
}

// ─── 데일리 퀴즈 위젯 ──────────────────────────────────────────────────

type AnswerKey = 'A' | 'B' | 'C' | 'D'

function DailyQuizWidget({
    quiz, answered, myAnswer, dateKey, session, onAnswered,
}: {
    quiz: TodayQuiz
    answered: boolean
    myAnswer: QuizAnswer | null
    dateKey: string
    session: boolean
    onAnswered: (ans: QuizAnswer) => void
}) {
    const [selected, setSelected] = useState<AnswerKey | null>(
        myAnswer ? myAnswer.selectedAnswer as AnswerKey : null
    )
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<{
        isCorrect: boolean; correctAnswer: string; explanation: string | null; gpEarned: number
    } | null>(null)
    const [localAnswered, setLocalAnswered] = useState(answered)

    const handleSubmit = async () => {
        if (!selected) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/quiz/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quizId: quiz.id, selectedAnswer: selected }),
            })
            const data = await res.json()
            if (res.ok) {
                setResult(data.result)
                setLocalAnswered(true)
                onAnswered({
                    selectedAnswer: selected,
                    isCorrect: data.result.isCorrect,
                    gpEarned: data.result.gpEarned,
                })
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSubmitting(false)
        }
    }

    const correctAnswer = result?.correctAnswer ?? (localAnswered && myAnswer ? null : null)

    return (
        <div className="bg-gradient-to-br from-purple-900/20 via-zinc-900 to-zinc-900 border border-purple-700/30 rounded-2xl overflow-hidden">
            {/* 헤더 */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-white">데일리 퀴즈</span>
                    <span className="text-xs text-zinc-500">
                        {dateKey
                            ? (() => {
                                const d = new Date(dateKey + 'T00:00:00+09:00')
                                return `${d.getMonth() + 1}월 ${d.getDate()}일`
                            })()
                            : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {localAnswered && (
                        <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            (result?.isCorrect ?? myAnswer?.isCorrect)
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                        )}>
                            {(result?.isCorrect ?? myAnswer?.isCorrect) ? '✓ 정답' : '✗ 오답'}
                        </span>
                    )}
                    <Link href="/quiz" className="text-zinc-500 hover:text-purple-400 text-xs transition-colors flex items-center gap-0.5">
                        자세히 <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* 질문 */}
            <div className="px-5 pb-4">
                <p className="text-white text-sm font-semibold leading-relaxed">{quiz.question}</p>
            </div>

            {/* 선택지 (모바일: 1열, sm+: 2열) */}
            <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(['A', 'B', 'C', 'D'] as AnswerKey[]).map((key) => {
                    const optionText = quiz[`option${key}` as keyof TodayQuiz] as string | undefined
                    if (!optionText) return null

                    const isSelected = selected === key
                    const isCorrectKey = correctAnswer === key
                    const showResult = localAnswered

                    let style = 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                    let labelStyle = 'bg-zinc-700 text-zinc-400'

                    if (showResult) {
                        if (isCorrectKey) {
                            style = 'border-green-500/50 bg-green-500/10'
                            labelStyle = 'bg-green-500 text-white'
                        } else if (isSelected && !isCorrectKey) {
                            style = 'border-red-500/50 bg-red-500/10'
                            labelStyle = 'bg-red-500 text-white'
                        }
                    } else if (isSelected) {
                        style = 'border-purple-500/60 bg-purple-500/10'
                        labelStyle = 'bg-purple-500 text-white'
                    }

                    return (
                        <button
                            key={key}
                            onClick={() => !localAnswered && setSelected(key)}
                            disabled={localAnswered}
                            className={cn(
                                'flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left',
                                style,
                                !localAnswered && 'cursor-pointer',
                            )}
                        >
                            <span className={cn('w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0', labelStyle)}>
                                {key}
                            </span>
                            <span className="text-xs text-zinc-300 leading-tight">{optionText}</span>
                        </button>
                    )
                })}
            </div>

            {/* 하단: 제출 or 결과 */}
            <div className="border-t border-zinc-800 px-5 py-3 flex items-center gap-3">
                {!localAnswered ? (
                    <>
                        <div className="flex items-center gap-1 text-xs text-zinc-500 mr-auto">
                            <Coins className="w-3.5 h-3.5 text-yellow-500" />
                            정답 시 <span className="text-yellow-400 font-bold">+{quiz.gpReward} GP</span>
                        </div>
                        {session ? (
                            <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={!selected || submitting}
                                className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold px-4 disabled:opacity-40"
                            >
                                {submitting ? '제출 중...' : '제출'}
                            </Button>
                        ) : (
                            <Link href="/auth/signin">
                                <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold px-4">
                                    로그인 후 참여
                                </Button>
                            </Link>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mr-auto">
                            {(result?.isCorrect ?? myAnswer?.isCorrect) ? (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                    <span className="text-green-400 font-bold">정답!</span>
                                    <Coins className="w-3 h-3 text-yellow-400" />
                                    <span className="text-yellow-400 font-bold">+{result?.gpEarned ?? myAnswer?.gpEarned} GP</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-red-400">오답</span>
                                    <span className="text-zinc-600">· 내일 다시 도전해보세요</span>
                                </>
                            )}
                        </div>
                        <Link href="/quiz">
                            <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-white text-xs">
                                해설 보기
                            </Button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
