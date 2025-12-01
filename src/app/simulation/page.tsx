'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, RotateCcw, Swords } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SimulationLog {
    name: string
    team: string
    position: string
    stats: {
        kills: number
        deaths: number
        assists: number
        cs: number
        visionScore: number
        isWin: boolean
    }
    points: number
    bonuses: {
        multiKill: string[]
        kda: boolean
        carry: boolean
    }
}

interface MatchLog {
    id?: string
    round: number
    team1: string
    team2: string
    winner: string
    details: SimulationLog[]
}

interface Matchup {
    team1: string
    team2: string
}

export default function SimulationPage() {
    const [round, setRound] = useState(0)
    const [logs, setLogs] = useState<MatchLog[]>([])
    const [upcomingMatches, setUpcomingMatches] = useState<Matchup[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchState()
    }, [])

    const fetchState = async () => {
        try {
            const res = await fetch('/api/simulation/state')
            const data = await res.json()
            if (data.success) {
                setRound(data.gameState.currentRound)

                if (data.gameState.upcomingMatches) {
                    setUpcomingMatches(JSON.parse(data.gameState.upcomingMatches))
                }

                if (data.gameState.currentRound === 0) {
                    setLogs([])
                    return
                }

                const parsedLogs = data.logs.map((l: any) => ({
                    ...l,
                    details: typeof l.details === 'string' ? JSON.parse(l.details) : l.details
                }))

                setLogs(parsedLogs)
            }
        } catch (error) {
            console.error('Failed to fetch state:', error)
        }
    }

    const handleNextRound = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/simulation/next-round', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setRound(data.currentRound)
                setUpcomingMatches(data.nextMatches)
                fetchState()
            }
        } catch (error) {
            console.error('Simulation error:', error)
            alert('시뮬레이션 실패')
        } finally {
            setLoading(false)
        }
    }

    const handleReset = async () => {
        if (!confirm('정말로 시즌을 초기화하시겠습니까? 모든 기록과 포인트가 삭제됩니다.')) return
        setLoading(true)
        try {
            const res = await fetch('/api/simulation/reset', { method: 'POST' })
            if (res.ok) {
                setRound(0)
                setLogs([])
                setUpcomingMatches([])
                alert('시즌이 초기화되었습니다.')
                fetchState()
            }
        } catch (error) {
            console.error('Reset error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 container mx-auto py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">2024 시즌 시뮬레이션</h1>
                    <p className="text-zinc-400">실시간 경기 시뮬레이션 및 판타지 포인트 집계</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                        <p className="text-sm text-zinc-400">현재 라운드</p>
                        <p className="text-2xl font-bold text-yellow-500">Round {round}</p>
                    </div>
                    <Button
                        onClick={handleReset}
                        disabled={loading}
                        variant="outline"
                        className="border-red-600 text-red-500 hover:bg-red-900/20"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        시즌 초기화
                    </Button>
                    <Button
                        onClick={handleNextRound}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        {loading ? '진행 중...' : '다음 라운드 진행'}
                    </Button>
                </div>
            </div>

            {/* Matchups */}
            {upcomingMatches.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <Swords className="w-5 h-5 text-yellow-500" />
                            다음 라운드 대진표 (Round {round + 1})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {upcomingMatches.map((match, idx) => (
                                <div key={idx} className="bg-zinc-800/50 p-3 rounded-lg flex items-center justify-between border border-zinc-700">
                                    <span className="font-bold text-white">{match.team1}</span>
                                    <span className="text-zinc-500 text-xs">VS</span>
                                    <span className="font-bold text-white">{match.team2}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {logs.map((matchLog, index) => (
                    <Card key={matchLog.id || index} className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg text-white">
                                Round {matchLog.round} - {matchLog.team1} vs {matchLog.team2}
                            </CardTitle>
                            <Badge variant={matchLog.winner === matchLog.team1 ? "default" : "secondary"} className="bg-blue-600">
                                Winner: {matchLog.winner}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px] w-full rounded-md border border-zinc-800 p-4">
                                <div className="space-y-4">
                                    {matchLog.details.map((player) => (
                                        <div key={player.name} className="flex items-center justify-between text-sm border-b border-zinc-800 pb-2 last:border-0">
                                            <div className="flex items-center gap-2 min-w-[180px]">
                                                <span className={`font-bold w-24 ${player.stats.isWin ? 'text-blue-400' : 'text-red-400'}`}>
                                                    {player.name} {player.stats.isWin ? '(승)' : '(패)'}
                                                </span>
                                                <span className="text-zinc-500 text-xs">{player.team} - {player.position}</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center gap-4 text-xs">
                                                <span className="text-zinc-300">
                                                    {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}
                                                </span>
                                                <span className="text-zinc-500">CS {player.stats.cs}</span>
                                                <span className="text-zinc-500">시야 {player.stats.visionScore}</span>
                                                <div className="flex gap-1">
                                                    {player.bonuses.multiKill.map((mk: string) => (
                                                        <span key={mk} className="px-1 bg-red-900/50 text-red-200 rounded text-[10px]">{mk}</span>
                                                    ))}
                                                    {player.bonuses.kda && <span className="px-1 bg-green-900/50 text-green-200 rounded text-[10px]">KDA+</span>}
                                                    {player.bonuses.carry && <span className="px-1 bg-yellow-900/50 text-yellow-200 rounded text-[10px]">CARRY</span>}
                                                </div>
                                            </div>
                                            <div className="font-bold text-yellow-500 w-16 text-right">
                                                +{player.points.toFixed(1)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                ))}

                {logs.length === 0 && (
                    <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                        '다음 라운드 진행' 버튼을 눌러 시뮬레이션을 시작하세요.
                    </div>
                )}
            </div>
        </div>
    )
}
