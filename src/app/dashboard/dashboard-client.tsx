"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DashboardStats {
    topPicked: { name: string, team: string, count: number }[]
    topPoints: { name: string, team: string, points: number }[]
    topWildcardPoints: { name: string, team: string, points: number }[]
    positionMeta: { position: string, avgPoints: number }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function DashboardClient() {
    const [activeTab, setActiveTab] = useState("SIMULATION")
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [standings, setStandings] = useState<any[]>([])

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true)
            try {
                // Fetch Stats with Type
                const resStats = await fetch(`/api/dashboard?type=${activeTab}`)
                const dataStats = await resStats.json()
                setStats(dataStats)

                // Fetch Matches to calculate Standings for this League Type
                // (Note: Database might only have SIMULATION matches currently, but logic is generic)
                const resMatches = await fetch(`/api/matches?type=${activeTab}`)
                const dataMatches = await resMatches.json()
                const matches = dataMatches.matches || []

                // Calculate Standings
                const teamStats: Record<string, { name: string, code: string, wins: 0, losses: 0, games: 0 }> = {}

                matches.forEach((m: any) => {
                    if (m.status !== 'COMPLETED') return

                    // Initialize
                    if (!teamStats[m.team1.id]) teamStats[m.team1.id] = { name: m.team1.name, code: m.team1.code, wins: 0, losses: 0, games: 0 }
                    if (!teamStats[m.team2.id]) teamStats[m.team2.id] = { name: m.team2.name, code: m.team2.code, wins: 0, losses: 0, games: 0 }

                    teamStats[m.team1.id].games++
                    teamStats[m.team2.id].games++

                    if (m.team1Score > m.team2Score) {
                        teamStats[m.team1.id].wins++
                        teamStats[m.team2.id].losses++
                    } else {
                        teamStats[m.team2.id].wins++
                        teamStats[m.team1.id].losses++
                    }
                })

                const sortedStandings = Object.values(teamStats).sort((a: any, b: any) => {
                    if (a.wins !== b.wins) return b.wins - a.wins
                    return 0
                })

                setStandings(sortedStandings)

            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [activeTab])

    const Content = () => {
        if (loading) return <div className="py-20 text-center text-zinc-500">데이터를 불러오고 있습니다...</div>
        if (!stats) return <div className="py-20 text-center text-red-500">데이터를 불러올 수 없습니다.</div>

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                {/* 0. League Standings */}
                <Card className="col-span-1 md:col-span-2 border-yellow-500/30 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span>🏆 {activeTab === 'REAL' ? 'Real LCK Season Standings' : '2026 Simulation Standings'}</span>
                        </CardTitle>
                        <CardDescription>
                            {activeTab === 'REAL' ? '실제 LCK 경기 결과에 따른 순위입니다.' : 'AI 시뮬레이션 리그의 실시간 순위입니다.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {standings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-zinc-500 border-b border-zinc-800">
                                        <tr>
                                            <th className="py-2 px-4">Rank</th>
                                            <th className="py-2 px-4">Team</th>
                                            <th className="py-2 px-4 text-center">W - L</th>
                                            <th className="py-2 px-4 text-center">Win Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standings.map((team, index) => (
                                            <tr key={index} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                                <td className="py-3 px-4 font-mono text-zinc-400">
                                                    {index + 1}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-white">
                                                    {team.name} <span className="text-zinc-500 text-xs ml-1">({team.code})</span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-mono">
                                                    <span className="text-blue-400">{team.wins}</span> - <span className="text-red-400">{team.losses}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-mono text-zinc-300">
                                                    {team.games > 0 ? ((team.wins / team.games) * 100).toFixed(1) : '0.0'}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-zinc-500 bg-zinc-900/50 rounded-lg">
                                {activeTab === 'REAL' ? '현재 등록된 경기 데이터가 없습니다.' : '아직 진행된 경기가 없습니다.'}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 1. Top Picked Players */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>가장 많이 선택된 선수 (Top 5)</CardTitle>
                        <CardDescription>
                            {activeTab === 'REAL' ? '유저들이 실제 리그 팀에 가장 많이 영입한 선수입니다.' : '시뮬레이션 팀에서 가장 인기 있는 선수입니다.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topPicked} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis type="number" stroke="#888" />
                                <YAxis dataKey="name" type="category" stroke="#888" width={80} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="count" name="영입 수" fill="#8884d8" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. Position Meta Analysis */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>포지션별 평균 포인트</CardTitle>
                        <CardDescription>어떤 포지션이 점수를 잘 내고 있나요?</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.positionMeta}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="avgPoints"
                                    nameKey="position"
                                >
                                    {stats.positionMeta?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 3. Top Total Points (Overall) */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>최고 획득 포인트 선수 (전체)</CardTitle>
                        <CardDescription>
                            {activeTab === 'REAL' ? '실제 리그 성적 기준 상위 포인트 선수입니다.' : '시뮬레이션 경기 누적 포인트 기준 상위 선수입니다.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topPoints}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="points" name="포인트" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 4. Top Wildcard Contribution */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>최고 효율 와일드카드</CardTitle>
                        <CardDescription>와일드카드로 기용되었을 때 가장 많은 이득을 가져다 준 선수입니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topWildcardPoints}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="points" name="기여 포인트" fill="#ffc658" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Tabs defaultValue="SIMULATION" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="SIMULATION" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black font-bold">
                    판타지 시뮬레이션 리그
                </TabsTrigger>
                <TabsTrigger value="REAL" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-bold">
                    보조 리그
                </TabsTrigger>
            </TabsList>
            <Content />
        </Tabs>
    )
}
