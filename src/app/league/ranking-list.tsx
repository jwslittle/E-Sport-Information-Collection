'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, UserPlus, UserMinus } from 'lucide-react'

interface RankingItem {
    rank: number
    id: string
    name: string
    image: string | null
    totalPoints: number
    owner: {
        id: string
        name: string | null
        image: string | null
        isMe: boolean
        isFollowing: boolean
    }
}

interface RankingListProps {
    type: 'global' | 'friends' | 'wealth'
    leagueType?: 'REAL' | 'SIMULATION'
}

export function RankingList({ type, leagueType = 'REAL' }: RankingListProps) {
    const [rankings, setRankings] = useState<RankingItem[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    const fetchRankings = async (pageNum: number) => {
        try {
            setLoading(true)
            const res = await fetch(`/api/league/ranking?type=${type}&leagueType=${leagueType}&page=${pageNum}&limit=20`)
            if (!res.ok) throw new Error('Failed to fetch rankings')
            const data = await res.json()

            if (pageNum === 1) {
                setRankings(data.data)
            } else {
                setRankings(prev => [...prev, ...data.data])
            }

            setHasMore(data.pagination.page < data.pagination.totalPages)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setPage(1)
        fetchRankings(1)
    }, [type, leagueType])

    const handleFollow = async (targetUserId: string, isFollowing: boolean) => {
        try {
            const res = await fetch('/api/league/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId })
            })
            if (!res.ok) throw new Error('Failed to toggle follow')

            const data = await res.json()

            // Update local state
            setRankings(prev => prev.map(item => {
                if (item.owner.id === targetUserId) {
                    return {
                        ...item,
                        owner: { ...item.owner, isFollowing: data.isFollowing }
                    }
                }
                return item
            }))
        } catch (error) {
            console.error(error)
        }
    }

    const loadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        fetchRankings(nextPage)
    }

    if (loading && page === 1) {
        return (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                <div className="animate-pulse">🧠</div>
                AI가 랭킹 데이터를 분석 중입니다...
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {rankings.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex-none w-8 text-center font-bold text-lg text-muted-foreground">
                            {item.rank <= 3 ? (
                                <Trophy className={`w-6 h-6 mx-auto ${item.rank === 1 ? 'text-yellow-500' :
                                    item.rank === 2 ? 'text-gray-400' :
                                        'text-amber-600'
                                    }`} />
                            ) : (
                                item.rank
                            )}
                        </div>

                        <div
                            className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity cursor-pointer"
                            onClick={() => window.location.href = `/league/team/${item.id}`}
                        >
                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                                <AvatarImage src={item.image || undefined} />
                                <AvatarFallback>{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{item.name}</div>
                            </div>
                        </div>

                        <div className="text-right mr-2">
                            <div className="font-bold text-primary">{item.totalPoints.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{type === 'wealth' ? 'Wealth' : 'PTS'}</div>
                        </div>

                        {!item.owner.isMe && (
                            <Button
                                variant={item.owner.isFollowing ? "secondary" : "outline"}
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleFollow(item.owner.id, item.owner.isFollowing)
                                }}
                            >
                                {item.owner.isFollowing ? (
                                    <UserMinus className="h-4 w-4" />
                                ) : (
                                    <UserPlus className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}

            {rankings.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No rankings found.
                </div>
            )}

            {hasMore && (
                <div className="text-center pt-4">
                    <Button variant="ghost" onClick={loadMore} disabled={loading}>
                        {loading ? 'Loading...' : 'Load More'}
                    </Button>
                </div>
            )}
        </div>
    )
}
