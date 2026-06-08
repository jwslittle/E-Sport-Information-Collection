
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Sparkles, CalendarRange, Calendar, Trophy, Medal, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014']
const POSITIONS = ['', 'TOP', 'JNG', 'MID', 'BOT', 'SUP']

const POS_STYLE: Record<string, string> = {
    TOP: 'bg-slate-800 text-slate-200 border-slate-500',
    JNG: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    MID: 'bg-blue-950 text-blue-300 border-blue-700',
    BOT: 'bg-orange-950 text-orange-300 border-orange-700',
    SUP: 'bg-purple-950 text-purple-300 border-purple-700',
}

// ─── 보조 컴포넌트 ────────────────────────────────────────────────────────────

function SortIcon({ col, sort, order }: { col: string; sort: string; order: 'asc' | 'desc' }) {
    if (sort !== col) return <ChevronsUpDown className="w-3 h-3 opacity-20 inline ml-0.5 shrink-0" />
    return order === 'asc'
        ? <ChevronUp className="w-3 h-3 text-yellow-400 inline ml-0.5 shrink-0" />
        : <ChevronDown className="w-3 h-3 text-yellow-400 inline ml-0.5 shrink-0" />
}

function WinBar({ wins, games }: { wins: number; games: number }) {
    const pct = games > 0 ? (wins / games) * 100 : 0
    const bar = pct >= 60 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'
    const txt = pct >= 60 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'
    return (
        <div className="flex items-center gap-1.5 justify-end">
            <span className={cn('font-semibold', txt)}>{pct.toFixed(0)}%</span>
            <div className="w-10 h-1.5 bg-zinc-700 rounded-full overflow-hidden flex-shrink-0">
                <div className={cn('h-full rounded-full', bar)} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
        </div>
    )
}

function KDA({ value }: { value: number }) {
    const color = value >= 5 ? 'text-yellow-300' : value >= 3 ? 'text-green-400' : value >= 2 ? 'text-zinc-200' : 'text-zinc-400'
    return <span className={cn('font-bold', color)}>{value.toFixed(2)}</span>
}

function PosBadge({ pos }: { pos: string }) {
    const s = POS_STYLE[pos]
    return s
        ? <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border', s)}>{pos}</span>
        : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border border-zinc-700 text-zinc-400">{pos}</span>
}

function SkeletonRows({ cols, rows = 8 }: { cols: number; rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="animate-pulse border-zinc-800/50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-2.5">
                            <div className={cn('h-3.5 bg-zinc-800 rounded', j === 0 ? 'w-5 mx-auto' : j === 1 ? 'w-24' : 'w-full')} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    )
}

/** 정렬 가능한 컬럼 헤더 + 툴팁 */
function TH({
    col, label, tip, sort, order, onSort,
    right = true, className = '',
}: {
    col?: string; label: string; tip?: string
    sort: string; order: 'asc' | 'desc'; onSort: (k: string) => void
    right?: boolean; className?: string
}) {
    const active = !!col && sort === col
    const cls = cn(
        right ? 'text-right' : '',
        col ? 'cursor-pointer select-none hover:text-yellow-400 transition-colors' : '',
        active ? 'text-yellow-400' : '',
        className,
    )
    const inner = (
        <TableHead className={cls} onClick={col ? () => onSort(col) : undefined}>
            <span className={cn('inline-flex items-center', right ? 'justify-end' : '')}>
                {label}
                {col && <SortIcon col={col} sort={sort} order={order} />}
            </span>
        </TableHead>
    )
    if (!tip) return inner
    return (
        <Tooltip>
            <TooltipTrigger asChild>{inner}</TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[180px] text-center">{tip}</TooltipContent>
        </Tooltip>
    )
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function InfoPage() {
    const [activeTab, setActiveTab]       = useState('team')
    const [division, setDivision]         = useState('1')
    const [yearMode, setYearMode]         = useState<'single' | 'range'>('single')
    const [year, setYear]                 = useState('2025')
    const [yearFrom, setYearFrom]         = useState('2020')
    const [yearTo, setYearTo]             = useState('2025')
    const [tournament, setTournament]     = useState('all')
    const [search, setSearch]             = useState('')
    const [sort, setSort]                 = useState('wins')
    const [sortOrder, setSortOrder]       = useState<'asc' | 'desc'>('desc')
    const [data, setData]                 = useState<any[]>([])
    const [loading, setLoading]           = useState(false)
    const [tournaments, setTournaments]   = useState<string[]>([])
    const [position, setPosition]         = useState('')
    const [limit, setLimit]               = useState(50)

    // 챔피언 탭
    const [champPlayer, setChampPlayer]         = useState('')
    const [champData, setChampData]             = useState<any[]>([])
    const [champLoading, setChampLoading]       = useState(false)
    const [champSort, setChampSort]             = useState('games')
    const [champOrder, setChampOrder]           = useState<'asc' | 'desc'>('desc')
    const [champViewMode, setChampViewMode]     = useState<'ranking' | 'cards'>('ranking')
    const [champLimit, setChampLimit]           = useState(5)
    const [champNameFilter, setChampNameFilter] = useState('')

    useEffect(() => { setData([]); setPosition('') }, [activeTab])

    // 토너먼트 목록
    useEffect(() => {
        const run = async () => {
            const targetYear = yearMode === 'range' ? yearTo : year
            if (!targetYear) return
            try {
                const res = await fetch(`/api/stats/tournaments?year=${targetYear}`)
                if (!res.ok) return
                let all: string[] = await res.json()
                const div2 = /LCK CL|LCKC|Challengers|NLB|\bCK\b|Academy|LDL|LCSA|CBLOLA|LJLCS|NACL|EU CS|NA CS|LSPL|ASCI|EUM|\bEM\b|BRCC|OCS|TCS|\bLFL\b|\bPRM\b|\bNLC\b|\bEBL\b|\bUL\b|\bLPLOL\b|\bPGN\b|\bHM\b|\bGLL\b|\bLIT\b/i
                all = division === '1' ? all.filter(t => !div2.test(t)) : all.filter(t => div2.test(t))
                setTournaments(all)
                const korean = all.filter(t => /LCK|KeSPA|Korea/i.test(t))
                const summer = korean.find(t => /Summer|Split 2/i.test(t))
                const spring = korean.find(t => /Spring|Split 1/i.test(t))
                setTournament(summer || spring || korean[0] || 'all')
            } catch { /* ignore */ }
        }
        run()
    }, [year, yearTo, yearMode, division])

    // 메인 통계 데이터
    useEffect(() => {
        if (activeTab === 'champion') return
        const run = async () => {
            setLoading(true)
            try {
                const q: Record<string, string> = { type: activeTab, tournament, sort, order: sortOrder, search, division, limit: String(limit) }
                if (yearMode === 'range') { q.yearFrom = yearFrom; q.yearTo = yearTo }
                else                       q.year = year
                if (position && activeTab === 'player') q.position = position
                const res  = await fetch(`/api/stats?${new URLSearchParams(q)}`)
                const json = await res.json()
                setData(Array.isArray(json) ? json : [])
            } catch { setData([]) }
            finally  { setLoading(false) }
        }
        const id = setTimeout(run, 300)
        return () => clearTimeout(id)
    }, [activeTab, year, yearFrom, yearTo, yearMode, tournament, sort, sortOrder, search, division, position, limit])

    // 챔피언 데이터
    const fetchChampions = useCallback(async () => {
        setChampLoading(true)
        try {
            const q: Record<string, string> = { limit: '20' }
            if (champPlayer.trim()) q.player = champPlayer.trim()
            q.tournament = tournament.startsWith('all') ? tournament + '_' + division : 'all_korea_1'
            if (yearMode === 'range') { q.yearFrom = yearFrom; q.yearTo = yearTo }
            else                       q.year = year
            const res  = await fetch(`/api/stats/champions?${new URLSearchParams(q)}`)
            const json = await res.json()
            setChampData(Array.isArray(json) ? json : [])
        } catch { setChampData([]) }
        finally  { setChampLoading(false) }
    }, [champPlayer, year, yearFrom, yearTo, yearMode, tournament, division])

    useEffect(() => {
        if (activeTab === 'champion') fetchChampions()
    }, [activeTab, year, yearFrom, yearTo, yearMode, tournament, division])

    const handleSort = (key: string) => {
        if (sort === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
        else { setSort(key); setSortOrder('desc') }
    }

    const handleChampSort = (key: string) => {
        if (champSort === key) setChampOrder(o => o === 'asc' ? 'desc' : 'asc')
        else { setChampSort(key); setChampOrder('desc') }
    }

    const koreanTournaments        = tournaments.filter(t => /LCK|KeSPA|Korea|NLB/i.test(t))
    const internationalTournaments = tournaments.filter(t => /World|MSI|Rift Rivals|Asian Games|Mid-Season|WLDs/i.test(t))
    const otherTournaments         = tournaments.filter(t => !koreanTournaments.includes(t) && !internationalTournaments.includes(t))

    const thProps = { sort, order: sortOrder, onSort: handleSort }

    return (
        <TooltipProvider delayDuration={400}>
            <div className="container mx-auto p-4 space-y-4">

                {/* ─── 헤더 ── */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">LCK 통계</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {division === '1' ? '1부 리그 (LCK)' : '2부 리그 (CL)'}{' · '}
                            {yearMode === 'range'
                                ? `${yearFrom}–${yearTo}년 통합`
                                : `${year}년${year === '2026' ? ' · 진행 중' : year === '2025' ? ' · 최근 시즌' : ''}`
                            }{' · '}
                            {tournament === 'all' ? '전체 대회'
                                : tournament === 'all_korea' ? '국내 통합'
                                : tournament === 'all_intl' ? '국제 통합'
                                : tournament}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Link href="/info/tournaments">
                            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white text-xs gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-yellow-400" /> 대회 아카이브
                            </Button>
                        </Link>
                        <Link href="/info/records">
                            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white text-xs gap-1.5">
                                <Medal className="w-3.5 h-3.5 text-orange-400" /> 역대 기록
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ─── AI 배너 ── */}
                <Alert className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 py-2.5">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <AlertTitle className="text-purple-300 font-semibold text-sm">AI 분석가에게 물어보세요!</AlertTitle>
                    <AlertDescription className="text-purple-400/80 text-xs">
                        "2025년 T1의 드래곤 제어율은?", "페이커의 챔피언 풀은?" 등 자연어로 질문하면 AI가 상세 분석해드립니다.
                    </AlertDescription>
                </Alert>

                {/* ─── 메인 카드 ── */}
                <Card className="overflow-hidden border-zinc-800">
                    <CardHeader className="pb-3 bg-zinc-900/40 border-b border-zinc-800/60">
                        <div className="flex flex-col gap-3">

                            {/* 탭 + 필터 */}
                            <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="bg-zinc-800/60 h-9">
                                        <TabsTrigger value="team"     className="text-xs px-3">🏟 팀 통계</TabsTrigger>
                                        <TabsTrigger value="player"   className="text-xs px-3">👤 선수 통계</TabsTrigger>
                                        <TabsTrigger value="champion" className="text-xs px-3">⚔️ 챔피언 풀</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <div className="flex flex-wrap gap-2 items-center">
                                    {/* 부 리그 */}
                                    <Select value={division} onValueChange={setDivision}>
                                        <SelectTrigger className="h-8 w-[110px] text-xs bg-zinc-900/60 border-zinc-700"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1부 (LCK)</SelectItem>
                                            <SelectItem value="2">2부 (CL)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* 연도 모드 토글 */}
                                    <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden h-8">
                                        <button onClick={() => setYearMode('single')}
                                            className={cn('flex items-center gap-1 px-3 h-full text-xs transition-colors',
                                                yearMode === 'single' ? 'bg-yellow-500/20 text-yellow-300' : 'text-zinc-500 hover:text-zinc-300')}>
                                            <Calendar className="w-3 h-3" />단일
                                        </button>
                                        <button onClick={() => setYearMode('range')}
                                            className={cn('flex items-center gap-1 px-3 h-full text-xs transition-colors',
                                                yearMode === 'range' ? 'bg-yellow-500/20 text-yellow-300' : 'text-zinc-500 hover:text-zinc-300')}>
                                            <CalendarRange className="w-3 h-3" />기간
                                        </button>
                                    </div>

                                    {/* 연도 선택 */}
                                    {yearMode === 'single' ? (
                                        <Select value={year} onValueChange={setYear}>
                                            <SelectTrigger className="h-8 w-[118px] text-xs bg-zinc-900/60 border-zinc-700"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {YEARS.map(y => (
                                                    <SelectItem key={y} value={y}>
                                                        {y}{y === '2026' ? ' ▶ 진행 중' : y === '2025' ? ' ★ 최근' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <Select value={yearFrom} onValueChange={setYearFrom}>
                                                <SelectTrigger className="h-8 w-[80px] text-xs bg-zinc-900/60 border-zinc-700"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {YEARS.filter(y => y <= yearTo).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <span className="text-zinc-600 text-xs">–</span>
                                            <Select value={yearTo} onValueChange={setYearTo}>
                                                <SelectTrigger className="h-8 w-[80px] text-xs bg-zinc-900/60 border-zinc-700"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {YEARS.filter(y => y >= yearFrom).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* 대회 */}
                                    <Select value={tournament} onValueChange={setTournament}>
                                        <SelectTrigger className="h-8 w-[175px] text-xs bg-zinc-900/60 border-zinc-700"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">전체 통합</SelectItem>
                                            {koreanTournaments.length > 0 && (
                                                <SelectGroup>
                                                    <SelectLabel>🇰🇷 국내 대회</SelectLabel>
                                                    <SelectItem value="all_korea" className="text-blue-400 text-xs font-semibold">국내 통합</SelectItem>
                                                    {koreanTournaments.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                                                </SelectGroup>
                                            )}
                                            {internationalTournaments.length > 0 && (
                                                <SelectGroup>
                                                    <SelectLabel>🌍 국제 대회</SelectLabel>
                                                    <SelectItem value="all_intl" className="text-blue-400 text-xs font-semibold">국제 통합</SelectItem>
                                                    {internationalTournaments.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                                                </SelectGroup>
                                            )}
                                            {otherTournaments.length > 0 && (
                                                <SelectGroup>
                                                    <SelectLabel>기타</SelectLabel>
                                                    <SelectItem value="all_others" className="text-blue-400 text-xs font-semibold">기타 통합</SelectItem>
                                                    {otherTournaments.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                                                </SelectGroup>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {/* 검색 */}
                                    <div className="relative w-[155px]">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                                        <Input
                                            placeholder={activeTab === 'champion' ? '선수명...' : activeTab === 'team' ? '팀명 검색...' : '선수명 검색...'}
                                            value={activeTab === 'champion' ? champPlayer : search}
                                            onChange={e => activeTab === 'champion' ? setChampPlayer(e.target.value) : setSearch(e.target.value)}
                                            onKeyDown={e => activeTab === 'champion' && e.key === 'Enter' && fetchChampions()}
                                            className="h-8 pl-7 text-xs bg-zinc-900/60 border-zinc-700"
                                        />
                                    </div>

                                    {/* 표시 수 */}
                                    {activeTab !== 'champion' && (
                                        <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
                                            <SelectTrigger className="h-8 w-[76px] text-xs bg-zinc-900/60 border-zinc-700"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="20">20개</SelectItem>
                                                <SelectItem value="50">50개</SelectItem>
                                                <SelectItem value="100">100개</SelectItem>
                                                <SelectItem value="200">200개</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>

                            {/* 포지션 필터 (선수 탭 전용) */}
                            {activeTab === 'player' && (
                                <div className="flex gap-1.5 flex-wrap items-center">
                                    <span className="text-[11px] text-zinc-500 mr-0.5">포지션</span>
                                    {POSITIONS.map(pos => {
                                        const isActive = position === pos
                                        const posStyle = pos ? POS_STYLE[pos] : null
                                        return (
                                            <button
                                                key={pos || 'all'}
                                                onClick={() => setPosition(pos)}
                                                className={cn(
                                                    'px-2.5 py-0.5 text-xs rounded border transition-all font-medium',
                                                    isActive
                                                        ? posStyle
                                                            ? posStyle
                                                            : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40'
                                                        : 'text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600'
                                                )}>
                                                {pos || '전체'}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {/* 챔피언 탭 전용 컨트롤 */}
                            {activeTab === 'champion' && !champPlayer.trim() && (
                                <div className="flex gap-2 flex-wrap items-center">
                                    <span className="text-[11px] text-zinc-500">보기</span>
                                    <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden h-7">
                                        <button onClick={() => setChampViewMode('ranking')}
                                            className={cn('flex items-center gap-1 px-2.5 h-full text-xs transition-colors',
                                                champViewMode === 'ranking' ? 'bg-yellow-500/20 text-yellow-300' : 'text-zinc-500 hover:text-zinc-300')}>
                                            📊 랭킹
                                        </button>
                                        <button onClick={() => setChampViewMode('cards')}
                                            className={cn('flex items-center gap-1 px-2.5 h-full text-xs transition-colors',
                                                champViewMode === 'cards' ? 'bg-yellow-500/20 text-yellow-300' : 'text-zinc-500 hover:text-zinc-300')}>
                                            🃏 선수별
                                        </button>
                                    </div>
                                    {champViewMode === 'ranking' && (
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
                                            <Input
                                                placeholder="챔피언 검색..."
                                                value={champNameFilter}
                                                onChange={e => setChampNameFilter(e.target.value)}
                                                className="h-7 pl-6 w-[130px] text-xs bg-zinc-900/60 border-zinc-700"
                                            />
                                        </div>
                                    )}
                                    {champViewMode === 'cards' && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] text-zinc-500">챔피언</span>
                                            <Select value={String(champLimit)} onValueChange={v => setChampLimit(Number(v))}>
                                                <SelectTrigger className="h-7 w-[68px] text-xs bg-zinc-900/60 border-zinc-700"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="3">3개</SelectItem>
                                                    <SelectItem value="5">5개</SelectItem>
                                                    <SelectItem value="8">8개</SelectItem>
                                                    <SelectItem value="10">10개</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {activeTab === 'team' && (
                            <TeamTable    data={data}      loading={loading}      yearMode={yearMode} {...thProps} />
                        )}
                        {activeTab === 'player' && (
                            <PlayerTable  data={data}      loading={loading}      yearMode={yearMode} {...thProps} />
                        )}
                        {activeTab === 'champion' && (
                            <ChampionTable
                                data={champData}
                                loading={champLoading}
                                playerFilter={champPlayer}
                                onSearch={fetchChampions}
                                champSort={champSort}
                                champOrder={champOrder}
                                onChampSort={handleChampSort}
                                champViewMode={champViewMode}
                                champLimit={champLimit}
                                champNameFilter={champNameFilter}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    )
}

// ─── 팀 통계 테이블 ───────────────────────────────────────────────────────────

function TeamTable({ data, loading, yearMode, sort, order, onSort }: {
    data: any[]; loading: boolean; yearMode: string
    sort: string; order: 'asc' | 'desc'; onSort: (k: string) => void
}) {
    const fmtPct = (v: number | null | undefined) => v == null ? '-' : `${(v * 100).toFixed(1)}%`
    const fmtMin = (sec: number | null | undefined) => {
        if (!sec) return '-'
        return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
    }
    const thP = { sort, order, onSort }
    const cols = yearMode === 'range' ? 17 : 16

    return (
        <div className="overflow-x-auto">
            <Table className="text-sm min-w-[1300px]">
                <TableHeader>
                    <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50 border-b border-zinc-800">
                        <TableHead className="w-8 text-center text-zinc-500 text-xs">#</TableHead>
                        <TH col="name"      label="팀명"       {...thP} right={false} className="min-w-[130px]" />
                        {yearMode === 'range' && <TableHead className="text-zinc-500 text-xs">연도</TableHead>}
                        <TH col="wins"      label="승"        {...thP} />
                        <TH col="losses"    label="패"        {...thP} />
                        <TH col="winRate"   label="승률"      {...thP} tip="승리 / 총 경기수" />
                        <TableHead className="text-right text-zinc-500 text-xs">G</TableHead>
                        <TH col="kda"       label="KDA"       {...thP} tip="(킬+어시스트) / 데스" />
                        <TableHead className="text-right text-zinc-400 text-xs">K/G</TableHead>
                        <TableHead className="text-right text-zinc-400 text-xs">D/G</TableHead>
                        <TableHead className="text-right text-zinc-400 text-xs">A/G</TableHead>
                        <TH col="damage"    label="DMG/G"     {...thP} tip="게임당 평균 팀 총 피해량" />
                        <TH col="duration"  label="평균시간"   {...thP} tip="게임 평균 소요 시간 (mm:ss)" className="text-blue-400" />
                        <TH col="blueSide"  label="블루승률"   {...thP} tip="블루 진영에서의 승률" className="text-emerald-400" />
                        <TH col="firstDragon" label="선드래곤" {...thP} tip="퍼스트 드래곤 획득률" className="text-purple-400" />
                        <TH col="firstBaron"  label="선바론"   {...thP} tip="퍼스트 바론 획득률" className="text-orange-400" />
                        <TH col="goldDiff15"  label="골드차@15" {...thP} tip="15분 기준 골드 차이 (양수=우세)" className="text-yellow-500" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? <SkeletonRows cols={cols} />
                        : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={cols} className="text-center py-14">
                                    <div className="flex flex-col items-center gap-2 text-zinc-600">
                                        <Trophy className="w-8 h-8 opacity-30" />
                                        <p className="text-sm">데이터가 없습니다</p>
                                        <p className="text-xs">다른 시즌 또는 대회를 선택해보세요</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.map((item: any, i: number) => {
                            const g = item.games ?? (item.wins + item.losses)
                            const kdaVal = item.totalDeaths > 0
                                ? (item.totalKills + item.totalAssists) / item.totalDeaths
                                : (item.totalKills + item.totalAssists)
                            const blueSideWr = item.blueSideGames > 0 ? item.blueSideWins / item.blueSideGames : null
                            const gd15 = item.avgGoldDiff15
                            const gd15Color = gd15 == null ? 'text-zinc-600' : gd15 > 0 ? 'text-green-400' : gd15 < 0 ? 'text-red-400' : 'text-zinc-400'
                            return (
                                <TableRow key={i} className="hover:bg-zinc-800/25 border-zinc-800/50 transition-colors">
                                    <TableCell className="text-center text-zinc-600 text-xs">{i + 1}</TableCell>
                                    <TableCell className="font-semibold">
                                        <Link href={`/info/team/${encodeURIComponent(item.teamName)}`} className="hover:text-yellow-400 transition-colors">
                                            {item.teamName}
                                        </Link>
                                    </TableCell>
                                    {yearMode === 'range' && <TableCell className="text-zinc-400 text-xs">{item.year}</TableCell>}
                                    <TableCell className="text-right text-green-400 font-bold">{item.wins}</TableCell>
                                    <TableCell className="text-right text-red-400">{item.losses}</TableCell>
                                    <TableCell className="text-right"><WinBar wins={item.wins} games={g} /></TableCell>
                                    <TableCell className="text-right text-zinc-400 text-xs">{g}</TableCell>
                                    <TableCell className="text-right"><KDA value={kdaVal} /></TableCell>
                                    <TableCell className="text-right">{g > 0 ? (item.totalKills   / g).toFixed(1) : '-'}</TableCell>
                                    <TableCell className="text-right text-zinc-400">{g > 0 ? (item.totalDeaths  / g).toFixed(1) : '-'}</TableCell>
                                    <TableCell className="text-right text-zinc-400">{g > 0 ? (item.totalAssists / g).toFixed(1) : '-'}</TableCell>
                                    <TableCell className="text-right">{g > 0 ? Math.round(item.totalDamage / g).toLocaleString() : '-'}</TableCell>
                                    <TableCell className="text-right text-blue-400">{fmtMin(item.avgGameLengthSeconds)}</TableCell>
                                    <TableCell className="text-right text-emerald-400">{fmtPct(blueSideWr)}</TableCell>
                                    <TableCell className="text-right text-purple-400">{fmtPct(item.firstDragonRate)}</TableCell>
                                    <TableCell className="text-right text-orange-400">{fmtPct(item.firstBaronRate)}</TableCell>
                                    <TableCell className={cn('text-right font-mono text-xs', gd15Color)}>
                                        {gd15 == null ? '-' : (gd15 >= 0 ? '+' : '') + gd15.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                </TableBody>
            </Table>
        </div>
    )
}

// ─── 선수 통계 테이블 ─────────────────────────────────────────────────────────

function PlayerTable({ data, loading, yearMode, sort, order, onSort }: {
    data: any[]; loading: boolean; yearMode: string
    sort: string; order: 'asc' | 'desc'; onSort: (k: string) => void
}) {
    const fmtPct = (v: number | null | undefined) => (!v && v !== 0) ? '-' : `${(v * 100).toFixed(1)}%`
    const thP = { sort, order, onSort }
    const cols = yearMode === 'range' ? 18 : 17

    return (
        <div className="overflow-x-auto">
            <Table className="text-sm min-w-[1500px]">
                <TableHeader>
                    <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50 border-b border-zinc-800">
                        <TableHead className="w-8 text-center text-zinc-500 text-xs">#</TableHead>
                        <TH col="name"      label="선수"    {...thP} right={false} className="min-w-[100px]" />
                        <TH col="position"  label="POS"    {...thP} right={false} tip="포지션" />
                        <TH col="team"      label="팀"     {...thP} right={false} className="min-w-[90px]" />
                        {yearMode === 'range' && <TableHead className="text-zinc-500 text-xs">연도</TableHead>}
                        <TableHead className="text-right text-zinc-500 text-xs">G</TableHead>
                        <TableHead className="text-right text-green-400 text-xs">W</TableHead>
                        <TableHead className="text-right text-red-400 text-xs">L</TableHead>
                        <TH col="winRate"   label="승률"   {...thP} tip="승리율" />
                        <TH col="kda"       label="KDA"    {...thP} tip="(킬+어시스트) / 데스" />
                        <TH col="damage"    label="DPM"    {...thP} tip="Damage Per Minute — 분당 피해량" />
                        <TH col="cspm"      label="CSPM"   {...thP} tip="CS Per Minute — 분당 미니언/정글 처치수" className="text-cyan-400" />
                        <TH col="gpm"       label="GPM"    {...thP} tip="Earned Gold Per Minute — 분당 획득 골드" className="text-yellow-300" />
                        <TH col="kp"        label="KP%"    {...thP} tip="Kill Participation — 팀 킬 관여율" className="text-orange-400" />
                        <TH col="dmgShare"  label="DMG%"   {...thP} tip="Damage Share — 팀 내 피해량 비중" className="text-red-400" />
                        <TH col="goldShare" label="GOLD%"  {...thP} tip="Gold Share — 팀 내 골드 비중" className="text-emerald-400" />
                        <TH                 label="시야"   {...thP} tip="Vision Score — 시야 제어 점수" className="text-blue-400" />
                        <TH col="penta"     label="펜타"   {...thP} tip="펜타킬 횟수" className="text-zinc-400" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? <SkeletonRows cols={cols} />
                        : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={cols} className="text-center py-14">
                                    <div className="flex flex-col items-center gap-2 text-zinc-600">
                                        <Trophy className="w-8 h-8 opacity-30" />
                                        <p className="text-sm">데이터가 없습니다</p>
                                        <p className="text-xs">다른 시즌, 대회 또는 포지션을 선택해보세요</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.map((item: any, i: number) => {
                            const g = item.games
                            return (
                                <TableRow key={i} className="hover:bg-zinc-800/25 border-zinc-800/50 transition-colors">
                                    <TableCell className="text-center text-zinc-600 text-xs">{i + 1}</TableCell>
                                    <TableCell className="font-semibold">
                                        <Link href={`/info/player/${encodeURIComponent(item.playerName)}`} className="hover:text-yellow-400 transition-colors">
                                            {item.playerName}
                                        </Link>
                                    </TableCell>
                                    <TableCell><PosBadge pos={item.position} /></TableCell>
                                    <TableCell className="text-zinc-400 text-xs">{item.teamName}</TableCell>
                                    {yearMode === 'range' && <TableCell className="text-zinc-400 text-xs">{item.year}</TableCell>}
                                    <TableCell className="text-right text-zinc-400 text-xs">{g}</TableCell>
                                    <TableCell className="text-right text-green-400">{item.wins}</TableCell>
                                    <TableCell className="text-right text-red-400">{item.losses}</TableCell>
                                    <TableCell className="text-right"><WinBar wins={item.wins} games={g} /></TableCell>
                                    <TableCell className="text-right"><KDA value={item.averageKDA ?? 0} /></TableCell>
                                    <TableCell className="text-right">{Math.round(item.averageDPM || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-cyan-400">{item.avgCSPM ? item.avgCSPM.toFixed(1) : '-'}</TableCell>
                                    <TableCell className="text-right text-yellow-300">{item.avgEarnedGPM ? Math.round(item.avgEarnedGPM) : '-'}</TableCell>
                                    <TableCell className="text-right text-orange-400">{fmtPct(item.avgKillParticipation)}</TableCell>
                                    <TableCell className="text-right text-red-400">{fmtPct(item.avgDamageShare)}</TableCell>
                                    <TableCell className="text-right text-emerald-400">{fmtPct(item.avgGoldShare)}</TableCell>
                                    <TableCell className="text-right text-blue-400">{item.averageVisionScore?.toFixed(1) || '-'}</TableCell>
                                    <TableCell className="text-right text-zinc-400">{item.pentakills || '-'}</TableCell>
                                </TableRow>
                            )
                        })}
                </TableBody>
            </Table>
        </div>
    )
}

// ─── 챔피언 풀 테이블 ─────────────────────────────────────────────────────────

function ChampionTable({
    data, loading, playerFilter, onSearch,
    champSort, champOrder, onChampSort,
    champViewMode, champLimit, champNameFilter,
}: {
    data: any[]; loading: boolean; playerFilter: string; onSearch: () => void
    champSort: string; champOrder: 'asc' | 'desc'; onChampSort: (k: string) => void
    champViewMode: 'ranking' | 'cards'; champLimit: number; champNameFilter: string
}) {
    const isPlayerView = Boolean(playerFilter.trim())
    const fmtPct = (v: number | null | undefined) => (!v && v !== 0) ? '-' : `${(v * 100).toFixed(1)}%`

    const sortRows = useCallback((rows: any[]) => {
        return [...rows].sort((a, b) => {
            const dir = champOrder === 'asc' ? 1 : -1
            const aWr = a.games > 0 ? a.wins / a.games : 0
            const bWr = b.games > 0 ? b.wins / b.games : 0
            switch (champSort) {
                case 'games':    return (b.games - a.games) * dir
                case 'winRate':  return (bWr - aWr) * dir
                case 'kda':      return ((b.avgKDA ?? 0) - (a.avgKDA ?? 0)) * dir
                case 'dpm':      return ((b.avgDPM ?? 0) - (a.avgDPM ?? 0)) * dir
                case 'cspm':     return ((b.avgCSPM ?? 0) - (a.avgCSPM ?? 0)) * dir
                case 'dmgShare': return ((b.avgDmgShare ?? 0) - (a.avgDmgShare ?? 0)) * dir
                case 'champion': return (a.champion ?? '').localeCompare(b.champion ?? '') * dir
                default:         return 0
            }
        })
    }, [champSort, champOrder])

    /** 게임 수에 따른 챔피언 텍스트 색상 (주력/숙련/기타) */
    const champTextCls  = (g: number) => g >= 10 ? 'text-yellow-300 font-bold' : g >= 5 ? 'text-blue-300 font-semibold' : 'text-zinc-300'
    /** 게임 수에 따른 챔피언 뱃지 배경 */
    const champBadgeCls = (g: number) =>
        g >= 10 ? 'bg-yellow-500/10 border-yellow-500/30' :
        g >= 5  ? 'bg-blue-500/10  border-blue-500/30'   :
                  'bg-zinc-800/50  border-zinc-700/50'

    const thP = { sort: champSort, order: champOrder, onSort: onChampSort }

    // ── 로딩 스켈레톤 ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="p-4">
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <Table><TableBody><SkeletonRows cols={isPlayerView ? 8 : 9} rows={10} /></TableBody></Table>
                </div>
            </div>
        )
    }

    // ── 빈 상태 ──────────────────────────────────────────────────────────────
    if (data.length === 0) {
        return (
            <div className="text-center py-16 flex flex-col items-center gap-3 text-zinc-600">
                <span className="text-5xl opacity-30">⚔️</span>
                <p className="text-sm font-medium">
                    {playerFilter ? `'${playerFilter}' 선수 데이터를 찾을 수 없습니다.` : '챔피언 풀 데이터가 없습니다.'}
                </p>
                <p className="text-xs">시즌 또는 대회를 변경해보세요</p>
            </div>
        )
    }

    // ── 선수 상세 뷰 ─────────────────────────────────────────────────────────
    if (isPlayerView) {
        const sorted     = sortRows(data)
        const totalGames = sorted.reduce((s: number, c: any) => s + c.games, 0)
        const mainChamps = sorted.filter((c: any) => c.games >= 10).length
        return (
            <div className="p-4 space-y-3">
                {/* 선수 요약 헤더 */}
                <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center text-base shrink-0">⚔️</div>
                        <div>
                            <p className="text-sm font-bold text-yellow-400">{playerFilter}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-zinc-500">챔피언 풀 <span className="text-zinc-300">{sorted.length}종</span></span>
                                <span className="text-zinc-700">·</span>
                                <span className="text-xs text-zinc-500">총 <span className="text-zinc-300">{totalGames}G</span></span>
                                {mainChamps > 0 && (
                                    <>
                                        <span className="text-zinc-700">·</span>
                                        <span className="text-[10px] text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">주력 {mainChamps}종</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-zinc-700 gap-1.5 shrink-0" onClick={onSearch}>
                        <Search className="w-3 h-3" />다른 선수
                    </Button>
                </div>

                {/* 정렬 가능한 상세 테이블 */}
                <div className="rounded-xl border border-zinc-800 overflow-x-auto">
                    <Table className="text-sm min-w-[720px]">
                        <TableHeader>
                            <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50 border-zinc-800">
                                <TableHead className="w-8 text-center text-zinc-600 text-xs">#</TableHead>
                                <TH col="champion" label="챔피언"  {...thP} right={false} className="min-w-[130px]" />
                                <TH col="games"    label="G"       {...thP} tip="게임 수 (많을수록 주력 챔피언)" />
                                <TH col="winRate"  label="승률"    {...thP} tip="승리율" />
                                <TH col="kda"      label="KDA"     {...thP} tip="평균 (킬+어시스트) / 데스" />
                                <TH col="dpm"      label="DPM"     {...thP} tip="Damage Per Minute — 분당 피해량" />
                                <TH col="cspm"     label="CSPM"    {...thP} tip="CS Per Minute — 분당 CS" className="text-cyan-400" />
                                <TH col="dmgShare" label="DMG%"    {...thP} tip="팀 내 피해량 비중" className="text-orange-400" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sorted.map((c: any, i: number) => (
                                <TableRow key={i} className="hover:bg-zinc-800/25 border-zinc-800/50 transition-colors">
                                    <TableCell className="text-center text-zinc-600 text-xs">{i + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border',
                                                champBadgeCls(c.games), champTextCls(c.games)
                                            )}>{c.champion}</span>
                                            {c.games >= 10 && (
                                                <span className="text-[9px] text-yellow-500 font-bold tracking-wide">주력</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{c.games}</TableCell>
                                    <TableCell className="text-right">{c.games > 0 ? <WinBar wins={c.wins} games={c.games} /> : '-'}</TableCell>
                                    <TableCell className="text-right"><KDA value={c.avgKDA ?? 0} /></TableCell>
                                    <TableCell className="text-right">{c.avgDPM ? Math.round(c.avgDPM).toLocaleString() : '-'}</TableCell>
                                    <TableCell className="text-right text-cyan-400">{c.avgCSPM?.toFixed(1) || '-'}</TableCell>
                                    <TableCell className="text-right text-orange-400">{fmtPct(c.avgDmgShare)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    // ── 랭킹 뷰 (플랫 정렬 테이블, 기본) ────────────────────────────────────
    if (champViewMode === 'ranking') {
        const filtered = champNameFilter.trim()
            ? data.filter(r => r.champion?.toLowerCase().includes(champNameFilter.trim().toLowerCase()))
            : data
        const sorted = sortRows(filtered)

        return (
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-zinc-500">
                        총 <span className="text-zinc-300">{sorted.length}</span>개 챔피언-선수 조합
                    </span>
                    {champNameFilter.trim() && (
                        <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                            &ldquo;{champNameFilter}&rdquo; 필터
                        </span>
                    )}
                </div>
                <div className="rounded-xl border border-zinc-800 overflow-x-auto">
                    <Table className="text-sm min-w-[740px]">
                        <TableHeader>
                            <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50 border-zinc-800">
                                <TableHead className="w-8 text-center text-zinc-600 text-xs">#</TableHead>
                                <TH col="champion" label="챔피언"  {...thP} right={false} className="min-w-[120px]" />
                                <TableHead className="text-xs text-zinc-400">선수</TableHead>
                                <TH col="games"    label="G"       {...thP} tip="게임 수" />
                                <TH col="winRate"  label="승률"    {...thP} tip="승리율" />
                                <TH col="kda"      label="KDA"     {...thP} tip="평균 KDA" />
                                <TH col="dpm"      label="DPM"     {...thP} tip="분당 피해량" />
                                <TH col="cspm"     label="CSPM"    {...thP} tip="분당 CS" className="text-cyan-400" />
                                <TH col="dmgShare" label="DMG%"    {...thP} tip="팀 피해량 비중" className="text-orange-400" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sorted.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-zinc-600 text-sm">
                                        &lsquo;{champNameFilter}&rsquo; 챔피언을 찾을 수 없습니다
                                    </TableCell>
                                </TableRow>
                            ) : sorted.slice(0, 300).map((c: any, i: number) => (
                                <TableRow key={i} className="hover:bg-zinc-800/25 border-zinc-800/50 transition-colors">
                                    <TableCell className="text-center text-zinc-600 text-xs">{i + 1}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border',
                                            champBadgeCls(c.games), champTextCls(c.games)
                                        )}>{c.champion}</span>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        <Link href={`/info/player/${encodeURIComponent(c.playerName)}`} className="text-zinc-300 hover:text-yellow-400 transition-colors">
                                            {c.playerName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{c.games}</TableCell>
                                    <TableCell className="text-right">{c.games > 0 ? <WinBar wins={c.wins} games={c.games} /> : '-'}</TableCell>
                                    <TableCell className="text-right"><KDA value={c.avgKDA ?? 0} /></TableCell>
                                    <TableCell className="text-right">{c.avgDPM ? Math.round(c.avgDPM).toLocaleString() : '-'}</TableCell>
                                    <TableCell className="text-right text-cyan-400">{c.avgCSPM?.toFixed(1) || '-'}</TableCell>
                                    <TableCell className="text-right text-orange-400">{fmtPct(c.avgDmgShare)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    // ── 선수별 카드 뷰 ───────────────────────────────────────────────────────
    const grouped: Record<string, any[]> = {}
    for (const row of data) {
        if (!grouped[row.playerName]) grouped[row.playerName] = []
        grouped[row.playerName].push(row)
    }
    const players = Object.entries(grouped)

    return (
        <div className="p-4 space-y-3">
            <div className="px-1">
                <span className="text-xs text-zinc-500">
                    <span className="text-zinc-300">{players.length}</span>명 선수 · 각 상위 <span className="text-zinc-300">{champLimit}</span>개 챔피언 표시
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {players.map(([playerName, champs]) => {
                    const totalGames = champs.reduce((s: number, c: any) => s + c.games, 0)
                    const display    = champs.slice(0, champLimit)
                    return (
                        <div key={playerName} className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors group">
                            {/* 카드 헤더 */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 bg-zinc-900/70">
                                <Link
                                    href={`/info/player/${encodeURIComponent(playerName)}`}
                                    className="font-semibold text-sm hover:text-yellow-400 transition-colors">
                                    {playerName}
                                </Link>
                                <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full tabular-nums">{totalGames}G</span>
                            </div>
                            {/* 챔피언 리스트 */}
                            <div className="p-2 space-y-0.5">
                                {display.map((c: any) => {
                                    const wr     = c.games > 0 ? (c.wins / c.games) * 100 : 0
                                    const barClr = wr >= 60 ? 'bg-green-400' : wr >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                                    const txtClr = wr >= 60 ? 'text-green-400' : wr >= 50 ? 'text-yellow-400' : 'text-red-400'
                                    const kdaClr = (c.avgKDA ?? 0) >= 5 ? 'text-yellow-300' : (c.avgKDA ?? 0) >= 3 ? 'text-green-400' : 'text-zinc-500'
                                    return (
                                        <div key={c.champion} className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-zinc-800/50 transition-colors">
                                            <span className={cn('text-[11px] min-w-[76px] truncate', champTextCls(c.games))}>
                                                {c.champion}
                                            </span>
                                            <span className="text-[10px] text-zinc-600 w-5 text-right tabular-nums">{c.games}</span>
                                            <div className="flex-1 flex items-center gap-1.5">
                                                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className={cn('h-full rounded-full', barClr)} style={{ width: `${Math.min(wr, 100)}%` }} />
                                                </div>
                                                <span className={cn('text-[10px] w-8 text-right font-medium tabular-nums', txtClr)}>
                                                    {wr.toFixed(0)}%
                                                </span>
                                            </div>
                                            <span className={cn('text-[10px] w-7 text-right tabular-nums', kdaClr)}>
                                                {c.avgKDA?.toFixed(1) ?? '-'}
                                            </span>
                                        </div>
                                    )
                                })}
                                {champs.length > champLimit && (
                                    <p className="text-[10px] text-zinc-600 text-center pt-1 pb-0.5">+{champs.length - champLimit}개 더</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
