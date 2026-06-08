'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
    Target, Flame, Trophy, CheckCircle2, XCircle,
    Clock, Loader2, TrendingUp, Coins, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CURRENT_SEASON } from '@/lib/config/season'
import { TEAM_COLORS } from '@/lib/config/teams'

// ─── 팀 이름→코드 역매핑 (team1/team2가 "TBD"일 때 사용) ────────────────
const TEAM_NAME_TO_CODE: Record<string, string> = {
    // 정식 표기
    'Dplus KIA': 'DK',          'HANJIN BRION': 'BRO',    'Hanjin Brion': 'BRO',
    'Hanwha Life Esports': 'HLE', 'kt Rolster': 'KT',      'KT Rolster': 'KT',
    'T1': 'T1',                 'Gen.G Esports': 'GEN',    'BNK FEARX': 'BFX',
    'KIWOOM DRX': 'KRX',       'Kiwoom DRX': 'KRX',
    'DN SOOPers': 'DNS',        'NONGSHIM RED FORCE': 'NS', 'Nongshim Red Force': 'NS',
    // 소문자 변형 (matches/page.tsx와 동기화)
    'dplus kia': 'DK',          'hanjin brion': 'BRO',
    'hanwha life esports': 'HLE', 'gen.g esports': 'GEN',
    'bnk fearx': 'BFX',         'kiwoom drx': 'KRX',
    'dn soopers': 'DNS',         'nongshim red force': 'NS',
}

function resolveTeam(code: string, name: string | null): { code: string; display: string; confirmed: boolean } {
    if (code && code !== 'TBD') return { code, display: code, confirmed: true }
    if (!name || name === 'TBD') return { code: 'TBD', display: 'TBD', confirmed: false }
    // 정확한 이름 매칭 먼저, 그 다음 소문자 매칭
    const resolved = TEAM_NAME_TO_CODE[name]
        ?? TEAM_NAME_TO_CODE[name.toLowerCase()]
        ?? null
    if (!resolved) return { code: 'TBD', display: name, confirmed: false }
    return { code: resolved, display: name, confirmed: true }
}

// ─── 타입 ───────────────────────────────────────────────────────────────
interface LckMatch {
    id: string
    team1: string
    team2: string
    team1Name: string | null
    team2Name: string | null
    team1Logo: string | null
    team2Logo: string | null
    team1Score: number
    team2Score: number
    winner: string | null
    status: string
    scheduledAt: string | null
    displayName: string | null
    bestOf: number
    season: string
}

interface LckPrediction {
    id: string
    matchId: string
    predictedWinner: string
    predictedScore: string | null
    isProcessed: boolean
    winnerCorrect: boolean | null
    scoreCorrect: boolean | null
    gpEarned: number
    match: LckMatch
}

interface PredictionStats {
    total: number
    processed: number
    correct: number
    accuracy: number
    totalGp: number
    streak: number
}

// ─── 팀 로고 컴포넌트 ──────────────────────────────────────────────────
function TeamLogo({ code, logoUrl, size = 'md' }: { code: string; logoUrl: string | null; size?: 'sm' | 'md' | 'lg' }) {
    const [err, setErr] = useState(false)
    const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-10 h-10' : 'w-7 h-7'
    const textSize = size === 'lg' ? 'text-base' : size === 'md' ? 'text-xs' : 'text-[10px]'
    const color = TEAM_COLORS[code] ?? '#71717a'

    if (logoUrl && !err) {
        return (
            <img
                src={logoUrl}
                alt={code}
                className={cn(sizeClass, 'object-contain drop-shadow')}
                onError={() => setErr(true)}
            />
        )
    }
    return (
        <div
            className={cn(sizeClass, 'rounded-full flex items-center justify-center font-black', textSize)}
            style={{ background: color + '22', border: `2px solid ${color}`, color }}
        >
            {code.slice(0, 3)}
        </div>
    )
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function PredictionPage() {
    const { data: session } = useSession()
    const [userGp, setUserGp] = useState(0)
    const [upcomingMatches, setUpcomingMatches] = useState<LckMatch[]>([])
    const [completedMatches, setCompletedMatches] = useState<LckMatch[]>([])
    const [myPredictions, setMyPredictions] = useState<LckPrediction[]>([])
    const [stats, setStats] = useState<PredictionStats | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [matchRes, predRes, gpRes] = await Promise.all([
                fetch(`/api/lck/matches?season=${CURRENT_SEASON}&limit=200`),
                session ? fetch('/api/lck/predictions/my') : Promise.resolve(null),
                session ? fetch('/api/users/me') : Promise.resolve(null),
            ])

            const matchData = await matchRes.json()
            const allMatches: LckMatch[] = matchData.matches ?? []
            const now = new Date()
            const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

            // 오늘부터 7일 이내 예정 경기만 예측 표시
            // 단, team1/team2가 "TBD"여도 team1Name/team2Name으로 팀이 확정된 경우 포함
            setUpcomingMatches(
                allMatches
                    .filter(m => {
                        if (m.status === 'COMPLETED') return false
                        if (!m.scheduledAt) return false
                        // 양 팀 모두 확정 여부 확인 (코드 OR 이름 기준)
                        const t1 = resolveTeam(m.team1, m.team1Name)
                        const t2 = resolveTeam(m.team2, m.team2Name)
                        if (!t1.confirmed || !t2.confirmed) return false
                        const d = new Date(m.scheduledAt)
                        return d >= now && d <= sevenDaysLater
                    })
                    .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime())
            )
            setCompletedMatches(
                allMatches
                    .filter(m => m.status === 'COMPLETED')
                    .sort((a, b) => new Date(b.scheduledAt ?? 0).getTime() - new Date(a.scheduledAt ?? 0).getTime())
            )

            if (predRes) {
                const predData = await predRes.json()
                setMyPredictions(predData.predictions ?? [])
                setStats(predData.stats ?? null)
            }

            if (gpRes) {
                const gpData = await gpRes.json()
                if (gpData.gp !== undefined) setUserGp(gpData.gp)
            }
        } catch (e) {
            toast.error('데이터를 불러오지 못했습니다.')
        } finally {
            setLoading(false)
        }
    }, [session])

    useEffect(() => { fetchAll() }, [fetchAll])

    const getPred = (matchId: string) => myPredictions.find(p => p.matchId === matchId)

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
            {/* ─ 헤더 */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Target className="w-7 h-7 text-yellow-500" />
                        승부 예측 리그
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">오늘부터 7일간의 경기를 예측하고 GP를 획득하세요</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-zinc-500">보유 GP</p>
                    <p className="text-xl font-black text-yellow-400">{userGp.toLocaleString()} <span className="text-sm font-normal">GP</span></p>
                </div>
            </div>

            {/* ─ 내 통계 */}
            {session && stats && (
                <StatsBar stats={stats} />
            )}

            {/* ─ 탭 */}
            <Tabs defaultValue="upcoming">
                <TabsList className="w-full grid grid-cols-3 bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="upcoming" className="data-[state=active]:bg-zinc-800">
                        이번 7일 ({upcomingMatches.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="data-[state=active]:bg-zinc-800">
                        완료된 경기
                    </TabsTrigger>
                    <TabsTrigger value="my" className="data-[state=active]:bg-zinc-800">
                        내 예측
                    </TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                    </div>
                ) : (
                    <>
                        {/* 예측 가능 */}
                        <TabsContent value="upcoming" className="mt-4 space-y-3">
                            {upcomingMatches.length === 0 ? (
                                <EmptyState icon={<Clock className="w-10 h-10 text-zinc-700" />} text="예정된 경기가 없습니다" />
                            ) : (
                                upcomingMatches.map(match => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        prediction={getPred(match.id)}
                                        onPredict={fetchAll}
                                        isLoggedIn={!!session}
                                    />
                                ))
                            )}
                        </TabsContent>

                        {/* 완료된 경기 */}
                        <TabsContent value="completed" className="mt-4 space-y-3">
                            {completedMatches.length === 0 ? (
                                <EmptyState icon={<Trophy className="w-10 h-10 text-zinc-700" />} text="완료된 경기가 없습니다" />
                            ) : (
                                completedMatches.slice(0, 30).map(match => (
                                    <CompletedMatchCard
                                        key={match.id}
                                        match={match}
                                        prediction={getPred(match.id)}
                                    />
                                ))
                            )}
                        </TabsContent>

                        {/* 내 예측 */}
                        <TabsContent value="my" className="mt-4 space-y-3">
                            {!session ? (
                                <EmptyState icon={<Target className="w-10 h-10 text-zinc-700" />} text="로그인 후 예측에 참여하세요" />
                            ) : myPredictions.length === 0 ? (
                                <EmptyState icon={<Target className="w-10 h-10 text-zinc-700" />} text="아직 예측한 경기가 없습니다" />
                            ) : (
                                myPredictions.map(pred => (
                                    <MyPredictionCard key={pred.id} pred={pred} />
                                ))
                            )}
                        </TabsContent>
                    </>
                )}
            </Tabs>

            {/* 규칙 안내 */}
            <PredictionRules />
        </div>
    )
}

// ─── 통계 바 ────────────────────────────────────────────────────────────
function StatsBar({ stats }: { stats: PredictionStats }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
                {
                    label: '적중률', value: stats.processed > 0 ? `${stats.accuracy}%` : '-',
                    icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-400'
                },
                {
                    label: '예측 수', value: `${stats.correct}/${stats.processed}`,
                    icon: <Target className="w-4 h-4" />, color: 'text-blue-400'
                },
                {
                    label: '연속 적중', value: stats.streak > 0 ? `${stats.streak}연속` : '-',
                    icon: <Flame className="w-4 h-4" />, color: 'text-orange-400'
                },
                {
                    label: '획득 GP', value: `+${stats.totalGp}`,
                    icon: <Coins className="w-4 h-4" />, color: 'text-yellow-400'
                },
            ].map(item => (
                <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                    <div className={cn('flex justify-center mb-1', item.color)}>{item.icon}</div>
                    <p className={cn('font-black text-lg leading-none', item.color)}>{item.value}</p>
                    <p className="text-zinc-500 text-[11px] mt-1">{item.label}</p>
                </div>
            ))}
        </div>
    )
}

// ─── 마감 카운트다운 훅 ────────────────────────────────────────────────
function useCutdownLeft(scheduledAt: string | null) {
    const cutoffMs = scheduledAt
        ? new Date(scheduledAt).getTime() - 5 * 60 * 1000
        : null
    const [msLeft, setMsLeft] = useState(() => cutoffMs ? cutoffMs - Date.now() : null)

    useEffect(() => {
        if (cutoffMs === null) return
        setMsLeft(cutoffMs - Date.now())
        const t = setInterval(() => {
            const left = cutoffMs - Date.now()
            setMsLeft(left)
            if (left <= 0) clearInterval(t)
        }, 10_000)
        return () => clearInterval(t)
    }, [cutoffMs])

    return msLeft
}

function CutoffBadge({ msLeft }: { msLeft: number | null }) {
    if (msLeft === null || msLeft <= 0) return null
    const totalMin = Math.floor(msLeft / 60000)
    if (totalMin > 120) return null // 2시간 이상 남으면 표시 안 함
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    const label = h > 0 ? `마감 ${h}h ${m}m 전` : `마감 ${m}분 전`
    const urgent = totalMin <= 15
    return (
        <span className={cn(
            'text-[11px] font-bold px-2 py-0.5 rounded-full border',
            urgent
                ? 'text-red-400 bg-red-500/10 border-red-500/30 animate-pulse'
                : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
        )}>
            ⏰ {label}
        </span>
    )
}

// ─── 예측 카드 (예정 경기) ────────────────────────────────────────────
function MatchCard({
    match, prediction, onPredict, isLoggedIn
}: {
    match: LckMatch
    prediction: LckPrediction | undefined
    onPredict: () => void
    isLoggedIn: boolean
}) {
    const [selectedWinner, setSelectedWinner] = useState<string | null>(null)
    const [selectedScore, setSelectedScore] = useState<string | null>(null)
    const [expanded, setExpanded] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const msLeft = useCutdownLeft(match.scheduledAt)
    // ✅ BUG-7 수정: scheduledAt이 null이면 마감 여부 미정 → false (미정 경기에 "예측 마감" 표시 방지)
    const isCutoff = msLeft !== null ? msLeft <= 0 : false

    const submitPrediction = async () => {
        if (!selectedWinner) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/lck/predictions/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: match.id,
                    predictedWinner: selectedWinner,
                    predictedScore: selectedScore,
                })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('예측 완료! 결과를 기다려보세요 🎯')
                setExpanded(false)
                onPredict()
            } else {
                toast.error(data.error ?? '예측 실패')
            }
        } catch {
            toast.error('오류가 발생했습니다.')
        } finally {
            setSubmitting(false)
        }
    }

    const scheduledStr = match.scheduledAt
        ? new Date(match.scheduledAt).toLocaleString('ko-KR', {
            month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
        })
        : '일정 미정'

    const isLive = match.status === 'LIVE'

    // TBD 팀 해소: team1/team2 코드가 "TBD"이면 teamName에서 코드 추론
    const r1 = resolveTeam(match.team1, match.team1Name)
    const r2 = resolveTeam(match.team2, match.team2Name)
    const stageLabel = (() => {
        const dn = match.displayName
        if (!dn) return null
        const i = dn.lastIndexOf(' - ')
        return (i !== -1 ? dn.slice(i + 3) : dn).trim() || null
    })()

    return (
        <div className={cn(
            'border rounded-2xl overflow-hidden transition-all',
            prediction ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-900',
            isLive && 'border-red-500/50'
        )}>
            {/* 경기 헤더 */}
            <div className="p-4">
                {/* 대회/라운드 + BO 정보 — 상단 중앙 */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {isLive && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                LIVE
                            </span>
                        )}
                        {stageLabel && (
                            <span className="text-[11px] font-bold text-zinc-200 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5">
                                {stageLabel}
                            </span>
                        )}
                        <span className="text-zinc-500 text-xs">{scheduledStr}</span>
                        {!prediction && <CutoffBadge msLeft={msLeft} />}
                    </div>
                    <span className="text-[10px] font-bold text-yellow-600 border border-yellow-700/40 rounded px-1.5 py-0.5 bg-yellow-500/5">
                        BO{match.bestOf}
                    </span>
                </div>

                {/* 팀 매치업 */}
                <div className="flex items-center justify-between">
                    {/* 팀1 */}
                    <button
                        type="button"
                        aria-label={`${r1.display} 선택`}
                        aria-pressed={selectedWinner === r1.code}
                        disabled={!!prediction || isCutoff}
                        className={cn(
                            'flex flex-col items-center gap-2 flex-1 p-3 rounded-xl cursor-pointer transition-all border-2 disabled:cursor-default',
                            !prediction && !isCutoff
                                ? selectedWinner === r1.code
                                    ? 'border-yellow-500 bg-yellow-500/10'
                                    : 'border-transparent hover:border-zinc-600'
                                : 'border-transparent',
                            prediction?.predictedWinner === r1.code && 'border-yellow-500/50 bg-yellow-500/5'
                        )}
                        onClick={() => {
                            if (!prediction && !isCutoff) setSelectedWinner(r1.code)
                        }}
                    >
                        <TeamLogo code={r1.code} logoUrl={match.team1Logo} size="lg" />
                        <div className="text-center">
                            <p className="font-black text-white text-sm">{r1.code !== r1.display ? r1.code : r1.display}</p>
                            <p className="text-zinc-500 text-[11px]">{r1.display !== r1.code ? r1.display : match.team1Name}</p>
                        </div>
                    </button>

                    {/* VS */}
                    <div className="flex flex-col items-center px-3">
                        <span className="text-zinc-600 font-mono text-sm font-bold">VS</span>
                        {prediction && (
                            <span className="text-yellow-500 text-[11px] mt-1 font-medium">예측 완료</span>
                        )}
                    </div>

                    {/* 팀2 */}
                    <button
                        type="button"
                        aria-label={`${r2.display} 선택`}
                        aria-pressed={selectedWinner === r2.code}
                        disabled={!!prediction || isCutoff}
                        className={cn(
                            'flex flex-col items-center gap-2 flex-1 p-3 rounded-xl cursor-pointer transition-all border-2 disabled:cursor-default',
                            !prediction && !isCutoff
                                ? selectedWinner === r2.code
                                    ? 'border-yellow-500 bg-yellow-500/10'
                                    : 'border-transparent hover:border-zinc-600'
                                : 'border-transparent',
                            prediction?.predictedWinner === r2.code && 'border-yellow-500/50 bg-yellow-500/5'
                        )}
                        onClick={() => {
                            if (!prediction && !isCutoff) setSelectedWinner(r2.code)
                        }}
                    >
                        <TeamLogo code={r2.code} logoUrl={match.team2Logo} size="lg" />
                        <div className="text-center">
                            <p className="font-black text-white text-sm">{r2.code !== r2.display ? r2.code : r2.display}</p>
                            <p className="text-zinc-500 text-[11px]">{r2.display !== r2.code ? r2.display : match.team2Name}</p>
                        </div>
                    </button>
                </div>

                {/* 예측 완료 상태 */}
                {prediction && (
                    <div className="mt-3 text-center">
                        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                            🎯 {prediction.predictedWinner} 승리 예측
                            {prediction.predictedScore && ` · ${prediction.predictedScore} 예측`}
                        </Badge>
                    </div>
                )}

                {/* 예측 UI */}
                {!prediction && !isCutoff && isLoggedIn && (
                    <div className="mt-3">
                        {selectedWinner ? (
                            <div className="space-y-3">
                                {/* 스코어 예측 (옵션) */}
                                {(match.bestOf === 3 || match.bestOf === 5) && (
                                    <div>
                                        <p className="text-xs text-zinc-400 mb-2 text-center">
                                            스코어 예측 (선택, 맞추면 +20 GP 추가)
                                        </p>
                                        <div className={cn(
                                            'gap-2',
                                            match.bestOf === 5 ? 'grid grid-cols-3' : 'grid grid-cols-2'
                                        )}>
                                            {(match.bestOf === 5
                                                ? ['3:0', '3:1', '3:2']
                                                : ['2:0', '2:1']
                                            ).map(score => (
                                                <button
                                                    key={score}
                                                    onClick={() => setSelectedScore(prev => prev === score ? null : score)}
                                                    className={cn(
                                                        'py-2 rounded-lg text-sm font-bold border transition-all',
                                                        selectedScore === score
                                                            ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400'
                                                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                                    )}
                                                >
                                                    {score}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 text-zinc-500 border border-zinc-800"
                                        onClick={() => { setSelectedWinner(null); setSelectedScore(null) }}
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                                        onClick={submitPrediction}
                                        disabled={submitting}
                                    >
                                        {submitting
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : `${selectedWinner === r1.code ? (r1.code) : (r2.code)} 승리 예측 (+${10 + (selectedScore ? 20 : 0)} GP)`
                                        }
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-zinc-500 text-xs mt-1">
                                팀을 선택해 예측하세요
                            </p>
                        )}
                    </div>
                )}

                {!isLoggedIn && (
                    <p className="text-center text-zinc-600 text-xs mt-3">로그인 후 예측에 참여할 수 있습니다</p>
                )}

                {isCutoff && !prediction && (
                    <p className="text-center text-zinc-600 text-xs mt-3">예측 마감 (경기 시작 5분 전)</p>
                )}
            </div>
        </div>
    )
}

// ─── 완료된 경기 카드 ──────────────────────────────────────────────────
function CompletedMatchCard({ match, prediction }: { match: LckMatch; prediction: LckPrediction | undefined }) {
    const winner = match.winner
    const scheduledStr = match.scheduledAt
        ? new Date(match.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
        : ''
    const stageLabel = (() => {
        const dn = match.displayName
        if (!dn) return null
        const i = dn.lastIndexOf(' - ')
        return (i !== -1 ? dn.slice(i + 3) : dn).trim() || null
    })()

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-600 mb-3">
                <div className="flex items-center gap-2">
                    <span>{scheduledStr}</span>
                    {stageLabel && (
                        <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5">
                            {stageLabel}
                        </span>
                    )}
                </div>
                <span className="text-zinc-700">BO{match.bestOf}</span>
            </div>
            <div className="flex items-center justify-between">
                {/* 팀1 */}
                <div className={cn('flex items-center gap-3 flex-1', winner === match.team1 ? 'opacity-100' : 'opacity-40')}>
                    <TeamLogo code={match.team1} logoUrl={match.team1Logo} size="md" />
                    <div>
                        <p className={cn('font-black text-sm', winner === match.team1 ? 'text-white' : 'text-zinc-500')}>
                            {match.team1}
                        </p>
                        {winner === match.team1 && <p className="text-[10px] text-yellow-500 font-bold">WIN</p>}
                    </div>
                </div>

                {/* 스코어 */}
                <div className="text-center px-4">
                    <p className="font-black text-2xl text-white tracking-wider">
                        {match.team1Score} : {match.team2Score}
                    </p>
                </div>

                {/* 팀2 */}
                <div className={cn('flex items-center gap-3 flex-1 justify-end', winner === match.team2 ? 'opacity-100' : 'opacity-40')}>
                    <div className="text-right">
                        <p className={cn('font-black text-sm', winner === match.team2 ? 'text-white' : 'text-zinc-500')}>
                            {match.team2}
                        </p>
                        {winner === match.team2 && <p className="text-[10px] text-yellow-500 font-bold">WIN</p>}
                    </div>
                    <TeamLogo code={match.team2} logoUrl={match.team2Logo} size="md" />
                </div>
            </div>

            {/* 내 예측 결과 */}
            {prediction && (
                <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                        예측: {prediction.predictedWinner} 승리
                        {prediction.predictedScore && ` · ${prediction.predictedScore}`}
                    </span>
                    {prediction.isProcessed ? (
                        prediction.winnerCorrect ? (
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 text-xs font-bold">
                                    적중 +{prediction.gpEarned} GP
                                </span>
                                {prediction.scoreCorrect && (
                                    <Badge className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                        스코어 보너스
                                    </Badge>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span className="text-red-400 text-xs">빗나감</span>
                            </div>
                        )
                    ) : (
                        <span className="text-zinc-600 text-xs">정산 대기 중...</span>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── 내 예측 카드 ──────────────────────────────────────────────────────
function MyPredictionCard({ pred }: { pred: LckPrediction }) {
    const match = pred.match
    const isCompleted = match.status === 'COMPLETED'
    const scheduledStr = match.scheduledAt
        ? new Date(match.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
        : '일정 미정'

    return (
        <div className={cn(
            'border rounded-xl p-4 transition-all',
            !isCompleted ? 'border-zinc-800 bg-zinc-900'
                : pred.winnerCorrect ? 'border-green-500/30 bg-green-500/5'
                    : 'border-red-500/20 bg-red-500/5'
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TeamLogo code={match.team1} logoUrl={match.team1Logo} size="sm" />
                    <span className="text-zinc-500 text-xs font-mono">vs</span>
                    <TeamLogo code={match.team2} logoUrl={match.team2Logo} size="sm" />
                    <div>
                        <p className="text-white text-sm font-bold">
                            {match.team1} vs {match.team2}
                        </p>
                        <p className="text-zinc-600 text-[11px]">{scheduledStr}</p>
                    </div>
                </div>

                {/* 결과 배지 */}
                {!isCompleted ? (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        대기 중
                    </Badge>
                ) : pred.isProcessed ? (
                    pred.winnerCorrect ? (
                        <div className="text-right">
                            <Badge className="bg-green-500/15 text-green-400 border-green-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                적중
                            </Badge>
                            <p className="text-yellow-400 text-xs font-bold mt-1">+{pred.gpEarned} GP</p>
                        </div>
                    ) : (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                            <XCircle className="w-3 h-3 mr-1" />
                            실패
                        </Badge>
                    )
                ) : (
                    <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700 text-xs">정산 중</Badge>
                )}
            </div>

            {/* 예측 내용 */}
            <div className="mt-2 flex items-center gap-2">
                <span className="text-zinc-500 text-xs">예측:</span>
                <span className="text-yellow-400 text-xs font-bold">
                    {pred.predictedWinner} 승리
                    {pred.predictedScore && ` (${pred.predictedScore})`}
                </span>
                {isCompleted && match.winner && (
                    <>
                        <span className="text-zinc-700 text-xs">→ 실제:</span>
                        <span className="text-white text-xs font-bold">
                            {match.winner} 승 ({match.team1Score}:{match.team2Score})
                        </span>
                    </>
                )}
            </div>
        </div>
    )
}

// ─── 규칙 안내 ────────────────────────────────────────────────────────
function PredictionRules() {
    const [open, setOpen] = useState(false)
    return (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-4 text-left text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-sm font-semibold">예측 리그 규칙 및 GP 보상 안내</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="px-4 pb-4 space-y-3 text-sm text-zinc-400">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: '승팀 맞히기', gp: '+10 GP', desc: '기본 보상' },
                            { label: '스코어까지 맞히기', gp: '+30 GP', desc: '승팀 +20 보너스' },
                        ].map(r => (
                            <div key={r.label} className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                                <p className="font-bold text-yellow-400">{r.gp}</p>
                                <p className="text-white text-xs mt-1">{r.label}</p>
                                <p className="text-zinc-600 text-[11px]">{r.desc}</p>
                            </div>
                        ))}
                    </div>
                    <ul className="space-y-1 text-xs text-zinc-500 list-disc list-inside">
                        <li>예측은 경기 시작 5분 전까지 가능합니다</li>
                        <li>1경기당 1회만 예측할 수 있습니다</li>
                        <li>경기 완료 후 자동으로 GP가 정산됩니다</li>
                        <li>스코어 예측은 BO3 경기만 가능합니다</li>
                    </ul>
                </div>
            )}
        </div>
    )
}

// ─── 빈 상태 ────────────────────────────────────────────────────────────
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
            {icon}
            <p className="text-sm">{text}</p>
        </div>
    )
}
