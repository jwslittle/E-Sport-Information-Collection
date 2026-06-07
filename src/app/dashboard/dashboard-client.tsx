"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Target, BookOpen, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopUser {
    rank: number
    userId: string
    userName: string
    image: string | null
    total: number
    correct: number
    accuracy: number
    gpEarned: number
    isMe: boolean
}

interface DashboardStats {
    recentPredictionCount: number
    topAccuracyUsers: TopUser[]
    todayQuizCount: number
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_COLOR = (rank: number) =>
    rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-zinc-300' : rank === 3 ? 'text-amber-600' : 'text-zinc-500'

export function DashboardClient() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/dashboard')
            .then(r => {
                // ✅ r.ok 체크: 오류 응답 시 JSON 파싱 시도 스킵
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
            .then(d => setStats(d))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    if (!stats || 'error' in stats) {
        return <div className="py-20 text-center text-red-500">데이터를 불러올 수 없습니다.</div>
    }

    return (
        <div className="space-y-6">
            {/* 요약 카드 3개 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="p-3 rounded-lg bg-yellow-500/10">
                            <Target className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">최근 7일 예측 참여</p>
                            <p className="text-2xl font-bold text-white">
                                {stats.recentPredictionCount.toLocaleString()}
                                <span className="text-sm text-zinc-500 ml-1">건</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">예측 정확도 Top 5</p>
                            <p className="text-2xl font-bold text-white">
                                {stats.topAccuracyUsers[0]?.accuracy ?? '-'}
                                {stats.topAccuracyUsers[0] && <span className="text-sm text-zinc-500 ml-1">% (1위)</span>}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="p-3 rounded-lg bg-green-500/10">
                            <BookOpen className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">오늘 퀴즈 참여자</p>
                            <p className="text-2xl font-bold text-white">
                                {stats.todayQuizCount.toLocaleString()}
                                <span className="text-sm text-zinc-500 ml-1">명</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 예측 정확도 상위 5명 */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Target className="w-5 h-5 text-yellow-400" />
                        예측 정확도 Top 5
                    </CardTitle>
                    <CardDescription>최소 3경기 이상 예측한 유저 기준 · 정확도 순</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.topAccuracyUsers.length === 0 ? (
                        <p className="text-zinc-500 text-sm py-4 text-center">아직 데이터가 없습니다.</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.topAccuracyUsers.map(user => (
                                <div key={user.userId}
                                    className={cn(
                                        'flex items-center gap-3 p-3 rounded-lg border',
                                        user.isMe
                                            ? 'border-yellow-500/40 bg-yellow-900/10'
                                            : 'border-zinc-800 bg-zinc-800/30'
                                    )}>
                                    <div className={cn('w-8 text-center text-lg font-bold shrink-0', RANK_COLOR(user.rank))}>
                                        {MEDAL[user.rank] ?? user.rank}
                                    </div>
                                    <Avatar className="h-8 w-8 border border-zinc-700 shrink-0">
                                        <AvatarImage src={user.image ?? ''} />
                                        <AvatarFallback className="bg-zinc-700 text-xs">
                                            {user.userName?.[0]?.toUpperCase() ?? '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white text-sm truncate">{user.userName}</span>
                                            {user.isMe && <Badge className="text-[10px] bg-yellow-600 text-black px-1.5">나</Badge>}
                                        </div>
                                        <p className="text-xs text-zinc-500">{user.correct}/{user.total} 적중</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={cn(
                                            'text-lg font-bold',
                                            user.accuracy >= 70 ? 'text-green-400'
                                                : user.accuracy >= 50 ? 'text-yellow-400'
                                                    : 'text-red-400'
                                        )}>
                                            {user.accuracy}%
                                        </p>
                                        <p className="text-xs text-zinc-500">+{user.gpEarned} GP</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
