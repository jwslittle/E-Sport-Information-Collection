'use client'

import { Player, Card as PlayerCard } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'

interface PlayerDetailProps {
    player: Player & { cards: PlayerCard[] }
}

export function PlayerDetail({ player }: PlayerDetailProps) {
    // JSON 문자열 파싱 (안전하게 처리)
    const seasonStats = player.seasonStats ? JSON.parse(player.seasonStats) : {}
    const careerStats = player.careerStats ? JSON.parse(player.careerStats) : {}

    // 레이더 차트 데이터 변환
    // KDA, DPM, GPM, WinRate 등을 정규화하여 0~100 스케일로 변환 필요하지만, 일단 원본 값 사용 (데모용)
    // 실제로는 각 스탯별 최대값을 기준으로 정규화해야 함.
    const chartData = [
        { subject: 'KDA', A: parseFloat(seasonStats.kda || '0') * 10, fullMark: 100 }, // KDA * 10
        { subject: 'Win Rate', A: parseFloat(seasonStats.winRate || '0'), fullMark: 100 },
        { subject: 'DPM', A: (seasonStats.dpm || 0) / 10, fullMark: 100 }, // DPM / 10
        { subject: 'GPM', A: (seasonStats.gpm || 0) / 10, fullMark: 100 }, // GPM / 10
        { subject: 'Cost', A: player.cost * 5, fullMark: 100 }, // Cost * 5
    ]

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-white">
                    <Link href="/players">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-white">{player.name}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* 프로필 카드 */}
                <Card className="md:col-span-1 bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-col items-center text-center pb-2">
                        <Avatar className="h-32 w-32 border-4 border-zinc-800 mb-4">
                            <AvatarImage src={`/images/players/${player.name.toLowerCase()}.png`} alt={player.name} />
                            <AvatarFallback className="text-4xl bg-zinc-800 text-zinc-500">
                                {player.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl text-white">{player.name}</CardTitle>
                        <p className="text-zinc-400">{player.realName}</p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 items-center">
                        <div className="flex gap-2">
                            <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-lg px-3 py-1">
                                {player.team}
                            </Badge>
                            <Badge className="bg-yellow-500 text-black text-lg px-3 py-1 hover:bg-yellow-400">
                                {player.position}
                            </Badge>
                        </div>
                        <div className="w-full pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Cost</p>
                                <p className="text-2xl font-bold text-yellow-500">{player.cost}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Total Games</p>
                                <p className="text-2xl font-bold text-white">{careerStats.totalGames || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 스탯 차트 */}
                <Card className="md:col-span-2 bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Season Stats Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#3f3f46" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name={player.name}
                                    dataKey="A"
                                    stroke="#eab308"
                                    strokeWidth={3}
                                    fill="#eab308"
                                    fillOpacity={0.3}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                    itemStyle={{ color: '#eab308' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 상세 스탯 테이블 */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Detailed Statistics (2024 Season)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <p className="text-sm text-zinc-500">KDA</p>
                            <p className="text-2xl font-mono text-white">{seasonStats.kda}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-zinc-500">Win Rate</p>
                            <p className="text-2xl font-mono text-white">{seasonStats.winRate}%</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-zinc-500">DPM (Damage Per Minute)</p>
                            <p className="text-2xl font-mono text-white">{seasonStats.dpm}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-zinc-500">GPM (Gold Per Minute)</p>
                            <p className="text-2xl font-mono text-white">{seasonStats.gpm}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
