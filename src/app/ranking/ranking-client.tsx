'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Trophy, Users, UserPlus, Search, Loader2, UserCheck, Target, Coins
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEAM_COLORS } from '@/lib/config/teams'
import { UserName } from '@/components/admin-badge'

// ─── 타입 ────────────────────────────────────────────────────────────
interface RankItem {
    rank: number
    userId: string
    userName: string | null
    image: string | null
    gp?: number
    role?: string
    title?: string | null
    isMe: boolean
}

interface PredictionRankItem {
    rank: number
    userId: string
    userName: string | null
    image: string | null
    title: string | null
    favoriteTeam: string | null
    total: number
    correct: number
    accuracy: number
    gpEarned: number
    isMe: boolean
}

interface SearchUser {
    id: string
    name: string | null
    image: string | null
    title: string | null
    isFollowing: boolean
}


const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_COLOR = (rank: number) =>
    rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-zinc-300' : rank === 3 ? 'text-amber-600' : 'text-zinc-500'

// ─── GP 랭킹 카드 ─────────────────────────────────────────────────────
function RankCard({ item, scoreLabel }: { item: RankItem; scoreLabel: string }) {
    const score = item.gp ?? 0
    return (
        <Card className={cn(
            'border transition-all hover:brightness-105',
            item.isMe ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-zinc-800 bg-zinc-900/80'
        )}>
            <CardContent className="flex items-center gap-4 p-4">
                <div className={cn('w-10 text-center text-xl font-bold', RANK_COLOR(item.rank))}>
                    {MEDAL[item.rank] ?? item.rank}
                </div>
                <Avatar className="h-10 w-10 border border-zinc-700">
                    <AvatarImage src={item.image ?? ''} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm">
                        {item.userName?.[0]?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <UserName name={item.userName} role={item.role ?? 'USER'} className="truncate" />
                        {item.isMe && <Badge className="text-[10px] bg-yellow-600 text-black px-1.5">나</Badge>}
                    </div>
                    {item.title && item.role !== 'ADMIN' && <p className="text-xs text-yellow-400 font-mono">"{item.title}"</p>}
                </div>
                <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold text-yellow-400">{score.toLocaleString()}</span>
                    <span className="text-xs text-zinc-500 ml-1">{scoreLabel}</span>
                </div>
            </CardContent>
        </Card>
    )
}

// ─── 예측 리더보드 카드 ───────────────────────────────────────────────
function PredictionRankCard({ item }: { item: PredictionRankItem }) {
    const teamColor = item.favoriteTeam ? (TEAM_COLORS[item.favoriteTeam] ?? '#71717a') : '#71717a'
    return (
        <div className={cn(
            'border rounded-xl p-4 flex items-center gap-4 transition-all hover:brightness-105',
            item.isMe ? 'border-yellow-500/40 bg-yellow-900/10' : 'border-zinc-800 bg-zinc-900/80'
        )}>
            {/* 순위 */}
            <div className={cn('w-9 text-center text-xl font-black shrink-0', RANK_COLOR(item.rank))}>
                {MEDAL[item.rank] ?? item.rank}
            </div>

            {/* 아바타 */}
            <Avatar className="h-9 w-9 border border-zinc-700 shrink-0">
                <AvatarImage src={item.image ?? ''} />
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                    {item.userName?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
            </Avatar>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm truncate">{item.userName ?? '익명'}</span>
                    {item.favoriteTeam && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
                            style={{ background: teamColor + '22', border: `1px solid ${teamColor}55`, color: teamColor }}>
                            {item.favoriteTeam}
                        </span>
                    )}
                    {item.isMe && <Badge className="text-[10px] bg-yellow-600 text-black px-1.5">나</Badge>}
                </div>
                {item.title && <p className="text-xs text-yellow-400">"{item.title}"</p>}
                <p className="text-xs text-zinc-600 mt-0.5">{item.correct}/{item.total} 적중</p>
            </div>

            {/* 스탯 */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                    <p className={cn(
                        'text-lg font-black',
                        item.accuracy >= 70 ? 'text-green-400' :
                            item.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                        {item.accuracy}%
                    </p>
                    <p className="text-[10px] text-zinc-600">적중률</p>
                </div>
                <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold text-yellow-400">+{item.gpEarned}</p>
                    <p className="text-[10px] text-zinc-600">GP</p>
                </div>
            </div>
        </div>
    )
}

// ─── 예측 리더보드 탭 ─────────────────────────────────────────────────
function PredictionLeaderboardTab() {
    const [leaderboard, setLeaderboard] = useState<PredictionRankItem[]>([])
    const [myRank, setMyRank] = useState<any>(null)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/lck/predictions/leaderboard?limit=50')
            .then(r => r.json())
            .then(d => {
                setLeaderboard(d.leaderboard ?? [])
                setMyRank(d.myRank ?? null)
                setTotal(d.total ?? 0)
            })
            .catch(err => { console.error(err); toast.error('예측 리더보드를 불러오지 못했습니다.') })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-yellow-500" /></div>
    }

    return (
        <div className="space-y-4">
            {/* 안내 */}
            <div className="bg-blue-500/5 border border-blue-800/30 rounded-xl p-3 text-xs text-blue-300 flex items-start gap-2">
                <Target className="w-4 h-4 mt-0.5 shrink-0" />
                <span>최소 3경기 예측한 유저만 리더보드에 표시됩니다. 적중률이 같으면 예측 수가 많은 유저가 우선합니다.</span>
            </div>

            {/* 내 순위 (상위에 없는 경우) */}
            {myRank && !leaderboard.find(r => r.isMe) && (
                <div className="border border-yellow-500/40 bg-yellow-900/10 rounded-xl p-3 text-sm flex items-center gap-3">
                    <Target className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span className="text-zinc-400">
                        내 순위: <span className="text-yellow-400 font-bold">{myRank.rank}위</span>
                        {' '}· 적중률 <span className="text-white font-bold">{myRank.accuracy}%</span>
                        {' '}· {myRank.correct}/{myRank.total} 적중
                    </span>
                </div>
            )}

            {/* 리더보드 */}
            {leaderboard.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <Target className="w-12 h-12 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500">아직 리더보드 데이터가 없습니다.</p>
                    <p className="text-zinc-600 text-sm">경기를 예측하고 첫 번째 순위에 올라보세요!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {leaderboard.map(item => (
                        <PredictionRankCard key={item.userId} item={item} />
                    ))}
                    {total > 50 && (
                        <p className="text-center text-zinc-600 text-xs pt-2">
                            상위 50명 표시 중 (전체 {total}명 참여)
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── 친구 검색 & 팔로우 ───────────────────────────────────────────────
function FriendSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchUser[]>([])
    const [searching, setSearching] = useState(false)
    const [searched, setSearched] = useState(false)
    const [following, setFollowing] = useState<Set<string>>(new Set())

    const handleSearch = useCallback(async () => {
        if (query.trim().length < 2) return
        setSearching(true)
        setSearched(false)
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
            if (res.ok) setResults(await res.json())
        } finally { setSearching(false); setSearched(true) }
    }, [query])

    const handleFollow = async (user: SearchUser) => {
        const isFollowing = following.has(user.id) || user.isFollowing
        const method = isFollowing ? 'DELETE' : 'POST'
        const res = await fetch('/api/friends', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: user.id }),
        })
        if (res.ok) {
            const newSet = new Set(following)
            isFollowing ? newSet.delete(user.id) : newSet.add(user.id)
            setFollowing(newSet)
            toast.success(isFollowing ? '팔로우 취소' : `${user.name}님을 팔로우했습니다.`)
            setResults(prev => prev.map(u => u.id === user.id ? { ...u, isFollowing: !isFollowing } : u))
        } else {
            const d = await res.json()
            toast.error(d.error ?? '오류 발생')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="이름 또는 이메일로 검색..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="bg-zinc-800 border-zinc-700"
                />
                <Button onClick={handleSearch} disabled={searching} variant="outline" className="border-zinc-700">
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
            </div>

            {searched && !searching && results.length === 0 && (
                <p className="text-center text-zinc-500 text-sm py-4">검색 결과가 없습니다.</p>
            )}

            {results.length > 0 && (
                <div className="space-y-2">
                    {results.map(user => {
                        const isFollowing = following.has(user.id) || user.isFollowing
                        return (
                            <div key={user.id}
                                className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                                <Avatar className="h-9 w-9 border border-zinc-700">
                                    <AvatarImage src={user.image ?? ''} />
                                    <AvatarFallback className="bg-zinc-700 text-xs">{user.name?.[0] ?? '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white text-sm">{user.name}</p>
                                    {user.title && <p className="text-xs text-yellow-400">"{user.title}"</p>}
                                </div>
                                <Button size="sm" variant={isFollowing ? 'outline' : 'default'}
                                    className={isFollowing ? 'border-zinc-600 text-zinc-400' : ''}
                                    onClick={() => handleFollow(user)}>
                                    {isFollowing
                                        ? <><UserCheck className="w-3.5 h-3.5 mr-1" />팔로잉</>
                                        : <><UserPlus className="w-3.5 h-3.5 mr-1" />팔로우</>}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────
export function RankingClient() {
    const { data: session } = useSession()
    const [gpRankings, setGpRankings] = useState<RankItem[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('prediction')

    useEffect(() => {
        fetch('/api/ranking?type=global')
            .then(r => r.json())
            .then(d => setGpRankings(Array.isArray(d) ? d : []))
            .catch(err => { console.error(err); toast.error('GP 랭킹을 불러오지 못했습니다.') })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Trophy className="w-7 h-7 text-yellow-400" />
                <h1 className="text-3xl font-bold text-white">랭킹</h1>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="w-full grid grid-cols-3 bg-zinc-900 border border-zinc-800 h-auto p-1">
                    <TabsTrigger value="prediction" className="gap-1.5 data-[state=active]:bg-zinc-800 py-2.5">
                        <Target className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="hidden sm:inline">예측 리더보드</span>
                        <span className="sm:hidden">예측</span>
                    </TabsTrigger>
                    <TabsTrigger value="gp" className="gap-1.5 data-[state=active]:bg-zinc-800 py-2.5">
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="hidden sm:inline">GP 랭킹</span>
                        <span className="sm:hidden">GP</span>
                    </TabsTrigger>
                    <TabsTrigger value="friends" className="gap-1.5 data-[state=active]:bg-zinc-800 py-2.5">
                        <Users className="w-3.5 h-3.5 text-green-400" />
                        친구
                    </TabsTrigger>
                </TabsList>

                {/* 예측 리더보드 */}
                <TabsContent value="prediction" className="mt-4">
                    <PredictionLeaderboardTab />
                </TabsContent>

                {/* GP 랭킹 */}
                <TabsContent value="gp" className="mt-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                        </div>
                    ) : gpRankings.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">아직 GP 랭킹 데이터가 없습니다.</div>
                    ) : gpRankings.map((item, idx) => (
                        <RankCard key={item.userId ?? idx}
                            item={item}
                            scoreLabel="GP"
                        />
                    ))}
                </TabsContent>

                {/* 친구 */}
                <TabsContent value="friends" className="mt-4">
                    <div className="space-y-6">
                        <FriendSearch />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
