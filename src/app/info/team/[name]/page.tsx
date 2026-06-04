'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function TeamDetailPage() {
    const params = useParams()
    const teamName = decodeURIComponent(params.name as string)
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch all stats for this team
                const res = await fetch(`/api/stats?type=team&search=${encodeURIComponent(teamName)}&year=all&tournament=all`)
                const json = await res.json()

                if (Array.isArray(json)) {
                    // Filter exactly by name
                    const exactMatches = json.filter((item: any) => item.teamName === teamName)

                    // Sort by year descending for table
                    const sortedData = exactMatches.sort((a: any, b: any) => b.year - a.year)
                    setData(sortedData)
                }
            } catch (error) {
                console.error("Failed to fetch team stats", error)
            } finally {
                setLoading(false)
            }
        }

        if (teamName) {
            fetchData()
        }
    }, [teamName])

    // Prepare chart data (aggregated by year)
    const chartData = data.reduce((acc: any[], curr: any) => {
        const existing = acc.find(item => item.year === curr.year)
        if (existing) {
            existing.winRate = (existing.winRate + (curr.wins / curr.games * 100)) / 2
            existing.totalKills += curr.totalKills
        } else {
            acc.push({
                year: curr.year,
                winRate: curr.games > 0 ? (curr.wins / curr.games * 100) : 0,
                totalKills: curr.totalKills
            })
        }
        return acc
    }, []).sort((a: any, b: any) => a.year - b.year)

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">{teamName}</h1>
                <p className="text-muted-foreground">팀 상세 정보</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <Card>
                    <CardHeader>
                        <CardTitle>연도별 총 킬 수</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="totalKills" stroke="#8884d8" name="Total Kills" />
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
                                <TableHead className="text-right">승</TableHead>
                                <TableHead className="text-right">패</TableHead>
                                <TableHead className="text-right">승률</TableHead>
                                <TableHead className="text-right">Total Kills</TableHead>
                                <TableHead className="text-right">Total DMG</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">Loading...</TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">데이터가 없습니다.</TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.year}</TableCell>
                                        <TableCell>{item.tournament}</TableCell>
                                        <TableCell className="text-right">{item.wins}</TableCell>
                                        <TableCell className="text-right">{item.losses}</TableCell>
                                        <TableCell className="text-right">
                                            {item.games > 0 ? ((item.wins / item.games) * 100).toFixed(1) + '%' : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">{item.totalKills}</TableCell>
                                        <TableCell className="text-right">{(item.totalDamage / 1000).toFixed(1)}k</TableCell>
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
