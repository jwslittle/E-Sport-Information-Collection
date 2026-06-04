'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Player {
    id: string
    name: string
    position: string
    teamId: string
    basePrice: number
    stats: any
    team?: {
        id: string
        name: string
        shortName: string
        logoUrl: string | null
    }
}

interface RosterItem {
    id: string
    position: string
    player: Player | null
    isCaptain: boolean
}

interface Team {
    id: string
    name: string
    type: string // 'REAL' | 'SIMULATION'
    totalPoints: number
    roster: RosterItem[]
    user: {
        id: string
    }
}

export default function TeamViewPage() {
    const params = useParams()
    const router = useRouter()
    const [teamsData, setTeamsData] = useState<{ real: Team | null, sim: Team | null } | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('real')

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch initial team to identify user
                const res = await fetch(`/api/league/team/${params.teamId}`)
                if (!res.ok) throw new Error('Failed to fetch team')
                const initialTeam = await res.json()

                // 2. Fetch all teams for that user
                const userId = initialTeam.user.id
                const allTeamsRes = await fetch(`/api/users/${userId}/teams`)
                const allTeams = await allTeamsRes.json()

                setTeamsData(allTeams)

                // Set active tab based on the type of the team we originally clicked on
                // This ensures if we clicked a Sim team in rankings, we see Sim tab first
                if (initialTeam.type === 'SIMULATION') {
                    setActiveTab('simulation')
                } else {
                    setActiveTab('real')
                }
            } catch (error) {
                console.error(error)
                toast.error('팀 정보를 불러오는데 실패했습니다.')
            } finally {
                setLoading(false)
            }
        }

        if (params.teamId) {
            fetchData()
        }
    }, [params.teamId])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!teamsData) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">팀을 찾을 수 없습니다.</h2>
                <Button onClick={() => router.back()}>뒤로 가기</Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6 pl-0 hover:pl-0 hover:bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" /> 뒤로 가기
            </Button>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border-zinc-800 mb-8">
                    <TabsTrigger value="real">실제 리그 (Real)</TabsTrigger>
                    <TabsTrigger value="simulation">가상 시뮬레이션 (Simulation)</TabsTrigger>
                </TabsList>

                <TabsContent value="real">
                    {teamsData.real ? (
                        <TeamRosterView team={teamsData.real} />
                    ) : (
                        <div className="text-center py-20 text-zinc-500">
                            생성된 실제 리그 팀이 없습니다.
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="simulation">
                    {teamsData.sim ? (
                        <TeamRosterView team={teamsData.sim} />
                    ) : (
                        <div className="text-center py-20 text-zinc-500">
                            생성된 가상 시뮬레이션 팀이 없습니다.
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function TeamRosterView({ team }: { team: Team }) {
    const positions = ['TOP', 'JUNGLE', 'MID', 'BOTTOM', 'SUPPORT', 'WILDCARD']

    return (
        <div>
            <div className="flex items-center gap-6 mb-8">
                <Avatar className="w-20 h-20 border-4 border-primary/20 bg-zinc-800">
                    <AvatarFallback className="bg-zinc-800 text-transparent" />
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{team.name}</h1>
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="bg-zinc-800 px-2 py-1 rounded text-xs font-bold text-zinc-300">
                            {team.type === 'REAL' ? '실제 리그' : '가상 리그'}
                        </span>
                        <span>Total Points: <span className="text-yellow-500 font-bold">{team.totalPoints.toLocaleString()}</span></span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positions.map((pos) => {
                    const rosterItem = team.roster.find(r => r.position === pos || (pos === 'BOTTOM' && r.position === 'ADC'))
                    const player = rosterItem?.player

                    return (
                        <Card key={pos} className={`bg-zinc-900 border-zinc-800 ${rosterItem?.isCaptain ? 'border-yellow-500/50' : ''}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <div className="text-xs font-bold text-zinc-500">{pos}</div>
                                    {rosterItem?.isCaptain && <div className="text-xs font-bold text-yellow-500">CAPTAIN</div>}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {player ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-zinc-500 border border-zinc-700 overflow-hidden">
                                            {player.team?.logoUrl ? (
                                                <img src={player.team.logoUrl} alt={player.team.shortName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px]">{player.team?.shortName || player.team?.name?.substring(0, 3) || 'FA'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg">{player.name}</div>
                                            <div className="text-xs text-zinc-400">{player.position}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-12 flex items-center text-zinc-600 text-sm italic">
                                        선수 없음
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
