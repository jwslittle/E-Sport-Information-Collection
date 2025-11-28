'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, RotateCcw } from 'lucide-react'

export default function SimulationPage() {
    const [round, setRound] = useState(0)
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const handleNextRound = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/simulation/next-round', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setRound(prev => prev + 1)
                setLogs(prev => [data.roundStats, ...prev])
            }
        } catch (error) {
            console.error('Simulation error:', error)
            alert('Simulation failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">2024 Season Simulation</h1>
                    <p className="text-zinc-400">Simulate live matches and update fantasy points.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                        <p className="text-sm text-zinc-400">Current Round</p>
                        <p className="text-2xl font-bold text-yellow-500">Round {round}</p>
                    </div>
                    <Button
                        onClick={handleNextRound}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        {loading ? 'Simulating...' : 'Next Round'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {logs.map((log, index) => (
                    <Card key={index} className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-white">Round {round - index} Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px] w-full rounded-md border border-zinc-800 p-4">
                                <div className="space-y-4">
                                    {Object.values(log).map((player: any) => (
                                        <div key={player.name} className="flex items-center justify-between text-sm border-b border-zinc-800 pb-2 last:border-0">
                                            <div className="flex items-center gap-2 min-w-[180px]">
                                                <span className={`font-bold w-24 ${player.stats.isWin ? 'text-blue-400' : 'text-red-400'}`}>
                                                    {player.name} {player.stats.isWin ? '(W)' : '(L)'}
                                                </span>
                                                <span className="text-zinc-500 text-xs">{player.team} - {player.position}</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center gap-4 text-xs">
                                                <span className="text-zinc-300">
                                                    {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}
                                                </span>
                                                <span className="text-zinc-500">CS {player.stats.cs}</span>
                                                <span className="text-zinc-500">VS {player.stats.visionScore}</span>
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
                        Press "Next Round" to start the simulation.
                    </div>
                )}
            </div>
        </div>
    )
}
