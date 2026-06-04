'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Loader2, Crown } from 'lucide-react'

interface TeamViewerModalProps {
    userId: string | null
    isOpen: boolean
    onClose: () => void
}

interface TeamData {
    id: string
    name: string
    image: string | null
    totalPoints: number
    user: {
        name: string | null
        image: string | null
    }
    players: {
        playerId: string
        position: string
        isStarter: boolean
        isCaptain: boolean
        player: {
            name: string
            team: string
            cost: number
            seasonStats: string
        }
    }[]
}

export function TeamViewerModal({ userId, isOpen, onClose }: TeamViewerModalProps) {
    const [team, setTeam] = useState<TeamData | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && userId) {
            fetchTeam()
        } else {
            setTeam(null)
        }
    }, [isOpen, userId])

    const fetchTeam = async () => {
        if (!userId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/users/${userId}/team`)
            if (!res.ok) throw new Error('Failed to fetch team')
            const data = await res.json()
            setTeam(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getPlayerStats = (statsJson: string) => {
        try {
            const stats = JSON.parse(statsJson)
            return {
                points: (stats.fantasyPoints || 0).toFixed(2)
            }
        } catch {
            return { points: '0.00' }
        }
    }

    const starters = team?.players.filter(p => p.isStarter) || []
    const wildcard = team?.players.find(p => !p.isStarter)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>팀 정보</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                    </div>
                ) : team ? (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between bg-zinc-800/50 p-6 rounded-xl">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20 border-2 border-yellow-500">
                                    <AvatarImage src={team.image || ''} />
                                    <AvatarFallback className="bg-zinc-700 text-yellow-500 text-2xl">
                                        <Trophy />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                                    {/* Owner name removed for privacy */}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-zinc-400">Total Points</p>
                                <p className="text-3xl font-bold text-yellow-500">
                                    {team.totalPoints.toLocaleString()} pts
                                </p>
                            </div>
                        </div>

                        {/* Starters */}
                        <div>
                            <h3 className="text-lg font-bold mb-3 text-green-400">선발 라인업 (Starters)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map(pos => {
                                    const player = starters.find(p => p.position === pos)
                                    return (
                                        <Card key={pos} className={`bg-zinc-800 border-zinc-700 ${player?.isCaptain ? 'border-yellow-500 ring-1 ring-yellow-500' : ''}`}>
                                            <CardContent className="p-4 text-center relative">
                                                <Badge className="absolute top-2 right-2 bg-zinc-700 text-[10px]">{pos}</Badge>
                                                {player?.isCaptain && (
                                                    <div className="absolute top-2 left-2 text-yellow-500">
                                                        <Crown className="h-4 w-4 fill-yellow-500" />
                                                    </div>
                                                )}

                                                {player ? (
                                                    <>
                                                        <Avatar className="h-12 w-12 mx-auto mb-2 mt-4">
                                                            <AvatarImage src={`/images/players/${player.player.name.toLowerCase()}.png`} />
                                                            <AvatarFallback>{player.player.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <p className="font-bold text-white text-sm">{player.player.name}</p>
                                                        <p className="text-xs text-zinc-400">{player.player.team}</p>
                                                        <div className="mt-2 text-xs font-mono text-yellow-500">
                                                            {getPlayerStats(player.player.seasonStats).points} pts
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="h-24 flex items-center justify-center text-zinc-600 text-sm">Empty</div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Wildcard */}
                        {wildcard && (
                            <div>
                                <h3 className="text-lg font-bold mb-3 text-zinc-400">와일드카드 (Wildcard)</h3>
                                <div className="w-full md:w-1/5">
                                    <Card className="bg-zinc-800 border-zinc-700">
                                        <CardContent className="p-4 text-center relative">
                                            <Badge className="absolute top-2 right-2 bg-zinc-700 text-[10px]">{wildcard.position}</Badge>
                                            <Avatar className="h-12 w-12 mx-auto mb-2 mt-4">
                                                <AvatarImage src={`/images/players/${wildcard.player.name.toLowerCase()}.png`} />
                                                <AvatarFallback>{wildcard.player.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-bold text-white text-sm">{wildcard.player.name}</p>
                                            <p className="text-xs text-zinc-400">{wildcard.player.team}</p>
                                            <div className="mt-2 text-xs font-mono text-zinc-500">
                                                {getPlayerStats(wildcard.player.seasonStats).points} pts (33%)
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-zinc-500">
                        팀 정보를 불러올 수 없습니다.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
