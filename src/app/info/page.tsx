
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    const [division, setDivision] = useState('1') // '1' (1st Div), '2' (2nd Div)

    // ── 연도 모드: single(단일) or range(기간 선택) ──────────────────────
    const [yearMode, setYearMode] = useState<'single' | 'range'>('single')
    const [year, setYear] = useState('2025') // Default to 2025 (Last Year)
    const [yearFrom, setYearFrom] = useState('2020')
    const [yearTo, setYearTo] = useState('2025')

    const [tournament, setTournament] = useState('all')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('wins')
    const [sortOrder, setSortOrder] = useState('desc')
    const [data, setData] = useState<any[]>([])

    // Clear data when tab changes to prevent type mismatch errors
    useEffect(() => {
        setData([])
    }, [activeTab])
    const [loading, setLoading] = useState(false)

    const [tournaments, setTournaments] = useState<string[]>([])

    // Fetch tournaments when year changes
    useEffect(() => {
        const fetchTournaments = async () => {
            // 범위 모드일 때는 yearTo 기준으로 토너먼트 로드
            const targetYear = yearMode === 'range' ? yearTo : year
            if (!targetYear) return
            try {
                const res = await fetch(`/api/stats/tournaments?year=${targetYear}`)
                if (res.ok) {
                    let allTournaments = await res.json()

                    // Filter by Division
                    // Comprehensive regex matching the API logic
                    const div2Regex = /LCK CL|LCKC|Challengers|NLB|\bCK\b|Academy|LDL|LCSA|CBLOLA|LJLCS|NACL|EU CS|NA CS|LSPL|ASCI|EUM|\bEM\b|BRCC|OCS|TCS|\bLFL\b|\bPRM\b|\bNLC\b|\bEBL\b|\bUL\b|\bLPLOL\b|\bPGN\b|\bHM\b|\bGLL\b|\bLIT\b/i

                    if (division === '1') {
                        allTournaments = allTournaments.filter((t: string) => !div2Regex.test(t))
                    } else {
                        allTournaments = allTournaments.filter((t: string) => div2Regex.test(t))
                    }

                    setTournaments(allTournaments)

                    // Default to a Korean tournament if available
                    // Prioritize: LCK Summer > LCK Spring > Korea Regional > KeSPA
                    const korean = allTournaments.filter((t: string) => t.toUpperCase().includes('LCK') || t.toUpperCase().includes('KESPA') || t.toUpperCase().includes('KOREA'))
                    const lckSummer = korean.find((t: string) => t.toUpperCase().includes('SUMMER'))
                    const lckSpring = korean.find((t: string) => t.toUpperCase().includes('SPRING'))

                    const defaultTournament = lckSummer || lckSpring || korean[0] || 'all'

                    // Force set to default tournament when year or division changes
                    setTournament(defaultTournament)
                }
            } catch (error) {
                console.error("Failed to fetch tournaments", error)
            }
        }
        fetchTournaments()
    }, [year, yearTo, yearMode, division])

    // Fetch data when filters change
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const queryObj: Record<string, string> = {
                    type: activeTab,
                    tournament,
                    sort,
                    order: sortOrder,
                    search,
                    division,
                }
                if (yearMode === 'range') {
                    queryObj.yearFrom = yearFrom
                    queryObj.yearTo = yearTo
                } else {
                    queryObj.year = year
                }
                const query = new URLSearchParams(queryObj)
                const res = await fetch(`/api/stats?${query}`)
                const json = await res.json()
                if (Array.isArray(json)) {
                    setData(json)
                } else {
                    console.error("Invalid data format:", json)
                    setData([])
                }
            } catch (error) {
                console.error("Failed to fetch stats", error)
                setData([])
            } finally {
                setLoading(false)
            }
        }

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchData()
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [activeTab, year, yearFrom, yearTo, yearMode, tournament, sort, sortOrder, search, division])

    const handleSort = (key: string) => {
        if (sort === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSort(key)
            setSortOrder('desc') // Default to desc for new key
        }
    }

    // Group Tournaments
    const koreanTournaments = tournaments.filter(t => /LCK|KeSPA|Korea|NLB/i.test(t))
    const internationalTournaments = tournaments.filter(t => /World|MSI|Rift Rivals|Asian Games|Mid-Season|WLDs/i.test(t))
    const otherTournaments = tournaments.filter(t => !koreanTournaments.includes(t) && !internationalTournaments.includes(t))

    return (
        <div className="container mx-auto p-4 space-y-6">
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
                <p className="text-muted-foreground">
                    {division === '1' ? '1부 리그 (LCK/Intl)' : '2부 리그 (CL/Challengers)'}
                    {' - '}
                    {yearMode === 'range'
                        ? `${yearFrom} ~ ${yearTo} 시즌 (기간 통합)`
                        : year === '2026' ? '2026 시즌 (진행 중 · 실시간)'
                        : year === '2025' ? '2025 시즌 (최근 시즌)'
                        : `${year} 시즌 (과거 기록)`}
                    {' - '}
                    {tournament === 'all' ? '전체 대회 통합' :
                        tournament === 'all_korea' ? '국내 대회 통합' :
                            tournament === 'all_intl' ? '국제 대회 통합' :
                                tournament === 'all_others' ? '기타 대회 통합' : tournament}
                </p>
            </div>

            <Alert className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <AlertTitle className="text-purple-700 font-bold">AI 분석가에게 물어보세요!</AlertTitle>
                <AlertDescription className="text-purple-600">
                    "2025년 T1의 시야 점수는?", "페이커의 15분 골드 차이는?" 등 고급 통계에 대해 질문하면 AI가 상세하게 분석해드립니다.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="team">팀 기록</TabsTrigger>
                                <TabsTrigger value="player">선수 기록</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <Select value={division} onValueChange={setDivision}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Division" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1부 리그 (Tier 1)</SelectItem>
                                    <SelectItem value="2">2부 리그 (Tier 2)</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* 연도 모드 토글 */}
                            <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setYearMode('single')}
                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs transition-colors ${yearMode === 'single' ? 'bg-yellow-500/20 text-yellow-300' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <Calendar className="w-3 h-3" />단일
                                </button>
                                <button
                                    onClick={() => setYearMode('range')}
                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs transition-colors ${yearMode === 'range' ? 'bg-yellow-500/20 text-yellow-300' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <CalendarRange className="w-3 h-3" />기간
                                </button>
                            </div>

                            {/* 단일 연도 선택 */}
                            {yearMode === 'single' && (
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map(y => (
                                            <SelectItem key={y} value={y}>
                                                {y}{y === '2026' ? ' ▶ 진행 중' : y === '2025' ? ' (최근)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* 기간 선택 */}
                            {yearMode === 'range' && (
                                <div className="flex items-center gap-1">
                                    <Select value={yearFrom} onValueChange={setYearFrom}>
                                        <SelectTrigger className="w-[90px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEARS.filter(y => y <= yearTo).map(y => (
                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-zinc-500 text-sm">~</span>
                                    <Select value={yearTo} onValueChange={setYearTo}>
                                        <SelectTrigger className="w-[90px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEARS.filter(y => y >= yearFrom).map(y => (
                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Select value={tournament} onValueChange={setTournament}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Tournament" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 통합 (All Integrated)</SelectItem>

                                    {koreanTournaments.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>국내 대회 (Korea)</SelectLabel>
                                            <SelectItem value="all_korea" className="font-semibold text-blue-400">국내 대회 통합 (Korea All)</SelectItem>
                                            {koreanTournaments.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}

                                    {internationalTournaments.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>국제 대회 (International)</SelectLabel>
                                            <SelectItem value="all_intl" className="font-semibold text-blue-400">국제 대회 통합 (Intl All)</SelectItem>
                                            {internationalTournaments.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}

                                    {otherTournaments.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>기타 (Others)</SelectLabel>
                                            <SelectItem value="all_others" className="font-semibold text-blue-400">기타 대회 통합 (Others All)</SelectItem>
                                            {otherTournaments.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>

                            <div className="relative w-full md:w-[200px]">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="검색..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                          {activeTab === 'team' ? (
                            <Table className="text-sm min-w-[900px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10 text-center">#</TableHead>
                                        <TableHead className="cursor-pointer hover:text-yellow-400 min-w-[140px]" onClick={() => handleSort('name')}>팀명{sort==='name'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        {yearMode === 'range' && <TableHead className="text-zinc-500 text-xs">연도</TableHead>}
                                        {yearMode === 'range' && <TableHead className="text-zinc-500 text-xs min-w-[100px]">대회</TableHead>}
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('wins')}>승{sort==='wins'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('losses')}>패{sort==='losses'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('winRate')}>승률{sort==='winRate'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="text-right text-zinc-400">게임</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('kda')}>KDA{sort==='kda'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="text-right">K/G</TableHead>
                                        <TableHead className="text-right text-zinc-400">D/G</TableHead>
                                        <TableHead className="text-right text-zinc-400">A/G</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('damage')}>DMG/G{sort==='damage'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="text-right text-zinc-500">총 킬</TableHead>
                                        <TableHead className="text-right text-zinc-500">총 DMG</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.length === 0 ? (
                                        <TableRow><TableCell colSpan={15} className="text-center py-10 text-zinc-500">데이터가 없습니다.</TableCell></TableRow>
                                    ) : data.map((item, index) => {
                                        const g = item.games ?? (item.wins + item.losses)
                                        const kda = item.totalDeaths > 0
                                            ? ((item.totalKills + item.totalAssists) / item.totalDeaths).toFixed(2)
                                            : (item.totalKills + item.totalAssists).toString()
                                        return (
                                            <TableRow key={index} className="hover:bg-zinc-800/30">
                                                <TableCell className="text-center text-zinc-500">{index+1}</TableCell>
                                                <TableCell className="font-semibold">
                                                    <Link href={`/info/team/${encodeURIComponent(item.teamName)}`} className="hover:text-yellow-400 transition-colors">{item.teamName}</Link>
                                                </TableCell>
                                                {yearMode==='range'&&<TableCell className="text-zinc-400 text-xs">{item.year}</TableCell>}
                                                {yearMode==='range'&&<TableCell className="text-zinc-500 text-xs max-w-[120px] truncate">{item.tournament}</TableCell>}
                                                <TableCell className="text-right text-green-400 font-bold">{item.wins}</TableCell>
                                                <TableCell className="text-right text-red-400">{item.losses}</TableCell>
                                                <TableCell className="text-right font-semibold">{g>0?((item.wins/g)*100).toFixed(1)+'%':'-'}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{g}</TableCell>
                                                <TableCell className="text-right text-yellow-400 font-bold">{kda}</TableCell>
                                                <TableCell className="text-right">{g>0?(item.totalKills/g).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{g>0?(item.totalDeaths/g).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{g>0?(item.totalAssists/g).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right">{g>0?Math.round(item.totalDamage/g).toLocaleString():'-'}</TableCell>
                                                <TableCell className="text-right text-zinc-500">{item.totalKills?.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-zinc-500">{((item.totalDamage??0)/1000).toFixed(0)}k</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                          ) : (
                            <Table className="text-sm min-w-[1100px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10 text-center">#</TableHead>
                                        <TableHead className="cursor-pointer hover:text-yellow-400 min-w-[100px]" onClick={() => handleSort('name')}>선수명{sort==='name'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="cursor-pointer hover:text-yellow-400" onClick={() => handleSort('position')}>포지션{sort==='position'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="cursor-pointer hover:text-yellow-400 min-w-[120px]" onClick={() => handleSort('team')}>소속팀{sort==='team'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        {yearMode === 'range' && <TableHead className="text-zinc-500 text-xs">연도</TableHead>}
                                        <TableHead className="text-right">경기</TableHead>
                                        <TableHead className="text-right text-green-400">승</TableHead>
                                        <TableHead className="text-right text-red-400">패</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('winRate')}>승률{sort==='winRate'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('kda')}>KDA{sort==='kda'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="text-right">K/G</TableHead>
                                        <TableHead className="text-right text-zinc-400">D/G</TableHead>
                                        <TableHead className="text-right text-zinc-400">A/G</TableHead>
                                        <TableHead className="text-right">K+A/G</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('damage')}>DPM{sort==='damage'&&(sortOrder==='asc'?' ↑':' ↓')}</TableHead>
                                        <TableHead className="text-right text-blue-400">시야</TableHead>
                                        <TableHead className="text-right text-zinc-500">총킬</TableHead>
                                        <TableHead className="text-right text-zinc-500">총데스</TableHead>
                                        <TableHead className="text-right text-zinc-500">총어시</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.length === 0 ? (
                                        <TableRow><TableCell colSpan={19} className="text-center py-10 text-zinc-500">데이터가 없습니다.</TableCell></TableRow>
                                    ) : data.map((item, index) => {
                                        const g = item.games
                                        const wr = g > 0 ? ((item.wins/g)*100).toFixed(0)+'%' : '-'
                                        return (
                                            <TableRow key={index} className="hover:bg-zinc-800/30">
                                                <TableCell className="text-center text-zinc-500">{index+1}</TableCell>
                                                <TableCell className="font-semibold">
                                                    <Link href={`/info/player/${encodeURIComponent(item.playerName)}`} className="hover:text-yellow-400 transition-colors">{item.playerName}</Link>
                                                </TableCell>
                                                <TableCell><Badge variant="outline" className="text-[10px] py-0">{item.position}</Badge></TableCell>
                                                <TableCell className="text-zinc-400 text-xs">{item.teamName}</TableCell>
                                                {yearMode==='range'&&<TableCell className="text-zinc-400 text-xs">{item.year}</TableCell>}
                                                <TableCell className="text-right">{g}</TableCell>
                                                <TableCell className="text-right text-green-400">{item.wins}</TableCell>
                                                <TableCell className="text-right text-red-400">{item.losses}</TableCell>
                                                <TableCell className="text-right">{wr}</TableCell>
                                                <TableCell className="text-right text-yellow-400 font-bold">{item.averageKDA?.toFixed(2)||'0.00'}</TableCell>
                                                <TableCell className="text-right">{g>0?(item.totalKills/g).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{g>0?(item.totalDeaths/g).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{g>0?(item.totalAssists/g).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right">{g>0?((item.totalKills+item.totalAssists)/g).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right">{Math.round(item.averageDPM||0).toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-blue-400">{item.averageVisionScore?.toFixed(1)||'-'}</TableCell>
                                                <TableCell className="text-right text-zinc-500">{item.totalKills}</TableCell>
                                                <TableCell className="text-right text-zinc-500">{item.totalDeaths}</TableCell>
                                                <TableCell className="text-right text-zinc-500">{item.totalAssists}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                          )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
