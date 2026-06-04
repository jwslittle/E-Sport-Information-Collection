'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, UserPlus, UserMinus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

interface SearchResult {
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

export function UserSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setSearched(true)
        try {
            const res = await fetch(`/api/league/ranking?search=${encodeURIComponent(query)}&limit=10`)
            if (!res.ok) throw new Error('Search failed')
            const data = await res.json()
            setResults(data.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleFollow = async (targetUserId: string) => {
        try {
            const res = await fetch('/api/league/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId })
            })
            if (!res.ok) throw new Error('Failed to toggle follow')

            const data = await res.json()
            setResults(prev => prev.map(item => {
                if (item.owner.id === targetUserId) {
                    return { ...item, owner: { ...item.owner, isFollowing: data.isFollowing } }
                }
                return item
            }))
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        type="search"
                        placeholder="팀 이름으로 검색..."
                        className="pl-8"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="팀 이름 검색"
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? '검색 중...' : '검색'}
                </Button>
            </form>

            <div className="space-y-2">
                {results.map((item) => (
                    <Card key={item.id}>
                        <CardContent className="p-3 flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={item.image || undefined} />
                                <AvatarFallback>{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            {/* ✅ div onClick → Link로 교체 (키보드 접근성 확보) */}
                            <Link
                                href={`/league/team/${item.id}`}
                                className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                            >
                                <div className="font-medium truncate">{item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {item.totalPoints.toLocaleString()} PTS
                                </div>
                            </Link>

                            {!item.owner.isMe && (
                                <Button
                                    variant={item.owner.isFollowing ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => handleFollow(item.owner.id)}
                                    aria-label={item.owner.isFollowing ? `${item.owner.name} 팔로우 취소` : `${item.owner.name} 팔로우`}
                                >
                                    {item.owner.isFollowing ? (
                                        <><UserMinus className="h-3 w-3 mr-1" aria-hidden="true" /> 팔로우 취소</>
                                    ) : (
                                        <><UserPlus className="h-3 w-3 mr-1" aria-hidden="true" /> 팔로우</>
                                    )}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {searched && results.length === 0 && !loading && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                        &ldquo;{query}&rdquo;에 해당하는 팀이 없습니다.
                    </div>
                )}
            </div>
        </div>
    )
}
