'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    ChevronLeft, Trophy, TrendingUp, Target, Users,
    Calendar, Swords, BarChart2, Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface TeamInfo {
    code: string
    name: string | null
    logo: string | null
}

interface SeasonStats {
    wins: number
    losses: number
    winRate: number
    total: number
    gameWins: number
    gameLosses: number
}

interface RecentMatch {
    id: string
    team1: string
    team2: string
    team1Logo: string | null
    team2Logo: string | null
    team1Score: number
    team2Score: number
    winner: string | null
    scheduledAt: string | null
    bestOf: number
    isWin: boolean
    opponent: string
    opponentName: string | null
    opponentLogo: string | null
    myScore: number
    opponentScore: number
}

interface H2HEntry {
    wins: number
    losses: number
    opponentName: string | null
    opponentLogo: string | null
}

interface PlayerStat {
    playerName: string
    position: string | null
    games: number
    kda: number
    avgKills: number
    avgDeaths: number
    avgAssists: number
    avgCs: number
    avgDamage: number
}

interface UpcomingMatch {
    id: string
    opponent: string
    opponentName: string | null
    opponentLogo: string | null
    scheduledAt: string | null
    bestOf: number
}

interface TeamData {
    teamInfo: TeamInfo
    seasonStats: SeasonStats
    form: string[]       // ['W','W','L','W','W']
    h2h: Record<string, H2HEntry>
    recentMatches: RecentMatch[]
    upcoming: UpcomingMatch[]
    playerStats: PlayerStat[]
}

// ─── 팀 색상 ─────────────────────────────────────────────────────────────────

const LCK_COLORS: Record<string, { text: string; bg: string; border: string }> = {
    T1:  { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/40' },
    GEN: { text: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/40' },
    HLE: { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/40' },
    KT:  { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/40' },
    DK:  { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/40' },
    BFX: { text: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/40' },
    NS:  { text: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/40' },
    KRX: { text: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/40' },
    DNS: { text: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/40' },
    BRO: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40' },
}

const POSITION_KO: Record<string, string> = {
    top: 'TOP', jng: 'JGL', jg: 'JGL', jungle: 'JGL',
    mid: 'MID', bot: 'ADC', adc: 'ADC', sup: 'SUP', support: 'SUP',
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function TeamDetailPage() {
    const { data: session } = useSession()
    const params = useParams()
    const code = (params.code as string ?? '').toUpperCase()
    const [data, setData] = useState<TeamData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'matches' | 'players' | 'h2h'>('matches')

    const colors = LCK_COLORS[code] ?? { text: 'text-zinc-400', bg: 'bg-zinc-800', border: 'border-zinc-700' }

    // ✅ BUG-5 수정: 로그인 사용자만 퀘스트 API 호출 (미로그인 시 401 낭비 방지)
    useEffect(() => {
        if (!session) return
        fetch('/api/quests/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CHECK_HISTORY' }),
        }).catch(() => {})
    }, [session])

    useEffect(() => {
        if (!code) return
        setLoading(true)
        fetch(`/api/lck/teams/${code}`)
            .then(r => r.json())
            .then(d => {
                if (d.error) setError(d.error)
                else setData(d)
            })
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false))
    }, [code])

    if (loading) return <LoadingState />
    if (error || !data) return <ErrorState code={code} error={error ?? '데이터 없음'} />

    const { teamInfo, seasonStats, form, h2h, recentMatches, upcoming, playerStats } = data

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">

            {/* 뒤로가기 */}
            <Link href="/matches" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" />
                경기 일정으로
            </Link>

            {/* ─── 히어로 ─────────────────────────────────────── */}
            <div className={cn('rounded-2xl border p-6', colors.bg, colors.border)}>
                <div className="flex items-center gap-5">
                    {/* 로고 */}
                    <TeamLogoLarge code={code} logoUrl={teamInfo.logo} name={teamInfo.name} />

                    {/* 팀 정보 */}
                    <div className="flex-1 min-w-0">
                        <h1 className={cn('text-3xl font-black', colors.text)}>{code}</h1>
                        {teamInfo.name && teamInfo.name !== code && (
                            <p className="text-zinc-400 text-sm mt-0.5 truncate">{teamInfo.name}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <Badge className={cn('text-sm font-bold px-3 py-1', colors.bg, colors.border, colors.text)}>
                                {seasonStats.wins}W {seasonStats.losses}L
                            </Badge>
                            <span className="text-zinc-500 text-sm">
                                승률 <span className={cn('font-bold', colors.text)}>{seasonStats.winRate}%</span>
                            </span>
                            <span className="text-zinc-600 text-sm">
                                게임 {seasonStats.gameWins}W {seasonStats.gameLosses}L
                            </span>
                        </div>
                    </div>

                    {/* 예측하기 버튼 */}
                    <Link href="/prediction" className="shrink-0 hidden md:block">
                        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            예측하기
                        </Button>
                    </Link>
                </div>

                {/* 최근 폼 */}
                {form.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-white/10">
                        <p className="text-zinc-500 text-xs mb-2.5">최근 {form.length}경기 폼</p>
                        <div className="flex items-center gap-1.5">
                            {form.map((f, i) => (
                                <div key={i} className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black',
                                    f === 'W' ? 'bg-green-500 text-white' : 'bg-red-500/60 text-white'
                                )}>
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── 예정 경기 ──────────────────────────────────── */}
            {upcoming.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <h2 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-yellow-500" />
                        다가오는 경기
                    </h2>
                    <div className="space-y-2">
                        {upcoming.map(m => (
                            <div key={m.id} className="flex items-center gap-3 text-sm">
                                <span className="text-zinc-500 text-xs min-w-[80px]">
                                    {m.scheduledAt
                                        ? format(new Date(m.scheduledAt), 'MM.dd (EEE) HH:mm', { locale: ko })
                                        : '미정'}
                                </span>
                                <TeamLogoSmall code={m.opponent} logoUrl={m.opponentLogo} />
                                <span className="text-zinc-300 font-medium">{m.opponent}</span>
                                <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 ml-auto">
                                    BO{m.bestOf}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── 탭 ─────────────────────────────────────────── */}
            <div className="flex gap-2 border-b border-zinc-800 pb-0">
                {[
                    { id: 'matches', label: '경기 기록', icon: <Swords className="w-3.5 h-3.5" /> },
                    { id: 'players', label: '선수 스탯', icon: <Users className="w-3.5 h-3.5" /> },
                    { id: 'h2h', label: '상대 전적', icon: <BarChart2 className="w-3.5 h-3.5" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                            activeTab === tab.id
                                ? cn('border-current', colors.text)
                                : 'border-transparent text-zinc-500 hover:text-zinc-300'
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── 경기 기록 탭 ───────────────────────────────── */}
            {activeTab === 'matches' && (
                <div className="space-y-2">
                    {recentMatches.length === 0 ? (
                        <div className="text-center py-10 text-zinc-600">완료된 경기가 없습니다.</div>
                    ) : recentMatches.map(m => (
                        <MatchRow key={m.id} match={m} teamCode={code} colors={colors} />
                    ))}
                </div>
            )}

            {/* ─── 선수 스탯 탭 ───────────────────────────────── */}
            {activeTab === 'players' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    {playerStats.length === 0 ? (
                        <div className="text-center py-10 text-zinc-600">선수 스탯 데이터가 없습니다.</div>
                    ) : (
                        <>
                            {/* 헤더 */}
                            <div className="grid grid-cols-12 gap-1 px-4 py-3 bg-zinc-800/60 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                <div className="col-span-1 hidden sm:block">POS</div>
                                <div className="col-span-4 sm:col-span-3">선수</div>
                                <div className="col-span-3 sm:col-span-2 text-center">KDA</div>
                                <div className="col-span-5 sm:col-span-2 text-center">K/D/A</div>
                                <div className="hidden sm:block col-span-2 text-center">CS</div>
                                <div className="hidden sm:block col-span-2 text-center">게임</div>
                            </div>
                            {/* 행 */}
                            {playerStats.map((p, i) => (
                                <div key={p.playerName}
                                    className={cn(
                                        'grid grid-cols-12 gap-1 px-4 py-3 text-sm items-center border-t border-zinc-800',
                                        i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/60'
                                    )}>
                                    <div className="col-span-1 hidden sm:block">
                                        <span className="text-[10px] text-zinc-500 font-mono">
                                            {POSITION_KO[(p.position ?? '').toLowerCase()] ?? p.position ?? '?'}
                                        </span>
                                    </div>
                                    <div className={cn('col-span-4 sm:col-span-3 font-bold text-sm truncate', colors.text)}>
                                        {p.playerName}
                                        <span className="sm:hidden ml-1 text-[10px] text-zinc-600 font-normal">
                                            {POSITION_KO[(p.position ?? '').toLowerCase()] ?? ''}
                                        </span>
                                    </div>
                                    <div className="col-span-3 sm:col-span-2 text-center">
                                        <span className={cn(
                                            'font-black text-base',
                                            p.kda >= 5 ? 'text-yellow-400' :
                                                p.kda >= 3 ? 'text-green-400' :
                                                    p.kda >= 2 ? 'text-blue-400' : 'text-zinc-400'
                                        )}>
                                            {p.kda.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="col-span-5 sm:col-span-2 text-center text-xs text-zinc-500 font-mono">
                                        {p.avgKills}/{p.avgDeaths}/{p.avgAssists}
                                    </div>
                                    <div className="hidden sm:block col-span-2 text-center text-xs text-zinc-400">
                                        {p.avgCs}
                                    </div>
                                    <div className="hidden sm:block col-span-2 text-center text-xs text-zinc-500">
                                        {p.games}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* ─── 상대 전적 탭 ───────────────────────────────── */}
            {activeTab === 'h2h' && (
                <div className="space-y-2">
                    {Object.entries(h2h).length === 0 ? (
                        <div className="text-center py-10 text-zinc-600">상대 전적 데이터가 없습니다.</div>
                    ) : Object.entries(h2h)
                        .sort((a, b) => {
                            // 총 경기 많은 순, 그 다음 승률 순
                            const aTotal = a[1].wins + a[1].losses
                            const bTotal = b[1].wins + b[1].losses
                            return bTotal - aTotal || b[1].wins / bTotal - a[1].wins / aTotal
                        })
                        .map(([opponent, record]) => {
                            const total = record.wins + record.losses
                            const winPct = total > 0 ? Math.round((record.wins / total) * 100) : 0
                            const oppColors = LCK_COLORS[opponent] ?? { text: 'text-zinc-400', bg: 'bg-zinc-800', border: 'border-zinc-700' }
                            return (
                                <Link key={opponent} href={`/teams/${opponent}`}>
                                    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl px-5 py-4 flex items-center gap-4 transition-colors cursor-pointer">
                                        <TeamLogoSmall code={opponent} logoUrl={record.opponentLogo} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn('font-bold text-sm', oppColors.text)}>{opponent}</span>
                                                {record.opponentName && record.opponentName !== opponent && (
                                                    <span className="text-zinc-600 text-xs truncate">{record.opponentName}</span>
                                                )}
                                            </div>
                                            {/* 승률 바 */}
                                            <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden w-full max-w-[200px]">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all"
                                                    style={{ width: `${winPct}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black">
                                                <span className="text-green-400">{record.wins}W</span>
                                                <span className="text-zinc-600 mx-1">-</span>
                                                <span className="text-red-400">{record.losses}L</span>
                                            </p>
                                            <p className={cn('text-xs font-bold mt-0.5', winPct >= 50 ? 'text-green-400' : 'text-red-400')}>
                                                {winPct}%
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                    }
                </div>
            )}
        </div>
    )
}

// ─── 매치 행 ─────────────────────────────────────────────────────────────────

function MatchRow({
    match, teamCode, colors,
}: {
    match: RecentMatch
    teamCode: string
    colors: { text: string; bg: string; border: string }
}) {
    const scheduled = match.scheduledAt ? new Date(match.scheduledAt) : null
    const oppColors = LCK_COLORS[match.opponent] ?? { text: 'text-zinc-400' }

    return (
        <div className={cn(
            'bg-zinc-900 border rounded-xl px-5 py-4 flex items-center gap-4 transition-colors hover:border-zinc-600',
            match.isWin ? 'border-green-800/40' : 'border-red-800/30'
        )}>
            {/* 날짜 */}
            <div className="min-w-[72px] text-left">
                <p className="text-xs text-zinc-500">
                    {scheduled ? format(scheduled, 'MM.dd (EEE)', { locale: ko }) : '미정'}
                </p>
                <p className="text-[10px] text-zinc-700 font-mono">
                    {scheduled ? format(scheduled, 'HH:mm') : ''}
                </p>
            </div>

            {/* 결과 배지 */}
            <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0',
                match.isWin ? 'bg-green-500 text-white' : 'bg-red-500/60 text-white'
            )}>
                {match.isWin ? 'W' : 'L'}
            </div>

            {/* 상대 팀 */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <TeamLogoSmall code={match.opponent} logoUrl={match.opponentLogo} />
                <div>
                    <span className={cn('font-bold text-sm', oppColors.text)}>
                        {match.opponent}
                    </span>
                    {match.opponentName && (
                        <p className="text-[10px] text-zinc-600 truncate">{match.opponentName}</p>
                    )}
                </div>
            </div>

            {/* 스코어 */}
            <div className="text-right shrink-0">
                <p className={cn('text-xl font-black font-mono', match.isWin ? 'text-green-400' : 'text-red-400')}>
                    {match.myScore}:{match.opponentScore}
                </p>
                <p className="text-[10px] text-zinc-600">BO{match.bestOf}</p>
            </div>
        </div>
    )
}

// ─── 로고 컴포넌트 ────────────────────────────────────────────────────────────

function TeamLogoLarge({ code, logoUrl, name }: { code: string; logoUrl?: string | null; name?: string | null }) {
    const [err, setErr] = useState(false)
    const colors = LCK_COLORS[code] ?? { text: 'text-zinc-400', bg: 'bg-zinc-800', border: 'border-zinc-700' }
    if (logoUrl && !err) {
        return (
            <div className="w-20 h-20 rounded-2xl bg-zinc-800/60 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={name ?? code} className="w-16 h-16 object-contain" onError={() => setErr(true)} />
            </div>
        )
    }
    return (
        <div className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 border',
            colors.bg, colors.border, colors.text
        )}>
            {code.slice(0, 3)}
        </div>
    )
}

function TeamLogoSmall({ code, logoUrl }: { code: string; logoUrl?: string | null }) {
    const [err, setErr] = useState(false)
    const colors = LCK_COLORS[code] ?? { text: 'text-zinc-400', bg: 'bg-zinc-800', border: 'border-zinc-700' }
    if (logoUrl && !err) {
        return (
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={code} className="w-6 h-6 object-contain" onError={() => setErr(true)} />
            </div>
        )
    }
    return (
        <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border',
            colors.bg, colors.border, colors.text
        )}>
            {code.slice(0, 3)}
        </div>
    )
}

// ─── 로딩 / 에러 ─────────────────────────────────────────────────────────────

function LoadingState() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-4">
            <div className="h-8 w-32 bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-36 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />)}
            </div>
            <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
        </div>
    )
}

function ErrorState({ code, error }: { code: string; error: string }) {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-4">
            <Link href="/matches" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm">
                <ChevronLeft className="w-4 h-4" /> 경기 일정으로
            </Link>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center space-y-3">
                <Trophy className="w-10 h-10 text-zinc-700 mx-auto" />
                <p className="text-zinc-400 font-bold">{code} 팀 데이터를 불러오지 못했습니다.</p>
                <p className="text-zinc-600 text-xs">{error}</p>
                <p className="text-zinc-600 text-xs">먼저 경기 일정 페이지에서 데이터를 동기화해 주세요.</p>
                <Link href="/matches">
                    <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
                        경기 일정으로 이동
                    </Button>
                </Link>
            </div>
        </div>
    )
}
