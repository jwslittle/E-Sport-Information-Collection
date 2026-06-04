
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Play } from 'lucide-react'

export default function SimulationView() {
    const [matches, setMatches] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const fetchMatches = async () => {
        const res = await fetch('/api/matches?type=SIMULATION')
        const data = await res.json()
        setMatches(data.matches || [])
    }

    useEffect(() => {
        fetchMatches()
    }, [])

    const handleAction = async (action: string) => {
        setLoading(true)
        try {
            await fetch('/api/simulation/control', {
                method: 'POST',
                body: JSON.stringify({ action })
            })
            toast.success('완료되었습니다!')
            fetchMatches()
        } catch (e) {
            console.error(e)
            toast.error('요청에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <Button onClick={() => handleAction('GENERATE_SCHEDULE')} disabled={loading} variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    일정 생성 (비시즌용)
                </Button>
                <Button onClick={() => handleAction('RUN_DAILY')} disabled={loading}>
                    <Play className="mr-2 h-4 w-4" />
                    오늘의 경기 시뮬레이션
                </Button>
            </div>

            <div className="grid gap-4">
                {matches.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded">
                        생성된 시뮬레이션 일정이 없습니다.
                    </div>
                ) : (
                    matches.map((match) => (
                        <Card key={match.id} className="bg-zinc-900 border-zinc-800">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="text-sm text-zinc-500">
                                    {new Date(match.matchDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-4 flex-1 justify-center">
                                    <span className={`font-bold ${match.winnerId === match.team1Id ? 'text-blue-400' : 'text-white'}`}>
                                        {match.team1Name}
                                    </span>
                                    <div className="px-3 py-1 bg-zinc-800 rounded text-sm font-mono">
                                        {match.status === 'COMPLETED' ? `${match.team1Score} : ${match.team2Score}` : 'VS'}
                                    </div>
                                    <span className={`font-bold ${match.winnerId === match.team2Id ? 'text-blue-400' : 'text-white'}`}>
                                        {match.team2Name}
                                    </span>
                                </div>
                                <Badge variant={match.status === 'COMPLETED' ? 'default' : 'outline'}>
                                    {match.status}
                                </Badge>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
