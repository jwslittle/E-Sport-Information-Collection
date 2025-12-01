"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardStats {
    topPicked: { name: string, team: string, count: number }[]
    winRates: { name: string, team: string, winRate: number, games: number }[]
    positionMeta: { position: string, avgPoints: number }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function DashboardClient() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard')
                const data = await res.json()
                setStats(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div>Loading...</div>
    if (!stats) return <div>데이터를 불러올 수 없습니다.</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. Top Picked Players */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>가장 많이 선택된 선수 (Top 5)</CardTitle>
                    <CardDescription>유저들이 가장 많이 보유한 선수 카드입니다.</CardDescription>
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
                            <Bar dataKey="count" name="보유 수" fill="#8884d8" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 2. Position Meta Analysis */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>포지션별 평균 포인트</CardTitle>
                    <CardDescription>어떤 포지션이 가장 많은 포인트를 획득했나요?</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.positionMeta}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="avgPoints"
                                nameKey="position"
                            >
                                {stats.positionMeta.map((entry, index) => (
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

            {/* 3. Highest Win Rate Players */}
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>최고 승률 선수 (Top 5)</CardTitle>
                    <CardDescription>최소 5경기 이상 출전한 선수 중 승률이 가장 높은 선수들입니다.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.winRates}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" unit="%" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`${value}%`, '승률']}
                            />
                            <Legend />
                            <Bar dataKey="winRate" name="승률" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
