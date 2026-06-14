'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Button }   from '@/components/ui/button'
import { Badge }    from '@/components/ui/badge'
import { Input }    from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Users, Search, ChevronLeft, ChevronRight,
    Loader2, Shield, ShieldOff, Trash2, Coins,
    CheckCircle2, XCircle, Check, X, ArrowLeft,
    SortAsc, SortDesc, Calendar, UserCheck, UserX,
} from 'lucide-react'

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface AdminUser {
    id:              string
    name:            string | null
    email:           string | null
    image:           string | null
    role:            string
    gp:              number
    isOnboarded:     boolean
    termsAgreedAt:   string | null
    privacyAgreedAt: string | null
    createdAt:       string
    updatedAt:       string
    profile:         { displayTitle: string | null; favoriteTeam: string | null } | null
    _count:          { lckPredictions: number; posts: number; quizAnswers: number }
}

interface PageData {
    users:      AdminUser[]
    total:      number
    page:       number
    totalPages: number
}

interface Toast {
    type: 'success' | 'error'
    text: string
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
    if (!iso) return '–'
    return new Date(iso).toLocaleDateString('ko-KR', {
        year: '2-digit', month: '2-digit', day: '2-digit',
        timeZone: 'Asia/Seoul',
    })
}

function fmtDateFull(iso: string | null) {
    if (!iso) return '–'
    return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

// ─── GP 인라인 에디터 ────────────────────────────────────────────────────────

function GpEditor({ user, onSaved }: { user: AdminUser; onSaved: (newGp: number) => void }) {
    const [editing, setEditing]   = useState(false)
    const [input, setInput]       = useState(String(user.gp))
    const [loading, setLoading]   = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const open = () => { setInput(String(user.gp)); setEditing(true) }
    const cancel = () => setEditing(false)

    useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

    const save = async () => {
        const gp = parseInt(input, 10)
        if (isNaN(gp) || gp < 0) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, action: 'setGp', value: gp }),
            })
            const d = await res.json()
            if (res.ok) { onSaved(d.user.gp); setEditing(false) }
        } finally { setLoading(false) }
    }

    if (editing) {
        return (
            <div className="flex items-center gap-1">
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
                    className="h-6 w-24 px-2 text-xs bg-zinc-800 border-yellow-600 text-yellow-300"
                />
                <button onClick={save} disabled={loading}
                    className="text-green-400 hover:text-green-300 disabled:opacity-50">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button onClick={cancel} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={open}
            className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 text-xs font-bold group"
            title="클릭하여 GP 수정"
        >
            <Coins className="w-3 h-3" />
            {user.gp.toLocaleString()}
            <span className="text-zinc-600 text-[10px] group-hover:text-zinc-400">GP</span>
        </button>
    )
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
    const { data: session, status } = useSession()
    const isAdmin = (session?.user as any)?.role === 'ADMIN'
    const myId    = (session?.user as any)?.id as string | undefined

    const [data,      setData]      = useState<PageData | null>(null)
    const [loading,   setLoading]   = useState(false)
    const [query,     setQuery]     = useState('')
    const [page,      setPage]      = useState(1)
    const [sort,      setSort]      = useState('gp_desc')
    const [toast,     setToast]     = useState<Toast | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [rolePending, setRolePending] = useState<string | null>(null)

    const searchRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── 목록 로드 ─────────────────────────────────────────────────────
    const load = useCallback(async (q: string, p: number, s: string) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(p), sort: s })
            if (q) params.set('q', q)
            const res  = await fetch(`/api/admin/users?${params}`)
            if (res.ok) setData(await res.json())
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isAdmin) load(query, page, sort)
    }, [isAdmin, page, sort]) // eslint-disable-line react-hooks/exhaustive-deps

    // 검색어 디바운스
    const onQueryChange = (v: string) => {
        setQuery(v)
        setPage(1)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => load(v, 1, sort), 350)
    }

    // ── 토스트 ───────────────────────────────────────────────────────
    const showToast = (type: Toast['type'], text: string) => {
        setToast({ type, text })
        setTimeout(() => setToast(null), 3000)
    }

    // ── 역할 변경 ────────────────────────────────────────────────────
    const toggleRole = async (user: AdminUser) => {
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
        if (user.id === myId && newRole !== 'ADMIN') return
        if (!confirm(`${user.name ?? '이 유저'}의 역할을 ${newRole}로 변경하시겠습니까?`)) return

        setRolePending(user.id)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, action: 'setRole', value: newRole }),
            })
            const d = await res.json()
            if (res.ok) {
                setData(prev => prev ? {
                    ...prev,
                    users: prev.users.map(u => u.id === user.id ? { ...u, role: d.user.role } : u),
                } : prev)
                showToast('success', `${d.user.name} → ${newRole}`)
            } else {
                showToast('error', d.error ?? '역할 변경 실패')
            }
        } finally {
            setRolePending(null)
        }
    }

    // ── GP 저장 ──────────────────────────────────────────────────────
    const onGpSaved = (userId: string, newGp: number) => {
        setData(prev => prev ? {
            ...prev,
            users: prev.users.map(u => u.id === userId ? { ...u, gp: newGp } : u),
        } : prev)
        showToast('success', `GP 업데이트 완료`)
    }

    // ── 회원 삭제 ────────────────────────────────────────────────────
    const deleteUser = async (user: AdminUser) => {
        if (user.id === myId) return
        if (!confirm(`⚠️ ${user.name ?? user.email} 회원을 영구 삭제합니다.\n\n모든 예측, 커뮤니티 글, GP 기록이 함께 삭제됩니다.\n\n계속하시겠습니까?`)) return

        setDeletingId(user.id)
        try {
            const res = await fetch(`/api/admin/users?userId=${user.id}`, { method: 'DELETE' })
            const d   = await res.json()
            if (res.ok) {
                setData(prev => prev ? {
                    ...prev,
                    users: prev.users.filter(u => u.id !== user.id),
                    total: prev.total - 1,
                } : prev)
                showToast('success', `${d.deleted.name ?? '회원'} 삭제 완료`)
            } else {
                showToast('error', d.error ?? '삭제 실패')
            }
        } finally {
            setDeletingId(null)
        }
    }

    // ── 가드 ─────────────────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }
    if (!session || !isAdmin) {
        return <div className="container mx-auto py-20 text-center text-zinc-500">접근 권한이 없습니다.</div>
    }

    const sortOptions = [
        { value: 'gp_desc',     label: 'GP 높은 순',   icon: SortDesc },
        { value: 'gp_asc',      label: 'GP 낮은 순',   icon: SortAsc  },
        { value: 'joined_new',  label: '최근 가입',     icon: Calendar },
        { value: 'joined_old',  label: '오래된 가입',   icon: Calendar },
    ]

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-5">

            {/* 헤더 */}
            <div className="flex items-center gap-3 flex-wrap">
                <Link href="/admin">
                    <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <Users className="w-6 h-6 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">회원 관리</h1>
                <Badge className="bg-blue-800 text-blue-200 text-xs">
                    {data ? `전체 ${data.total.toLocaleString()}명` : '로딩 중…'}
                </Badge>
            </div>

            {/* 토스트 */}
            {toast && (
                <Alert className={toast.type === 'success'
                    ? 'border-green-700 bg-green-900/20 py-2'
                    : 'border-red-700 bg-red-900/20 py-2'}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                        : <XCircle      className="h-4 w-4 text-red-400" />}
                    <AlertDescription className="text-xs ml-2">{toast.text}</AlertDescription>
                </Alert>
            )}

            {/* 검색 + 정렬 */}
            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-52">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        ref={searchRef}
                        value={query}
                        onChange={e => onQueryChange(e.target.value)}
                        placeholder="닉네임 또는 이메일 검색…"
                        className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex gap-1">
                    {sortOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { setSort(opt.value); setPage(1) }}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                sort === opt.value
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                            }`}
                        >
                            <opt.icon className="w-3 h-3" />
                            <span className="hidden sm:inline">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 테이블 영역 */}
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
                {/* 테이블 헤더 */}
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 bg-zinc-800/60 border-b border-zinc-700 text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                    <span>프로필</span>
                    <span>회원 정보</span>
                    <span className="text-right">GP</span>
                    <span className="text-center">상태</span>
                    <span className="text-center">역할</span>
                    <span className="text-right">액션</span>
                </div>

                {/* 로딩 */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                    </div>
                )}

                {/* 빈 결과 */}
                {!loading && data?.users.length === 0 && (
                    <div className="text-center py-12 text-zinc-500 text-sm">
                        검색 결과가 없습니다.
                    </div>
                )}

                {/* 회원 행 */}
                {!loading && data?.users.map(user => (
                    <div
                        key={user.id}
                        className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"
                    >
                        {/* 아바타 */}
                        <div className="shrink-0">
                            {user.image ? (
                                <Image
                                    src={user.image}
                                    alt={user.name ?? '?'}
                                    width={36}
                                    height={36}
                                    className="rounded-full object-cover border border-zinc-700"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-sm font-bold">
                                    {user.name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                            )}
                        </div>

                        {/* 회원 정보 */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                    href={`/profile/${user.id}`}
                                    target="_blank"
                                    className="text-sm font-semibold text-white hover:text-yellow-400 transition-colors truncate"
                                >
                                    {user.name ?? '(닉네임 없음)'}
                                </Link>
                                {user.id === myId && (
                                    <Badge className="text-[10px] px-1.5 py-0.5 bg-yellow-900/40 text-yellow-400 border border-yellow-700/40">나</Badge>
                                )}
                                {user.profile?.displayTitle && (
                                    <span className="text-[10px] text-zinc-500">{user.profile.displayTitle}</span>
                                )}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate mt-0.5">{user.email ?? '이메일 없음'}</div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-600">
                                <span title={fmtDateFull(user.createdAt)}>가입 {fmtDate(user.createdAt)}</span>
                                <span>·</span>
                                <span>예측 {user._count.lckPredictions}</span>
                                <span>·</span>
                                <span>글 {user._count.posts}</span>
                                {user.profile?.favoriteTeam && (
                                    <>
                                        <span>·</span>
                                        <span>{user.profile.favoriteTeam}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* GP */}
                        <div className="shrink-0 text-right">
                            <GpEditor
                                user={user}
                                onSaved={newGp => onGpSaved(user.id, newGp)}
                            />
                        </div>

                        {/* 온보딩 상태 */}
                        <div className="shrink-0 flex justify-center">
                            {user.isOnboarded ? (
                                <span title="온보딩 완료">
                                    <UserCheck className="w-4 h-4 text-green-500" />
                                </span>
                            ) : (
                                <span title="온보딩 미완료">
                                    <UserX className="w-4 h-4 text-zinc-600" />
                                </span>
                            )}
                        </div>

                        {/* 역할 */}
                        <div className="shrink-0 flex justify-center">
                            <button
                                onClick={() => toggleRole(user)}
                                disabled={rolePending === user.id || (user.id === myId)}
                                title={user.id === myId ? '자기 자신의 역할은 변경 불가' : `${user.role === 'ADMIN' ? 'USER로 강등' : 'ADMIN으로 승격'}`}
                                className="disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                {rolePending === user.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                                ) : user.role === 'ADMIN' ? (
                                    <Badge className="text-[10px] px-1.5 py-0.5 bg-red-900/40 text-red-400 border border-red-700/40 cursor-pointer hover:bg-red-800/50 transition-colors">
                                        ADMIN
                                    </Badge>
                                ) : (
                                    <Badge className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-pointer hover:bg-zinc-700/50 transition-colors">
                                        USER
                                    </Badge>
                                )}
                            </button>
                        </div>

                        {/* 삭제 */}
                        <div className="shrink-0 flex justify-end">
                            <button
                                onClick={() => deleteUser(user)}
                                disabled={deletingId === user.id || user.id === myId}
                                title={user.id === myId ? '자기 자신은 삭제 불가' : '회원 삭제'}
                                className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {deletingId === user.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Trash2   className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 페이지네이션 */}
            {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1 || loading}
                        className="border-zinc-700 text-zinc-400 hover:text-white h-8"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {/* 페이지 번호 버튼 (최대 7개) */}
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                        .filter(p =>
                            p === 1 ||
                            p === data.totalPages ||
                            Math.abs(p - page) <= 2
                        )
                        .reduce<(number | '…')[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                            acc.push(p)
                            return acc
                        }, [])
                        .map((p, i) =>
                            p === '…' ? (
                                <span key={`ellipsis-${i}`} className="text-zinc-600 text-sm px-1">…</span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => setPage(p as number)}
                                    disabled={loading}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                                        page === p
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                                    }`}
                                >
                                    {p}
                                </button>
                            )
                        )
                    }

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                        disabled={page >= data.totalPages || loading}
                        className="border-zinc-700 text-zinc-400 hover:text-white h-8"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* 안내 푸터 */}
            <div className="text-[11px] text-zinc-600 text-center space-y-1 pb-2">
                <p>• GP 수정: 숫자 클릭 → 값 입력 → Enter 저장 (Esc 취소)</p>
                <p>• 역할 배지 클릭: USER ↔ ADMIN 전환 (본인 제외)</p>
                <p>• 회원 삭제 시 예측·커뮤니티·GP 기록이 모두 영구 삭제됩니다</p>
            </div>
        </div>
    )
}
