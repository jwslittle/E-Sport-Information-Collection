'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Trophy, Users, TrendingUp } from 'lucide-react'

interface TeamEntry {
    teamName: string; year: number; tournament: string
    games: number; wins: number; losses: number
    totalKills: number; totalDeaths: number; totalAssists: number; totalDamage: number
}
interface PlayerEntry {
    playerName: string; teamName: string; position: string; year: number; tournament: string
    games: number; wins: number; losses: number
    totalKills: number; totalDeaths: number; totalAssists: number; totalDamage: number
    averageKDA: number; averageDPM: number; averageVisionScore: number
}

const POS_ORDER: Record<string, number> = { TOP: 1, JUNGLE: 2, MID: 3, BOTTOM: 4, ADC: 4, SUPPORT: 5 }

export default function TournamentDetailPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = use(params)
    const tournamentName = decodeURIComponent(name)

    const [year, setYear] = useState<string>('')
    const [teams,   setTeams]   = useState<TeamEntry[]>([])
    const [players, setPlayers] = useState<PlayerEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('teams')
    const [sortKey, setSortKey] = useState('wins')
    const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

    // 연도 추출 (이름에서: "LCK 2025 Spring" → "2025", "WLDs Season" → "2025" default)
    useEffect(() => {
        const m = tournamentName.match(/(\d{4})/)
        setYear(m ? m[1] : '2025')
    }, [tournamentName])

    useEffect(() => {
        if (!year) return
        setLoading(true)
        const enc = encodeURIComponent(tournamentName)
        Promise.all([
            fetch(`/api/stats?type=team&year=${year}&tournament=${enc}&division=1`).then(r => r.json()),
            fetch(`/api/stats?type=player&year=${year}&tournament=${enc}&division=1`).then(r => r.json()),
        ]).then(([t, p]) => {
            setTeams(Array.isArray(t) ? t : [])
            setPlayers(Array.isArray(p) ? p : [])
        }).catch(() => { setTeams([]); setPlayers([]) })
        .finally(() => setLoading(false))
    }, [year, tournamentName])

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('desc') }
    }
    const dir = sortDir === 'asc' ? 1 : -1
    const sortIcon = (k: string) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

    const sortedTeams = [...teams].sort((a, b) => {
        if (sortKey === 'winRate') return ((b.wins/b.games) - (a.wins/a.games)) * dir
        if (sortKey === 'wins')    return (b.wins - a.wins) * dir
        if (sortKey === 'kpg')     return ((b.totalKills/b.games) - (a.totalKills/a.games)) * dir
        if (sortKey === 'dpg')     return ((b.totalDamage/b.games) - (a.totalDamage/a.games)) * dir
        return (b.wins - a.wins) * dir
    })

    const sortedPlayers = [...players].sort((a, b) => {
        if (sortKey === 'kda')    return (b.averageKDA - a.averageKDA) * dir
        if (sortKey === 'dpm')    return (b.averageDPM - a.averageDPM) * dir
        if (sortKey === 'wins')   return (b.wins - a.wins) * dir
        if (sortKey === 'games')  return (b.games - a.games) * dir
        if (sortKey === 'kills')  return ((b.totalKills/b.games) - (a.totalKills/a.games)) * dir
        if (sortKey === 'vision') return (b.averageVisionScore - a.averageVisionScore) * dir
        if (sortKey === 'pos')    return ((POS_ORDER[a.position]||9) - (POS_ORDER[b.position]||9))
        return (b.averageKDA - a.averageKDA) * dir
    })

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-5 pb-20">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <Link href="/info/tournaments" className="text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white">{tournamentName}</h1>
                    <p className="text-sm text-zinc-400">{year}년 · 대회 통계</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                        팀 {teams.length}개
                    </Badge>
                    <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        선수 {players.length}명
                    </Badge>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-zinc-500">데이터 불러오는 중...</div>
            ) : teams.length === 0 && players.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 space-y-2">
                    <Trophy className="w-12 h-12 mx-auto opacity-20" />
                    <p>이 대회의 상세 통계 데이터가 없습니다.</p>
                    <p className="text-xs">연도별 통합 데이터만 제공되는 대회일 수 있습니다.</p>
                </div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="teams"   className="gap-1.5"><Trophy  className="w-4 h-4"/>팀 기록</TabsTrigger>
                        <TabsTrigger value="players" className="gap-1.5"><Users   className="w-4 h-4"/>선수 기록</TabsTrigger>
                    </TabsList>

                    {/* 팀 기록 */}
                    <TabsContent value="teams">
                        <div className="rounded-lg border border-zinc-800 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800">
                                        <TableHead className="w-10 text-center">#</TableHead>
                                        <TableHead>팀명</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('wins')}>승{sortIcon('wins')}</TableHead>
                                        <TableHead className="text-right">패</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('winRate')}>승률{sortIcon('winRate')}</TableHead>
                                        <TableHead className="text-right">게임</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('kpg')}>킬/G{sortIcon('kpg')}</TableHead>
                                        <TableHead className="text-right">데스/G</TableHead>
                                        <TableHead className="text-right">KDA</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('dpg')}>DMG/G{sortIcon('dpg')}</TableHead>
                                        <TableHead className="text-right">총 킬</TableHead>
                                        <TableHead className="text-right">총 DMG</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedTeams.map((t, i) => {
                                        const wr = t.games > 0 ? (t.wins / t.games * 100).toFixed(1) : '0.0'
                                        const kda = t.totalDeaths > 0 ? ((t.totalKills + t.totalAssists) / t.totalDeaths).toFixed(2) : (t.totalKills + t.totalAssists).toString()
                                        return (
                                            <TableRow key={i} className="border-zinc-800 hover:bg-zinc-800/30">
                                                <TableCell className="text-center text-zinc-500">{i+1}</TableCell>
                                                <TableCell className="font-semibold text-white">{t.teamName}</TableCell>
                                                <TableCell className="text-right text-green-400 font-bold">{t.wins}</TableCell>
                                                <TableCell className="text-right text-red-400">{t.losses}</TableCell>
                                                <TableCell className="text-right font-semibold">{wr}%</TableCell>
                                                <TableCell className="text-right text-zinc-400">{t.games}</TableCell>
                                                <TableCell className="text-right">{t.games > 0 ? (t.totalKills/t.games).toFixed(1) : '-'}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{t.games > 0 ? (t.totalDeaths/t.games).toFixed(1) : '-'}</TableCell>
                                                <TableCell className="text-right text-yellow-400">{kda}</TableCell>
                                                <TableCell className="text-right">{t.games > 0 ? Math.round(t.totalDamage/t.games).toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{t.totalKills.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-zinc-500">{(t.totalDamage/1000).toFixed(0)}k</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* 선수 기록 */}
                    <TabsContent value="players">
                        <div className="rounded-lg border border-zinc-800 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800">
                                        <TableHead className="w-10 text-center">#</TableHead>
                                        <TableHead>선수</TableHead>
                                        <TableHead className="cursor-pointer hover:text-yellow-400" onClick={() => handleSort('pos')}>포지션{sortIcon('pos')}</TableHead>
                                        <TableHead>소속팀</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('games')}>경기{sortIcon('games')}</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('wins')}>승{sortIcon('wins')}</TableHead>
                                        <TableHead className="text-right">패</TableHead>
                                        <TableHead className="text-right">승률</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('kda')}>KDA{sortIcon('kda')}</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('kills')}>K/G{sortIcon('kills')}</TableHead>
                                        <TableHead className="text-right">D/G</TableHead>
                                        <TableHead className="text-right">A/G</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('dpm')}>DPM{sortIcon('dpm')}</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:text-yellow-400" onClick={() => handleSort('vision')}>시야{sortIcon('vision')}</TableHead>
                                        <TableHead className="text-right">총킬</TableHead>
                                        <TableHead className="text-right">총데스</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedPlayers.map((p, i) => {
                                        const wr = p.games > 0 ? (p.wins / p.games * 100).toFixed(0) : '0'
                                        return (
                                            <TableRow key={i} className="border-zinc-800 hover:bg-zinc-800/30 text-sm">
                                                <TableCell className="text-center text-zinc-500">{i+1}</TableCell>
                                                <TableCell className="font-semibold text-white">{p.playerName}</TableCell>
                                                <TableCell><Badge variant="outline" className="text-[10px] py-0">{p.position}</Badge></TableCell>
                                                <TableCell className="text-zinc-400 text-xs">{p.teamName}</TableCell>
                                                <TableCell className="text-right">{p.games}</TableCell>
                                                <TableCell className="text-right text-green-400">{p.wins}</TableCell>
                                                <TableCell className="text-right text-red-400">{p.losses}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{wr}%</TableCell>
                                                <TableCell className="text-right text-yellow-400 font-bold">{p.averageKDA.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{p.games>0?(p.totalKills/p.games).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{p.games>0?(p.totalDeaths/p.games).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{p.games>0?(p.totalAssists/p.games).toFixed(1):'-'}</TableCell>
                                                <TableCell className="text-right">{Math.round(p.averageDPM).toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-blue-400">{p.averageVisionScore.toFixed(1)}</TableCell>
                                                <TableCell className="text-right text-zinc-400">{p.totalKills}</TableCell>
                                                <TableCell className="text-right text-zinc-500">{p.totalDeaths}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}
