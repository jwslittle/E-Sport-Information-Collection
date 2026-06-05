'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Sword, Shield, Zap, Eye, Coins, Crown, TrendingUp, BarChart3 } from 'lucide-react'
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts'

// ─── 타입 ────────────────────────────────────────────────────────────

interface Team { id: string; code: string; name: string; logoUrl?: string | null; primaryColor?: string | null }
interface Player {
    id: string; name: string; realName?: string | null
    position: string; status: string; basePrice: number
    stats?: any; team?: Team | null
}
interface GameStat {
    id: string; playerName: string; team: string; position?: string | null; champion?: string | null
    kills: number; deaths: number; assists: number; cs: number; gold: number; damage: number; visionScore: number
    game: {
        gameNumber: number; winner?: string | null; duration?: string | null
        match: { team1: string; team2: string; displayName?: string | null; scheduledAt?: string | null }
    }
}

// ─── 포지션 색상 ─────────────────────────────────────────────────────
const POS_COLORS: Record<string, string> = {
    TOP: 'bg-red-900/40 text-red-300 border-red-700/50',
    JUG: 'bg-green-900/40 text-green-300 border-green-700/50',
    MID: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    ADC: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
    SUP: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
}

// ─── KDA 계산 ────────────────────────────────────────────────────────
function kda(k: number, d: number, a: number) {
    if (d === 0) return ((k + a) * 1).toFixed(2) + ' (Perfect)'
    return ((k + a) / d).toFixed(2)
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────
export function PlayerDetail({ player, realGameStats }: {
    player: Player
    realGameStats: GameStat[]
}) {
    const stats = player.stats as any ?? {}

    // CHECK_PLAYER 퀘스트 트리거 (선수 상세 페이지 방문)
    useEffect(() => {
        fetch('/api/quests/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CHECK_PLAYER' }),
        }).catch(() => {})
    }, [])

    // 레이더 차트 데이터 (정규화)
    const kdaVal = Math.min((stats.kda ?? 0) * 15, 100)
    const radarData = [
        { subject: 'KDA',    A: kdaVal },
        { subject: '승률',   A: Math.min((stats.winRate ?? 0) * 100, 100) },
        { subject: 'DPM',    A: Math.min((stats.dpm ?? 0) / 8, 100) },
        { subject: 'CS/분',  A: Math.min((stats.cspm ?? 0) * 10, 100) },
        { subject: '시야',   A: Math.min((stats.visionScore ?? 0) * 5, 100) },
        { subject: '밸류',   A: Math.min(player.basePrice * 6, 100) },
    ]

    // 최근 게임 스탯 KDA 차트 데이터 (최근 10경기)
    const recentGames = realGameStats.slice(0, 10).reverse()
    const kdaChartData = recentGames.map((g, i) => ({
        name: `G${i + 1}`,
        KDA: g.deaths === 0 ? (g.kills + g.assists) : Number(((g.kills + g.assists) / g.deaths).toFixed(2)),
        kill: g.kills, death: g.deaths, assist: g.assists,
        won: g.game.winner === g.team,
    }))

    // 평균 스탯 (실제 게임 기반)
    const avgStats = realGameStats.length > 0 ? {
        kills:   (realGameStats.reduce((s, g) => s + g.kills, 0) / realGameStats.length).toFixed(1),
        deaths:  (realGameStats.reduce((s, g) => s + g.deaths, 0) / realGameStats.length).toFixed(1),
        assists: (realGameStats.reduce((s, g) => s + g.assists, 0) / realGameStats.length).toFixed(1),
        cs:      Math.round(realGameStats.reduce((s, g) => s + g.cs, 0) / realGameStats.length),
        damage:  Math.round(realGameStats.reduce((s, g) => s + g.damage, 0) / realGameStats.length),
        vision:  Math.round(realGameStats.reduce((s, g) => s + g.visionScore, 0) / realGameStats.length),
        wins:    realGameStats.filter(g => g.game.winner === g.team).length,
    } : null

    return (
        <div className="space-y-6">
            {/* 뒤로가기 */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-white">
                    <Link href="/players"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{player.name}</h1>
                    {player.realName && <p className="text-sm text-zinc-400">{player.realName}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ── 좌: 프로필 카드 ── */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                            {/* 아바타 */}
                            <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-3xl font-bold text-zinc-400">
                                {player.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{player.name}</p>
                                {player.realName && <p className="text-sm text-zinc-500">{player.realName}</p>}
                            </div>
                            <div className="flex gap-2 flex-wrap justify-center">
                                <Badge variant="outline" className={POS_COLORS[player.position] ?? 'border-zinc-700 text-zinc-300'}>
                                    {player.position}
                                </Badge>
                                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                                    {player.team?.code ?? 'FA'}
                                </Badge>
                                <Badge variant="outline" className={`border-zinc-700 ${player.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}>
                                    {player.status === 'ACTIVE' ? '활성' : '비활성'}
                                </Badge>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                                <p className="text-xs text-zinc-500 mb-1">선수 가격</p>
                                <p className="text-2xl font-bold text-yellow-400">{player.basePrice} <span className="text-sm text-zinc-500">pt</span></p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 시즌 평균 스탯 (실제 데이터 있을 때) */}
                    {avgStats && (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-zinc-400 flex items-center gap-1">
                                    <BarChart3 className="w-4 h-4" /> 실제 경기 평균 ({realGameStats.length}게임)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {[
                                    { icon: <Sword className="w-3.5 h-3.5 text-red-400" />,  label: 'K/D/A', value: `${avgStats.kills}/${avgStats.deaths}/${avgStats.assists}` },
                                    { icon: <TrendingUp className="w-3.5 h-3.5 text-blue-400" />, label: 'KDA', value: kda(parseFloat(avgStats.kills), parseFloat(avgStats.deaths), parseFloat(avgStats.assists)) },
                                    { icon: <Coins className="w-3.5 h-3.5 text-yellow-400" />, label: 'CS 평균', value: avgStats.cs },
                                    { icon: <Zap className="w-3.5 h-3.5 text-orange-400" />, label: '딜량', value: `${(avgStats.damage / 1000).toFixed(1)}k` },
                                    { icon: <Eye className="w-3.5 h-3.5 text-purple-400" />, label: '시야', value: avgStats.vision },
                                    { icon: <Crown className="w-3.5 h-3.5 text-green-400" />, label: '승리', value: `${avgStats.wins}승 / ${realGameStats.length}게임` },
                                ].map(row => (
                                    <div key={row.label} className="flex items-center justify-between">
                                        <span className="flex items-center gap-1 text-zinc-400">{row.icon}{row.label}</span>
                                        <span className="font-medium text-white">{row.value}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* 종합 스탯이 없을 때 DB 기반 표시 */}
                    {!avgStats && Object.keys(stats).length > 0 && (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-zinc-400">시즌 통계 (집계)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {[
                                    { label: 'KDA',    value: stats.kda?.toFixed(2) ?? '-' },
                                    { label: '승률',   value: stats.winRate ? `${(stats.winRate * 100).toFixed(1)}%` : '-' },
                                    { label: 'DPM',    value: stats.dpm ? Math.round(stats.dpm).toLocaleString() : '-' },
                                    { label: 'CSPM',   value: stats.cspm?.toFixed(1) ?? '-' },
                                    { label: '시야',   value: stats.visionScore?.toFixed(1) ?? '-' },
                                ].map(row => (
                                    <div key={row.label} className="flex justify-between">
                                        <span className="text-zinc-400">{row.label}</span>
                                        <span className="font-medium text-white">{row.value}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── 우: 차트 + 히스토리 ── */}
                <div className="lg:col-span-2 space-y-5">
                    <Tabs defaultValue={realGameStats.length > 0 ? 'history' : 'radar'}>
                        <TabsList className="bg-zinc-900 border border-zinc-800">
                            <TabsTrigger value="radar">능력치 레이더</TabsTrigger>
                            {realGameStats.length > 0 && <TabsTrigger value="history">실제 경기 기록 ({realGameStats.length})</TabsTrigger>}
                            {realGameStats.length > 0 && <TabsTrigger value="kda-chart">KDA 추이</TabsTrigger>}
                        </TabsList>

                        {/* 레이더 차트 */}
                        <TabsContent value="radar">
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-white text-sm">종합 능력치</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="#3f3f46" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                            <Radar dataKey="A" stroke="#eab308" fill="#eab308" fillOpacity={0.25} strokeWidth={2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 실제 경기 기록 */}
                        {realGameStats.length > 0 && (
                            <TabsContent value="history">
                                <Card className="bg-zinc-900 border-zinc-800">
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-zinc-800 text-zinc-500">
                                                        <th className="text-left px-4 py-3">경기</th>
                                                        <th className="text-center px-2 py-3">챔프</th>
                                                        <th className="text-center px-2 py-3">결과</th>
                                                        <th className="text-center px-2 py-3">KDA</th>
                                                        <th className="text-center px-2 py-3">CS</th>
                                                        <th className="text-center px-2 py-3">딜량</th>
                                                        <th className="text-center px-2 py-3">시야</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {realGameStats.map(g => {
                                                        const won = g.game.winner === g.team
                                                        return (
                                                            <tr key={g.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                                                <td className="px-4 py-2.5">
                                                                    <div className="font-medium text-zinc-200">
                                                                        {g.game.match.displayName ?? `${g.game.match.team1} vs ${g.game.match.team2}`}
                                                                    </div>
                                                                    <div className="text-zinc-600">Game {g.game.gameNumber} {g.game.duration ? `· ${g.game.duration}` : ''}</div>
                                                                </td>
                                                                <td className="px-2 py-2.5 text-center text-zinc-300">{g.champion ?? '-'}</td>
                                                                <td className="px-2 py-2.5 text-center">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${won ? 'bg-blue-900/50 text-blue-300' : 'bg-red-900/50 text-red-300'}`}>
                                                                        {won ? 'WIN' : 'LOSE'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-2.5 text-center font-mono font-bold text-blue-300">
                                                                    {g.kills}/{g.deaths}/{g.assists}
                                                                </td>
                                                                <td className="px-2 py-2.5 text-center text-zinc-400">{g.cs}</td>
                                                                <td className="px-2 py-2.5 text-center text-zinc-400">
                                                                    {g.damage > 0 ? `${(g.damage / 1000).toFixed(1)}k` : '-'}
                                                                </td>
                                                                <td className="px-2 py-2.5 text-center text-zinc-400">{g.visionScore || '-'}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        {/* KDA 추이 차트 */}
                        {realGameStats.length > 0 && (
                            <TabsContent value="kda-chart">
                                <Card className="bg-zinc-900 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="text-white text-sm">최근 {recentGames.length}게임 KDA 추이</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={kdaChartData} barSize={20}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                                                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                                                <Tooltip
                                                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                                                    formatter={(val: any, name: string, props: any) => {
                                                        const g = props.payload
                                                        return [`${g.kill}/${g.death}/${g.assist} (KDA: ${val})`, '']
                                                    }}
                                                />
                                                <Bar dataKey="KDA" radius={[4, 4, 0, 0]}>
                                                    {kdaChartData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.won ? '#3b82f6' : '#ef4444'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <p className="text-xs text-zinc-600 text-center mt-2">
                                            <span className="text-blue-400">■</span> WIN &nbsp;
                                            <span className="text-red-400">■</span> LOSE
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}
                    </Tabs>

                    {/* 실제 데이터 없을 때 안내 */}
                    {realGameStats.length === 0 && (
                        <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-8 text-center">
                            <BarChart3 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-500 text-sm">아직 실제 경기 데이터가 없습니다.</p>
                            <p className="text-zinc-600 text-xs mt-1">경기 일정 탭에서 데이터를 동기화하면 표시됩니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
