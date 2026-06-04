'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Package, ArrowUp, Loader2, Crown } from 'lucide-react'

const GRADE_STYLE: Record<string, { border: string; text: string; bg: string; label: string }> = {
    BRONZE:     { border: 'border-orange-800', text: 'text-orange-500',  bg: 'bg-orange-900/20', label: '브론즈' },
    SILVER:     { border: 'border-zinc-500',   text: 'text-zinc-300',    bg: 'bg-zinc-700/20',   label: '실버' },
    GOLD:       { border: 'border-yellow-500', text: 'text-yellow-400',  bg: 'bg-yellow-900/20', label: '골드' },
    DIAMOND:    { border: 'border-cyan-400',   text: 'text-cyan-300',    bg: 'bg-cyan-900/20',   label: '다이아' },
    CHALLENGER: { border: 'border-purple-500', text: 'text-purple-300',  bg: 'bg-purple-900/20', label: '챌린저' },
}
const GRADE_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'CHALLENGER']
const POS_ICON: Record<string, string> = {
    TOP: '🛡️', JUNGLE: '🌿', MID: '⚡', ADC: '🎯', SUPPORT: '🔮'
}

interface CardItem {
    id: string
    playerId: string | null
    grade: string | null
    playerName: string
    position: string
    teamCode: string
}
interface GroupedCard {
    playerId: string
    playerName: string
    position: string
    teamCode: string
    grade: string
    count: number
    ids: string[]
}

export function CollectionClient() {
    const { data: session } = useSession()
    const [cards, setCards] = useState<CardItem[]>([])
    const [loading, setLoading] = useState(true)
    const [evolving, setEvolving] = useState<string | null>(null)

    const fetchCards = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/collection/cards')
            if (res.ok) setCards(await res.json())
        } finally { setLoading(false) }
    }

    useEffect(() => { if (session) fetchCards() }, [session])

    const grouped: GroupedCard[] = []
    const keyMap = new Map<string, GroupedCard>()
    for (const c of cards) {
        const key = `${c.playerId}-${c.grade}`
        if (!keyMap.has(key)) {
            const g: GroupedCard = { playerId: c.playerId ?? '', playerName: c.playerName, position: c.position, teamCode: c.teamCode, grade: c.grade ?? 'BRONZE', count: 0, ids: [] }
            keyMap.set(key, g); grouped.push(g)
        }
        const g = keyMap.get(key)!; g.count++; g.ids.push(c.id)
    }
    grouped.sort((a, b) => GRADE_ORDER.indexOf(b.grade) - GRADE_ORDER.indexOf(a.grade) || a.playerName.localeCompare(b.playerName))

    const handleEvolve = async (g: GroupedCard) => {
        if (g.count < 3) { toast.error('같은 등급 카드 3장이 필요합니다.'); return }
        if (GRADE_ORDER.indexOf(g.grade) >= GRADE_ORDER.length - 1) { toast.error('최고 등급입니다.'); return }
        setEvolving(`${g.playerId}-${g.grade}`)
        try {
            const res = await fetch('/api/collection/evolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inventoryIds: g.ids.slice(0, 3), playerId: g.playerId, currentGrade: g.grade }),
            })
            const d = await res.json()
            if (res.ok) { toast.success(`${g.playerName} → ${GRADE_STYLE[d.newGrade]?.label} 진화!`); fetchCards() }
            else toast.error(d.error ?? '진화 실패')
        } finally { setEvolving(null) }
    }

    const byGrade = (g: string) => grouped.filter(x => x.grade === g)

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-yellow-500" /></div>

    if (cards.length === 0) return (
        <div className="text-center py-20 space-y-4">
            <Package className="w-14 h-14 text-zinc-700 mx-auto" />
            <p className="text-zinc-500">보유한 카드가 없습니다.</p>
            <Button asChild variant="outline" className="border-yellow-600/50 text-yellow-400"><a href="/shop">상점 가기</a></Button>
        </div>
    )

    return (
        <div className="space-y-5">
            {/* 요약 */}
            <div className="flex flex-wrap gap-2">
                {GRADE_ORDER.slice().reverse().map(grade => {
                    const cnt = byGrade(grade).reduce((s, g) => s + g.count, 0)
                    if (!cnt) return null
                    const s = GRADE_STYLE[grade]
                    return <div key={grade} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm ${s.border} ${s.bg} ${s.text}`}>{s.label} {cnt}장</div>
                })}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-800/30 text-zinc-300 text-sm">총 {cards.length}장</div>
            </div>

            {/* 진화 안내 */}
            <div className="bg-purple-500/5 border border-purple-800/30 rounded-lg px-4 py-3 text-xs text-zinc-400 flex items-start gap-2">
                <ArrowUp className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>같은 선수·같은 등급 카드 <strong className="text-white">3장</strong> → 다음 등급으로 진화 &nbsp;
                    BRONZE → SILVER → GOLD → DIAMOND → CHALLENGER</span>
            </div>

            <Tabs defaultValue="ALL">
                <TabsList className="flex flex-wrap h-auto bg-zinc-900 border border-zinc-800 p-1 gap-1">
                    <TabsTrigger value="ALL" className="text-xs">전체 ({cards.length})</TabsTrigger>
                    {GRADE_ORDER.slice().reverse().map(grade => {
                        const cnt = byGrade(grade).reduce((s, g) => s + g.count, 0)
                        return cnt ? <TabsTrigger key={grade} value={grade} className="text-xs">{GRADE_STYLE[grade].label} ({cnt})</TabsTrigger> : null
                    })}
                </TabsList>
                <TabsContent value="ALL" className="mt-4"><Grid items={grouped} onEvolve={handleEvolve} evolving={evolving} /></TabsContent>
                {GRADE_ORDER.map(g => <TabsContent key={g} value={g} className="mt-4"><Grid items={byGrade(g)} onEvolve={handleEvolve} evolving={evolving} /></TabsContent>)}
            </Tabs>
        </div>
    )
}

function Grid({ items, onEvolve, evolving }: { items: GroupedCard[]; onEvolve: (g: GroupedCard) => void; evolving: string | null }) {
    if (!items.length) return <div className="text-center py-12 text-zinc-600">카드 없음</div>
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {items.map(g => {
                const s = GRADE_STYLE[g.grade] ?? GRADE_STYLE.BRONZE
                const isEv = evolving === `${g.playerId}-${g.grade}`
                const canEv = g.count >= 3 && GRADE_ORDER.indexOf(g.grade) < GRADE_ORDER.length - 1
                return (
                    <Card key={`${g.playerId}-${g.grade}`} className={`border ${s.border} ${s.bg} overflow-hidden hover:brightness-110 transition-all`}>
                        <CardContent className="p-3 flex flex-col gap-2">
                            <div className="text-center">
                                <div className="text-3xl mb-1">{POS_ICON[g.position] ?? '⚡'}</div>
                                <p className={`font-bold text-sm ${s.text}`}>{g.playerName}</p>
                                <p className="text-[10px] text-zinc-500">{g.teamCode} · {g.position}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className={`text-[10px] px-1.5 border ${s.border} ${s.text}`}>{s.label}</Badge>
                                <div className="flex gap-0.5">
                                    {[0,1,2].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i < g.count ? 'bg-yellow-500' : 'bg-zinc-700'}`} />)}
                                    {g.count > 3 && <span className="text-[10px] text-zinc-500 ml-1">+{g.count-3}</span>}
                                </div>
                            </div>
                            <p className="text-[10px] text-zinc-500 text-center">{g.count}장</p>
                            {canEv && (
                                <Button size="sm" className="w-full text-xs bg-purple-700 hover:bg-purple-600" onClick={() => onEvolve(g)} disabled={isEv}>
                                    {isEv ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ArrowUp className="w-3 h-3 mr-1" />진화</>}
                                </Button>
                            )}
                            {g.grade === 'CHALLENGER' && <p className="text-center text-[10px] text-purple-300 flex items-center justify-center gap-1"><Crown className="w-3 h-3" />최고 등급</p>}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
