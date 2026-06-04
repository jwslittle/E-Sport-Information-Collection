'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion'
import {
    Trophy, Calendar, Search, RefreshCw,
    ChevronLeft, ChevronRight, Swords, Loader2,
    Shield, Zap, Eye, Target, Crown, TrendingUp, LayoutGrid
} from 'lucide-react'
import {
    format, addMonths, subMonths, isSameMonth, parseISO,
    startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, addDays,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { CURRENT_SEASON, SEASON_OPTIONS } from '@/lib/config/season'

// ─── 타입 ────────────────────────────────────────────────────────────

interface PlayerStat {
    id: string
    playerName: string
    team: string
    position: string | null
    champion: string | null
    kills: number
    deaths: number
    assists: number
    cs: number
    gold: number
    damage: number
    visionScore: number
}

interface GameStat {
    id: string
    gameNumber: number
    winner: string | null
    duration: string | null
    patch: string | null
    playerStats: PlayerStat[]
}

interface LckMatch {
    id: string
    externalId: string
    tournament: string
    displayName: string | null
    season: string
    team1: string
    team2: string
    team1Name: string | null
    team2Name: string | null
    team1Logo: string | null
    team2Logo: string | null
    team1Score: number
    team2Score: number
    winner: string | null
    bestOf: number
    scheduledAt: string | null
    completedAt: string | null
    status: string
    games: GameStat[]
}

// ─── 상수 ────────────────────────────────────────────────────────────

const POSITION_ORDER = ['top', 'jng', 'mid', 'bot', 'sup']
const POSITION_KO: Record<string, string> = {
    top: 'TOP', jng: 'JGL', mid: 'MID', bot: 'ADC', sup: 'SUP',
    jungle: 'JGL', adc: 'ADC', support: 'SUP'
}

const LCK_TEAM_COLORS: Record<string, string> = {
    T1: 'text-red-400',
    GEN: 'text-yellow-400',
    HLE: 'text-orange-400',
    KT: 'text-blue-400',
    DK: 'text-cyan-400',
    KRX: 'text-purple-400',
    BFX: 'text-pink-400',
    NS: 'text-green-400',
    DNS: 'text-sky-400',
    BRO: 'text-emerald-400',
}

// ─── 스테이지 유틸 ─────────────────────────────────────────────────────

/** displayName에서 시즌 접두사를 제거하고 스테이지 이름만 추출
 *  "LCK 2026 - X"           → "X"
 *  "LCK 2026 Split 1 - X"   → "X"  (greedy regex 실패 케이스 방지)
 */
function extractStageLabel(displayName: string | null): string | null {
    if (!displayName) return null
    // 마지막 " - " 이후 문자열을 스테이지 이름으로 사용 (가장 견고한 방식)
    const idx = displayName.lastIndexOf(' - ')
    if (idx !== -1) return displayName.slice(idx + 3).trim() || null
    // 대시 변형(–, —)도 시도
    const idx2 = displayName.search(/\s[–—]\s/)
    if (idx2 !== -1) return displayName.slice(idx2 + 3).trim() || null
    return null
}

/** 스테이지 이름으로 타입 분류 */
type StageType = 'regular' | 'playoff' | 'playin' | 'roadtomsi' | 'other'
function getStageType(label: string): StageType {
    if (/플레이오프|playoff|토너먼트\s*스테이지|결승|준결승|semi|final/i.test(label)) return 'playoff'
    if (/플레이인|play.?in/i.test(label)) return 'playin'
    if (/로드.*MSI|road.*msi|msi로\s*가는/i.test(label)) return 'roadtomsi'
    if (/\d+주\s*차|week\s*\d+|리그/i.test(label)) return 'regular'
    return 'other'
}

/** displayName에서 그룹 단위 스테이지 이름 추출 (주차들은 "정규 시즌"으로 통합) */
function detectStageGroup(displayName: string | null): string {
    const label = extractStageLabel(displayName)
    if (!label) return '기타'
    if (/토너먼트\s*스테이지/i.test(label)) return '토너먼트 스테이지'
    if (/플레이오프|playoff/i.test(label)) return '플레이오프'
    if (/플레이인|play.?in/i.test(label)) return '플레이인'
    if (/로드.*MSI|road.*msi|msi로\s*가는/i.test(label)) return '로드 투 MSI'
    if (/\d+주\s*차|week\s*\d+|리그/i.test(label)) return '정규 시즌'
    return label
}

/** 팀 이름 → 팀 코드 역매핑 (team1/team2가 "TBD"일 때 사용) */
const TEAM_NAME_TO_CODE: Record<string, string> = {
    'Dplus KIA': 'DK', 'dplus kia': 'DK',
    'HANJIN BRION': 'BRO', 'Hanjin Brion': 'BRO',
    'Hanwha Life Esports': 'HLE', 'hanwha life esports': 'HLE',
    'kt Rolster': 'KT', 'KT Rolster': 'KT',
    'T1': 'T1', 't1': 'T1',
    'Gen.G Esports': 'GEN', 'gen.g esports': 'GEN',
    'BNK FEARX': 'BFX', 'bnk fearx': 'BFX',
    'KIWOOM DRX': 'KRX', 'Kiwoom DRX': 'KRX',
    'DN SOOPers': 'DNS', 'dn soopers': 'DNS',
    'NONGSHIM RED FORCE': 'NS', 'Nongshim Red Force': 'NS',
}

/** team1/team2가 "TBD"일 때 team1Name으로 실제 코드 추론 */
function resolveTeamCode(code: string, name: string | null): string {
    if (code && code !== 'TBD') return code
    if (!name || name === 'TBD') return 'TBD'
    return TEAM_NAME_TO_CODE[name] ?? TEAM_NAME_TO_CODE[name.toLowerCase()] ?? name.substring(0, 4).toUpperCase()
}

/** 플레이오프 라운드 이름 추출 */
function extractPlayoffRound(m: LckMatch): string {
    const dn = m.displayName ?? ''
    const roundMatch = dn.match(/준준결승|8강|준결승|4강|결승|3위전|1라운드|2라운드|3라운드|quarterfinal|semifinal|final/i)
    if (roundMatch) return roundMatch[0]
    if (m.scheduledAt) return format(new Date(m.scheduledAt), 'MM.dd')
    return '예정'
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────

export default function MatchesPage() {
    const [now, setNow] = useState(new Date())
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(t)
    }, [])

    useEffect(() => {
        fetch('/api/quests/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CHECK_MATCH' }),
        }).catch(() => {})
    }, [])

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            <div className="container mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-zinc-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                            <Calendar className="text-yellow-500" />
                            경기 일정
                        </h1>
                        <p className="text-zinc-400 mt-1 text-sm">
                            실제 LCK 경기 일정 — 출처:{' '}
                            <a href="https://lolesports.com" target="_blank" rel="noreferrer"
                                className="underline text-blue-400 hover:text-blue-300">LoL Esports</a>
                            {' '}(비상업적 정보 제공 목적)
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-zinc-500">현재 시간</div>
                        <div className="text-lg font-mono text-yellow-500">
                            {format(now, 'yyyy.MM.dd (EEE) HH:mm', { locale: ko })}
                        </div>
                    </div>
                </div>

                <RealMatchTab />
            </div>
        </div>
    )
}

// ─── 실제 LCK 탭 ─────────────────────────────────────────────────────

function RealMatchTab() {
    const [matches, setMatches] = useState<LckMatch[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [selectedSeason, setSelectedSeason] = useState<string>(CURRENT_SEASON)
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED'>('ALL')
    const [teamFilter, setTeamFilter] = useState('')
    const [searchTeam, setSearchTeam] = useState('')
    const [viewMonth, setViewMonth] = useState(new Date())
    const [viewWeek, setViewWeek] = useState(new Date())
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
    const [error, setError] = useState<string | null>(null)
    const [matchTab, setMatchTab] = useState<'schedule' | 'standings'>('schedule')

    const fetchMatches = useCallback(async (forceSync = false) => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams({ season: selectedSeason, limit: '200' })
            if (statusFilter !== 'ALL') params.set('status', statusFilter)
            if (teamFilter) params.set('team', teamFilter)
            if (forceSync) params.set('sync', '1')
            const res = await fetch(`/api/lck/matches?${params}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            const list = Array.isArray(data.matches) ? data.matches : []
            setMatches(list)
            // 현재 시즌은 오늘 날짜 유지, 과거 시즌은 첫 경기 날짜로 이동
            if (list.length > 0 && list[0].scheduledAt && selectedSeason !== CURRENT_SEASON) {
                const d = new Date(list[0].scheduledAt)
                setViewMonth(d)
                setViewWeek(d)
            }
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [statusFilter, teamFilter, selectedSeason])

    useEffect(() => { fetchMatches() }, [fetchMatches])

    const handleSync = async () => {
        setSyncing(true)
        await fetchMatches(true)
        setSyncing(false)
    }

    // ── 주/월 범위 계산 ──
    const weekStart = startOfWeek(viewWeek, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(viewWeek, { weekStartsOn: 1 })

    const monthMatches = matches.filter(m => {
        const d = m.scheduledAt ? parseISO(m.scheduledAt) : null
        return d && isSameMonth(d, viewMonth)
    })

    const weekMatches = matches.filter(m => {
        const d = m.scheduledAt ? parseISO(m.scheduledAt) : null
        return d && isWithinInterval(d, { start: weekStart, end: weekEnd })
    })

    // 월 모드: 주차별 그룹
    const byWeek: Record<string, LckMatch[]> = {}
    for (const m of monthMatches) {
        const weekMatch = m.displayName?.match(/(\d+주\s*차|[A-Za-z]+\s+\d+)/)
        const d = m.scheduledAt ? new Date(m.scheduledAt) : new Date()
        const weekKey = weekMatch?.[0] ?? format(d, 'MM/dd')
        byWeek[weekKey] = byWeek[weekKey] ?? []
        byWeek[weekKey].push(m)
    }

    // 주 모드: 일별 그룹
    const byDay: Record<string, LckMatch[]> = {}
    for (const m of weekMatches) {
        const d = m.scheduledAt ? new Date(m.scheduledAt) : new Date()
        const dayKey = format(d, 'MM.dd (EEE)', { locale: ko })
        byDay[dayKey] = byDay[dayKey] ?? []
        byDay[dayKey].push(m)
    }

    const upcomingCount = matches.filter(m => m.status === 'SCHEDULED').length
    const completedCount = matches.filter(m => m.status === 'COMPLETED').length

    // 현재 시즌 레이블
    const currentSeasonLabel = SEASON_OPTIONS.find(s => s.value === selectedSeason)?.label ?? selectedSeason

    return (
        <div className="space-y-5">

            {/* ── 대회 선택 헤더 ─────────────────────────────────── */}
            <div className="rounded-2xl border border-zinc-700 overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
                {/* 대회명 */}
                <div className="px-5 py-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">현재 대회</p>
                            <h2 className="text-xl font-black text-white">{currentSeasonLabel.replace(' (현재)', '')}</h2>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="text-center">
                                <p className="text-lg font-bold text-white">{matches.length}</p>
                                <p className="text-[10px] text-zinc-500">전체</p>
                            </div>
                            <div className="w-px h-8 bg-zinc-700" />
                            <div className="text-center">
                                <p className="text-lg font-bold text-blue-400">{upcomingCount}</p>
                                <p className="text-[10px] text-zinc-500">예정</p>
                            </div>
                            <div className="w-px h-8 bg-zinc-700" />
                            <div className="text-center">
                                <p className="text-lg font-bold text-green-400">{completedCount}</p>
                                <p className="text-[10px] text-zinc-500">완료</p>
                            </div>
                            <div className="w-px h-8 bg-zinc-700" />
                            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || loading}
                                className="border-zinc-600 text-zinc-400 h-8">
                                <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? '동기화...' : '동기화'}
                            </Button>
                        </div>
                    </div>
                </div>
                {/* 시즌 선택 버튼 */}
                <div className="flex divide-x divide-zinc-800 overflow-x-auto">
                    {SEASON_OPTIONS.map(s => {
                        const isActive = selectedSeason === s.value
                        const isCurrent = s.label.includes('현재')
                        return (
                            <button
                                key={s.value}
                                onClick={() => setSelectedSeason(s.value)}
                                className={`flex-1 min-w-[140px] py-3 px-4 text-left transition-all hover:bg-zinc-800/60 relative ${isActive ? 'bg-yellow-500/[0.05]' : ''}`}
                            >
                                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />}
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                                        {s.label.replace(' (현재)', '')}
                                    </span>
                                    {isCurrent && (
                                        <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded px-1 py-0.5 shrink-0">진행중</span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── 탭 — 일정 / 순위 (선택한 대회 공유) ── */}
            <div className="flex gap-1 border-b border-zinc-800">
                {(['schedule', 'standings'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setMatchTab(tab)}
                        className={`px-5 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${matchTab === tab
                            ? 'text-yellow-400 border-yellow-400'
                            : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
                    >
                        {tab === 'schedule' ? '📅 경기 일정' : '🏆 순위표'}
                    </button>
                ))}
                <div className="flex-1 flex items-end pb-1 pl-2">
                    <span className="text-[10px] text-zinc-600">
                        {currentSeasonLabel.replace(' (현재)', '')} 기준
                    </span>
                </div>
            </div>

            {/* ── 순위표 탭 ── */}
            {matchTab === 'standings' && (
                <StandingsTab matches={matches} />
            )}

            {/* ── 일정 탭 ── */}
            {matchTab === 'schedule' && (
                <>
                    {/* 필터 바 */}
                    <div className="flex flex-wrap gap-3 items-center bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                            <SelectTrigger className="w-[110px] bg-zinc-800 border-zinc-700 h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">전체 상태</SelectItem>
                                <SelectItem value="SCHEDULED">예정</SelectItem>
                                <SelectItem value="COMPLETED">완료</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative flex-1 min-w-[160px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                            <Input
                                placeholder="팀 검색 (T1, GEN, HLE, KT...)"
                                value={searchTeam}
                                onChange={e => setSearchTeam(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && setTeamFilter(searchTeam)}
                                className="pl-8 bg-zinc-800 border-zinc-700 h-8 text-sm"
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setTeamFilter(searchTeam)} className="border-zinc-700 h-8">
                            <Target className="w-3.5 h-3.5 mr-1" /> 검색
                        </Button>
                        {teamFilter && (
                            <Button variant="ghost" size="sm" onClick={() => { setTeamFilter(''); setSearchTeam('') }} className="h-8 text-zinc-500">
                                ✕ 초기화
                            </Button>
                        )}
                    </div>

                    {/* 주/월 단위 토글 */}
                    <div className="flex items-center justify-center gap-3">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-1 flex gap-1">
                            <button
                                onClick={() => { setViewMode('month'); setViewMonth(viewWeek) }}
                                className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${viewMode === 'month' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-600/40' : 'text-zinc-400 hover:text-white'}`}
                            >
                                월단위
                            </button>
                            <button
                                onClick={() => { setViewMode('week'); setViewWeek(viewMonth) }}
                                className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${viewMode === 'week' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-600/40' : 'text-zinc-400 hover:text-white'}`}
                            >
                                주단위
                            </button>
                        </div>
                    </div>

                    {/* 네비게이션 */}
                    {viewMode === 'week' ? (
                        <div className="flex items-center justify-center gap-6">
                            <Button variant="ghost" size="icon" onClick={() => setViewWeek(subWeeks(viewWeek, 1))} className="hover:bg-zinc-800">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <div className="text-center">
                                <h2 className="text-xl font-bold tracking-tight">
                                    {format(weekStart, 'MM.dd', { locale: ko })} ~ {format(weekEnd, 'MM.dd', { locale: ko })}
                                </h2>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {format(weekStart, 'yyyy년 MM월', { locale: ko })} · {weekMatches.length}경기
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setViewWeek(addWeeks(viewWeek, 1))} className="hover:bg-zinc-800">
                                <ChevronRight className="w-6 h-6" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-6">
                            <Button variant="ghost" size="icon" onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="hover:bg-zinc-800">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <h2 className="text-2xl font-bold tracking-tight">
                                {format(viewMonth, 'yyyy년 MM월', { locale: ko })}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="hover:bg-zinc-800">
                                <ChevronRight className="w-6 h-6" />
                            </Button>
                        </div>
                    )}

                    {/* 경기 목록 */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
                            <p className="text-zinc-500 text-sm">경기 데이터를 불러오는 중...</p>
                        </div>
                    ) : error ? (
                        <ErrorState message={error} onRetry={() => fetchMatches()} />
                    ) : matches.length === 0 ? (
                        <div className="text-center py-16 bg-zinc-900/40 rounded-xl border border-zinc-800 border-dashed space-y-4">
                            <Trophy className="w-12 h-12 text-zinc-700 mx-auto" />
                            <div>
                                <p className="text-zinc-400 font-medium">실제 LCK 경기 데이터를 불러오는 중입니다.</p>
                                <p className="text-zinc-600 text-sm mt-1">잠시 후 새로고침해 주세요.</p>
                            </div>
                            <Button onClick={handleSync} disabled={syncing} variant="outline" className="border-yellow-600/50 text-yellow-400">
                                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? '동기화 중...' : '지금 동기화'}
                            </Button>
                        </div>
                    ) : viewMode === 'week' ? (
                        weekMatches.length === 0 ? (
                            <EmptyState label="이 주에 예정된 경기가 없습니다. ← → 버튼으로 다른 주를 확인하세요." />
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(byDay)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([day, dayMatches]) => (
                                        <div key={day} className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-px bg-zinc-800 flex-1" />
                                                <Badge variant="outline"
                                                    className="px-3 text-xs border-blue-600/40 text-blue-400 bg-blue-500/5">
                                                    {day}
                                                </Badge>
                                                <div className="h-px bg-zinc-800 flex-1" />
                                            </div>
                                            {dayMatches
                                                .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime())
                                                .map(match => <RealMatchCard key={match.id} match={match} />)}
                                        </div>
                                    ))}
                            </div>
                        )
                    ) : monthMatches.length === 0 ? (
                        <EmptyState label="이 달에 예정된 경기가 없습니다. ← → 버튼으로 다른 달을 확인하세요." />
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(byWeek)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([week, weekMatchGroup]) => (
                                    <div key={week} className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px bg-zinc-800 flex-1" />
                                            <Badge variant="outline"
                                                className="px-3 text-xs border-yellow-600/40 text-yellow-500 bg-yellow-500/5">
                                                {week}
                                            </Badge>
                                            <div className="h-px bg-zinc-800 flex-1" />
                                        </div>
                                        {weekMatchGroup
                                            .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime())
                                            .map(match => <RealMatchCard key={match.id} match={match} />)}
                                    </div>
                                ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// ─── 실제 경기 카드 ───────────────────────────────────────────────────

function RealMatchCard({ match }: { match: LckMatch }) {
    const isCompleted = match.status === 'COMPLETED'
    const isLive = match.status === 'LIVE'
    const scheduledDate = match.scheduledAt ? new Date(match.scheduledAt) : null

    const t1Color = LCK_TEAM_COLORS[match.team1] ?? 'text-white'
    const t2Color = LCK_TEAM_COLORS[match.team2] ?? 'text-white'

    // 라운드/스테이지 레이블
    const stageLabel = extractStageLabel(match.displayName)

    return (
        <Card className={`border overflow-hidden transition-all
            ${isLive ? 'border-red-500/50 bg-red-500/5' :
                isCompleted ? 'border-zinc-800 bg-zinc-900/80' :
                    'border-zinc-800 bg-zinc-900'}`}>
            <Accordion type="single" collapsible disabled={!isCompleted || match.games.length === 0}>
                <AccordionItem value="item" className="border-none">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-800/30 group">
                        <div className="flex items-center justify-between w-full gap-3">

                            {/* 날짜 / 상태 */}
                            <div className="flex flex-col items-start min-w-[90px] gap-1 shrink-0">
                                {scheduledDate && (
                                    <span className="text-sm text-zinc-300 font-semibold">
                                        {format(scheduledDate, 'MM.dd (EEE)', { locale: ko })}
                                    </span>
                                )}
                                {scheduledDate && (
                                    <span className="text-xs text-zinc-600 font-mono">
                                        {format(scheduledDate, 'HH:mm')} KST
                                    </span>
                                )}
                                {isLive && (
                                    <Badge className="bg-red-500 text-white text-[10px] animate-pulse px-2">
                                        🔴 LIVE
                                    </Badge>
                                )}
                                {!isCompleted && !isLive && (
                                    <Badge variant="outline" className="text-[10px] border-blue-600/50 text-blue-400">
                                        예정
                                    </Badge>
                                )}
                                {isCompleted && (
                                    <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                                        종료
                                    </Badge>
                                )}
                            </div>

                            {/* 매치업 — 중앙 (라운드+BO 상단 배치) */}
                            <div className="flex flex-col items-center gap-2 flex-1 justify-center">

                                {/* 라운드 + BO 배지 — 스코어 위 중앙에 크게 표시 */}
                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                    {stageLabel && (
                                        <span className="text-[11px] font-bold text-zinc-200 bg-zinc-700/80 border border-zinc-600 rounded px-2 py-0.5 leading-tight">
                                            {stageLabel}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold text-yellow-500/80 border border-yellow-700/40 rounded px-1.5 py-0.5 bg-yellow-500/5 leading-tight">
                                        BO{match.bestOf}
                                    </span>
                                </div>

                                {/* 팀 + 스코어 행 */}
                                <div className="flex items-center gap-3 w-full">
                                    {/* 팀 1 */}
                                    <div className={`flex-1 flex items-center justify-end gap-2
                                        ${isCompleted && match.winner === match.team1 ? 'opacity-100' : isCompleted ? 'opacity-50' : ''}`}>
                                        {match.team1 && match.team1 !== 'TBD' ? (
                                            <Link href={`/teams/${match.team1}`} onClick={e => e.stopPropagation()} className="hidden md:flex flex-col items-end hover:opacity-80 transition-opacity">
                                                <span className={`text-base font-bold ${t1Color}`}>{match.team1}</span>
                                                {match.team1Name && (
                                                    <span className="text-[10px] text-zinc-500 max-w-[100px] truncate text-right">{match.team1Name}</span>
                                                )}
                                            </Link>
                                        ) : (
                                            <div className="hidden md:flex flex-col items-end">
                                                <span className={`text-base font-bold ${t1Color}`}>{match.team1 || 'TBD'}</span>
                                            </div>
                                        )}
                                        {match.team1 && match.team1 !== 'TBD' ? (
                                            <Link href={`/teams/${match.team1}`} onClick={e => e.stopPropagation()}>
                                                <TeamLogo code={match.team1} logoUrl={match.team1Logo} name={match.team1Name} />
                                            </Link>
                                        ) : (
                                            <TeamLogo code={match.team1 || 'TBD'} logoUrl={match.team1Logo} name={match.team1Name} />
                                        )}
                                    </div>

                                    {/* 스코어 */}
                                    <div className="flex flex-col items-center min-w-[70px]">
                                        {isCompleted ? (
                                            <div className="text-2xl font-bold font-mono text-white">
                                                <span className={match.winner === match.team1 ? 'text-green-400' : 'text-zinc-400'}>
                                                    {match.team1Score}
                                                </span>
                                                <span className="text-zinc-600 mx-1">:</span>
                                                <span className={match.winner === match.team2 ? 'text-green-400' : 'text-zinc-400'}>
                                                    {match.team2Score}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-xl font-bold text-zinc-600 bg-zinc-800 px-4 py-1 rounded">
                                                VS
                                            </div>
                                        )}
                                        {match.games[0]?.patch && (
                                            <span className="text-[10px] text-zinc-700 mt-1">
                                                Patch {match.games[0].patch}
                                            </span>
                                        )}
                                    </div>

                                    {/* 팀 2 */}
                                    <div className={`flex-1 flex items-center justify-start gap-2
                                        ${isCompleted && match.winner === match.team2 ? 'opacity-100' : isCompleted ? 'opacity-50' : ''}`}>
                                        {match.team2 && match.team2 !== 'TBD' ? (
                                            <Link href={`/teams/${match.team2}`} onClick={e => e.stopPropagation()}>
                                                <TeamLogo code={match.team2} logoUrl={match.team2Logo} name={match.team2Name} />
                                            </Link>
                                        ) : (
                                            <TeamLogo code={match.team2 || 'TBD'} logoUrl={match.team2Logo} name={match.team2Name} />
                                        )}
                                        {match.team2 && match.team2 !== 'TBD' ? (
                                            <Link href={`/teams/${match.team2}`} onClick={e => e.stopPropagation()} className="hidden md:flex flex-col hover:opacity-80 transition-opacity">
                                                <span className={`text-base font-bold ${t2Color}`}>{match.team2}</span>
                                                {match.team2Name && (
                                                    <span className="text-[10px] text-zinc-500 max-w-[100px] truncate">{match.team2Name}</span>
                                                )}
                                            </Link>
                                        ) : (
                                            <div className="hidden md:flex flex-col">
                                                <span className={`text-base font-bold ${t2Color}`}>{match.team2 || 'TBD'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 우측 액션 */}
                            <div className="hidden md:flex flex-col items-end min-w-[90px] gap-1.5 shrink-0">
                                {isCompleted && match.games.length > 0 && (
                                    <>
                                        <div className="flex gap-1">
                                            {match.games.map(g => (
                                                <div key={g.gameNumber}
                                                    className={`w-3 h-3 rounded-full ${g.winner === match.team1 ? 'bg-blue-500' : g.winner === match.team2 ? 'bg-red-500' : 'bg-zinc-700'}`}
                                                    title={`G${g.gameNumber}: ${g.winner ?? '?'} win`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                            상세 보기 ↓
                                        </span>
                                    </>
                                )}
                                {!isCompleted && (
                                    <Link href="/prediction" onClick={e => e.stopPropagation()}>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-1 rounded-lg hover:bg-yellow-500/20 transition-colors">
                                            <Target className="w-3 h-3" />
                                            예측하기
                                        </span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>

                    {/* 게임별 상세 */}
                    {isCompleted && match.games.length > 0 && (
                        <AccordionContent className="border-t border-zinc-800 px-0 pb-0">
                            <div className="bg-zinc-950/60 p-4 space-y-4">
                                {match.games
                                    .sort((a, b) => a.gameNumber - b.gameNumber)
                                    .map(game => (
                                        <GameDetailPanel
                                            key={game.id}
                                            game={game}
                                            team1={match.team1}
                                            team2={match.team2}
                                        />
                                    ))}
                            </div>
                        </AccordionContent>
                    )}
                </AccordionItem>
            </Accordion>
        </Card>
    )
}

// ─── 게임 상세 패널 ───────────────────────────────────────────────────

function GameDetailPanel({ game, team1, team2 }: { game: GameStat; team1: string; team2: string }) {
    const t1Players = sortByPosition(game.playerStats.filter(p => p.team === team1))
    const t2Players = sortByPosition(game.playerStats.filter(p => p.team === team2))

    const winnerPlayers = game.winner === team1 ? t1Players : t2Players
    const mvp = winnerPlayers.reduce<PlayerStat | null>((best, p) => {
        const kda = p.deaths === 0 ? (p.kills + p.assists) * 10 : (p.kills + p.assists) / p.deaths
        const bestKda = best ? (best.deaths === 0 ? (best.kills + best.assists) * 10 : (best.kills + best.assists) / best.deaths) : -1
        return kda > bestKda ? p : best
    }, null)

    return (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/60 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-300 text-sm">GAME {game.gameNumber}</span>
                    {game.winner && (
                        <Badge className={`text-[10px] px-2 ${game.winner === team1 ? 'bg-blue-600/30 text-blue-300 border-blue-600/50' : 'bg-red-600/30 text-red-300 border-red-600/50'}`}
                            variant="outline">
                            {game.winner} WIN
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-600">
                    {game.duration && <span>⏱ {game.duration}</span>}
                    {game.patch && <span>Patch {game.patch}</span>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                <PlayerStatTable players={t1Players} teamCode={team1} isWinner={game.winner === team1} mvpName={mvp?.playerName} />
                <PlayerStatTable players={t2Players} teamCode={team2} isWinner={game.winner === team2} mvpName={mvp?.playerName} />
            </div>
        </div>
    )
}

function PlayerStatTable({ players, teamCode, isWinner, mvpName }: {
    players: PlayerStat[]; teamCode: string; isWinner: boolean; mvpName?: string
}) {
    const color = LCK_TEAM_COLORS[teamCode] ?? 'text-white'
    return (
        <div className="p-3">
            <div className="flex items-center justify-between mb-2">
                <span className={`font-bold text-sm ${color}`}>{teamCode}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isWinner ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {isWinner ? 'WIN' : 'LOSE'}
                </span>
            </div>
            <div className="grid grid-cols-12 text-[10px] text-zinc-600 px-1 pb-1 border-b border-zinc-800/60 mb-1">
                <div className="col-span-4">선수 / 챔피언</div>
                <div className="col-span-2 text-center">포지션</div>
                <div className="col-span-2 text-center">KDA</div>
                <div className="col-span-2 text-center">CS</div>
                <div className="col-span-2 text-center">딜량</div>
            </div>
            {players.length > 0 ? players.map(p => {
                const isMvp = p.playerName === mvpName
                return (
                    <div key={p.id}
                        className={`grid grid-cols-12 text-xs items-center py-1 px-1 rounded ${isMvp ? 'bg-yellow-500/10' : 'hover:bg-zinc-800/30'}`}>
                        <div className="col-span-4 flex flex-col gap-0.5 overflow-hidden">
                            <div className="flex items-center gap-1">
                                {isMvp && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                <span className={`truncate font-medium ${isMvp ? 'text-yellow-200' : 'text-zinc-200'}`}>
                                    {p.playerName}
                                </span>
                            </div>
                            {p.champion && <span className="text-[10px] text-zinc-500 truncate">{p.champion}</span>}
                        </div>
                        <div className="col-span-2 text-center">
                            <span className="text-[10px] text-zinc-500">
                                {p.position ? (POSITION_KO[p.position.toLowerCase()] ?? p.position.toUpperCase()) : '-'}
                            </span>
                        </div>
                        <div className={`col-span-2 text-center font-mono text-[11px] font-bold ${color}`}>
                            {p.kills}/{p.deaths}/{p.assists}
                        </div>
                        <div className="col-span-2 text-center text-zinc-500 text-[10px]">{p.cs}</div>
                        <div className="col-span-2 text-center text-zinc-500 text-[10px]">
                            {p.damage > 0 ? `${(p.damage / 1000).toFixed(1)}k` : '-'}
                        </div>
                    </div>
                )
            }) : (
                <div className="text-xs text-zinc-700 py-3 text-center">스탯 데이터 없음</div>
            )}
            {players.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-800/40 grid grid-cols-3 gap-2 text-[10px] text-zinc-600">
                    <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-600" />총킬: {players.reduce((s, p) => s + p.kills, 0)}</div>
                    <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-600" />CS: {players.reduce((s, p) => s + p.cs, 0)}</div>
                    <div className="flex items-center gap-1"><Eye className="w-3 h-3 text-purple-600" />시야: {players.reduce((s, p) => s + p.visionScore, 0)}</div>
                </div>
            )}
        </div>
    )
}

// ─── 공통 유틸 컴포넌트 ──────────────────────────────────────────────

function TeamLogo({ code, logoUrl, name }: { code: string; logoUrl?: string | null; name?: string | null }) {
    if (logoUrl) {
        return (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={name ?? code} className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
        )
    }
    const color = LCK_TEAM_COLORS[code] ?? 'text-zinc-400'
    return (
        <div className={`w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold ${color} border border-zinc-700`}>
            {code.slice(0, 3)}
        </div>
    )
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="text-center py-20 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed">
            <Swords className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">{label}</p>
        </div>
    )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="text-center py-16 bg-red-900/10 rounded-xl border border-red-800/40">
            <p className="text-red-400 mb-3">데이터를 불러오지 못했습니다.</p>
            <p className="text-zinc-600 text-xs mb-4">{message}</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="border-red-800 text-red-400">
                <RefreshCw className="w-4 h-4 mr-2" /> 다시 시도
            </Button>
        </div>
    )
}

function sortByPosition(players: PlayerStat[]): PlayerStat[] {
    return [...players].sort((a, b) => {
        const ai = POSITION_ORDER.indexOf((a.position ?? '').toLowerCase())
        const bi = POSITION_ORDER.indexOf((b.position ?? '').toLowerCase())
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
}

// ─── 브라켓 레이아웃 상수 ───────────────────────────────────────────
const MATCH_H = 102  // px: 브라켓 카드 고정 높이
const MATCH_W = 240  // px: 브라켓 카드 너비
const COL_GAP = 76   // px: 라운드 사이 SVG 커넥터 너비
const PAIR_GAP = 28  // px: 같은 브라켓 쌍 내 두 경기 간격
const INTER_PAIR = 76 // px: 브라켓 쌍 사이 간격
const HEADER_H = 68  // px: 라운드 헤더 높이

interface BracketRound {
    name: string
    displayDate: string
    matches: LckMatch[]
}

function groupMatchesIntoRounds(matches: LckMatch[]): BracketRound[] {
    if (matches.length === 0) return []
    const sorted = [...matches].sort((a, b) =>
        new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime()
    )

    // displayName에 라운드명이 있으면 우선 사용
    const byNamedRound = new Map<string, LckMatch[]>()
    let hasNamed = false
    const namedOrder: string[] = []
    for (const m of sorted) {
        const dn = m.displayName ?? ''
        const rm = dn.match(/준준결승|8강|준결승|4강|결승|3위전|1라운드|2라운드|3라운드|4라운드|5라운드|상위권.*8강|상위권.*4강|상위권.*결승|하위권.*1라운드|하위권.*8강|하위권.*4강|챔피언십/i)
        if (rm) {
            hasNamed = true
            const key = rm[0]
            if (!byNamedRound.has(key)) { byNamedRound.set(key, []); namedOrder.push(key) }
            byNamedRound.get(key)!.push(m)
        }
    }
    if (hasNamed) {
        return namedOrder.map(name => ({
            name,
            displayDate: byNamedRound.get(name)![0]?.scheduledAt
                ? format(new Date(byNamedRound.get(name)![0].scheduledAt!), 'M.d', { locale: ko })
                : '',
            matches: byNamedRound.get(name)!,
        }))
    }

    // 주 단위로 그룹화 (fallback)
    const byWeek = new Map<string, LckMatch[]>()
    for (const m of sorted) {
        if (!m.scheduledAt) continue
        const ws = startOfWeek(new Date(m.scheduledAt), { weekStartsOn: 1 })
        const key = format(ws, 'yyyy-MM-dd')
        if (!byWeek.has(key)) byWeek.set(key, [])
        byWeek.get(key)!.push(m)
    }

    const BASE_NAMES = ['1라운드', '2라운드', '3라운드', '준결승']
    const sorted2 = Array.from(byWeek.entries()).sort(([a], [b]) => a.localeCompare(b))
    // sorted2.length > 1 조건 제거: 단일 주 1경기도 '결승'으로 표시
    const lastHasOnlyOne = (sorted2[sorted2.length - 1]?.[1]?.length ?? 0) === 1
    return sorted2.map(([wk, ms], i) => {
            const ws = parseISO(wk)
            const isLast = i === sorted2.length - 1
            const isSecondToLast = i === sorted2.length - 2
            // 마지막 주가 1경기면 → '결승', 그 직전 주 → '준결승'
            const name = isLast && lastHasOnlyOne
                ? '결승'
                : isSecondToLast && lastHasOnlyOne
                ? '준결승'
                : BASE_NAMES[i] ?? `${i + 1}라운드`
            return {
                name,
                displayDate: `${format(ws, 'M.d')} – ${format(addDays(ws, 6), 'M.d')}`,
                matches: ms,
            }
        })
}

function computeBracketPositions(rounds: BracketRound[]): number[][] {
    if (rounds.length === 0) return []
    const r0 = rounds[0].matches
    const pos0: number[] = []
    let y = 0
    for (let i = 0; i < r0.length; i++) {
        pos0.push(y)
        if (i < r0.length - 1) {
            y += MATCH_H + (i % 2 === 0 ? PAIR_GAP : INTER_PAIR)
        }
    }
    const all = [pos0]
    for (let ri = 1; ri < rounds.length; ri++) {
        const prev = all[ri - 1]
        const cnt = rounds[ri].matches.length
        const ratio = prev.length / cnt
        const pos: number[] = []
        for (let mi = 0; mi < cnt; mi++) {
            const fs = Math.max(0, Math.min(Math.floor(mi * ratio), prev.length - 1))
            // fe: ratio < 1(라운드 수 증가) 시 -1이 될 수 있어 Math.max(0, ...) 로 방어
            const fe = Math.max(0, Math.min(Math.floor((mi + 1) * ratio) - 1, prev.length - 1))
            const y1 = prev[fs] + MATCH_H / 2
            const y2 = prev[fe] + MATCH_H / 2
            pos.push((y1 + y2) / 2 - MATCH_H / 2)
        }
        all.push(pos)
    }
    return all
}

// ─── 순위표 탭 (lolesports 스타일) ───────────────────────────────────

function StandingsTab({ matches }: { matches: LckMatch[] }) {
    const stages = useMemo(() => {
        const seen = new Set<string>()
        const result: string[] = []
        for (const m of matches) {
            const s = detectStageGroup(m.displayName)
            if (!seen.has(s)) { seen.add(s); result.push(s) }
        }
        return result.sort((a, b) => {
            const order: Record<string, number> = {
                '정규 시즌': 0, '플레이인': 1, '플레이오프': 2,
                '토너먼트 스테이지': 3, '로드 투 MSI': 4,
            }
            return (order[a] ?? 9) - (order[b] ?? 9)
        })
    }, [matches])

    const [selectedStage, setSelectedStage] = useState<string>('')

    useEffect(() => {
        if (stages.length > 0 && !stages.includes(selectedStage)) {
            setSelectedStage(stages[0])
        }
    }, [stages, selectedStage])

    const stageMatches = useMemo(() =>
        matches.filter(m => detectStageGroup(m.displayName) === selectedStage)
    , [matches, selectedStage])

    const stageType = getStageType(selectedStage)

    const STAGE_META: Record<string, { icon: React.ReactNode; color: string; desc: string }> = {
        '정규 시즌':        { icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-400',   desc: '리그 순위표' },
        '플레이오프':       { icon: <Trophy className="w-4 h-4" />,     color: 'text-yellow-400', desc: '토너먼트 브라켓' },
        '토너먼트 스테이지': { icon: <Trophy className="w-4 h-4" />,    color: 'text-yellow-400', desc: 'Road to MSI 브라켓' },
        '플레이인':         { icon: <Zap className="w-4 h-4" />,        color: 'text-orange-400', desc: '플레이인 브라켓' },
        '로드 투 MSI':      { icon: <Zap className="w-4 h-4" />,        color: 'text-green-400',  desc: 'MSI 진출 결정전' },
    }

    if (matches.length === 0) {
        return <EmptyState label="경기 데이터가 없습니다. 시즌을 선택하거나 동기화를 시도해보세요." />
    }

    return (
        <div className="space-y-5">
            {/* LoL Esports 스타일 스테이지 선택 바 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">시즌 스테이지 선택</span>
                </div>
                <div className="flex divide-x divide-zinc-800 overflow-x-auto">
                    {stages.map(stage => {
                        const cnt = matches.filter(m => detectStageGroup(m.displayName) === stage).length
                        const isActive = selectedStage === stage
                        const meta = STAGE_META[stage]
                        return (
                            <button
                                key={stage}
                                onClick={() => setSelectedStage(stage)}
                                className={`flex-1 min-w-[120px] py-4 px-3 text-center transition-all hover:bg-zinc-800/60 relative ${isActive ? 'bg-yellow-500/[0.06]' : ''}`}
                            >
                                {isActive && (
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-500" />
                                )}
                                <div className={`flex items-center justify-center gap-1.5 mb-1 ${isActive ? (meta?.color ?? 'text-yellow-400') : 'text-zinc-500'}`}>
                                    {meta?.icon ?? <LayoutGrid className="w-4 h-4" />}
                                </div>
                                <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-zinc-400'}`}>{stage}</p>
                                <p className={`text-[10px] mt-0.5 ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                    {meta?.desc ?? '경기'} · {cnt}경기
                                </p>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 스테이지별 콘텐츠 */}
            {stageType === 'playoff' || stageType === 'playin' || stageType === 'roadtomsi' ? (
                <PlayoffBracket matches={stageMatches} stageName={selectedStage} />
            ) : (
                <LeagueStandings matches={stageMatches} />
            )}
        </div>
    )
}

// ─── 리그 순위표 ─────────────────────────────────────────────────────

function LeagueStandings({ matches }: { matches: LckMatch[] }) {
    const teamMap: Record<string, { code: string; name: string | null; logo: string | null; wins: number; losses: number; form: string[] }> = {}

    const completed = [...matches]
        .filter(m => m.status === 'COMPLETED' && m.winner)
        .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime())

    for (const m of completed) {
        ;[
            { code: m.team1, name: m.team1Name, logo: m.team1Logo, won: m.winner === m.team1 },
            { code: m.team2, name: m.team2Name, logo: m.team2Logo, won: m.winner === m.team2 },
        ].forEach(({ code, name, logo, won }) => {
            if (!teamMap[code]) teamMap[code] = { code, name, logo, wins: 0, losses: 0, form: [] }
            if (won) { teamMap[code].wins++; teamMap[code].form.push('W') }
            else { teamMap[code].losses++; teamMap[code].form.push('L') }
        })
    }

    const standings = Object.values(teamMap).sort((a, b) => {
        const aWr = a.wins / (a.wins + a.losses || 1)
        const bWr = b.wins / (b.wins + b.losses || 1)
        return bWr - aWr || b.wins - a.wins
    })

    if (standings.length === 0) {
        return <div className="text-center py-12 text-zinc-500 text-sm">완료된 경기가 없습니다.</div>
    }

    return (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-white">리그 순위 ({standings.length}팀)</span>
                <span className="text-xs text-zinc-600 ml-auto">{completed.length}경기 기준</span>
            </div>
            <div className="bg-zinc-950">
                {/* 헤더 */}
                <div className="grid grid-cols-12 text-[11px] text-zinc-600 px-4 py-2 border-b border-zinc-800">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-5">팀</div>
                    <div className="col-span-1 text-center">승</div>
                    <div className="col-span-1 text-center">패</div>
                    <div className="col-span-2 text-center">승률</div>
                    <div className="col-span-2 text-center hidden sm:block">최근 5경기</div>
                </div>
                {standings.map((team, idx) => {
                    const wr = team.wins + team.losses > 0 ? Math.round(team.wins / (team.wins + team.losses) * 100) : 0
                    const recentForm = team.form.slice(-5)
                    const color = LCK_TEAM_COLORS[team.code] ?? 'text-white'
                    return (
                        <div key={team.code}
                            className="grid grid-cols-12 items-center px-4 py-2.5 border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                            <div className="col-span-1 text-center">
                                <span className={`text-sm font-black ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>
                                    {idx + 1}
                                </span>
                            </div>
                            <div className="col-span-5 flex items-center gap-2">
                                <Link href={`/teams/${team.code}`}>
                                    <TeamLogo code={team.code} logoUrl={team.logo} />
                                </Link>
                                <Link href={`/teams/${team.code}`} className="hover:underline">
                                    <p className={`text-sm font-black ${color}`}>{team.code}</p>
                                    {team.name && <p className="text-[10px] text-zinc-600 truncate max-w-[90px]">{team.name}</p>}
                                </Link>
                            </div>
                            <div className="col-span-1 text-center text-green-400 font-bold text-sm">{team.wins}</div>
                            <div className="col-span-1 text-center text-red-400 font-bold text-sm">{team.losses}</div>
                            <div className="col-span-2 text-center">
                                <span className={`text-sm font-bold ${wr >= 60 ? 'text-green-400' : wr >= 40 ? 'text-zinc-300' : 'text-red-400'}`}>
                                    {wr}%
                                </span>
                            </div>
                            <div className="col-span-2 hidden sm:flex justify-center gap-0.5">
                                {recentForm.map((r, i) => (
                                    <span key={i}
                                        className={`text-[10px] w-5 h-5 flex items-center justify-center rounded font-bold ${r === 'W' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── 플레이오프/플레이인 브라켓 (SVG 커넥터) ──────────────────────────

function PlayoffBracket({ matches, stageName }: { matches: LckMatch[]; stageName: string }) {
    const rounds = useMemo(() => groupMatchesIntoRounds(matches), [matches])
    const allPositions = useMemo(() => computeBracketPositions(rounds), [rounds])

    if (rounds.length === 0) {
        return <div className="text-center py-12 text-zinc-500 text-sm">{stageName} 경기가 없습니다.</div>
    }

    // 전체 브라켓 크기
    const pos0 = allPositions[0] ?? []
    const totalBracketH = pos0.length > 0 ? pos0[pos0.length - 1] + MATCH_H : MATCH_H
    const totalBracketW = rounds.length * MATCH_W + (rounds.length - 1) * COL_GAP

    const sorted = [...matches].sort((a, b) =>
        new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime()
    )

    return (
        <div className="space-y-5">
            {/* ── 스테이지 헤더 ── */}
            <div className="flex items-center gap-3">
                <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                <h3 className="text-sm font-black text-white tracking-wide">{stageName} 브라켓</h3>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(234,179,8,0.35), transparent)' }} />
                <span className="text-xs text-zinc-600">{matches.length}경기</span>
            </div>

            {/* ── 시각적 브라켓 ── */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-800/60 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #09090b 0%, #0d0d10 50%, #09090b 100%)' }}>
            <div className="p-8" style={{ minWidth: totalBracketW + 64 }}>
                <div
                    className="relative"
                    style={{ width: totalBracketW, height: totalBracketH + HEADER_H }}
                >
                    {rounds.map((round, ri) => {
                        const xOffset = ri * (MATCH_W + COL_GAP)
                        const positions = allPositions[ri] ?? []
                        const nextPositions = allPositions[ri + 1] ?? []
                        const isLast = ri === rounds.length - 1

                        return (
                            <div key={`${round.name}-${ri}`}>
                                {/* 라운드 헤더 */}
                                <div
                                    className="absolute text-center"
                                    style={{ left: xOffset, top: 0, width: MATCH_W }}
                                >
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide border ${
                                        isLast
                                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-600/40'
                                            : ri === 0
                                            ? 'bg-zinc-800/80 text-zinc-200 border-zinc-600/50'
                                            : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/50'
                                    }`}>
                                        {isLast && <Trophy className="w-3 h-3" />}
                                        {round.name}
                                    </div>
                                    {round.displayDate && <p className="text-[10px] text-zinc-600 mt-1">{round.displayDate}</p>}
                                </div>

                                {/* 경기 카드들 */}
                                {round.matches.map((m, mi) => (
                                    <div
                                        key={m.id}
                                        className="absolute"
                                        style={{ left: xOffset, top: positions[mi] + HEADER_H, width: MATCH_W }}
                                    >
                                        <FixedBracketCard match={m} />
                                    </div>
                                ))}

                                {/* SVG 커넥터 라인 → 다음 라운드 */}
                                {!isLast && nextPositions.length > 0 && (
                                    <svg
                                        className="absolute"
                                        style={{
                                            left: xOffset + MATCH_W,
                                            top: HEADER_H,
                                            width: COL_GAP,
                                            height: totalBracketH,
                                            overflow: 'visible',
                                        }}
                                    >
                                        {nextPositions.map((nextY, ni) => {
                                            const ratio = positions.length / nextPositions.length
                                            const fromStart = Math.floor(ni * ratio)
                                            const fromEnd = Math.min(
                                                Math.floor((ni + 1) * ratio) - 1,
                                                positions.length - 1
                                            )
                                            const y1 = positions[fromStart] + MATCH_H / 2
                                            const y2 = positions[fromEnd] + MATCH_H / 2
                                            const toY = nextY + MATCH_H / 2
                                            const MID = COL_GAP / 2

                                            return (
                                                <g key={ni}>
                                                    <path d={`M 0 ${y1} H ${MID}`} stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                                    {fromEnd !== fromStart && (
                                                        <>
                                                            <path d={`M 0 ${y2} H ${MID}`} stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                                            <path d={`M ${MID} ${y1} V ${y2}`} stroke="#3f3f46" strokeWidth="1.5" fill="none" />
                                                        </>
                                                    )}
                                                    <path d={`M ${MID} ${toY} H ${COL_GAP}`} stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                                    {/* 화살표 */}
                                                    <polygon
                                                        points={`${COL_GAP - 6},${toY - 4} ${COL_GAP},${toY} ${COL_GAP - 6},${toY + 4}`}
                                                        fill="#52525b"
                                                    />
                                                </g>
                                            )
                                        })}
                                    </svg>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            </div>

            {/* ── 전체 경기 리스트 ── */}
            <div className="space-y-2">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide px-1">전체 경기 목록</p>
                {sorted.map(m => {
                    const isCompleted = m.status === 'COMPLETED'
                    const roundLabel = extractPlayoffRound(m)
                    return (
                        <div key={m.id}
                            className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 hover:border-zinc-700 transition-colors">
                            <div className="w-[60px] shrink-0 text-center">
                                <p className="text-[10px] text-zinc-500">
                                    {m.scheduledAt ? format(new Date(m.scheduledAt), 'MM.dd') : ''}
                                </p>
                                <p className="text-[9px] text-zinc-700 truncate">{roundLabel}</p>
                                <p className="text-[9px] text-yellow-700/70">BO{m.bestOf}</p>
                            </div>
                            <span className={`text-sm font-bold flex-1 text-right ${LCK_TEAM_COLORS[m.team1] ?? 'text-white'} ${isCompleted && m.winner !== m.team1 ? 'opacity-40' : ''}`}>
                                {m.team1}
                            </span>
                            <div className="text-center min-w-[60px]">
                                {isCompleted ? (
                                    <p className="font-black text-xl font-mono">
                                        <span className={m.winner === m.team1 ? 'text-green-400' : 'text-zinc-500'}>{m.team1Score}</span>
                                        <span className="text-zinc-700 mx-0.5">:</span>
                                        <span className={m.winner === m.team2 ? 'text-green-400' : 'text-zinc-500'}>{m.team2Score}</span>
                                    </p>
                                ) : (
                                    <span className="text-zinc-600 font-bold text-sm">VS</span>
                                )}
                            </div>
                            <span className={`text-sm font-bold flex-1 ${LCK_TEAM_COLORS[m.team2] ?? 'text-white'} ${isCompleted && m.winner !== m.team2 ? 'opacity-40' : ''}`}>
                                {m.team2}
                            </span>
                            <div className="w-[60px] shrink-0 text-right">
                                {isCompleted && m.winner && (
                                    <p className="text-[10px] font-bold text-yellow-400">{m.winner} 승</p>
                                )}
                                {m.status === 'SCHEDULED' && m.scheduledAt && (
                                    <p className="text-[10px] text-zinc-600">
                                        {format(new Date(m.scheduledAt), 'HH:mm')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/** 고정 높이 브라켓 카드 — TBD 팀은 teamName으로 표시, 승자 accent bar */
function FixedBracketCard({ match }: { match: LckMatch }) {
    const isCompleted = match.status === 'COMPLETED'
    const isScheduled = match.status === 'SCHEDULED'

    const t1code = resolveTeamCode(match.team1, match.team1Name)
    const t2code = resolveTeamCode(match.team2, match.team2Name)
    const t1display = match.team1 !== 'TBD' ? match.team1 : (match.team1Name && match.team1Name !== 'TBD' ? match.team1Name : 'TBD')
    const t2display = match.team2 !== 'TBD' ? match.team2 : (match.team2Name && match.team2Name !== 'TBD' ? match.team2Name : 'TBD')
    const isTBD1 = t1display === 'TBD'
    const isTBD2 = t2display === 'TBD'
    const hasTBD = isTBD1 || isTBD2

    const sides = [
        { code: t1code, display: t1display, logo: match.team1Logo, score: match.team1Score, isWinner: match.winner === match.team1 || match.winner === t1code, isTBD: isTBD1 },
        { code: t2code, display: t2display, logo: match.team2Logo, score: match.team2Score, isWinner: match.winner === match.team2 || match.winner === t2code, isTBD: isTBD2 },
    ]
    const ROW_H = MATCH_H / 2

    const borderStyle: React.CSSProperties = hasTBD
        ? { border: '1px dashed #27272a' }
        : isCompleted
        ? { border: '1px solid #52525b' }
        : { border: '1px solid #3f3f46' }

    return (
        <div
            className="rounded-xl overflow-hidden shadow-xl"
            style={{ height: MATCH_H, ...borderStyle }}
        >
            {sides.map((side, i) => {
                const isWon = isCompleted && side.isWinner
                const isLost = isCompleted && !side.isWinner
                const rowBg = isWon
                    ? 'linear-gradient(90deg, rgba(202,138,4,0.13) 0%, rgba(14,14,16,0.97) 65%)'
                    : 'rgba(14,14,16,0.97)'

                return (
                    <div
                        key={i}
                        className={`relative flex items-center gap-2.5 px-3 overflow-hidden ${i === 0 ? 'border-b border-zinc-900' : ''}`}
                        style={{ height: ROW_H, background: rowBg }}
                    >
                        {/* 승자 왼쪽 골드 accent 바 */}
                        {isWon && (
                            <div
                                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r"
                                style={{ background: 'linear-gradient(to bottom, #fbbf24, #b45309)' }}
                            />
                        )}

                        {/* 팀 아이콘 */}
                        <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center overflow-hidden border ${
                            side.isTBD
                                ? 'border-dashed border-zinc-800 bg-zinc-900'
                                : 'border-zinc-700/50 bg-zinc-800/70'
                        }`}>
                            {!side.isTBD && side.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={side.logo} alt={side.display}
                                    className="w-5 h-5 object-contain"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                                <span className={`text-[7px] font-black ${
                                    side.isTBD ? 'text-zinc-700' : (LCK_TEAM_COLORS[side.code] ?? 'text-zinc-500')
                                }`}>
                                    {side.isTBD ? '?' : side.code.slice(0, 3)}
                                </span>
                            )}
                        </div>

                        {/* 팀 이름 */}
                        <div className="flex-1 min-w-0">
                            <span className={`text-[11px] font-bold truncate block leading-tight ${
                                side.isTBD ? 'text-zinc-700 italic' :
                                isWon ? 'text-white' :
                                isLost ? 'text-zinc-500' :
                                'text-zinc-300'
                            }`}>
                                {side.isTBD ? 'TBD' : side.display}
                            </span>
                            {!side.isTBD && side.code !== side.display && (
                                <span className={`text-[9px] leading-none ${LCK_TEAM_COLORS[side.code] ?? 'text-zinc-600'}`}>
                                    {side.code}
                                </span>
                            )}
                        </div>

                        {/* 스코어 or 날짜 */}
                        {isCompleted ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-sm font-black font-mono w-5 text-center ${
                                    side.isWinner ? 'text-yellow-400' : 'text-zinc-600'
                                }`}>
                                    {side.score}
                                </span>
                                {side.isWinner && (
                                    <div className="w-2 h-2 rounded-full shrink-0"
                                        style={{ background: 'radial-gradient(circle, #fbbf24, #ca8a04)', boxShadow: '0 0 4px rgba(251,191,36,0.5)' }} />
                                )}
                            </div>
                        ) : (
                            <div className="shrink-0 text-right">
                                {isScheduled && match.scheduledAt && i === 0 && (
                                    <span className="text-[9px] text-zinc-600 block">
                                        {format(new Date(match.scheduledAt), 'M.d')}
                                    </span>
                                )}
                                <span className="text-zinc-700 text-xs">—</span>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
