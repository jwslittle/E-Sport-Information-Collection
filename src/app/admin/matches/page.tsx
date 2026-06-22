'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
    Loader2, Plus, Pencil, Trash2, CheckCircle2, XCircle,
    ChevronLeft, Calendar, Trophy,
} from 'lucide-react'
import { SEASON_OPTIONS } from '@/lib/config/season'
import { LCK_TEAMS } from '@/lib/config/teams'

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface ManualMatch {
    id: string
    externalId: string
    tournament: string
    season: string
    team1: string
    team2: string
    team1Name: string | null
    team2Name: string | null
    team1Logo: string | null
    team2Logo: string | null
    team1Score: number
    team2Score: number
    winner: string | null
    bestOf: number
    scheduledAt: string | null
    status: string
}

interface FormState {
    id: string | null       // null = create, string = edit
    team1: string
    team2: string
    team1Name: string
    team2Name: string
    team1Logo: string
    team2Logo: string
    scheduledAt: string     // datetime-local value
    bestOf: number
    season: string
    tournament: string
    status: string
    winner: string
    team1Score: string
    team2Score: string
}

const EMPTY_FORM: FormState = {
    id: null,
    team1: '', team2: '',
    team1Name: '', team2Name: '',
    team1Logo: '', team2Logo: '',
    scheduledAt: '',
    bestOf: 3,
    season: '2026-EWC',
    tournament: '',
    status: 'SCHEDULED',
    winner: '',
    team1Score: '0',
    team2Score: '0',
}

// datetime-local에서 쓰는 로컬 KST 포맷 변환
function toDatetimeLocal(iso: string | null): string {
    if (!iso) return ''
    const d = new Date(iso)
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    return kst.toISOString().slice(0, 16)
}

function fromDatetimeLocal(local: string): string {
    if (!local) return ''
    // datetime-local 값은 KST 기준 → UTC로 변환
    const d = new Date(local)
    const utc = new Date(d.getTime() - 9 * 60 * 60 * 1000)
    return utc.toISOString()
}

function fmtDate(iso: string | null): string {
    if (!iso) return '미정'
    return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export default function AdminMatchesPage() {
    const { data: session, status } = useSession()
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    const [matches,  setMatches]  = useState<ManualMatch[]>([])
    const [total,    setTotal]    = useState(0)
    const [loading,  setLoading]  = useState(false)
    const [saving,   setSaving]   = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [form,     setForm]     = useState<FormState>(EMPTY_FORM)
    const [result,   setResult]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [filterSeason, setFilterSeason] = useState<string>('')

    const loadMatches = useCallback(async () => {
        setLoading(true)
        try {
            const qs = filterSeason ? `?season=${filterSeason}` : ''
            const res = await fetch(`/api/admin/matches${qs}`)
            if (res.ok) {
                const d = await res.json()
                setMatches(d.matches)
                setTotal(d.total)
            }
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [filterSeason])

    useEffect(() => {
        if (isAdmin) loadMatches()
    }, [isAdmin, loadMatches])

    // ── 세션 로딩 ──────────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <div className="container mx-auto py-20 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }
    if (!session || !isAdmin) {
        return <div className="container mx-auto py-20 text-center text-zinc-500">접근 권한이 없습니다.</div>
    }

    // ── 폼 편집 시작 ──────────────────────────────────────────────
    function startEdit(m: ManualMatch) {
        setForm({
            id: m.id,
            team1: m.team1,
            team2: m.team2,
            team1Name: m.team1Name ?? '',
            team2Name: m.team2Name ?? '',
            team1Logo: m.team1Logo ?? '',
            team2Logo: m.team2Logo ?? '',
            scheduledAt: toDatetimeLocal(m.scheduledAt),
            bestOf: m.bestOf,
            season: m.season,
            tournament: m.tournament,
            status: m.status,
            winner: m.winner ?? '',
            team1Score: String(m.team1Score),
            team2Score: String(m.team2Score),
        })
        setResult(null)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function resetForm() {
        setForm(EMPTY_FORM)
        setResult(null)
    }

    // ── 저장 (생성 or 수정) ──────────────────────────────────────
    async function handleSave() {
        if (!form.team1 || !form.team2 || !form.season || !form.tournament) {
            setResult({ type: 'error', text: 'team1, team2, 대회명, 시즌은 필수입니다.' })
            return
        }
        setSaving(true)
        setResult(null)
        try {
            const body: Record<string, any> = {
                team1:      form.team1.toUpperCase().trim(),
                team2:      form.team2.toUpperCase().trim(),
                team1Name:  form.team1Name  || null,
                team2Name:  form.team2Name  || null,
                team1Logo:  form.team1Logo  || null,
                team2Logo:  form.team2Logo  || null,
                scheduledAt: form.scheduledAt ? fromDatetimeLocal(form.scheduledAt) : null,
                bestOf:     form.bestOf,
                season:     form.season,
                tournament: form.tournament.trim(),
                status:     form.status,
                winner:     form.winner || null,
                team1Score: parseInt(form.team1Score, 10) || 0,
                team2Score: parseInt(form.team2Score, 10) || 0,
            }

            let res: Response
            if (form.id) {
                res = await fetch('/api/admin/matches', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: form.id, ...body }),
                })
            } else {
                res = await fetch('/api/admin/matches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                })
            }

            const d = await res.json()
            if (!res.ok) throw new Error(d.error ?? 'Failed')

            setResult({ type: 'success', text: form.id ? '수정 완료' : '경기 등록 완료' })
            resetForm()
            await loadMatches()
        } catch (e: unknown) {
            setResult({ type: 'error', text: e instanceof Error ? e.message : '오류 발생' })
        } finally {
            setSaving(false)
        }
    }

    // ── 삭제 ────────────────────────────────────────────────────
    async function handleDelete(id: string, label: string) {
        if (!confirm(`"${label}" 경기를 삭제하시겠습니까?`)) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/admin/matches?id=${id}`, { method: 'DELETE' })
            const d = await res.json()
            if (!res.ok) throw new Error(d.error ?? 'Failed')
            await loadMatches()
            if (form.id === id) resetForm()
        } catch (e: unknown) {
            setResult({ type: 'error', text: e instanceof Error ? e.message : '삭제 오류' })
        } finally {
            setDeleting(null)
        }
    }

    // ── 렌더 ─────────────────────────────────────────────────────
    return (
        <div className="container mx-auto p-6 space-y-6 max-w-4xl">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        관리자
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-white">수동 경기 등록</h1>
                <Badge className="bg-amber-600 text-white text-xs">EWC · 아시안게임</Badge>
            </div>
            <p className="text-xs text-zinc-500">
                LoL Esports API에서 제공되지 않는 EWC, 아시안게임 경기를 수동으로 등록합니다.
                자동 동기화 경기는 수정·삭제할 수 없습니다.
            </p>

            {/* ── 등록/수정 폼 ─────────────────────────────────── */}
            <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-base">
                        {form.id ? <Pencil className="w-4 h-4 text-yellow-400" /> : <Plus className="w-4 h-4 text-green-400" />}
                        {form.id ? '경기 수정' : '새 경기 등록'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 시즌 + 대회명 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">시즌 *</label>
                            <select
                                value={form.season}
                                onChange={e => setForm(f => ({ ...f, season: e.target.value }))}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                            >
                                {SEASON_OPTIONS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">대회명 * (예: EWC 2026 - Group A)</label>
                            <input
                                type="text"
                                value={form.tournament}
                                onChange={e => setForm(f => ({ ...f, tournament: e.target.value }))}
                                placeholder="EWC 2026 - Group A"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                            />
                        </div>
                    </div>

                    {/* 팀 코드 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">팀1 코드 * (예: T1, KOR)</label>
                            <input
                                list="team-list"
                                type="text"
                                value={form.team1}
                                onChange={e => setForm(f => ({ ...f, team1: e.target.value.toUpperCase() }))}
                                placeholder="T1"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 uppercase"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">팀2 코드 * (예: GEN, CHN)</label>
                            <input
                                list="team-list"
                                type="text"
                                value={form.team2}
                                onChange={e => setForm(f => ({ ...f, team2: e.target.value.toUpperCase() }))}
                                placeholder="GEN"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 uppercase"
                            />
                        </div>
                        <datalist id="team-list">
                            {LCK_TEAMS.map(t => <option key={t} value={t} />)}
                        </datalist>
                    </div>

                    {/* 팀 전체명 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">팀1 전체명 (선택)</label>
                            <input
                                type="text"
                                value={form.team1Name}
                                onChange={e => setForm(f => ({ ...f, team1Name: e.target.value }))}
                                placeholder="T1"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">팀2 전체명 (선택)</label>
                            <input
                                type="text"
                                value={form.team2Name}
                                onChange={e => setForm(f => ({ ...f, team2Name: e.target.value }))}
                                placeholder="Gen.G"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                            />
                        </div>
                    </div>

                    {/* 로고 URL */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">팀1 로고 URL (선택)</label>
                            <input
                                type="url"
                                value={form.team1Logo}
                                onChange={e => setForm(f => ({ ...f, team1Logo: e.target.value }))}
                                placeholder="https://..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">팀2 로고 URL (선택)</label>
                            <input
                                type="url"
                                value={form.team2Logo}
                                onChange={e => setForm(f => ({ ...f, team2Logo: e.target.value }))}
                                placeholder="https://..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                            />
                        </div>
                    </div>

                    {/* 일시 + Best Of */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">경기 일시 KST (선택)</label>
                            <input
                                type="datetime-local"
                                value={form.scheduledAt}
                                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">Best Of</label>
                            <div className="flex gap-2 pt-1">
                                {[1, 3, 5].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, bestOf: n }))}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            form.bestOf === n
                                                ? 'bg-yellow-600 text-black'
                                                : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        BO{n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 수정 전용: 상태/스코어/승자 */}
                    {form.id && (
                        <div className="grid grid-cols-4 gap-3 pt-2 border-t border-zinc-800">
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">상태</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                                >
                                    <option value="SCHEDULED">SCHEDULED</option>
                                    <option value="LIVE">LIVE</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">팀1 스코어</label>
                                <input
                                    type="number" min="0" max="5"
                                    value={form.team1Score}
                                    onChange={e => setForm(f => ({ ...f, team1Score: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">팀2 스코어</label>
                                <input
                                    type="number" min="0" max="5"
                                    value={form.team2Score}
                                    onChange={e => setForm(f => ({ ...f, team2Score: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">승자 코드</label>
                                <input
                                    type="text"
                                    value={form.winner}
                                    onChange={e => setForm(f => ({ ...f, winner: e.target.value.toUpperCase() }))}
                                    placeholder="T1"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 uppercase"
                                />
                            </div>
                        </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex-1 text-sm font-semibold ${form.id ? 'bg-yellow-600 hover:bg-yellow-700 text-black' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {saving
                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                : form.id ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                            {form.id ? '수정 저장' : '경기 등록'}
                        </Button>
                        {form.id && (
                            <Button
                                onClick={resetForm}
                                variant="outline"
                                className="border-zinc-700 text-zinc-400 hover:text-white text-sm"
                            >
                                취소
                            </Button>
                        )}
                    </div>

                    {result && (
                        <Alert className={result.type === 'success' ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'}>
                            {result.type === 'success'
                                ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                                : <XCircle className="h-4 w-4 text-red-400" />}
                            <AlertDescription className="text-xs ml-2">{result.text}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* ── 등록된 수동 경기 목록 ─────────────────────────── */}
            <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white text-base">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            수동 등록 경기 ({total}개)
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <select
                                value={filterSeason}
                                onChange={e => setFilterSeason(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                            >
                                <option value="">전체 시즌</option>
                                {SEASON_OPTIONS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <Button
                                onClick={loadMatches}
                                variant="ghost"
                                size="sm"
                                disabled={loading}
                                className="text-zinc-400 hover:text-white text-xs"
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '새로고침'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && matches.length === 0 ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-10 text-zinc-500 text-sm">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p>등록된 수동 경기가 없습니다.</p>
                            <p className="text-xs mt-1">위 폼으로 EWC, 아시안게임 경기를 등록하세요.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {matches.map(m => (
                                <div
                                    key={m.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition-colors ${
                                        form.id === m.id
                                            ? 'border-yellow-600/50 bg-yellow-900/10'
                                            : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'
                                    }`}
                                >
                                    {/* 상태 배지 */}
                                    <Badge className={`shrink-0 text-[10px] px-1.5 ${
                                        m.status === 'LIVE'      ? 'bg-red-600'
                                        : m.status === 'COMPLETED' ? 'bg-zinc-600'
                                        : 'bg-blue-700'
                                    }`}>
                                        {m.status}
                                    </Badge>

                                    {/* 경기 정보 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{m.team1}</span>
                                            <span className="text-zinc-500">vs</span>
                                            <span className="font-bold text-white">{m.team2}</span>
                                            {m.status === 'COMPLETED' && (
                                                <span className="text-zinc-400 text-xs">
                                                    ({m.team1Score}:{m.team2Score})
                                                </span>
                                            )}
                                            <span className="text-zinc-600 text-xs">BO{m.bestOf}</span>
                                        </div>
                                        <div className="text-xs text-zinc-500 truncate">
                                            {m.tournament} · {fmtDate(m.scheduledAt)}
                                        </div>
                                    </div>

                                    {/* 액션 */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            onClick={() => startEdit(m)}
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-zinc-400 hover:text-yellow-400"
                                            title="수정"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(m.id, `${m.team1} vs ${m.team2}`)}
                                            size="sm"
                                            variant="ghost"
                                            disabled={deleting === m.id}
                                            className="h-7 w-7 p-0 text-zinc-400 hover:text-red-400"
                                            title="삭제"
                                        >
                                            {deleting === m.id
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <Trash2 className="h-3.5 w-3.5" />}
                                        </Button>
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
