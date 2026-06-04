'use client'

import { useEffect, useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Trophy, CheckCircle, Lock, Gift, Calendar, CalendarDays, Star, Crown, Loader2, RefreshCw } from 'lucide-react'

interface Quest {
    id: string
    title: string
    description: string
    type: string
    category: string
    icon: string | null
    targetCount: number
    rewardGp: number
    progress: number
    isCompleted: boolean
    isClaimed: boolean
}

interface QuestData {
    daily: Quest[]
    weekly: Quest[]
    achievements: Quest[]
    meta: { dailyKey: string; weeklyKey: string }
}

const CATEGORY_COLORS: Record<string, string> = {
    PREDICTION: 'bg-blue-900/30 text-blue-300 border-blue-700/50',
    QUIZ:       'bg-violet-900/30 text-violet-300 border-violet-700/50',
    SOCIAL:     'bg-pink-900/30 text-pink-300 border-pink-700/50',
    GACHA:      'bg-orange-900/30 text-orange-300 border-orange-700/50',
    GENERAL:    'bg-zinc-800 text-zinc-400 border-zinc-700',
}
const CATEGORY_KO: Record<string, string> = {
    PREDICTION: '예측', QUIZ: '퀴즈', SOCIAL: '소셜', GACHA: '가챠', GENERAL: '일반'
}

function QuestCard({ quest, onClaim }: { quest: Quest; onClaim: (id: string) => void }) {
    const pct = quest.targetCount > 0 ? Math.min(100, Math.floor((quest.progress / quest.targetCount) * 100)) : 0
    const catColor = CATEGORY_COLORS[quest.category] ?? CATEGORY_COLORS.GENERAL

    return (
        <Card className={`border transition-all
            ${quest.isClaimed ? 'border-zinc-800 opacity-60 bg-zinc-900/40' :
              quest.isCompleted ? 'border-yellow-600/60 bg-yellow-900/10 shadow-md shadow-yellow-900/20' :
              'border-zinc-800 bg-zinc-900/80'}`}>
            <CardContent className="p-4 flex items-center gap-4">
                {/* 아이콘 */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0
                    ${quest.isCompleted && !quest.isClaimed ? 'bg-yellow-900/40 ring-2 ring-yellow-600/50' : 'bg-zinc-800'}`}>
                    {quest.icon ?? '🎯'}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{quest.title}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${catColor}`}>
                            {CATEGORY_KO[quest.category]}
                        </Badge>
                        {quest.isClaimed && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">완료됨</Badge>}
                    </div>
                    <p className="text-xs text-zinc-400">{quest.description}</p>
                    {quest.targetCount > 1 && (
                        <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 flex-1 max-w-[140px]" />
                            <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                                {quest.progress} / {quest.targetCount}
                            </span>
                        </div>
                    )}
                </div>

                {/* 보상 + 버튼 */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                        <Crown className="w-3.5 h-3.5" />
                        {quest.rewardGp.toLocaleString()} GP
                    </div>
                    {quest.isClaimed ? (
                        <Button disabled variant="ghost" size="sm" className="text-xs text-zinc-600">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> 수령 완료
                        </Button>
                    ) : quest.isCompleted ? (
                        <Button size="sm" className="bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold"
                            onClick={() => onClaim(quest.id)}>
                            <Gift className="w-3.5 h-3.5 mr-1" /> 보상 받기
                        </Button>
                    ) : (
                        <Button disabled variant="outline" size="sm" className="text-xs border-zinc-700 text-zinc-500">
                            <Lock className="w-3 h-3 mr-1" /> 진행 중
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function QuestSection({ quests, label, onClaim }: { quests: Quest[]; label: string; onClaim: (id: string) => void }) {
    const claimable = quests.filter(q => q.isCompleted && !q.isClaimed).length
    const done = quests.filter(q => q.isClaimed).length
    const total = quests.length

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">{label} · {done}/{total} 완료 {claimable > 0 && `· `}
                    {claimable > 0 && <span className="text-yellow-400 font-semibold">{claimable}개 수령 가능!</span>}
                </p>
            </div>
            {quests.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-sm">퀘스트가 없습니다.</div>
            ) : (
                quests.map(q => <QuestCard key={q.id} quest={q} onClaim={onClaim} />)
            )}
        </div>
    )
}

export function QuestClient() {
    const [data, setData] = useState<QuestData | null>(null)
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState<string | null>(null)
    const [totalGp, setTotalGp] = useState(0)

    const fetchQuests = useCallback(async () => {
        setLoading(true)
        try {
            const [questRes, userRes] = await Promise.all([
                fetch('/api/quests'),
                fetch('/api/users/me'),
            ])
            if (questRes.ok) setData(await questRes.json())
            if (userRes.ok) { const u = await userRes.json(); setTotalGp(u.gp ?? 0) }
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [])

    useEffect(() => {
        fetchQuests()
    }, [fetchQuests])

    const handleClaim = async (questId: string) => {
        setClaiming(questId)
        try {
            const res = await fetch('/api/quests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questId }),
            })
            const d = await res.json()
            if (res.ok) {
                toast.success(`+${d.rewardGp} GP 획득! (현재 ${d.newGp.toLocaleString()} GP)`)
                fetchQuests()
            } else {
                toast.error(d.error ?? '보상 수령 실패')
            }
        } finally {
            setClaiming(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                <p className="text-zinc-500 text-sm">퀘스트 로딩 중...</p>
            </div>
        )
    }

    if (!data) return <div className="text-center py-12 text-zinc-500">데이터를 불러올 수 없습니다.</div>

    const totalClaimable = [...data.daily, ...data.weekly, ...data.achievements].filter(q => q.isCompleted && !q.isClaimed).length

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Trophy className="text-yellow-400" /> 퀘스트
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">퀘스트를 완료하고 GP를 획득하세요!</p>
                </div>
                <div className="flex items-center gap-3">
                    {totalClaimable > 0 && (
                        <Badge className="bg-yellow-600 text-black font-bold px-3 py-1">
                            🎁 {totalClaimable}개 수령 가능
                        </Badge>
                    )}
                    <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-2 rounded-full border border-zinc-700">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-bold">{totalGp.toLocaleString()} GP</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchQuests} className="hover:bg-zinc-800">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* GP 획득처 안내 */}
            <div className="bg-blue-500/5 border border-blue-800/40 rounded-lg px-4 py-3 text-xs text-blue-300">
                💡 GP는 퀘스트 완료 및 승부 예측 성공으로 획득할 수 있습니다. 현금 결제는 지원하지 않습니다.
            </div>

            {/* 탭 */}
            <Tabs defaultValue="daily">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800 h-auto p-1">
                    <TabsTrigger value="daily" className="gap-1.5 data-[state=active]:bg-zinc-800 py-2">
                        <Calendar className="w-3.5 h-3.5" />
                        일일 퀘스트
                        {data.daily.filter(q => q.isCompleted && !q.isClaimed).length > 0 && (
                            <Badge className="bg-yellow-600 text-black text-[10px] px-1.5 py-0 ml-1">
                                {data.daily.filter(q => q.isCompleted && !q.isClaimed).length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="weekly" className="gap-1.5 data-[state=active]:bg-zinc-800 py-2">
                        <CalendarDays className="w-3.5 h-3.5" />
                        주간 퀘스트
                        {data.weekly.filter(q => q.isCompleted && !q.isClaimed).length > 0 && (
                            <Badge className="bg-yellow-600 text-black text-[10px] px-1.5 py-0 ml-1">
                                {data.weekly.filter(q => q.isCompleted && !q.isClaimed).length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="achievement" className="gap-1.5 data-[state=active]:bg-zinc-800 py-2">
                        <Star className="w-3.5 h-3.5" />
                        업적
                        {data.achievements.filter(q => q.isCompleted && !q.isClaimed).length > 0 && (
                            <Badge className="bg-yellow-600 text-black text-[10px] px-1.5 py-0 ml-1">
                                {data.achievements.filter(q => q.isCompleted && !q.isClaimed).length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="daily" className="mt-4 space-y-3">
                    <QuestSection quests={data.daily} label={`오늘 (${data.meta.dailyKey})`} onClaim={handleClaim} />
                </TabsContent>
                <TabsContent value="weekly" className="mt-4 space-y-3">
                    <QuestSection quests={data.weekly} label={`이번 주 (${data.meta.weeklyKey})`} onClaim={handleClaim} />
                </TabsContent>
                <TabsContent value="achievement" className="mt-4 space-y-3">
                    {/* 진행 중 먼저 */}
                    <QuestSection
                        quests={data.achievements.filter(q => !q.isClaimed)}
                        label="진행 중 / 달성 가능"
                        onClaim={handleClaim}
                    />
                    {data.achievements.filter(q => q.isClaimed).length > 0 && (
                        <details className="mt-4">
                            <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400">
                                완료된 업적 ({data.achievements.filter(q => q.isClaimed).length}개) 보기
                            </summary>
                            <div className="mt-3 space-y-3">
                                {data.achievements.filter(q => q.isClaimed).map(q => (
                                    <QuestCard key={q.id} quest={q} onClaim={handleClaim} />
                                ))}
                            </div>
                        </details>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
