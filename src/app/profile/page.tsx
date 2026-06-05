'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Crown, Tag, Star, Palette, User, Image, Smile, ShoppingBag, Trophy, Pencil, Check, X, LogIn, Trash2, AlertTriangle, Camera } from 'lucide-react'
import { TEAM_COLORS, LCK_TEAMS } from '@/lib/config/teams'

interface UserProfile {
    id: string; name: string; email: string; image: string | null; gp: number; role: string
    profile: { displayTitle: string | null; bio: string | null; favoriteTeam: string | null } | null
    equippedCosmetics: { type: string; name: string; titleText: string | null; imageUrl: string | null }[]
}

/** 이메일 마스킹 — a*****@gmail.com 형태 */
function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!local || !domain) return email
    const visible = local.slice(0, 1)
    return `${visible}${'*'.repeat(Math.min(local.length - 1, 5))}@${domain}`
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
    const { data: session, update: updateSession } = useSession()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editNickname, setEditNickname] = useState('')
    const [editTeam, setEditTeam] = useState('')
    const [editBio, setEditBio] = useState('')
    const [nicknameError, setNicknameError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [deleting, setDeleting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,15}$/

    useEffect(() => {
        if (!session) { setLoading(false); return }
        fetch('/api/users/me')
            .then(r => r.json())
            .then(d => {
                setProfile(d)
                setEditNickname(d.name ?? '')
                setEditTeam(d.profile?.favoriteTeam ?? '')
                setEditBio(d.profile?.bio ?? '')
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [session])

    // ── 프로필 사진 업로드 ────────────────────────────────────────────────
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!ALLOWED.includes(file.type)) {
            toast.error('JPG, PNG, WebP 형식만 업로드 가능합니다.')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('파일 크기는 5MB 이하여야 합니다.')
            return
        }

        setUploadingImage(true)
        try {
            // 1. Cloudinary에 업로드
            const formData = new FormData()
            formData.append('file', file)
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
            const uploadData = await uploadRes.json()
            if (!uploadRes.ok) {
                toast.error(uploadData.error ?? '업로드 실패')
                return
            }

            // 2. DB에 이미지 URL 저장
            const patchRes = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: uploadData.url }),
            })
            const patchData = await patchRes.json()
            if (!patchRes.ok) {
                toast.error(patchData.error ?? '이미지 저장 실패')
                return
            }

            // 3. 로컬 상태 + 세션 업데이트
            setProfile(prev => prev ? { ...prev, image: uploadData.url } : prev)
            await updateSession({ user: { image: uploadData.url } })
            toast.success('프로필 사진이 변경되었습니다.')
        } catch {
            toast.error('업로드 중 오류가 발생했습니다.')
        } finally {
            setUploadingImage(false)
            // 같은 파일 재선택 허용
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== '탈퇴합니다') return
        setDeleting(true)
        try {
            const res = await fetch('/api/users/me', { method: 'DELETE' })
            if (res.ok) {
                toast.success('계정이 삭제되었습니다. 이용해주셔서 감사합니다.')
                // 세션 종료 후 홈으로
                const { signOut } = await import('next-auth/react')
                await signOut({ callbackUrl: '/' })
            } else {
                const d = await res.json()
                toast.error(d.error ?? '계정 삭제 실패. 잠시 후 다시 시도해주세요.')
            }
        } finally {
            setDeleting(false)
        }
    }

    const handleSave = async () => {
        // 닉네임 클라이언트 검증
        const trimmedNick = editNickname.trim()
        if (!trimmedNick) {
            setNicknameError('닉네임을 입력해주세요.')
            return
        }
        if (!NICKNAME_REGEX.test(trimmedNick)) {
            setNicknameError('한글·영문·숫자·_ 만 사용 가능 (2~15자)')
            return
        }
        setNicknameError(null)

        setSaving(true)
        try {
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: trimmedNick,
                    favoriteTeam: editTeam,
                    bio: editBio,
                }),
            })
            const d = await res.json()
            if (res.ok) {
                toast.success('프로필이 저장되었습니다.')
                // 세션 닉네임도 업데이트
                if (d.nickname) {
                    await updateSession({ user: { name: d.nickname } })
                }
                setProfile(prev => prev ? {
                    ...prev,
                    name: d.nickname ?? prev.name,
                    profile: {
                        ...(prev.profile ?? { displayTitle: null, bio: null, favoriteTeam: null }),
                        favoriteTeam: editTeam || null,
                        bio: editBio || null,
                    }
                } : prev)
                setEditing(false)
            } else {
                // 409 = 닉네임 중복
                if (res.status === 409) setNicknameError(d.error)
                else toast.error(d.error ?? '저장 실패')
            }
        } finally {
            setSaving(false)
        }
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

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
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
                    <div className="relative shrink-0 mx-auto md:mx-0 group">
                        {/* 숨겨진 파일 인풋 */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        <Avatar className="w-24 h-24 border-2 border-zinc-700">
                            <AvatarImage src={profile.image ?? ''} alt={profile.name ?? ''} />
                            <AvatarFallback className="text-2xl bg-zinc-800">
                                {profile.name?.[0] ?? '?'}
                            </AvatarFallback>
                        </Avatar>
                        {/* 카메라 오버레이 — 호버 시 표시 */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            title="프로필 사진 변경"
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                        >
                            {uploadingImage
                                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                                : <Camera className="w-6 h-6 text-white" />
                            }
                        </button>
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
                                <p className="text-xs text-zinc-500 mt-0.5">{maskEmail(profile.email)}</p>
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
                                {/* 닉네임 변경 */}
                                <div>
                                    <p className="text-xs text-zinc-400 mb-1">
                                        닉네임 <span className="text-zinc-600">({editNickname.length}/15)</span>
                                    </p>
                                    <Input
                                        value={editNickname}
                                        onChange={e => {
                                            setEditNickname(e.target.value.slice(0, 15))
                                            setNicknameError(null)
                                        }}
                                        placeholder="한글·영문·숫자·_ (2~15자)"
                                        className="bg-zinc-800 border-zinc-700 text-sm"
                                        maxLength={15}
                                    />
                                    {nicknameError && (
                                        <p className="text-xs text-red-400 mt-1">{nicknameError}</p>
                                    )}
                                </div>

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
                            { label: '데일리 퀴즈', desc: '퀴즈 정답 시 +15~20 GP', icon: '🧠' },
                            { label: '승부 예측 성공', desc: '승팀 적중 +10 GP, 스코어까지 적중 최대 +30 GP', icon: '🎯' },
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

            {/* ─── 계정 탈퇴 (PIPA 제36조 — 정보주체의 삭제 권리) ────── */}
            <Card className="bg-zinc-950 border-red-900/40">
                <CardHeader>
                    <CardTitle className="text-red-400 text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> 계정 탈퇴
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {!showDeleteConfirm ? (
                        <>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                탈퇴 시 회원님의 모든 데이터(GP, 코스메틱, 예측 기록, 게시글 등)가
                                <strong className="text-zinc-400"> 영구적으로 삭제</strong>되며 복구할 수 없습니다.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red-800 text-red-400 hover:bg-red-900/20 hover:border-red-700"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> 탈퇴하기
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-3 border border-red-900/50 rounded-lg p-4">
                            <p className="text-sm text-red-300 font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </p>
                            <p className="text-xs text-zinc-500">
                                확인을 위해 아래 입력창에 <strong className="text-zinc-300">탈퇴합니다</strong>를 정확히 입력해주세요.
                            </p>
                            <Input
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder="탈퇴합니다"
                                className="bg-zinc-900 border-red-800 text-sm text-white placeholder:text-zinc-600"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                                    className="text-zinc-400"
                                    disabled={deleting}
                                >
                                    취소
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== '탈퇴합니다' || deleting}
                                    className="bg-red-700 hover:bg-red-600 text-white font-bold"
                                >
                                    {deleting
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <><Trash2 className="w-3.5 h-3.5 mr-1" />영구 탈퇴</>
                                    }
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
