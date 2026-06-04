
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function RealMatchView() {
    const [matches, setMatches] = useState<any[]>([])

    useEffect(() => {
        const fetchMatches = async () => {
            const res = await fetch('/api/matches?type=REAL')
            const data = await res.json()
            setMatches(data.matches || [])
        }
        fetchMatches()
    }, [])

    return (
        <div className="space-y-4">
            {matches.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded">
                    예정된 실제 경기가 없습니다.
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
    )
}
