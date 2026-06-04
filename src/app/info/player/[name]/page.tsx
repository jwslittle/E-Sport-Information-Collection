'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function PlayerDetailPage() {
    const params = useParams()
    const playerName = decodeURIComponent(params.name as string)
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch all stats for this player (all years, all tournaments)
                const res = await fetch(`/api/stats?type=player&search=${encodeURIComponent(playerName)}&year=all&tournament=all`)
                const json = await res.json()

                if (Array.isArray(json)) {
                    // Filter exactly by name to avoid partial matches
                    const exactMatches = json.filter((item: any) => item.playerName === playerName)

                    // Sort by year descending for table, ascending for chart
                    const sortedData = exactMatches.sort((a: any, b: any) => b.year - a.year)
                    setData(sortedData)
                }
            } catch (error) {
                console.error("Failed to fetch player stats", error)
            } finally {
                setLoading(false)
            }
        }

        if (playerName) {
            fetchData()
        }
    }, [playerName])

    // Prepare chart data (aggregated by year)
    const chartData = data.reduce((acc: any[], curr: any) => {
        const existing = acc.find(item => item.year === curr.year)
        if (existing) {
            // Simple average for chart if multiple tournaments in a year
            // This is a simplification; ideally we'd weight by games
            existing.kda = (existing.kda + curr.averageKDA) / 2
            existing.winRate = (existing.winRate + (curr.wins / curr.games * 100)) / 2
        } else {
            acc.push({
                year: curr.year,
                kda: curr.averageKDA,
                winRate: curr.games > 0 ? (curr.wins / curr.games * 100) : 0
            })
        }
        return acc
    }, []).sort((a: any, b: any) => a.year - b.year)

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">{playerName}</h1>
                <p className="text-muted-foreground">선수 상세 정보</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>연도별 KDA 추이</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="kda" stroke="#8884d8" name="KDA" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>연도별 승률 추이 (%)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="winRate" stroke="#82ca9d" name="Win Rate" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>상세 기록</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>연도</TableHead>
                                <TableHead>대회</TableHead>
                                <TableHead>소속팀</TableHead>
                                <TableHead>포지션</TableHead>
                                <TableHead className="text-right">승</TableHead>
                                <TableHead className="text-right">패</TableHead>
                                <TableHead className="text-right">승률</TableHead>
                                <TableHead className="text-right">KDA</TableHead>
                                <TableHead className="text-right">DPM</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10">Loading...</TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10">데이터가 없습니다.</TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.year}</TableCell>
                                        <TableCell>{item.tournament}</TableCell>
                                        <TableCell>{item.teamName}</TableCell>
                                        <TableCell><Badge variant="outline">{item.position}</Badge></TableCell>
                                        <TableCell className="text-right">{item.wins}</TableCell>
                                        <TableCell className="text-right">{item.losses}</TableCell>
                                        <TableCell className="text-right">
                                            {item.games > 0 ? ((item.wins / item.games) * 100).toFixed(1) + '%' : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">{item.averageKDA.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{Math.round(item.averageDPM).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
