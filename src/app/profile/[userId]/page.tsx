'use client'

import { use, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Users, MessageSquare, Target, Brain, Crown, Tag,
    Loader2, UserPlus, UserMinus, ArrowLeft, Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { TEAM_COLORS } from '@/lib/config/teams'

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface PublicProfile {
    id: string; name: string | null; image: string | null; gp?: number; createdAt: string
    profile: { displayTitle: string | null; bio: string | null; favoriteTeam: string | null } | null
    equippedCosmetics: { type: string; name: string; titleText: string | null; imageUrl: string | null }[]
    stats: { following: number; followers: number; posts: number; predictions: number; quizAnswers: number }
    isFollowing: boolean; isMe: boolean
    recentPosts: {
        id: string; title: string; category: string; createdAt: string
        commentCount: number; likeCount: number
    }[]
}

const CATEGORY_LABELS: Record<string, string> = {
    FREE: '자유', ANALYSIS: '분석', PREDICTION: '예측토론', INFO: '정보'
}

function timeAgo(dateStr: string) {
    try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ko }) }
    catch { return dateStr }
}

// ✅ Next.js 16: 클라이언트 컴포넌트에서 React.use()로 params 언래핑
export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params)
    const { data: session } = useSession()
    const router = useRouter()

    const [profile, setProfile] = useState<PublicProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [followLoading, setFollowLoading] = useState(false)

    const myId = (session?.user as any)?.id

    useEffect(() => {
        // 내 프로필은 /profile로 리다이렉트
        if (myId && myId === userId) {
            router.replace('/profile')
            return
        }
        fetch(`/api/users/${userId}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setProfile(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [userId, myId, router])

    const handleFollow = async () => {
        if (!session) { toast.error('로그인이 필요합니다.'); return }
        if (!profile) return
        setFollowLoading(true)
        try {
            const method = profile.isFollowing ? 'DELETE' : 'POST'
            const res = await fetch('/api/friends', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId }),
            })
            if (res.ok) {
                const wasFollowing = profile.isFollowing
                setProfile(prev => prev ? {
                    ...prev,
                    isFollowing: !prev.isFollowing,
                    stats: {
                        ...prev.stats,
                        followers: prev.stats.followers + (wasFollowing ? -1 : 1),
                    },
                } : prev)
                toast.success(wasFollowing ? '팔로우를 취소했습니다.' : `${profile.name}님을 팔로우합니다!`)
            } else {
                const d = await res.json()
                toast.error(d.error ?? '오류가 발생했습니다.')
            }
        } finally { setFollowLoading(false) }
    }

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-yellow-500" /></div>
    }

    if (!profile) {
        return (
            <div className="text-center py-20 space-y-3">
                <p className="text-zinc-500">사용자를 찾을 수 없습니다.</p>
                <Link href="/community"><Button variant="outline">커뮤니티로</Button></Link>
            </div>
        )
    }

    const favoriteTeamCode = profile.profile?.favoriteTeam ?? null
    const teamColor = favoriteTeamCode ? TEAM_COLORS[favoriteTeamCode] : undefined
    const displayTitle = profile.equippedCosmetics.find(c => c.type === 'TITLE')?.titleText
        ?? profile.profile?.displayTitle

    return (
        <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
            {/* 뒤로가기 */}
            <button onClick={() => router.back()} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> 뒤로
            </button>

            {/* 프로필 카드 */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-5">
                {/* 상단: 아바타 + 이름 + 팔로우 */}
                <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20 border-2 border-zinc-700">
                        <AvatarImage src={profile.image ?? ''} />
                        <AvatarFallback className="text-2xl bg-zinc-800">
                            {profile.name?.[0] ?? 'U'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-1.5">
                        <div>
                            <h1 className="text-xl font-bold text-white">{profile.name ?? '익명 유저'}</h1>
                            {displayTitle && (
                                <p className="text-yellow-400 text-sm flex items-center gap-1">
                                    <Crown className="w-3.5 h-3.5" />
                                    {displayTitle}
                                </p>
                            )}
                        </div>
                        {profile.profile?.bio && (
                            <p className="text-sm text-zinc-400">{profile.profile.bio}</p>
                        )}
                        {favoriteTeamCode && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <span>응원팀:</span>
                                <span
                                    className="font-bold"
                                    style={{ color: teamColor }}
                                >
                                    {favoriteTeamCode}
                                </span>
                            </div>
                        )}
                        <p className="text-xs text-zinc-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {timeAgo(profile.createdAt)} 가입
                        </p>
                    </div>

                    {/* 팔로우 버튼 */}
                    {session && !profile.isMe && (
                        <Button
                            size="sm"
                            variant={profile.isFollowing ? 'outline' : 'default'}
                            className={profile.isFollowing
                                ? 'border-zinc-600 text-zinc-300'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-black font-bold'}
                            onClick={handleFollow}
                            disabled={followLoading}
                        >
                            {followLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : profile.isFollowing ? (
                                <><UserMinus className="w-4 h-4 mr-1" />팔로우 취소</>
                            ) : (
                                <><UserPlus className="w-4 h-4 mr-1" />팔로우</>
                            )}
                        </Button>
                    )}
                </div>

                {/* 통계 */}
                <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                        { label: '팔로잉', value: profile.stats.following, icon: <Users className="w-4 h-4" /> },
                        { label: '팔로워', value: profile.stats.followers, icon: <Users className="w-4 h-4" /> },
                        { label: '게시글', value: profile.stats.posts, icon: <MessageSquare className="w-4 h-4" /> },
                        { label: '예측',   value: profile.stats.predictions, icon: <Target className="w-4 h-4" /> },
                    ].map(stat => (
                        <div key={stat.label} className="bg-zinc-800/40 rounded-lg py-3 px-2 space-y-1">
                            <div className="flex justify-center text-zinc-500">{stat.icon}</div>
                            <p className="text-lg font-black text-white">{stat.value.toLocaleString()}</p>
                            <p className="text-xs text-zinc-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 최근 게시글 */}
            {profile.recentPosts.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        최근 게시글
                    </h2>
                    <div className="space-y-2">
                        {profile.recentPosts.map(post => (
                            <Link
                                key={post.id}
                                href={`/community/${post.id}`}
                                className="block bg-zinc-900/40 border border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                                        {CATEGORY_LABELS[post.category] ?? post.category}
                                    </span>
                                    <span className="text-sm text-white font-medium truncate flex-1">{post.title}</span>
                                    <span className="text-xs text-zinc-600 shrink-0">{timeAgo(post.createdAt)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <Link href={`/community?author=${userId}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                        게시글 더보기 →
                    </Link>
                </div>
            )}
        </div>
    )
}
