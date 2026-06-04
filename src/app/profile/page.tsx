'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Crown, Tag, Star, Palette, User, Image, Smile, ShoppingBag, Trophy, Pencil, Check, X, LogIn } from 'lucide-react'
import { TEAM_COLORS, LCK_TEAMS } from '@/lib/config/teams'

interface UserProfile {
    id: string; name: string; email: string; image: string | null; gp: number; role: string
    profile: { displayTitle: string | null; bio: string | null; favoriteTeam: string | null } | null
    equippedCosmetics: { type: string; name: string; titleText: string | null; imageUrl: string | null }[]
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    TITLE: <Tag className="w-3.5 h-3.5 text-yellow-400" />,
    AVATAR: <User className="w-3.5 h-3.5 text-blue-400" />,
    STICKER: <Smile className="w-3.5 h-3.5 text-green-400" />,
    PLAYER_CARD: <Star className="w-3.5 h-3.5 text-purple-400" />,
    PROFILE_FRAME: <Image className="w-3.5 h-3.5 text-cyan-400" />,
    BACKGROUND: <Palette className="w-3.5 h-3.5 text-pink-400" />,
}
const TYPE_KO: Record<string, string> = {
    TITLE: '칭호', AVATAR: '아바타', STICKER: '스티커',
    PLAYER_CARD: '카드 스킨', PROFILE_FRAME: '프레임', BACKGROUND: '배경',
}

export default function ProfilePage() {
    const { data: session } = useSession()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editTeam, setEditTeam] = useState('')
    const [editBio, setEditBio] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!session) { setLoading(false); return }
        fetch('/api/users/me')
            .then(r => r.json())
            .then(d => {
                setProfile(d)
                setEditTeam(d.profile?.favoriteTeam ?? '')
                setEditBio(d.profile?.bio ?? '')
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [session])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favoriteTeam: editTeam, bio: editBio }),
            })
            const d = await res.json()
            if (res.ok) {
                toast.success('프로필이 저장되었습니다.')
                setProfile(prev => prev ? {
                    ...prev,
                    profile: {
                        ...(prev.profile ?? { displayTitle: null, bio: null, favoriteTeam: null }),
                        favoriteTeam: editTeam || null,
                        bio: editBio || null,
                    }
                } : prev)
                setEditing(false)
            } else {
                toast.error(d.error ?? '저장 실패')
            }
        } finally {
            setSaving(false)
        }
    }

    if (!session) {
        return (
            <div className="container mx-auto py-20 text-center text-zinc-500">
                <p>로그인이 필요합니다.</p>
                <Button asChild className="mt-4">
                    <Link href="/auth/signin">로그인</Link>
                </Button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <LogIn className="w-12 h-12 text-zinc-600" />
                <p className="text-zinc-400 font-medium">로그인 후 프로필을 확인할 수 있습니다.</p>
                <Link href="/auth/signin">
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">로그인하기</Button>
                </Link>
            </div>
        )
    }

    if (!profile) return <div className="text-center py-20 text-zinc-500">프로필을 불러올 수 없습니다.</div>

    const title = profile.equippedCosmetics.find(c => c.type === 'TITLE')

    return (
        <div className="container mx-auto py-8 space-y-6 max-w-2xl">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <User className="text-blue-400" /> 내 프로필
            </h1>

            {/* 프로필 카드 */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 flex flex-col md:flex-row items-start gap-6">
                    {/* 아바타 */}
                    <div className="relative shrink-0 mx-auto md:mx-0">
                        <Avatar className="w-24 h-24 border-2 border-zinc-700">
                            <AvatarImage src={profile.image ?? ''} alt={profile.name ?? ''} />
                            <AvatarFallback className="text-2xl bg-zinc-800">
                                {profile.name?.[0] ?? '?'}
                            </AvatarFallback>
                        </Avatar>
                        {profile.role === 'ADMIN' && (
                            <Badge className="absolute -top-1 -right-1 bg-red-600 text-xs px-1">ADMIN</Badge>
                        )}
                    </div>

                    {/* 정보 + 편집 */}
                    <div className="flex-1 w-full space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xl font-bold text-white">{profile.name}</p>
                                {title?.titleText && (
                                    <p className="text-sm text-yellow-400 font-mono mt-0.5">
                                        &quot;{title.titleText}&quot;
                                    </p>
                                )}
                                <p className="text-xs text-zinc-500 mt-0.5">{profile.email}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-zinc-700 text-zinc-400 hover:text-white shrink-0"
                                onClick={() => setEditing(e => !e)}
                            >
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                {editing ? '취소' : '편집'}
                            </Button>
                        </div>

                        {/* 보기 모드 */}
                        {!editing && (
                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-full">
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                    <span className="text-yellow-400 font-bold">{profile.gp.toLocaleString()} GP</span>
                                </div>
                                {profile.profile?.favoriteTeam && (
                                    <div className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-full">
                                        <Trophy className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="text-zinc-300 text-sm">{profile.profile.favoriteTeam} 팬</span>
                                    </div>
                                )}
                                {profile.profile?.bio && (
                                    <p className="w-full text-sm text-zinc-400 italic">&quot;{profile.profile.bio}&quot;</p>
                                )}
                            </div>
                        )}

                        {/* 편집 모드 */}
                        {editing && (
                            <div className="space-y-3 border border-zinc-700 rounded-xl p-4">
                                {/* 응원 팀 */}
                                <div>
                                    <p className="text-xs text-zinc-400 mb-2">응원하는 LCK 팀</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setEditTeam('')}
                                            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                                                !editTeam ? 'border-zinc-500 bg-zinc-700 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                                            }`}
                                        >
                                            없음
                                        </button>
                                        {LCK_TEAMS.map(team => {
                                            const color = TEAM_COLORS[team] ?? '#71717a'
                                            const selected = editTeam === team
                                            return (
                                                <button
                                                    key={team}
                                                    onClick={() => setEditTeam(team)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                                                    style={{
                                                        borderColor: selected ? color : '#3f3f46',
                                                        background: selected ? color + '22' : 'transparent',
                                                        color: selected ? color : '#a1a1aa',
                                                    }}
                                                >
                                                    {team}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* 한 줄 소개 */}
                                <div>
                                    <p className="text-xs text-zinc-400 mb-1">한 줄 소개 <span className="text-zinc-600">({editBio.length}/100)</span></p>
                                    <Input
                                        value={editBio}
                                        onChange={e => setEditBio(e.target.value.slice(0, 100))}
                                        placeholder="예: T1의 열혈 팬, LCK 5년차"
                                        className="bg-zinc-800 border-zinc-700 text-sm"
                                        maxLength={100}
                                    />
                                </div>

                                {/* 저장 */}
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-zinc-500">
                                        <X className="w-3.5 h-3.5 mr-1" />취소
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={saving}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" />저장</>}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 장착 중인 코스메틱 */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" /> 장착 중인 아이템
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {profile.equippedCosmetics.length === 0 ? (
                        <div className="text-center py-6 text-zinc-600">
                            <p>장착 중인 아이템이 없습니다.</p>
                            <Button asChild variant="outline" size="sm" className="mt-3 border-zinc-700">
                                <Link href="/shop"><ShoppingBag className="w-4 h-4 mr-1" /> 상점 방문</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {profile.equippedCosmetics.map((c, i) => (
                                <div key={i}
                                    className="bg-zinc-800 rounded-lg p-3 flex items-center gap-2 border border-zinc-700">
                                    {TYPE_ICONS[c.type]}
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] text-zinc-500">{TYPE_KO[c.type]}</p>
                                        <p className="text-xs text-white font-medium truncate">{c.name}</p>
                                        {c.titleText && (
                                            <p className="text-[10px] text-yellow-400 truncate">&quot;{c.titleText}&quot;</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* GP 획득 방법 안내 */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-400" /> GP 획득 방법
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {[
                            { label: '판타지 팀 포인트', desc: '선수들의 실제 경기 성적에 따라 자동 지급', icon: '⚽' },
                            { label: '승부 예측 성공', desc: '경기 결과 예측 적중 시 +50 GP', icon: '🎯' },
                            { label: '일일 퀘스트', desc: '매일 초기화되는 미션 완료 시 지급', icon: '📋' },
                            { label: '주간 퀘스트', desc: '주별 목표 달성 시 보너스 GP', icon: '🏅' },
                            { label: '랭킹 보상', desc: '시즌 종료 시 랭킹에 따른 보상 지급', icon: '🏆' },
                            { label: '업적 달성', desc: '특정 조건 달성 시 보상 지급', icon: '⭐' },
                        ].map(item => (
                            <div key={item.label} className="flex items-start gap-3 bg-zinc-800/50 rounded-lg p-3">
                                <span className="text-xl">{item.icon}</span>
                                <div>
                                    <p className="font-semibold text-white">{item.label}</p>
                                    <p className="text-xs text-zinc-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-zinc-600 mt-4 text-center">
                        ⚠ GP는 현금으로 구매할 수 없습니다. 모든 재화는 게임 플레이를 통해서만 획득할 수 있습니다.
                    </p>
                </CardContent>
            </Card>

            <div className="flex justify-center gap-3">
                <Button asChild variant="outline" className="border-zinc-700">
                    <Link href="/shop"><ShoppingBag className="w-4 h-4 mr-1" /> 상점</Link>
                </Button>
                <Button asChild variant="outline" className="border-zinc-700">
                    <Link href="/quests">퀘스트</Link>
                </Button>
            </div>
        </div>
    )
}
