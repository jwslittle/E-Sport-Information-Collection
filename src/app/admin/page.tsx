'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
    Loader2, RefreshCw, Trophy, Database, Zap,
    CheckCircle2, XCircle, ShoppingBag, Clock,
    Bot, Activity, BookOpen, MessageSquare, Trash2,
    BarChart2, TrendingUp,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface SyncStatus {
    lastSyncAt: string | null
    status: string | null
}

interface ProcessStatus {
    total: number
    processed: number
    pending: number
    lastProcessedAt: string | null
    lastDetails: { processed: number; gpAwarded: number; skipped: number; fromCron?: boolean } | null
}

interface ActionResult {
    type: 'success' | 'error'
    text: string
}

// ─── 날짜 포맷 ───────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
    if (!iso) return '없음'
    return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

function timeAgo(iso: string | null) {
    if (!iso) return null
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return '방금 전'
    if (m < 60) return `${m}분 전`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}시간 전`
    return `${Math.floor(h / 24)}일 전`
}

// ─── 메인 ───────────────────────────────────────────────────────────────────

export default function AdminPage() {
    const { data: session, status } = useSession()

    // 로딩
    const [syncLoading,    setSyncLoading]    = useState(false)
    const [processLoading, setProcessLoading] = useState(false)
    const [communityLoading, setCommunityLoading] = useState(false)
    const [communityStats, setCommunityStats] = useState<{
        stats: { totalPosts: number; totalComments: number; postsToday: number; commentsToday: number }
        recentPosts: { id: string; title: string; category: string; viewCount: number; likeCount: number; commentCount: number; createdAt: string; author: { id: string; name: string | null; image: string | null } }[]
    } | null>(null)
    const [seedLoading,    setSeedLoading]    = useState(false)
    const [quizLoading,    setQuizLoading]    = useState(false)

    // 결과 메시지
    const [syncResult,    setSyncResult]    = useState<ActionResult | null>(null)
    const [processResult, setProcessResult] = useState<ActionResult | null>(null)
    const [seedResult,    setSeedResult]    = useState<ActionResult | null>(null)
    const [quizResult,    setQuizResult]    = useState<ActionResult | null>(null)

    // 현황 데이터
    const [syncStatus,    setSyncStatus]    = useState<SyncStatus | null>(null)
    const [processStatus, setProcessStatus] = useState<ProcessStatus | null>(null)

    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    // ── 현황 자동 로드 ──────────────────────────────────────────────
    const loadStatus = useCallback(async () => {
        try {
            const [matchRes, procRes] = await Promise.all([
                fetch('/api/lck/matches?limit=1'),
                fetch('/api/lck/predictions/process'),
            ])
            if (matchRes.ok) {
                const d = await matchRes.json()
                setSyncStatus({
                    lastSyncAt: d.syncStatus?.lastSyncAt ?? null,
                    status: d.syncStatus?.status ?? null,
                })
            }
            if (procRes.ok) {
                setProcessStatus(await procRes.json())
            }
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        if (isAdmin) loadStatus()
    }, [isAdmin, loadStatus])

    // ✅ 보안: 세션 로딩 중 어드민 UI가 잠깐 보이는 플래시 현상 차단
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

    // ── LCK 데이터 동기화 ────────────────────────────────────────────
    const handleSync = async (reset = false) => {
        setSyncLoading(true)
        setSyncResult(null)
        try {
            const res  = await fetch(`/api/lck/matches?sync=1${reset ? '&reset=1' : ''}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Sync failed')
            const s = data.syncStatus
            setSyncResult({
                type: 'success',
                text: `동기화 완료 — 총 ${data.total}경기 | 마지막: ${s?.lastSyncAt ? fmtDate(s.lastSyncAt) : '알 수 없음'}`,
            })
            await loadStatus()
        } catch (err: unknown) {
            setSyncResult({ type: 'error', text: err instanceof Error ? err.message : '오류' })
        } finally {
            setSyncLoading(false)
        }
    }

    // ── 예측 정산 ────────────────────────────────────────────────────
    const handleProcess = async () => {
        setProcessLoading(true)
        setProcessResult(null)
        try {
            const res  = await fetch('/api/lck/predictions/process', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Process failed')
            setProcessResult({
                type: 'success',
                text: `정산 완료 — ${data.processed}건 처리, ${data.gpAwarded} GP 지급`,
            })
            await loadStatus()
        } catch (err: unknown) {
            setProcessResult({ type: 'error', text: err instanceof Error ? err.message : '오류' })
        } finally {
            setProcessLoading(false)
        }
    }

    // ── 퀴즈 자동 생성 ───────────────────────────────────────────────
    const handleGenerateQuiz = async () => {
        setQuizLoading(true)
        setQuizResult(null)
        try {
            const res = await fetch('/api/quiz/generate', { method: 'POST' })
            const d   = await res.json()
            if (res.ok) setQuizResult({ type: 'success', text: d.message ?? `${d.generated}개 문항 생성 완료` })
            else        setQuizResult({ type: 'error',   text: d.error ?? 'Failed' })
        } catch {
            setQuizResult({ type: 'error', text: '오류 발생' })
        } finally {
            setQuizLoading(false)
        }
    }

    // ── 커뮤니티 현황 ─────────────────────────────────────────────────
    const loadCommunity = async () => {
        setCommunityLoading(true)
        try {
            const res = await fetch('/api/admin/community')
            if (res.ok) setCommunityStats(await res.json())
        } catch { /* ignore */ }
        finally { setCommunityLoading(false) }
    }

    const deletePost = async (postId: string) => {
        if (!confirm('이 게시글을 삭제하시겠습니까?')) return
        await fetch(`/api/admin/community?postId=${postId}`, { method: 'DELETE' })
        loadCommunity()
    }

    // ── 아이템 시딩 ──────────────────────────────────────────────────
    const handleSeed = async () => {
        setSeedLoading(true)
        setSeedResult(null)
        try {
            const res  = await fetch('/api/admin/cosmetics/seed', { method: 'POST' })
            const text = await res.text()
            let d: Record<string, any>
            try { d = JSON.parse(text) } catch { d = { error: `응답 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 300)}` } }
            if (res.ok) setSeedResult({ type: 'success', text: `완료 — 등록 ${d.created}개 · 업데이트 ${d.updated}개 · 비활성화 ${d.deactivated}개 · 스킵 ${d.skipped}개` })
            else        setSeedResult({ type: 'error',   text: d.error ?? `HTTP ${res.status}` })
        } catch (e: unknown) {
            setSeedResult({ type: 'error', text: e instanceof Error ? e.message : '네트워크 오류' })
        } finally {
            setSeedLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-4xl">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">관리자 대시보드</h1>
                <Badge className="bg-red-600 text-white">ADMIN</Badge>
            </div>

            {/* ── 자동화 현황 카드 ──────────────────────────────────── */}
            <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Bot className="w-5 h-5 text-green-400" />
                        자동화 현황
                        <Badge variant="outline" className="border-green-600 text-green-400 text-xs ml-1">Vercel Cron</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 동기화 상태 */}
                    <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Database className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold text-zinc-200">LCK 데이터 동기화</span>
                            <Badge className="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-400 ml-auto">매일 06:00 KST</Badge>
                        </div>
                        <div className="space-y-1 text-xs text-zinc-400">
                            <div className="flex justify-between">
                                <span>상태</span>
                                <span className={syncStatus?.status === 'OK' ? 'text-green-400' : syncStatus?.status === 'ERROR' ? 'text-red-400' : 'text-zinc-500'}>
                                    {syncStatus?.status ?? '–'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>마지막 실행</span>
                                <span className="text-zinc-300">{timeAgo(syncStatus?.lastSyncAt ?? null) ?? '–'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>KST 시각</span>
                                <span className="text-zinc-400 text-[11px]">{fmtDate(syncStatus?.lastSyncAt ?? null)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 정산 상태 */}
                    <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-semibold text-zinc-200">예측 정산</span>
                            <Badge className="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-400 ml-auto">매일 오전 6시</Badge>
                        </div>
                        <div className="space-y-1 text-xs text-zinc-400">
                            <div className="flex justify-between">
                                <span>총 예측 / 정산완료 / 대기</span>
                                <span className="text-zinc-300">
                                    {processStatus ? `${processStatus.total} / ${processStatus.processed} / ${processStatus.pending}` : '–'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>마지막 실행</span>
                                <span className="text-zinc-300">{timeAgo(processStatus?.lastProcessedAt ?? null) ?? '–'}</span>
                            </div>
                            {processStatus?.lastDetails && (
                                <div className="flex justify-between">
                                    <span>이전 결과</span>
                                    <span className="text-zinc-400 text-[11px]">
                                        {processStatus.lastDetails.processed}건 · {processStatus.lastDetails.gpAwarded}GP
                                        {processStatus.lastDetails.fromCron ? ' (자동)' : ' (수동)'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 다음 실행 안내 */}
                    <div className="md:col-span-2 flex items-start gap-2 bg-blue-900/10 border border-blue-800/40 rounded-lg px-4 py-3 text-xs text-blue-300">
                        <Clock className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                        <span>
                            <strong>스케줄:</strong> 데이터 동기화 + 예측 정산 모두 <strong>매일 오전 06:00 KST</strong> (21:00 UTC) 자동 실행됩니다.
                            {' '}수시 업데이트가 필요하면 아래 수동 버튼을 이용하세요.
                            {' '}Vercel 대시보드 → Functions → Cron Jobs에서 실행 로그를 확인하세요.
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* ── 수동 실행 카드 2열 ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LCK 데이터 동기화 */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white text-base">
                            <Database className="w-4 h-4 text-blue-400" />
                            LCK 데이터 동기화
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-xs text-zinc-400">
                            LoL Esports API에서 최신 LCK 경기 데이터를 즉시 가져옵니다.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleSync(false)}
                                disabled={syncLoading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                            >
                                {syncLoading
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <RefreshCw className="mr-2 h-4 w-4" />}
                                지금 동기화
                            </Button>
                            <Button
                                onClick={() => handleSync(true)}
                                disabled={syncLoading}
                                variant="outline"
                                className="border-zinc-700 text-zinc-400 hover:text-white text-xs"
                                title="동기화 로그 초기화 후 전체 재동기화"
                            >
                                초기화
                            </Button>
                        </div>
                        {syncResult && (
                            <Alert className={syncResult.type === 'success' ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'}>
                                {syncResult.type === 'success'
                                    ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                                    : <XCircle className="h-4 w-4 text-red-400" />}
                                <AlertDescription className="text-xs ml-2">{syncResult.text}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* 예측 정산 */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white text-base">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            예측 정산
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-xs text-zinc-400">
                            완료된 경기의 예측 결과를 즉시 처리하고 GP를 지급합니다.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleProcess}
                                disabled={processLoading}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-bold text-sm"
                            >
                                {processLoading
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <Zap className="mr-2 h-4 w-4" />}
                                지금 정산
                            </Button>
                            <Button
                                onClick={loadStatus}
                                variant="outline"
                                className="border-zinc-700 text-zinc-400 hover:text-white text-xs"
                            >
                                <Activity className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        {processResult && (
                            <Alert className={processResult.type === 'success' ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'}>
                                {processResult.type === 'success'
                                    ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                                    : <XCircle className="h-4 w-4 text-red-400" />}
                                <AlertDescription className="text-xs ml-2">{processResult.text}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── 상점 아이템 시딩 ──────────────────────────────────── */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-base">
                        <ShoppingBag className="w-4 h-4 text-orange-400" />
                        상점 아이템 시딩
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-xs text-zinc-400">기본 코스메틱 아이템(칭호·스티커·프레임·배경·질의권)을 DB에 등록합니다. 중복은 가격 변경 시만 업데이트합니다.</p>
                    <div className="flex gap-2">
                    <Button
                        onClick={handleSeed}
                        disabled={seedLoading}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm"
                    >
                        {seedLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
                        아이템 시딩
                    </Button>
                    <Button
                        onClick={async () => {
                            setSeedLoading(true); setSeedResult(null)
                            try {
                                const res = await fetch('/api/quiz/seed', { method: 'POST' })
                                const d   = await res.json()
                                setSeedResult(res.ok
                                    ? { type: 'success', text: d.message ?? `퀴즈 ${d.created}개 등록` }
                                    : { type: 'error',   text: d.error ?? 'Failed' })
                            } catch { setSeedResult({ type: 'error', text: '오류 발생' }) }
                            finally  { setSeedLoading(false) }
                        }}
                        disabled={seedLoading}
                        variant="outline"
                        className="border-purple-700 text-purple-400 hover:text-white text-xs"
                        title="퀴즈 정적 문항(quiz-data.ts) 시딩"
                    >
                        <BookOpen className="w-3.5 h-3.5 mr-1" />퀴즈
                    </Button>
                    </div>
                    {seedResult && (
                        <Alert className={seedResult.type === 'success' ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'}>
                            {seedResult.type === 'success'
                                ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                                : <XCircle className="h-4 w-4 text-red-400" />}
                            <AlertDescription className="text-xs ml-2">{seedResult.text}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* ── 퀴즈 문항 자동 생성 ───────────────────────────────── */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-base">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        퀴즈 문항 자동 생성
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-xs text-zinc-400">
                        LCK 경기 결과 데이터(결승전, 시즌 전적 등)를 바탕으로 퀴즈 문항을 자동 생성합니다.
                        히스토리컬 선수 통계가 쌓이면 추가 문항도 자동으로 만들어집니다.
                        이미 존재하는 문항은 건너뜁니다.
                    </p>
                    <Button
                        onClick={handleGenerateQuiz}
                        disabled={quizLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
                    >
                        {quizLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                        문항 자동 생성
                    </Button>
                    {quizResult && (
                        <Alert className={quizResult.type === 'success' ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'}>
                            {quizResult.type === 'success'
                                ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                                : <XCircle className="h-4 w-4 text-red-400" />}
                            <AlertDescription className="text-xs ml-2">{quizResult.text}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* ── 커뮤니티 관리 ─────────────────────────────────────── */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-base">
                        <MessageSquare className="w-4 h-4 text-pink-400" />
                        커뮤니티 관리
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button
                            onClick={loadCommunity}
                            disabled={communityLoading}
                            className="bg-pink-700 hover:bg-pink-600 text-white text-sm"
                        >
                            {communityLoading
                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                : <BarChart2 className="mr-2 h-4 w-4" />}
                            현황 불러오기
                        </Button>
                        <a href="/community" target="_blank" rel="noreferrer">
                            <Button variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white text-xs">
                                커뮤니티 보기
                            </Button>
                        </a>
                    </div>

                    {communityStats && (
                        <>
                            {/* 통계 요약 */}
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: '전체 글', value: communityStats.stats.totalPosts },
                                    { label: '전체 댓글', value: communityStats.stats.totalComments },
                                    { label: '오늘 글', value: communityStats.stats.postsToday },
                                    { label: '오늘 댓글', value: communityStats.stats.commentsToday },
                                ].map(s => (
                                    <div key={s.label} className="bg-zinc-800/60 rounded-lg p-3 text-center border border-zinc-700">
                                        <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                                        <p className="text-lg font-bold text-white">{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* 최근 게시글 */}
                            <div className="space-y-1 max-h-72 overflow-y-auto">
                                {communityStats.recentPosts.length === 0 && (
                                    <p className="text-xs text-zinc-500 text-center py-4">게시글 없음</p>
                                )}
                                {communityStats.recentPosts.map(post => (
                                    <div key={post.id} className="flex items-center gap-3 p-2.5 bg-zinc-800/40 rounded-lg border border-zinc-700/50 text-xs">
                                        <Badge className="shrink-0 text-[10px] bg-zinc-700 text-zinc-300">{post.category}</Badge>
                                        <a
                                            href={`/community/${post.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 text-zinc-200 hover:text-white truncate"
                                        >
                                            {post.title}
                                        </a>
                                        <span className="text-zinc-500 shrink-0">
                                            조회 {post.viewCount} · 댓글 {post.commentCount}
                                        </span>
                                        <span className="text-zinc-600 shrink-0">{post.author?.name ?? '익명'}</span>
                                        <button
                                            onClick={() => deletePost(post.id)}
                                            className="shrink-0 text-red-500 hover:text-red-400 p-1 rounded"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── 2026 라이브 통계 안내 ──────────────────────────────── */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-base">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        2026 시즌 통계 (실시간)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-xs text-zinc-400">
                        2026 시즌 통계는 LCK 데이터 동기화 시 자동으로 업데이트됩니다.
                        DB에 저장된 실시간 경기 데이터를 집계하여 /info 통계 페이지에 즉시 반영합니다.
                    </p>
                    <div className="flex gap-2">
                        <a href="/info?year=2026" target="_blank" rel="noreferrer">
                            <Button variant="outline" className="border-green-700 text-green-400 hover:text-white text-xs">
                                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                2026 통계 보기
                            </Button>
                        </a>
                        <a href="/api/stats?year=2026&type=team&tournament=all_korea" target="_blank" rel="noreferrer">
                            <Button variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white text-xs">
                                API 직접 확인
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* ── 퀵 링크 ────────────────────────────────────────────── */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                    <p className="text-xs text-zinc-500 mb-3">직접 API 접근</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'GET 경기 목록',     href: '/api/lck/matches' },
                            { label: 'GET 예측 현황',     href: '/api/lck/predictions/process' },
                            { label: 'GET 퀘스트 목록',   href: '/api/quests' },
                            { label: 'GET 퀴즈 오늘',     href: '/api/quiz/today' },
                            { label: 'GET 퀴즈 시딩',     href: '/api/quiz/seed' },
                            { label: 'GET Cron 동기화',   href: '/api/cron/sync' },
                            { label: 'GET Cron 정산',     href: '/api/cron/process' },
                        ].map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
