'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

const POS_COLORS: Record<string, string> = {
    TOP: 'bg-red-500/20 text-red-300 border-red-500/30',
    JUNGLE: 'bg-green-500/20 text-green-300 border-green-500/30',
    MID: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    BOTTOM: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    ADC: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    SUPPORT: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

export default function PlayerDetailPage() {
    const params   = useParams()
    const playerName = decodeURIComponent(params.name as string)

    const [data, setData] = useState<any[]>([])
    const [champData, setChampData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [champLoading, setChampLoading] = useState(true)

    useEffect(() => {
        if (!playerName) return
        // 선수 통계 (전 연도 · 전 대회)
        fetch(`/api/stats?type=player&search=${encodeURIComponent(playerName)}&year=all&tournament=all`)
            .then(r => r.json())
            .then(json => {
                if (Array.isArray(json)) {
                    const exact = json.filter((item: any) => item.playerName === playerName)
                    setData(exact.sort((a: any, b: any) => b.year - a.year))
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false))

        // 챔피언 풀 (전 연도 + 2026 라이브)
        fetch(`/api/stats/champions?player=${encodeURIComponent(playerName)}&yearFrom=2014&yearTo=2026&tournament=all_1`)
            .then(r => r.json())
            .then(json => { if (Array.isArray(json)) setChampData(json) })
            .catch(() => {})
            .finally(() => setChampLoading(false))
    }, [playerName])

    // 연도별 집계 (차트용) — 가중평균
    const chartData = (() => {
        const byYear: Record<number, { kda: number; winRate: number; dpm: number; cspm: number; gpm: number; weight: number }> = {}
        for (const row of data) {
            const y = row.year
            if (!byYear[y]) byYear[y] = { kda: 0, winRate: 0, dpm: 0, cspm: 0, gpm: 0, weight: 0 }
            const w  = row.games
            byYear[y].kda     += row.averageKDA  * w
            byYear[y].winRate += (row.wins / row.games * 100) * w
            byYear[y].dpm     += (row.averageDPM || 0) * w
            byYear[y].cspm    += (row.avgCSPM || 0) * w
            byYear[y].gpm     += (row.avgEarnedGPM || 0) * w
            byYear[y].weight  += w
        }
        return Object.entries(byYear).map(([yr, v]) => ({
            year: Number(yr),
            kda:     v.weight > 0 ? +(v.kda     / v.weight).toFixed(2) : 0,
            winRate: v.weight > 0 ? +(v.winRate  / v.weight).toFixed(1) : 0,
            dpm:     v.weight > 0 ? Math.round(v.dpm  / v.weight) : 0,
            cspm:    v.weight > 0 ? +(v.cspm     / v.weight).toFixed(2) : 0,
            gpm:     v.weight > 0 ? Math.round(v.gpm  / v.weight) : 0,
        })).sort((a, b) => a.year - b.year)
    })()

    // 커리어 요약
    const totalGames  = data.reduce((s, r) => s + r.games, 0)
    const totalWins   = data.reduce((s, r) => s + r.wins, 0)
    const totalKills  = data.reduce((s, r) => s + r.totalKills, 0)
    const totalDeaths = data.reduce((s, r) => s + r.totalDeaths, 0)
    const totalAssists = data.reduce((s, r) => s + r.totalAssists, 0)
    const totalPentas  = data.reduce((s, r) => s + (r.pentakills || 0), 0)
    const careerKDA    = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : '-'
    const careerWR     = totalGames  > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '-'
    const lastPosition = data[0]?.position || ''
    const lastTeam     = data[0]?.teamName || ''

    const fmtPct = (v: number | null | undefined) =>
        (!v && v !== 0) ? '-' : `${(v * 100).toFixed(1)}%`

    return (
        <div className="container mx-auto p-4 space-y-6 pb-16">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <Link href="/info" className="text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">{playerName}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        {lastPosition && <Badge className={`text-xs ${POS_COLORS[lastPosition] || 'bg-zinc-800 text-zinc-300'}`}>{lastPosition}</Badge>}
                        {lastTeam && <span className="text-sm text-zinc-400">{lastTeam}</span>}
                    </div>
                </div>
            </div>

            {/* 커리어 요약 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                    { label: '총 게임',   value: totalGames.toString(),          color: 'text-zinc-200' },
                    { label: '총 승리',   value: totalWins.toString(),           color: 'text-green-400' },
                    { label: '승률',      value: careerWR + '%',                 color: 'text-yellow-400' },
                    { label: 'KDA',       value: careerKDA,                      color: 'text-yellow-400' },
                    { label: 'K/D/A',     value: `${totalKills}/${totalDeaths}/${totalAssists}`, color: 'text-zinc-200' },
                    { label: '펜타킬',   value: totalPentas.toString(),         color: 'text-red-400' },
                ].map(item => (
                    <Card key={item.label} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-3 text-center">
                            <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 연도별 차트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-300">KDA / 승률 추이</CardTitle></CardHeader>
                    <CardContent className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="year" tick={{ fill: '#71717a', fontSize: 11 }} />
                                <YAxis yAxisId="left"  tick={{ fill: '#71717a', fontSize: 11 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#71717a', fontSize: 11 }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line yAxisId="left"  type="monotone" dataKey="kda"     stroke="#facc15" name="KDA"   dot={false} strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="#22c55e" name="승률%" dot={false} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-300">DPM / CSPM 추이</CardTitle></CardHeader>
                    <CardContent className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="year" tick={{ fill: '#71717a', fontSize: 11 }} />
                                <YAxis yAxisId="dpm"  tick={{ fill: '#71717a', fontSize: 11 }} />
                                <YAxis yAxisId="cspm" orientation="right" tick={{ fill: '#71717a', fontSize: 11 }} domain={[0, 12]} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line yAxisId="dpm"  type="monotone" dataKey="dpm"  stroke="#f97316" name="DPM"  dot={false} strokeWidth={2} />
                                <Line yAxisId="cspm" type="monotone" dataKey="cspm" stroke="#22d3ee" name="CSPM" dot={false} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 챔피언 풀 */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-300">챔피언 풀 (전 시즌 통합)</CardTitle>
                </CardHeader>
                <CardContent>
                    {champLoading ? (
                        <div className="text-center py-6 text-zinc-500 text-sm">로딩 중...</div>
                    ) : champData.length === 0 ? (
                        <div className="text-center py-6 text-zinc-500 text-sm">챔피언 데이터가 없습니다.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="text-sm min-w-[580px]">
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {champData.slice(0, 20).map((c: any, i: number) => (
                                        <TableRow key={i} className="hover:bg-zinc-800/30">
                                            <TableCell className="text-zinc-500">{i + 1}</TableCell>
                                            <TableCell className="font-semibold text-yellow-300">{c.champion}</TableCell>
                                            <TableCell className="text-right">{c.games}</TableCell>
                                            <TableCell className="text-right text-green-400">{c.wins}</TableCell>
                                            <TableCell className="text-right text-red-400">{c.losses}</TableCell>
                                            <TableCell className="text-right font-bold">{c.games > 0 ? ((c.wins/c.games)*100).toFixed(1)+'%' : '-'}</TableCell>
                                            <TableCell className="text-right text-yellow-400 font-bold">{c.avgKDA?.toFixed(2) || '-'}</TableCell>
                                            <TableCell className="text-right">{c.avgDPM ? Math.round(c.avgDPM).toLocaleString() : '-'}</TableCell>
                                            <TableCell className="text-right text-cyan-400">{c.avgCSPM?.toFixed(1) || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 상세 기록 테이블 */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-300">시즌별 상세 기록</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="text-sm min-w-[900px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>연도</TableHead>
                                    <TableHead>대회</TableHead>
                                    <TableHead>팀</TableHead>
                                    <TableHead>포지션</TableHead>
                                    <TableHead className="text-right">G</TableHead>
                                    <TableHead className="text-right text-green-400">W</TableHead>
                                    <TableHead className="text-right text-red-400">L</TableHead>
                                    <TableHead className="text-right">승률</TableHead>
                                    <TableHead className="text-right text-yellow-400">KDA</TableHead>
                                    <TableHead className="text-right">DPM</TableHead>
                                    <TableHead className="text-right text-cyan-400">CSPM</TableHead>
                                    <TableHead className="text-right text-yellow-300">GPM</TableHead>
                                    <TableHead className="text-right text-orange-400">KP%</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={13} className="text-center py-10 text-zinc-500">로딩 중...</TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={13} className="text-center py-10 text-zinc-500">데이터가 없습니다.</TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item: any, idx: number) => (
                                        <TableRow key={idx} className="hover:bg-zinc-800/30">
                                            <TableCell className="font-semibold text-white">{item.year}</TableCell>
                                            <TableCell className="text-zinc-400 text-xs max-w-[140px] truncate">{item.tournament}</TableCell>
                                            <TableCell className="text-zinc-300">{item.teamName}</TableCell>
                                            <TableCell><Badge variant="outline" className={`text-[10px] py-0 ${POS_COLORS[item.position] || ''}`}>{item.position}</Badge></TableCell>
                                            <TableCell className="text-right">{item.games}</TableCell>
                                            <TableCell className="text-right text-green-400">{item.wins}</TableCell>
                                            <TableCell className="text-right text-red-400">{item.losses}</TableCell>
                                            <TableCell className="text-right">{item.games > 0 ? ((item.wins/item.games)*100).toFixed(1)+'%' : '-'}</TableCell>
                                            <TableCell className="text-right text-yellow-400 font-bold">{item.averageKDA.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{Math.round(item.averageDPM).toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-cyan-400">{item.avgCSPM ? item.avgCSPM.toFixed(1) : '-'}</TableCell>
                                            <TableCell className="text-right text-yellow-300">{item.avgEarnedGPM ? Math.round(item.avgEarnedGPM) : '-'}</TableCell>
                                            <TableCell className="text-right text-orange-400">{fmtPct(item.avgKillParticipation)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
