
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, RotateCcw, Swords, Trophy, Calendar, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Match {
    id: string
    round: number
    matchDate: string
    status: string
    team1: { name: string, code: string, logoUrl?: string }
    team2: { name: string, code: string, logoUrl?: string }
    team1Score: number
    team2Score: number
    winner?: { name: string, code: string }
    details?: string // JSON string
}

export default function SimulationPage() {
    const { data: session } = useSession()
    const [round, setRound] = useState(0)
    const [loading, setLoading] = useState(false)
    const [matches, setMatches] = useState<Match[]>([])
    const [progress, setProgress] = useState(0)

    // Admin check (Update email as needed)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    const fetchMatches = async () => {
        try {
            const res = await fetch('/api/matches', { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setMatches(data.matches)

                // Determine current round
                const scheduled = data.matches.find((m: Match) => m.status === 'SCHEDULED')
                const lastCompleted = [...data.matches].reverse().find((m: Match) => m.status === 'COMPLETED')

                // Calculate Progress
                const total = data.matches.length
                const completed = data.matches.filter((m: Match) => m.status === 'COMPLETED').length
                setProgress(total > 0 ? (completed / total) * 100 : 0)

                if (scheduled) {
                    setRound(scheduled.round)
                } else if (lastCompleted) {
                    setRound(lastCompleted.round + 1) // Season finished?
                } else {
                    setRound(1)
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchMatches()
    }, [])

    const handleReset = async () => {
        if (!confirm('정말로 시즌을 초기화하시겠습니까? 모든 경기 결과와 포인트가 삭제됩니다.')) return
        setLoading(true)
        try {
            const res = await fetch('/api/simulation/reset', { method: 'POST' })
            if (res.ok) {
                alert('시즌이 초기화되었습니다.')
                fetchMatches()
            } else {
                const data = await res.json()
                alert('초기화 실패: ' + data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUserReset = async () => {
        if (!confirm('경고: 관리자를 제외한 모든 유저 데이터가 영구 삭제됩니다. 진행하시겠습니까?')) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/reset', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                alert(data.message)
                fetchMatches()
            } else {
                alert('유저 초기화 실패: ' + data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleNextRound = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/simulation/next-round', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                if (data.message === 'Season Completed') {
                    alert('시즌이 종료되었습니다!')
                } else {
                    fetchMatches()
                }
            } else {
                alert('오류: ' + data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Filter matches for display
    const currentRoundMatches = matches.filter(m => m.round === round)
    const completedMatches = matches.filter(m => m.status === 'COMPLETED').sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())

    return (
        <div className="space-y-8 container mx-auto py-8 px-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">시뮬레이션 센터</h1>
                    <p className="text-zinc-400 mt-1">2026 LCK 스프링 시즌 시뮬레이션</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {isAdmin ? (
                        <>
                            <Button
                                onClick={handleReset}
                                disabled={loading}
                                variant="outline"
                                className="w-full md:w-auto border-zinc-700"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                시즌 초기화
                            </Button>
                    <Button
                        onClick={handleUserReset}
                        disabled={loading}
                        variant="destructive"
                        className="w-full md:w-auto bg-red-700 hover:bg-red-800"
                    >
                        <Swords className="mr-2 h-4 w-4" />
                        유저 데이터 초기화
                    </Button>
                    <Button
                        onClick={handleNextRound}
                        disabled={loading}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold w-full md:w-auto"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        {loading ? '진행 중...' : `Round ${round} 진행`}
                    </Button>
                </>
                ) : (
                <Badge variant="outline" className="text-zinc-500 border-zinc-700">
                    관리자 전용 기능입니다
                </Badge>
                    )}
            </div>
        </div>

            {/* Progress Bar */ }
    <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
                <span>시즌 진행률</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-zinc-800" indicatorClassName="bg-yellow-500" />
        </CardContent>
    </Card>

    {/* Current Round Schedule */ }
    {
        currentRoundMatches.length > 0 ? (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-yellow-500" />
                    진행 예정 매치 (Round {round})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {currentRoundMatches.map((match) => (
                        <Card key={match.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
                                <div className="text-xs text-zinc-500 font-mono">{new Date(match.matchDate).toLocaleDateString()}</div>
                                <div className="flex items-center justify-between w-full gap-2">
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 mb-1">
                                            {match.team1.code}
                                        </div>
                                        <span className="text-sm font-bold text-white truncate max-w-[80px]">{match.team1.name}</span>
                                    </div>
                                    <span className="text-zinc-600 font-bold text-xs">VS</span>
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 mb-1">
                                            {match.team2.code}
                                        </div>
                                        <span className="text-sm font-bold text-white truncate max-w-[80px]">{match.team2.name}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        ) : (
        <Alert className="bg-zinc-900 border-zinc-800">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-white">예정된 경기가 없습니다</AlertTitle>
            <AlertDescription className="text-zinc-400">
                모든 경기가 종료되었거나 예정된 일정이 없습니다.
            </AlertDescription>
        </Alert>
    )
    }

    {/* Completed Matches Log */ }
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            최근 경기 결과
        </h2>
        <div className="grid grid-cols-1 gap-4">
            {completedMatches.slice(0, 10).map((match) => (
                <Card key={match.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        {/* Match Summary */}
                        <div className="p-6 flex-1 flex items-center justify-between border-b md:border-b-0 md:border-r border-zinc-800">
                            <div className="flex items-center gap-4 flex-1 justify-end">
                                <span className={`text-lg font-bold ${match.winner?.code === match.team1.code ? 'text-yellow-500' : 'text-white'}`}>
                                    {match.team1.name}
                                </span>
                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                                    {match.team1.code}
                                </div>
                            </div>

                            <div className="px-6 flex flex-col items-center">
                                <div className="text-3xl font-black text-white tracking-widest">
                                    {match.team1Score} : {match.team2Score}
                                </div>
                                <Badge variant="secondary" className="mt-2 text-[10px] bg-zinc-800 text-zinc-400">
                                    Round {match.round}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-4 flex-1 justify-start">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                                    {match.team2.code}
                                </div>
                                <span className={`text-lg font-bold ${match.winner?.code === match.team2.code ? 'text-yellow-500' : 'text-white'}`}>
                                    {match.team2.name}
                                </span>
                            </div>
                        </div>

                        {/* Match Details (Scrollable) */}
                        <div className="w-full md:w-[400px] bg-zinc-950/50 p-4">
                            <ScrollArea className="h-[120px]">
                                {match.details && (() => {
                                    try {
                                        const games = JSON.parse(match.details)
                                        return games.map((game: any, idx: number) => (
                                            <div key={idx} className="mb-3 last:mb-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-zinc-500">Game {idx + 1}</span>
                                                    <span className="text-xs text-zinc-600">{game.duration}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {/* Show Top Performer (Highest Points) */}
                                                    {(() => {
                                                        const bestPlayer = Object.entries(game.stats).sort(([, a]: any, [, b]: any) => b.points - a.points)[0]
                                                        if (!bestPlayer) return null
                                                        const [pid, stats]: [string, any] = bestPlayer
                                                        return (
                                                            <div className="flex justify-between text-xs text-zinc-400">
                                                                <span className="text-yellow-500">MVP (Sim)</span>
                                                                <span>{stats.kills}/{stats.deaths}/{stats.assists} ({stats.points.toFixed(1)}pts)</span>
                                                            </div>
                                                        )
                                                    })()}
                                                </div>
                                            </div>
                                        ))
                                    } catch (e) { return <div className="text-red-500 text-xs">Error parsing details</div> }
                                })()}
                            </ScrollArea>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    </div>
        </div >
    )
}
