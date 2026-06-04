'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, ArrowLeft, Medal, Crown, Zap, Shield, Swords, Eye } from 'lucide-react'

const YEAR_PRESETS = [
    { label: '전체 (2014~2025)', from: '2014', to: '2025' },
    { label: '최근 5시즌',       from: '2021', to: '2025' },
    { label: '최근 3시즌',       from: '2023', to: '2025' },
    { label: '2025 시즌',       from: '2025', to: '2025' },
    { label: '2024 시즌',       from: '2024', to: '2024' },
    { label: '2023 시즌',       from: '2023', to: '2023' },
]

// 기준점(scope) 설정
const SCOPE_OPTIONS = [
    { value: 'lck',   label: 'LCK 국내만',        tournament: 'all_korea', note: 'LCK 리그 경기만' },
    { value: 'intl',  label: 'LCK + 국제대회',     tournament: 'all_intl',  note: 'MSI · Worlds 포함' },
    { value: 'all',   label: '전체 통합 (글로벌)', tournament: 'all',       note: 'LPL·LEC·LCS 등 포함' },
] as const
type ScopeValue = typeof SCOPE_OPTIONS[number]['value']

interface TeamEntry  { teamName: string; year: number; tournament: string; games: number; wins: number; losses: number; totalKills: number; totalDeaths: number; totalDamage: number }
interface PlayerEntry { playerName: string; teamName: string; position: string; year: number; tournament: string; games: number; wins: number; losses: number; totalKills: number; totalDeaths: number; totalAssists: number; totalDamage: number; averageKDA: number; averageDPM: number; averageVisionScore: number }

interface RecordItem {
    rank: number
    label: string
    sub: string
    value: string
    year: number | string
    tournament: string
}

const RANK_ICONS = ['🥇', '🥈', '🥉']

function rankColor(rank: number) {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-zinc-300'
    if (rank === 3) return 'text-orange-400'
    return 'text-zinc-500'
}

function RecordTable({ title, icon: Icon, iconColor, records, loading }: {
    title: string
    icon: any
    iconColor: string
    records: RecordItem[]
    loading: boolean
}) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-sm">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="px-4 py-6 text-center text-zinc-500 text-xs">로딩 중...</div>
                ) : records.length === 0 ? (
                    <div className="px-4 py-6 text-center text-zinc-500 text-xs">데이터 없음</div>
                ) : (
                    <div className="divide-y divide-zinc-800/60">
                        {records.map((r, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors">
                                <span className="text-base w-6 text-center shrink-0">
                                    {i < 3 ? RANK_ICONS[i] : <span className={`text-xs font-bold ${rankColor(r.rank)}`}>{r.rank}</span>}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{r.label}</p>
                                    <p className="text-xs text-zinc-500 truncate">{r.sub} · {r.tournament}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-sm font-bold ${i === 0 ? 'text-yellow-400' : 'text-zinc-200'}`}>{r.value}</p>
                                    <p className="text-[10px] text-zinc-600">{r.year}년</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function RecordsPage() {
    const [preset, setPreset] = useState('0')
    const [scope,   setScope]  = useState<ScopeValue>('lck')
    const [teams,   setTeams]   = useState<TeamEntry[]>([])
    const [players, setPlayers] = useState<PlayerEntry[]>([])
    const [intlTeams,   setIntlTeams]   = useState<TeamEntry[]>([])
    const [intlPlayers, setIntlPlayers] = useState<PlayerEntry[]>([])
    const [loading, setLoading] = useState(false)

    const { from, to } = YEAR_PRESETS[parseInt(preset)] ?? YEAR_PRESETS[0]
    const scopeOpt = SCOPE_OPTIONS.find(s => s.value === scope) ?? SCOPE_OPTIONS[0]

    useEffect(() => {
        setLoading(true)
        const base = `yearFrom=${from}&yearTo=${to}&division=1`

        if (scope === 'intl') {
            // LCK + International = 두 데이터셋 병합
            Promise.all([
                fetch(`/api/stats?type=team&${base}&tournament=all_korea`).then(r => r.json()),
                fetch(`/api/stats?type=player&${base}&tournament=all_korea`).then(r => r.json()),
                fetch(`/api/stats?type=team&${base}&tournament=all_intl`).then(r => r.json()),
                fetch(`/api/stats?type=player&${base}&tournament=all_intl`).then(r => r.json()),
            ]).then(([tk, pk, ti, pi]) => {
                setTeams(Array.isArray(tk) ? tk : [])
                setPlayers(Array.isArray(pk) ? pk : [])
                setIntlTeams(Array.isArray(ti) ? ti : [])
                setIntlPlayers(Array.isArray(pi) ? pi : [])
            }).catch(() => {
                setTeams([]); setPlayers([]); setIntlTeams([]); setIntlPlayers([])
            }).finally(() => setLoading(false))
        } else {
            const tournament = scopeOpt.tournament
            Promise.all([
                fetch(`/api/stats?type=team&${base}&tournament=${tournament}`).then(r => r.json()),
                fetch(`/api/stats?type=player&${base}&tournament=${tournament}`).then(r => r.json()),
            ]).then(([t, p]) => {
                setTeams(Array.isArray(t) ? t : [])
                setPlayers(Array.isArray(p) ? p : [])
                setIntlTeams([]); setIntlPlayers([])
            }).catch(() => {
                setTeams([]); setPlayers([]); setIntlTeams([]); setIntlPlayers([])
            }).finally(() => setLoading(false))
        }
    }, [from, to, scope])

    // scope=intl이면 LCK + International 합산
    const allTeams   = scope === 'intl' ? [...teams,   ...intlTeams]   : teams
    const allPlayers = scope === 'intl' ? [...players, ...intlPlayers] : players

    // ── 팀 기록 ──────────────────────────────────────────────────────────
    const topTeamWins: RecordItem[] = [...allTeams]
        .filter(t => t.games >= 5)
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 10)
        .map((t, i) => ({
            rank: i + 1, label: t.teamName,
            sub: `${t.games}경기`,
            value: `${t.wins}승`, year: t.year, tournament: t.tournament
        }))

    const topTeamWinRate: RecordItem[] = [...allTeams]
        .filter(t => t.games >= 20)
        .sort((a, b) => (b.wins / b.games) - (a.wins / a.games))
        .slice(0, 10)
        .map((t, i) => ({
            rank: i + 1, label: t.teamName,
            sub: `${t.games}경기 ${t.wins}승`,
            value: `${((t.wins / t.games) * 100).toFixed(1)}%`,
            year: t.year, tournament: t.tournament
        }))

    const topTeamKillsPerGame: RecordItem[] = [...allTeams]
        .filter(t => t.games >= 10)
        .sort((a, b) => (b.totalKills / b.games) - (a.totalKills / a.games))
        .slice(0, 10)
        .map((t, i) => ({
            rank: i + 1, label: t.teamName,
            sub: `${t.games}경기`,
            value: `${(t.totalKills / t.games).toFixed(1)} 킬/게임`,
            year: t.year, tournament: t.tournament
        }))

    // ── 선수 기록 ─────────────────────────────────────────────────────────
    const topKDA: RecordItem[] = [...allPlayers]
        .filter(p => p.games >= 20)
        .sort((a, b) => b.averageKDA - a.averageKDA)
        .slice(0, 10)
        .map((p, i) => ({
            rank: i + 1, label: p.playerName,
            sub: `${p.teamName} · ${p.position}`,
            value: p.averageKDA.toFixed(2),
            year: p.year, tournament: p.tournament
        }))

    const topDPM: RecordItem[] = [...allPlayers]
        .filter(p => p.games >= 20)
        .sort((a, b) => b.averageDPM - a.averageDPM)
        .slice(0, 10)
        .map((p, i) => ({
            rank: i + 1, label: p.playerName,
            sub: `${p.teamName} · ${p.position}`,
            value: `${Math.round(p.averageDPM).toLocaleString()} DPM`,
            year: p.year, tournament: p.tournament
        }))

    const topGames: RecordItem[] = [...allPlayers]
        .sort((a, b) => b.games - a.games)
        .slice(0, 10)
        .map((p, i) => ({
            rank: i + 1, label: p.playerName,
            sub: `${p.teamName} · ${p.position}`,
            value: `${p.games}게임`,
            year: p.year, tournament: p.tournament
        }))

    const topVision: RecordItem[] = [...allPlayers]
        .filter(p => p.games >= 20 && (p.position === 'SUPPORT' || p.position === 'JUNGLE'))
        .sort((a, b) => b.averageVisionScore - a.averageVisionScore)
        .slice(0, 10)
        .map((p, i) => ({
            rank: i + 1, label: p.playerName,
            sub: `${p.teamName} · ${p.position}`,
            value: p.averageVisionScore.toFixed(1),
            year: p.year, tournament: p.tournament
        }))

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6 pb-20">
            {/* 헤더 */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <Link href="/info" className="text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">역대 기록</h1>
                        <p className="text-sm text-zinc-400">1부 리그 통합 역대 기록 (디비전 1 기준)</p>
                    </div>
                </div>
                <Select value={preset} onValueChange={setPreset}>
                    <SelectTrigger className="w-44 bg-zinc-900 border-zinc-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {YEAR_PRESETS.map((p, i) => (
                            <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 기준점(scope) 선택 */}
            <div className="flex gap-2 flex-wrap">
                {SCOPE_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setScope(opt.value)}
                        className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-sm transition-all ${
                            scope === opt.value
                                ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                        }`}
                    >
                        <span className="font-semibold">{opt.label}</span>
                        <span className="text-[10px] opacity-60 mt-0.5">{opt.note}</span>
                    </button>
                ))}
            </div>

            {/* 상태 배지 */}
            <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                    {YEAR_PRESETS[parseInt(preset)]?.label}
                </Badge>
                <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {scopeOpt.label}
                </Badge>
                <span className="text-xs text-zinc-500">
                    팀 {allTeams.length}개 · 선수 {allPlayers.length}개 시즌 기록
                </span>
            </div>

            {/* ── 팀 기록 ───────────────────────── */}
            <div>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" /> 팀 기록
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <RecordTable title="최다 승리 (시즌)"          icon={Trophy}  iconColor="text-yellow-400" records={topTeamWins}        loading={loading} />
                    <RecordTable title="최고 승률 (20경기 이상)"    icon={Crown}   iconColor="text-purple-400" records={topTeamWinRate}     loading={loading} />
                    <RecordTable title="게임당 최다 킬 (10경기 이상)" icon={Swords} iconColor="text-red-400"    records={topTeamKillsPerGame} loading={loading} />
                </div>
            </div>

            {/* ── 선수 기록 ─────────────────────── */}
            <div>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Medal className="w-5 h-5 text-orange-400" /> 선수 기록
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <RecordTable title="최고 KDA (20경기 이상)"     icon={Zap}    iconColor="text-yellow-400" records={topKDA}    loading={loading} />
                    <RecordTable title="최고 DPM (20경기 이상)"     icon={Swords} iconColor="text-red-400"    records={topDPM}    loading={loading} />
                    <RecordTable title="최다 출전 경기"              icon={Trophy} iconColor="text-blue-400"   records={topGames}  loading={loading} />
                    <RecordTable title="최고 시야 점수 (서포터·정글)" icon={Eye}   iconColor="text-green-400"  records={topVision} loading={loading} />
                </div>
            </div>

            <p className="text-xs text-zinc-600 text-center">
                * 1부 리그(디비전 1) 기준 · 서브 대회(챌린저스/아카데미 등) 제외 · MSI/Worlds 포함
            </p>
        </div>
    )
}
