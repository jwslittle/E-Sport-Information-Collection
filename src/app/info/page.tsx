
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, Sparkles, CalendarRange, Calendar, Trophy, Medal } from 'lucide-react'

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014']

export default function InfoPage() {
    const [activeTab, setActiveTab] = useState('team')
    const [division, setDivision] = useState('1')
    const [yearMode, setYearMode] = useState<'single' | 'range'>('single')
    const [year, setYear] = useState('2025')
    const [yearFrom, setYearFrom] = useState('2020')
    const [yearTo, setYearTo] = useState('2025')
    const [tournament, setTournament] = useState('all')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('wins')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [tournaments, setTournaments] = useState<string[]>([])

    // 챔피언 탭 상태
    const [champPlayer, setChampPlayer] = useState('')
    const [champData, setChampData] = useState<any[]>([])
    const [champLoading, setChampLoading] = useState(false)

    useEffect(() => { setData([]) }, [activeTab])

    // 토너먼트 목록
    useEffect(() => {
        const fetchTournaments = async () => {
            const targetYear = yearMode === 'range' ? yearTo : year
            if (!targetYear) return
            try {
                const res = await fetch(`/api/stats/tournaments?year=${targetYear}`)
                if (res.ok) {
                    let all: string[] = await res.json()
                    const div2Regex = /LCK CL|LCKC|Challengers|NLB|\bCK\b|Academy|LDL|LCSA|CBLOLA|LJLCS|NACL|EU CS|NA CS|LSPL|ASCI|EUM|\bEM\b|BRCC|OCS|TCS|\bLFL\b|\bPRM\b|\bNLC\b|\bEBL\b|\bUL\b|\bLPLOL\b|\bPGN\b|\bHM\b|\bGLL\b|\bLIT\b/i
                    if (division === '1') all = all.filter(t => !div2Regex.test(t))
                    else                 all = all.filter(t =>  div2Regex.test(t))
                    setTournaments(all)
                    const korean = all.filter(t => /LCK|KeSPA|Korea/i.test(t))
                    const summer = korean.find(t => /Summer|Split 2/i.test(t))
                    const spring = korean.find(t => /Spring|Split 1/i.test(t))
                    setTournament(summer || spring || korean[0] || 'all')
                }
            } catch { /* ignore */ }
        }
        fetchTournaments()
    }, [year, yearTo, yearMode, division])

    // 메인 통계 데이터
    useEffect(() => {
        if (activeTab === 'champion') return
        const fetchData = async () => {
            setLoading(true)
            try {
                const q: Record<string, string> = { type: activeTab, tournament, sort, order: sortOrder, search, division }
                if (yearMode === 'range') { q.yearFrom = yearFrom; q.yearTo = yearTo }
                else                       q.year = year
                const res  = await fetch(`/api/stats?${new URLSearchParams(q)}`)
                const json = await res.json()
                setData(Array.isArray(json) ? json : [])
            } catch { setData([]) }
            finally  { setLoading(false) }
        }
        const id = setTimeout(fetchData, 300)
        return () => clearTimeout(id)
    }, [activeTab, year, yearFrom, yearTo, yearMode, tournament, sort, sortOrder, search, division])

    // 챔피언 데이터
    const fetchChampions = useCallback(async () => {
        setChampLoading(true)
        try {
            const q: Record<string, string> = { limit: '20' }
            if (champPlayer.trim()) q.player = champPlayer.trim()
            const catKey = tournament.startsWith('all') ? tournament + '_' + division : 'all_korea_1'
            q.tournament = catKey
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
    const sortArrow = (key: string) => sort === key ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''

    const koreanTournaments        = tournaments.filter(t => /LCK|KeSPA|Korea|NLB/i.test(t))
    const internationalTournaments = tournaments.filter(t => /World|MSI|Rift Rivals|Asian Games|Mid-Season|WLDs/i.test(t))
    const otherTournaments         = tournaments.filter(t => !koreanTournaments.includes(t) && !internationalTournaments.includes(t))

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* 헤더 */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h1 className="text-3xl font-bold">정보 (Information)</h1>
                    <div className="flex gap-2">
                        <Link href="/info/tournaments">
                            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white text-xs gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-yellow-400" /> 대회 아카이브
                            </Button>
                        </Link>
                        <Link href="/info/records">
                            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white text-xs gap-1.5">
                                <Medal className="w-3.5 h-3.5 text-orange-400" /> 역대 기록
                            </Button>
                        </Link>
                    </div>
                </div>
                <p className="text-muted-foreground text-sm">
                    {division === '1' ? '1부 리그 (LCK/Intl)' : '2부 리그 (CL/Challengers)'}{' · '}
                    {yearMode === 'range' ? `${yearFrom}~${yearTo} 통합` : `${year}${year === '2026' ? ' (진행 중)' : year === '2025' ? ' (최근)' : ''} 시즌`}{' · '}
                    {tournament === 'all' ? '전체 통합' : tournament === 'all_korea' ? '국내 통합' : tournament === 'all_intl' ? '국제 통합' : tournament}
                </p>
            </div>

            <Alert className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <AlertTitle className="text-purple-700 font-bold">AI 분석가에게 물어보세요!</AlertTitle>
                <AlertDescription className="text-purple-600">
                    "2025년 T1의 드래곤 제어율은?", "페이커의 챔피언 풀은?" 등 고급 통계에 대해 AI가 상세 분석해드립니다.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        {/* 탭 */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="team">팀 기록</TabsTrigger>
                                <TabsTrigger value="player">선수 기록</TabsTrigger>
                                <TabsTrigger value="champion">챔피언 풀</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* 필터 컨트롤 */}
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <Select value={division} onValueChange={setDivision}>
                                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1부 (Tier 1)</SelectItem>
                                    <SelectItem value="2">2부 (Tier 2)</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* 연도 모드 */}
                            <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden">
                                <button onClick={() => setYearMode('single')}
                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs transition-colors ${yearMode === 'single' ? 'bg-yellow-500/20 text-yellow-300' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                    <Calendar className="w-3 h-3" />단일
                                </button>
                                <button onClick={() => setYearMode('range')}
                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs transition-colors ${yearMode === 'range' ? 'bg-yellow-500/20 text-yellow-300' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                    <CalendarRange className="w-3 h-3" />기간
                                </button>
                            </div>

                            {yearMode === 'single' ? (
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map(y => (
                                            <SelectItem key={y} value={y}>
                                                {y}{y === '2026' ? ' ▶ 진행 중' : y === '2025' ? ' (최근)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <Select value={yearFrom} onValueChange={setYearFrom}>
                                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {YEARS.filter(y => y <= yearTo).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-zinc-500 text-sm">~</span>
                                    <Select value={yearTo} onValueChange={setYearTo}>
                                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {YEARS.filter(y => y >= yearFrom).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Select value={tournament} onValueChange={setTournament}>
                                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 통합 (All)</SelectItem>
                                    {koreanTournaments.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>국내 대회 (Korea)</SelectLabel>
                                            <SelectItem value="all_korea" className="font-semibold text-blue-400">국내 통합</SelectItem>
                                            {koreanTournaments.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                    {internationalTournaments.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>국제 대회 (International)</SelectLabel>
                                            <SelectItem value="all_intl" className="font-semibold text-blue-400">국제 통합</SelectItem>
                                            {internationalTournaments.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                    {otherTournaments.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>기타 (Others)</SelectLabel>
                                            <SelectItem value="all_others" className="font-semibold text-blue-400">기타 통합</SelectItem>
                                            {otherTournaments.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>

                            {activeTab !== 'champion' ? (
                                <div className="relative w-full md:w-[180px]">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
                                </div>
                            ) : (
                                <div className="relative w-full md:w-[180px]">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="선수명..."
                                        value={champPlayer}
                                        onChange={e => setChampPlayer(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && fetchChampions()}
                                        className="pl-8"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {activeTab === 'team' && (
                        <TeamTable data={data} loading={loading} yearMode={yearMode}
                            sort={sort} sortOrder={sortOrder} handleSort={handleSort} sortArrow={sortArrow} />
                    )}
                    {activeTab === 'player' && (
                        <PlayerTable data={data} loading={loading} yearMode={yearMode}
                            sort={sort} sortOrder={sortOrder} handleSort={handleSort} sortArrow={sortArrow} />
                    )}
                    {activeTab === 'champion' && (
                        <ChampionTable data={champData} loading={champLoading}
                            playerFilter={champPlayer} onSearch={fetchChampions} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ── 팀 통계 테이블 ──────────────────────────────────────────────────────────────

function TeamTable({ data, loading, yearMode, sort, sortOrder, handleSort, sortArrow }: {
    data: any[]; loading: boolean; yearMode: string;
    sort: string; sortOrder: string; handleSort: (k: string) => void; sortArrow: (k: string) => string
}) {
    const fmtPct = (v: number | null | undefined) =>
        v == null ? '-' : `${(v * 100).toFixed(1)}%`
    const fmtMin = (sec: number | null | undefined) => {
        if (!sec) return '-'
        return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
    }
    const gd15Color = (v: number | null | undefined) =>
        v == null ? 'text-zinc-600' : v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-zinc-400'

    if (loading) return <div className="text-center py-10 text-zinc-500">로딩 중...</div>
    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="text-sm min-w-[1300px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8 text-center">#</TableHead>
                        <TableHead className="cursor-pointer hover:text-yellow-400 min-w-[130px]" onClick={() => handleSort('name')}>팀명{sortArrow('name')}</TableHead>
                        {yearMode === 'range' && <TableHead className="text-zinc-500 text-xs">연도</TableHead>}
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('wins')}>승{sortArrow('wins')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('losses')}>패{sortArrow('losses')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('winRate')}>승률{sortArrow('winRate')}</TableHead>
                        <TableHead className="text-right text-zinc-400">G</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('kda')}>KDA{sortArrow('kda')}</TableHead>
                        <TableHead className="text-right">K/G</TableHead>
                        <TableHead className="text-right text-zinc-400">D/G</TableHead>
                        <TableHead className="text-right text-zinc-400">A/G</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('damage')}>DMG/G{sortArrow('damage')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-blue-400" onClick={() => handleSort('duration')}>평균시간{sortArrow('duration')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-emerald-400" onClick={() => handleSort('blueSide')}>블루승률{sortArrow('blueSide')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-purple-400" onClick={() => handleSort('firstDragon')}>선드래곤{sortArrow('firstDragon')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-orange-400" onClick={() => handleSort('firstBaron')}>선바론{sortArrow('firstBaron')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-yellow-500" onClick={() => handleSort('goldDiff15')}>골드차@15{sortArrow('goldDiff15')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow><TableCell colSpan={17} className="text-center py-10 text-zinc-500">데이터가 없습니다.</TableCell></TableRow>
                    ) : data.map((item: any, i: number) => {
                        const g = item.games ?? (item.wins + item.losses)
                        const kda = item.totalDeaths > 0
                            ? ((item.totalKills + item.totalAssists) / item.totalDeaths).toFixed(2)
                            : String(item.totalKills + item.totalAssists)
                        const blueSideWr = item.blueSideGames > 0 ? item.blueSideWins / item.blueSideGames : null
                        const gd15 = item.avgGoldDiff15
                        return (
                            <TableRow key={i} className="hover:bg-zinc-800/30">
                                <TableCell className="text-center text-zinc-500">{i + 1}</TableCell>
                                <TableCell className="font-semibold">
                                    <Link href={`/info/team/${encodeURIComponent(item.teamName)}`} className="hover:text-yellow-400 transition-colors">{item.teamName}</Link>
                                </TableCell>
                                {yearMode === 'range' && <TableCell className="text-zinc-400 text-xs">{item.year}</TableCell>}
                                <TableCell className="text-right text-green-400 font-bold">{item.wins}</TableCell>
                                <TableCell className="text-right text-red-400">{item.losses}</TableCell>
                                <TableCell className="text-right font-semibold">{g > 0 ? ((item.wins / g) * 100).toFixed(1) + '%' : '-'}</TableCell>
                                <TableCell className="text-right text-zinc-400">{g}</TableCell>
                                <TableCell className="text-right text-yellow-400 font-bold">{kda}</TableCell>
                                <TableCell className="text-right">{g > 0 ? (item.totalKills / g).toFixed(1) : '-'}</TableCell>
                                <TableCell className="text-right text-zinc-400">{g > 0 ? (item.totalDeaths / g).toFixed(1) : '-'}</TableCell>
                                <TableCell className="text-right text-zinc-400">{g > 0 ? (item.totalAssists / g).toFixed(1) : '-'}</TableCell>
                                <TableCell className="text-right">{g > 0 ? Math.round(item.totalDamage / g).toLocaleString() : '-'}</TableCell>
                                <TableCell className="text-right text-blue-400">{fmtMin(item.avgGameLengthSeconds)}</TableCell>
                                <TableCell className="text-right text-emerald-400">{fmtPct(blueSideWr)}</TableCell>
                                <TableCell className="text-right text-purple-400">{fmtPct(item.firstDragonRate)}</TableCell>
                                <TableCell className="text-right text-orange-400">{fmtPct(item.firstBaronRate)}</TableCell>
                                <TableCell className={`text-right font-mono text-xs ${gd15Color(gd15)}`}>
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

// ── 선수 통계 테이블 ─────────────────────────────────────────────────────────────

function PlayerTable({ data, loading, yearMode, sort, sortOrder, handleSort, sortArrow }: {
    data: any[]; loading: boolean; yearMode: string;
    sort: string; sortOrder: string; handleSort: (k: string) => void; sortArrow: (k: string) => string
}) {
    const fmtPct = (v: number | null | undefined) =>
        (!v && v !== 0) ? '-' : `${(v * 100).toFixed(1)}%`

    if (loading) return <div className="text-center py-10 text-zinc-500">로딩 중...</div>
    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="text-sm min-w-[1500px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8 text-center">#</TableHead>
                        <TableHead className="cursor-pointer hover:text-yellow-400 min-w-[100px]" onClick={() => handleSort('name')}>선수{sortArrow('name')}</TableHead>
                        <TableHead className="cursor-pointer hover:text-yellow-400" onClick={() => handleSort('position')}>POS{sortArrow('position')}</TableHead>
                        <TableHead className="cursor-pointer hover:text-yellow-400 min-w-[100px]" onClick={() => handleSort('team')}>팀{sortArrow('team')}</TableHead>
                        {yearMode === 'range' && <TableHead className="text-zinc-500 text-xs">연도</TableHead>}
                        <TableHead className="text-right">G</TableHead>
                        <TableHead className="text-right text-green-400">W</TableHead>
                        <TableHead className="text-right text-red-400">L</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('winRate')}>승률{sortArrow('winRate')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('kda')}>KDA{sortArrow('kda')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('damage')}>DPM{sortArrow('damage')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-cyan-400" onClick={() => handleSort('cspm')}>CSPM{sortArrow('cspm')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-yellow-300" onClick={() => handleSort('gpm')}>GPM{sortArrow('gpm')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-orange-400" onClick={() => handleSort('kp')}>KP%{sortArrow('kp')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-red-400" onClick={() => handleSort('dmgShare')}>DMG%{sortArrow('dmgShare')}</TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-yellow-400 text-emerald-400" onClick={() => handleSort('goldShare')}>GOLD%{sortArrow('goldShare')}</TableHead>
                        <TableHead className="text-right text-blue-400">시야</TableHead>
                        <TableHead className="text-right text-zinc-400 cursor-pointer hover:text-yellow-400" onClick={() => handleSort('penta')}>펜타{sortArrow('penta')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow><TableCell colSpan={18} className="text-center py-10 text-zinc-500">데이터가 없습니다.</TableCell></TableRow>
                    ) : data.map((item: any, i: number) => {
                        const g  = item.games
                        const wr = g > 0 ? ((item.wins / g) * 100).toFixed(0) + '%' : '-'
                        return (
                            <TableRow key={i} className="hover:bg-zinc-800/30">
                                <TableCell className="text-center text-zinc-500">{i + 1}</TableCell>
                                <TableCell className="font-semibold">
                                    <Link href={`/info/player/${encodeURIComponent(item.playerName)}`} className="hover:text-yellow-400 transition-colors">{item.playerName}</Link>
                                </TableCell>
                                <TableCell><Badge variant="outline" className="text-[10px] py-0">{item.position}</Badge></TableCell>
                                <TableCell className="text-zinc-400 text-xs">{item.teamName}</TableCell>
                                {yearMode === 'range' && <TableCell className="text-zinc-400 text-xs">{item.year}</TableCell>}
                                <TableCell className="text-right">{g}</TableCell>
                                <TableCell className="text-right text-green-400">{item.wins}</TableCell>
                                <TableCell className="text-right text-red-400">{item.losses}</TableCell>
                                <TableCell className="text-right">{wr}</TableCell>
                                <TableCell className="text-right text-yellow-400 font-bold">{item.averageKDA?.toFixed(2) || '0.00'}</TableCell>
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

// ── 챔피언 풀 테이블 ─────────────────────────────────────────────────────────────

function ChampionTable({ data, loading, playerFilter, onSearch }: {
    data: any[]; loading: boolean; playerFilter: string; onSearch: () => void
}) {
    const isPlayerView = Boolean(playerFilter.trim())
    const fmtPct = (v: number | null | undefined) =>
        (!v && v !== 0) ? '-' : `${(v * 100).toFixed(1)}%`

    // 전체 뷰: 선수별 그룹핑
    const grouped: Record<string, any[]> = {}
    if (!isPlayerView) {
        for (const row of data) {
            if (!grouped[row.playerName]) grouped[row.playerName] = []
            grouped[row.playerName].push(row)
        }
    }

    if (loading) return <div className="text-center py-10 text-zinc-500">로딩 중...</div>

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 py-2.5">
                <p className="text-xs text-zinc-400 flex-1">
                    {isPlayerView
                        ? <>선수 <span className="text-yellow-400 font-bold">{playerFilter}</span>의 챔피언 풀 | 좌측 검색창에서 다른 선수 검색</>
                        : '선수명 검색창에 이름을 입력해 특정 선수의 챔피언 풀을 확인하거나, 아래에서 전체 목록을 확인할 수 있습니다.'}
                </p>
                {isPlayerView && (
                    <Button size="sm" variant="outline" className="text-xs h-7 border-zinc-700" onClick={onSearch}>다시 검색</Button>
                )}
            </div>

            {data.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                    {playerFilter ? `'${playerFilter}' 선수 데이터를 찾을 수 없습니다.` : '데이터가 없습니다.'}
                </div>
            ) : isPlayerView ? (
                <div className="rounded-md border overflow-x-auto">
                    <Table className="text-sm min-w-[640px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8">#</TableHead>
                                <TableHead>챔피언</TableHead>
                                <TableHead className="text-right">게임</TableHead>
                                <TableHead className="text-right text-green-400">승</TableHead>
                                <TableHead className="text-right text-red-400">패</TableHead>
                                <TableHead className="text-right font-bold">승률</TableHead>
                                <TableHead className="text-right text-yellow-400">KDA</TableHead>
                                <TableHead className="text-right text-red-400">DPM</TableHead>
                                <TableHead className="text-right text-cyan-400">CSPM</TableHead>
                                <TableHead className="text-right text-orange-400">DMG%</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((c: any, i: number) => (
                                <TableRow key={i} className="hover:bg-zinc-800/30">
                                    <TableCell className="text-zinc-500">{i + 1}</TableCell>
                                    <TableCell className="font-semibold text-yellow-300">{c.champion}</TableCell>
                                    <TableCell className="text-right">{c.games}</TableCell>
                                    <TableCell className="text-right text-green-400">{c.wins}</TableCell>
                                    <TableCell className="text-right text-red-400">{c.losses}</TableCell>
                                    <TableCell className="text-right font-bold">{c.games > 0 ? ((c.wins / c.games) * 100).toFixed(1) + '%' : '-'}</TableCell>
                                    <TableCell className="text-right text-yellow-400 font-bold">{c.avgKDA?.toFixed(2) || '-'}</TableCell>
                                    <TableCell className="text-right">{c.avgDPM ? Math.round(c.avgDPM).toLocaleString() : '-'}</TableCell>
                                    <TableCell className="text-right text-cyan-400">{c.avgCSPM?.toFixed(1) || '-'}</TableCell>
                                    <TableCell className="text-right text-orange-400">{fmtPct(c.avgDmgShare)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="rounded-md border overflow-x-auto">
                    <Table className="text-sm min-w-[700px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[100px]">선수</TableHead>
                                <TableHead>챔피언 풀 (상위 5개)</TableHead>
                                <TableHead className="text-right text-zinc-400">총 게임</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(grouped).slice(0, 60).map(([playerName, champs]: [string, any[]]) => (
                                <TableRow key={playerName} className="hover:bg-zinc-800/30">
                                    <TableCell className="font-semibold">
                                        <Link href={`/info/player/${encodeURIComponent(playerName)}`} className="hover:text-yellow-400">{playerName}</Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {champs.slice(0, 5).map((c: any) => (
                                                <span key={c.champion} className="text-[11px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full text-zinc-300">
                                                    {c.champion} <span className="text-zinc-500">{c.games}G</span>
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-zinc-500">
                                        {champs.reduce((s: number, c: any) => s + c.games, 0)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
