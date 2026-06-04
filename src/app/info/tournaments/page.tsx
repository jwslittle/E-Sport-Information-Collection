'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Trophy, Search, ArrowLeft, Globe, Flag, Layers } from 'lucide-react'

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014']

// 대회 분류 규칙
function classifyTournament(name: string): 'LCK' | 'INTERNATIONAL' | 'GLOBAL' | 'OTHER' {
    if (/LCK|LCKC|LCK CL/i.test(name)) return 'LCK'
    if (/MSI|WLDs|Worlds|World/i.test(name)) return 'INTERNATIONAL'
    if (/LPL|LEC|LCS|LTA|PCS|VCS|TCL|CBLOL|LJL|LCO|LLA|LCSA|LRN|LRS|EBL|NLC|PRM|LFL|HLL|HC|LIT|LVP|HM|RL|ROL|GLL/i.test(name)) return 'GLOBAL'
    return 'OTHER'
}

const CATEGORY_INFO = {
    LCK:           { label: 'LCK 국내',    icon: Flag,   color: 'text-blue-400',   bg: 'bg-blue-900/20 border-blue-800/50' },
    INTERNATIONAL: { label: 'MSI · Worlds', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800/50' },
    GLOBAL:        { label: '글로벌 리그',  icon: Globe,  color: 'text-green-400',  bg: 'bg-green-900/20 border-green-800/50' },
    OTHER:         { label: '기타 대회',    icon: Layers, color: 'text-zinc-400',   bg: 'bg-zinc-800/40 border-zinc-700/50' },
}

type CategoryKey = keyof typeof CATEGORY_INFO

export default function TournamentsPage() {
    const [year, setYear] = useState('2025')
    const [tournaments, setTournaments] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState<CategoryKey | 'ALL'>('ALL')

    useEffect(() => {
        setLoading(true)
        fetch(`/api/stats/tournaments?year=${year}`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setTournaments(data)
                else setTournaments([])
            })
            .catch(() => setTournaments([]))
            .finally(() => setLoading(false))
    }, [year])

    const filtered = tournaments.filter(t => {
        const matchSearch = !search || t.toLowerCase().includes(search.toLowerCase())
        const matchCat = activeCategory === 'ALL' || classifyTournament(t) === activeCategory
        return matchSearch && matchCat
    })

    // 카테고리별 카운트
    const counts = tournaments.reduce<Record<string, number>>((acc, t) => {
        const cat = classifyTournament(t)
        acc[cat] = (acc[cat] ?? 0) + 1
        return acc
    }, {})

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6 pb-20">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <Link href="/info" className="text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">대회 아카이브</h1>
                    <p className="text-sm text-zinc-400">연도별 대회 목록 및 전적 탐색</p>
                </div>
            </div>

            {/* 연도 + 검색 */}
            <div className="flex gap-3 flex-wrap">
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {YEARS.map(y => (
                            <SelectItem key={y} value={y}>
                                {y}{y === '2026' ? ' ▶ 진행 중' : y === '2025' ? ' (최근)' : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="대회 이름 검색..."
                        className="pl-9 bg-zinc-900 border-zinc-700 text-white"
                    />
                </div>
            </div>

            {/* 카테고리 필터 탭 */}
            <div className="flex gap-2 flex-wrap">
                {([['ALL', '전체', tournaments.length]] as [string, string, number][]).concat(
                    (Object.entries(CATEGORY_INFO) as [CategoryKey, typeof CATEGORY_INFO[CategoryKey]][])
                        .filter(([k]) => (counts[k] ?? 0) > 0)
                        .map(([k, v]) => [k, v.label, counts[k] ?? 0] as [string, string, number])
                ).map(([key, label, count]) => (
                    <button
                        key={key}
                        onClick={() => setActiveCategory(key as CategoryKey | 'ALL')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            activeCategory === key
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                                : 'text-zinc-400 hover:text-white bg-zinc-800/60 border border-transparent'
                        }`}
                    >
                        {label}
                        <span className="text-xs opacity-60">{count}</span>
                    </button>
                ))}
            </div>

            {/* 대회 목록 */}
            {loading ? (
                <div className="text-center py-16 text-zinc-500">불러오는 중...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                    {tournaments.length === 0 ? `${year}년 대회 데이터가 없습니다.` : '검색 결과 없음'}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 카테고리별 그룹 표시 */}
                    {(Object.keys(CATEGORY_INFO) as CategoryKey[])
                        .filter(cat => activeCategory === 'ALL' || activeCategory === cat)
                        .map(cat => {
                            const items = filtered.filter(t => classifyTournament(t) === cat)
                            if (items.length === 0) return null
                            const { label, icon: Icon, color, bg } = CATEGORY_INFO[cat]
                            return (
                                <div key={cat}>
                                    <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border ${bg}`}>
                                        <Icon className={`w-4 h-4 ${color}`} />
                                        <span className={`text-sm font-semibold ${color}`}>{label}</span>
                                        <Badge className="text-[10px] bg-zinc-700/60 text-zinc-400 ml-auto">{items.length}개</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {items.map(t => (
                                            <TournamentCard key={t} name={t} year={year} category={cat} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            )}
        </div>
    )
}

function TournamentCard({ name, year, category }: { name: string; year: string; category: CategoryKey }) {
    const { color } = CATEGORY_INFO[category]
    const href = `/info/tournaments/${encodeURIComponent(name)}`

    return (
        <Link href={href}>
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-zinc-700 transition-colors`}>
                        <Trophy className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-yellow-400 transition-colors">
                            {name}
                        </p>
                        <p className="text-xs text-zinc-500">{year} 시즌</p>
                    </div>
                    <span className="ml-auto text-zinc-600 group-hover:text-zinc-400 text-xs transition-colors">→</span>
                </CardContent>
            </Card>
        </Link>
    )
}
