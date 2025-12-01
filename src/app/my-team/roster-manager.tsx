'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, RefreshCw, Trophy, History } from 'lucide-react'

interface Player {
    id: string
    name: string
    team: string
    position: string
    cost: number
    seasonStats?: string
}

interface TeamPlayer {
    playerId: string
    position: string
    isStarter: boolean
    player: Player
}

interface RoundScore {
    round: number
    points: number
    details: string // JSON
}

interface RosterManagerProps {
    teamId: string
    players: TeamPlayer[]
    totalPoints: number
    roundScores: RoundScore[]
}

const POSITIONS = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

export function RosterManager({ teamId, players: initialPlayers, totalPoints, roundScores }: RosterManagerProps) {
    const [players, setPlayers] = useState<TeamPlayer[]>(initialPlayers)
    const [loading, setLoading] = useState(false)

    const starters = players.filter(p => p.isStarter)
    const bench = players.filter(p => !p.isStarter)

    const handleSwap = (player1: TeamPlayer, player2: TeamPlayer) => {
        const newPlayers = players.map(p => {
            if (p.playerId === player1.playerId) return { ...p, isStarter: player2.isStarter }
            if (p.playerId === player2.playerId) return { ...p, isStarter: player1.isStarter }
            return p
        })
        setPlayers(newPlayers)
    }

    const handleFinalize = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/my-team/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId,
                    players: players.map(p => ({
                        playerId: p.playerId,
                        position: p.position,
                        isStarter: p.isStarter
                    }))
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            alert('로스터가 확정되었습니다. 이번 라운드 시뮬레이션에 반영됩니다.')
        } catch (error: any) {
            console.error('Finalize error:', error)
            alert(error.message || '로스터 확정 실패')
        } finally {
            setLoading(false)
        }
    }

    const getPlayerStats = (player: Player) => {
        if (!player.seasonStats) return { games: 0, points: 0, avg: 0 }
        const stats = JSON.parse(player.seasonStats)
        return {
            games: stats.games || 0,
            points: stats.fantasyPoints || 0,
            avg: stats.games ? (stats.fantasyPoints / stats.games).toFixed(1) : 0
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">나의 팀 관리</h2>
                    <p className="text-zinc-400">선발/벤치 선수를 교체하고 로스터를 확정하세요.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-zinc-400">총 획득 포인트</p>
                    <p className="text-3xl font-bold text-yellow-500 flex items-center justify-end gap-2">
                        <Trophy className="w-6 h-6" />
                        {totalPoints.toLocaleString()} pts
                    </p>
                </div>
            </div>

            <Tabs defaultValue="roster" className="w-full">
                <TabsList className="bg-zinc-900 border-zinc-800">
                    <TabsTrigger value="roster">로스터 관리</TabsTrigger>
                    <TabsTrigger value="history">라운드 기록</TabsTrigger>
                </TabsList>

                <TabsContent value="roster" className="space-y-6 mt-6">
                    {/* Starters */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-green-400">선발 라인업 (Starters)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {POSITIONS.map(pos => {
                                    const player = starters.find(p => p.position === pos)
                                    return (
                                        <div key={pos} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 relative group">
                                            <Badge className="absolute top-2 right-2 bg-zinc-700">{pos}</Badge>
                                            {player ? (
                                                <div className="mt-4 text-center">
                                                    <div className="w-16 h-16 bg-zinc-700 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold text-zinc-500">
                                                        {player.player.name[0]}
                                                    </div>
                                                    <p className="font-bold text-white">{player.player.name}</p>
                                                    <p className="text-sm text-zinc-400">{player.player.team}</p>
                                                    <div className="mt-2 text-xs text-zinc-500">
                                                        {getPlayerStats(player.player).points} pts
                                                    </div>

                                                    {/* Swap UI */}
                                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                        <div className="flex flex-col gap-2 p-2 w-full">
                                                            {bench.filter(b => b.position === pos).map(b => (
                                                                <Button
                                                                    key={b.playerId}
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onClick={() => handleSwap(player, b)}
                                                                >
                                                                    Swap with {b.player.name}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-32 flex items-center justify-center text-zinc-600">
                                                    Empty
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bench */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-zinc-400">벤치 (Bench)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 overflow-x-auto pb-4">
                                {bench.map(player => (
                                    <div key={player.playerId} className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800 min-w-[150px] text-center relative group">
                                        <Badge variant="outline" className="absolute top-2 right-2 text-[10px]">{player.position}</Badge>
                                        <div className="w-12 h-12 bg-zinc-800 rounded-full mx-auto mb-2 mt-4 flex items-center justify-center text-lg font-bold text-zinc-600">
                                            {player.player.name[0]}
                                        </div>
                                        <p className="font-bold text-zinc-300">{player.player.name}</p>
                                        <p className="text-xs text-zinc-500">{player.player.team}</p>
                                        <div className="mt-2 text-xs text-zinc-500">
                                            {getPlayerStats(player.player).points} pts
                                        </div>

                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => {
                                                    const starter = starters.find(s => s.position === player.position)
                                                    if (starter) handleSwap(starter, player)
                                                }}
                                            >
                                                Swap to Start
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {bench.length === 0 && <p className="text-zinc-500 text-sm p-4">벤치 선수가 없습니다.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleFinalize}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? '저장 중...' : '로스터 확정'}
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <History className="w-5 h-5" />
                                라운드별 획득 포인트
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-4">
                                    {roundScores.length > 0 ? roundScores.map((score) => {
                                        const details = typeof score.details === 'string' ? JSON.parse(score.details) : score.details
                                        return (
                                            <div key={score.round} className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="font-bold text-white text-lg">Round {score.round}</span>
                                                    <span className="font-bold text-yellow-500 text-xl">+{score.points} pts</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                                    {Object.entries(details).map(([playerId, points]: [string, any]) => {
                                                        const player = players.find(p => p.playerId === playerId)?.player
                                                        return (
                                                            <div key={playerId} className="text-xs bg-zinc-900 p-2 rounded flex justify-between items-center">
                                                                <span className="text-zinc-400">{player?.name || 'Unknown'}</span>
                                                                <span className="text-zinc-200 font-bold">+{points}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <div className="text-center py-10 text-zinc-500">
                                            아직 기록된 라운드가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
