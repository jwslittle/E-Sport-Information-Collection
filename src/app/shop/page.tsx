'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
    Crown, ShoppingBag, Tag, Smile, Image, Loader2, CheckCircle2,
    Lock, Sparkles, Zap, Star, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface CosmeticItem {
    id: string
    name: string
    type: string
    rarity: string
    gpCost: number
    description: string | null
    titleText: string | null
    imageUrl: string | null
    condition: string | null
    owned: boolean
    equipped: boolean
    obtainedBy: string | null
}

interface GachaResult {
    item: {
        id: string; name: string; type: string; rarity: string
        description: string | null; titleText: string | null; imageUrl: string | null
    }
    isDuplicate: boolean
    gpRefund: number
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const RARITY_COLORS: Record<string, string> = {
    COMMON:    'border-zinc-600 text-zinc-400 bg-zinc-800',
    UNCOMMON:  'border-green-700 text-green-400 bg-green-900/20',
    RARE:      'border-blue-700 text-blue-400 bg-blue-900/20',
    EPIC:      'border-purple-700 text-purple-400 bg-purple-900/20',
    LEGENDARY: 'border-yellow-600 text-yellow-400 bg-yellow-900/20',
}
const RARITY_KO: Record<string, string> = {
    COMMON: '일반', UNCOMMON: '고급', RARE: '희귀', EPIC: '영웅', LEGENDARY: '전설'
}
const RARITY_GLOW: Record<string, string> = {
    COMMON:    '',
    UNCOMMON:  'shadow-green-900/40',
    RARE:      'shadow-blue-900/50',
    EPIC:      'shadow-purple-900/60',
    LEGENDARY: 'shadow-yellow-900/60',
}
const TYPE_ICONS: Record<string, React.ReactNode> = {
    TITLE:        <Tag className="w-4 h-4" />,
    AVATAR:       <Image className="w-4 h-4" />,
    STICKER:      <Smile className="w-4 h-4" />,
    PROFILE_FRAME: <Crown className="w-4 h-4" />,
    BACKGROUND:   <Image className="w-4 h-4" />,
}
const TYPE_KO: Record<string, string> = {
    TITLE: '칭호', AVATAR: '아바타', STICKER: '스티커',
    PROFILE_FRAME: '프레임', BACKGROUND: '배경',
}
const SHOP_TABS = [
    { value: 'ALL',           label: '전체' },
    { value: 'TITLE',         label: '칭호' },
    { value: 'STICKER',       label: '스티커' },
    { value: 'PROFILE_FRAME', label: '프레임' },
    { value: 'BACKGROUND',    label: '배경' },
    { value: 'AVATAR',        label: '아바타' },
]

// ─── 가챠 결과 카드 ───────────────────────────────────────────────────────────
function GachaResultCard({ result, index }: { result: GachaResult; index: number }) {
    const [revealed, setRevealed] = useState(false)
    const rc = RARITY_COLORS[result.item.rarity] ?? RARITY_COLORS.COMMON
    const glow = RARITY_GLOW[result.item.rarity] ?? ''

    useEffect(() => {
        const t = setTimeout(() => setRevealed(true), 80 * index + 200)
        return () => clearTimeout(t)
    }, [index])

    return (
        <div
            className={cn(
                'relative border rounded-xl p-3 flex flex-col items-center gap-2 text-center transition-all duration-500',
                revealed ? `opacity-100 scale-100 ${glow} shadow-lg` : 'opacity-0 scale-90',
                result.isDuplicate ? 'opacity-70' : '',
                rc,
            )}
        >
            {/* 중복 배지 */}
            {result.isDuplicate && (
                <div className="absolute -top-1.5 -right-1.5 bg-zinc-700 text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    중복
                </div>
            )}
            {/* 새 아이템 배지 */}
            {!result.isDuplicate && (
                <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    NEW
                </div>
            )}

            {/* 아이콘 영역 */}
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-2xl border', rc)}>
                {TYPE_ICONS[result.item.type] ?? <Star className="w-5 h-5" />}
            </div>

            {/* 이름 */}
            <p className="text-xs font-bold text-white leading-tight">{result.item.name}</p>

            {/* 등급 배지 */}
            <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', rc)}>
                {RARITY_KO[result.item.rarity]}
            </Badge>

            {/* 칭호 텍스트 */}
            {result.item.titleText && (
                <p className="text-[9px] text-yellow-400 font-mono">"{result.item.titleText}"</p>
            )}

            {/* 중복 환급 */}
            {result.isDuplicate && result.gpRefund > 0 && (
                <p className="text-[9px] text-yellow-400">+{result.gpRefund} GP 환급</p>
            )}
        </div>
    )
}

// ─── 가챠 탭 ──────────────────────────────────────────────────────────────────
function GachaTab({ userGp, onGpChange }: { userGp: number; onGpChange: (gp: number) => void }) {
    const [pulling, setPulling] = useState(false)
    const [results, setResults] = useState<GachaResult[] | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [lastSummary, setLastSummary] = useState<{ totalCost: number; totalRefund: number; newCount: number } | null>(null)

    const pull = async (count: 1 | 10) => {
        const cost = count === 1 ? 150 : 1350
        if (userGp < cost) {
            toast.error(`GP가 부족합니다. (필요: ${cost.toLocaleString()} GP)`)
            return
        }
        setPulling(true)
        try {
            const res = await fetch('/api/cosmetics/gacha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error ?? '가챠 오류가 발생했습니다.')
                return
            }
            setResults(data.results)
            setLastSummary({
                totalCost: data.totalCost,
                totalRefund: data.totalRefund,
                newCount: data.results.filter((r: GachaResult) => !r.isDuplicate).length,
            })
            onGpChange(data.remainingGp)
            setModalOpen(true)
        } catch {
            toast.error('네트워크 오류가 발생했습니다.')
        } finally {
            setPulling(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* 가챠 안내 */}
            <div className="bg-gradient-to-br from-purple-900/20 to-zinc-900 border border-purple-800/40 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold text-white">코스메틱 가챠</h2>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                    GP를 소모하여 랜덤 코스메틱 아이템을 획득하세요.
                    중복 아이템은 자동으로 GP로 환급됩니다.
                </p>

                {/* 확률 표 */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                        { label: '일반/고급', pct: '60%', color: 'text-zinc-300', bg: 'bg-zinc-800 border-zinc-600' },
                        { label: '희귀',     pct: '30%', color: 'text-blue-300',  bg: 'bg-blue-900/20 border-blue-700' },
                        { label: '영웅',     pct: '10%', color: 'text-purple-300',bg: 'bg-purple-900/20 border-purple-700' },
                    ].map(tier => (
                        <div key={tier.label} className={cn('border rounded-lg py-2 px-1', tier.bg)}>
                            <p className={cn('text-lg font-black', tier.color)}>{tier.pct}</p>
                            <p className="text-[10px] text-zinc-500">{tier.label}</p>
                        </div>
                    ))}
                </div>

                {/* 중복 환급 안내 */}
                <div className="text-xs text-zinc-500 space-y-0.5">
                    <p>• 중복 아이템 환급: 일반/고급 30 GP · 희귀 75 GP · 영웅 150 GP</p>
                    <p>• 전설 등급은 가챠에 포함되지 않습니다</p>
                </div>
            </div>

            {/* 뽑기 버튼 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1회 뽑기 */}
                <div className="border border-zinc-800 rounded-xl p-5 space-y-3 bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-white">1회 뽑기</p>
                            <p className="text-xs text-zinc-500 mt-0.5">코스메틱 1개 랜덤 획득</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-yellow-400">150 GP</p>
                        </div>
                    </div>
                    <Button
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold gap-2"
                        disabled={pulling || userGp < 150}
                        onClick={() => pull(1)}
                    >
                        {pulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {userGp < 150 ? 'GP 부족' : '1회 뽑기'}
                    </Button>
                </div>

                {/* 10회 뽑기 */}
                <div className="border border-purple-800/50 rounded-xl p-5 space-y-3 bg-gradient-to-br from-purple-900/20 to-zinc-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-white">10회 뽑기</p>
                            <p className="text-xs text-zinc-500 mt-0.5">코스메틱 10개 랜덤 획득</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-yellow-400">1,350 GP</p>
                            <p className="text-[10px] text-purple-400 font-medium">× 10</p>
                        </div>
                    </div>
                    <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold gap-2"
                        disabled={pulling || userGp < 1350}
                        onClick={() => pull(10)}
                    >
                        {pulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {userGp < 1350 ? 'GP 부족' : '10회 뽑기'}
                    </Button>
                </div>
            </div>

            {/* 결과 모달 */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            가챠 결과
                        </DialogTitle>
                    </DialogHeader>

                    {results && (
                        <div className="space-y-4">
                            {/* 요약 */}
                            {lastSummary && (
                                <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                                    <span className="text-zinc-400">
                                        신규 <span className="text-white font-bold">{lastSummary.newCount}개</span>
                                    </span>
                                    {lastSummary.totalRefund > 0 && (
                                        <span className="text-yellow-400">
                                            +{lastSummary.totalRefund.toLocaleString()} GP 환급
                                        </span>
                                    )}
                                    <span className="text-zinc-500">
                                        소비 {(lastSummary.totalCost - lastSummary.totalRefund).toLocaleString()} GP
                                    </span>
                                </div>
                            )}

                            {/* 결과 그리드 */}
                            <div className={cn(
                                'grid gap-2',
                                results.length === 1 ? 'grid-cols-1 max-w-[120px] mx-auto' : 'grid-cols-3 sm:grid-cols-5',
                            )}>
                                {results.map((r, i) => (
                                    <GachaResultCard key={i} result={r} index={i} />
                                ))}
                            </div>

                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                            >
                                확인
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ─── 코스메틱 아이템 카드 ─────────────────────────────────────────────────────
function ItemCard({
    item, onBuy, onEquip, buying, equipping
}: {
    item: CosmeticItem
    onBuy: (id: string) => void
    onEquip: (id: string, equip: boolean) => void
    buying: string | null
    equipping: string | null
}) {
    const rarityClass = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.COMMON
    const isConditionOnly = item.gpCost === 0 && !!item.condition
    const isGachaOnly = item.gpCost === 0 && !item.condition

    return (
        <div className={cn(
            'border rounded-xl p-4 flex flex-col gap-3 transition-all',
            item.owned
                ? 'border-zinc-700 bg-zinc-900/60'
                : isConditionOnly || isGachaOnly
                    ? 'border-zinc-800/50 bg-zinc-900/30 opacity-70'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700',
        )}>
            {/* 아이콘 / 이미지 */}
            <div className={cn('h-24 rounded-lg flex items-center justify-center text-4xl border', rarityClass)}>
                {item.type === 'STICKER' && (item.condition === null || item.owned)
                    ? <span>{(item as any).emoji ?? '🎭'}</span>
                    : item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="h-16 w-16 object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        : TYPE_ICONS[item.type] ?? <Star className="w-6 h-6" />
                }
            </div>

            {/* 정보 */}
            <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-1">
                    <p className="font-bold text-white text-sm leading-tight">{item.name}</p>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 shrink-0', rarityClass)}>
                        {RARITY_KO[item.rarity]}
                    </Badge>
                </div>
                {item.titleText && (
                    <p className="text-xs text-yellow-400 font-mono">&quot;{item.titleText}&quot;</p>
                )}
                {item.description && (
                    <p className="text-[11px] text-zinc-500 leading-snug">{item.description}</p>
                )}
                {isConditionOnly && (
                    <p className="text-[11px] text-zinc-600 italic flex items-center gap-1">
                        <Lock className="w-3 h-3" /> 조건 달성 시 해금
                    </p>
                )}
                {isGachaOnly && !item.owned && (
                    <p className="text-[11px] text-purple-500 italic flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> 가챠로만 획득 가능
                    </p>
                )}
                {item.owned && item.obtainedBy === 'GACHA' && (
                    <p className="text-[10px] text-purple-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> 가챠 획득
                    </p>
                )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between">
                <div>
                    {isConditionOnly || isGachaOnly ? (
                        <span className="text-xs text-zinc-600">
                            {isGachaOnly ? '가챠 전용' : '조건부 해금'}
                        </span>
                    ) : (
                        <span className="text-sm font-black text-yellow-400">
                            {item.gpCost > 0 ? `${item.gpCost.toLocaleString()} GP` : '무료'}
                        </span>
                    )}
                </div>

                {item.owned ? (
                    <Button
                        size="sm"
                        variant={item.equipped ? 'default' : 'outline'}
                        className={cn(
                            'text-xs h-7',
                            item.equipped
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-black font-bold'
                                : 'border-zinc-600 text-zinc-300 hover:border-zinc-500'
                        )}
                        onClick={() => onEquip(item.id, !item.equipped)}
                        disabled={equipping === item.id}
                    >
                        {equipping === item.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : item.equipped
                                ? <><CheckCircle2 className="w-3 h-3 mr-1" />장착 중</>
                                : '장착'}
                    </Button>
                ) : isConditionOnly || isGachaOnly ? (
                    <Button size="sm" variant="outline" disabled className="text-xs h-7 border-zinc-800 text-zinc-600">
                        <Lock className="w-3 h-3 mr-1" />잠금
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs h-7"
                        onClick={() => onBuy(item.id)}
                        disabled={buying === item.id}
                    >
                        {buying === item.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><ShoppingBag className="w-3 h-3 mr-1" />구매</>}
                    </Button>
                )}
            </div>
        </div>
    )
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function ShopPage() {
    const { data: session } = useSession()
    const [items, setItems] = useState<CosmeticItem[]>([])
    const [gp, setGp] = useState(0)
    const [loading, setLoading] = useState(true)
    const [buying, setBuying] = useState<string | null>(null)
    const [equipping, setEquipping] = useState<string | null>(null)
    const [tab, setTab] = useState('GACHA')

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [itemRes, userRes] = await Promise.all([
                fetch('/api/cosmetics'),
                session ? fetch('/api/users/me') : Promise.resolve(null),
            ])
            if (itemRes.ok) setItems(await itemRes.json())
            if (userRes?.ok) {
                const u = await userRes.json()
                setGp(u.gp ?? 0)
            }
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [session])

    useEffect(() => { fetchAll() }, [fetchAll])

    const handleBuy = async (itemId: string) => {
        if (!session) { toast.error('로그인이 필요합니다.'); return }
        const item = items.find(i => i.id === itemId)
        if (!item) return
        if (gp < item.gpCost) {
            toast.error(`GP가 부족합니다. (필요: ${item.gpCost.toLocaleString()} GP, 보유: ${gp.toLocaleString()} GP)`)
            return
        }
        setBuying(itemId)
        try {
            const res = await fetch('/api/cosmetics/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId }),
            })
            const d = await res.json()
            if (res.ok) {
                toast.success(`"${item.name}" 구매 완료! (잔여 GP: ${d.remainingGp.toLocaleString()})`)
                setGp(d.remainingGp)
                setItems(prev => prev.map(i => i.id === itemId ? { ...i, owned: true } : i))
            } else {
                toast.error(d.error ?? '구매 실패')
            }
        } finally { setBuying(null) }
    }

    const handleEquip = async (itemId: string, equip: boolean) => {
        if (!session) { toast.error('로그인이 필요합니다.'); return }
        setEquipping(itemId)
        try {
            const res = await fetch('/api/cosmetics/equip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, equip }),
            })
            const d = await res.json()
            if (res.ok) {
                const item = items.find(i => i.id === itemId)
                toast.success(equip ? `"${item?.name}" 장착!` : '장착 해제됨')
                const type = item?.type
                setItems(prev => prev.map(i =>
                    i.id === itemId
                        ? { ...i, equipped: equip }
                        : (i.type === type && equip ? { ...i, equipped: false } : i)
                ))
            } else {
                toast.error(d.error ?? '실패')
            }
        } finally { setEquipping(null) }
    }

    const filtered = tab === 'ALL' ? items : items.filter(i => i.type === tab)
    const purchasable = filtered.filter(i => i.gpCost > 0 && !i.condition)
    const conditionOnly = filtered.filter(i => (i.condition || i.gpCost === 0) && !i.owned)

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <ShoppingBag className="w-7 h-7 text-yellow-500" />
                        GP 상점
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">GP를 소비하여 코스메틱 아이템을 획득하세요</p>
                </div>

                <div className="flex items-center gap-2">
                    {session ? (
                        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-black text-lg">{gp.toLocaleString()}</span>
                            <span className="text-yellow-600 text-sm">GP</span>
                        </div>
                    ) : (
                        <Link href="/auth/signin">
                            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                                로그인하고 구매하기
                            </Button>
                        </Link>
                    )}
                    <Button variant="ghost" size="icon" onClick={fetchAll} className="hover:bg-zinc-800">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* 안내 */}
            <div className="bg-yellow-500/5 border border-yellow-800/30 rounded-xl p-3 text-xs text-yellow-700">
                ⚠ GP는 현금으로 구매할 수 없습니다. 퀘스트 완료, 예측 적중, 퀴즈 등 게임 플레이를 통해서만 획득 가능합니다.
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div>
            ) : (
                <Tabs value={tab} onValueChange={setTab}>
                    {/* 탭 리스트 */}
                    <TabsList className="w-full flex flex-wrap h-auto bg-zinc-900 border border-zinc-800 p-1 gap-1">
                        {/* 가챠 탭 (강조) */}
                        <TabsTrigger
                            value="GACHA"
                            className="gap-1.5 data-[state=active]:bg-purple-900/60 data-[state=active]:text-purple-300 text-xs px-3 py-2"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> 가챠
                        </TabsTrigger>

                        {/* 일반 코스메틱 탭 */}
                        {SHOP_TABS.map(t => (
                            <TabsTrigger key={t.value} value={t.value}
                                className="data-[state=active]:bg-zinc-800 text-xs px-3 py-2">
                                {t.label}
                                {t.value !== 'ALL' && (
                                    <span className="ml-1 text-zinc-600">
                                        ({items.filter(i => i.type === t.value && i.owned).length}/
                                        {items.filter(i => i.type === t.value).length})
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* 가챠 탭 콘텐츠 */}
                    <TabsContent value="GACHA" className="mt-6">
                        {session ? (
                            <GachaTab userGp={gp} onGpChange={setGp} />
                        ) : (
                            <div className="text-center py-16 space-y-3">
                                <Sparkles className="w-12 h-12 text-purple-700 mx-auto" />
                                <p className="text-zinc-400 font-medium">로그인 후 가챠를 이용하세요</p>
                                <Link href="/auth/signin">
                                    <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
                                        로그인하기
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </TabsContent>

                    {/* 코스메틱 탭 콘텐츠 */}
                    {SHOP_TABS.map(t => (
                        <TabsContent key={t.value} value={t.value} className="mt-6 space-y-6">
                            {purchasable.length > 0 && (
                                <div>
                                    <p className="text-xs text-zinc-500 mb-3">
                                        구매 가능 ({purchasable.filter(i => i.owned).length}/{purchasable.length} 보유)
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {purchasable.map(item => (
                                            <ItemCard key={item.id} item={item}
                                                onBuy={handleBuy} onEquip={handleEquip}
                                                buying={buying} equipping={equipping} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {conditionOnly.length > 0 && (
                                <div>
                                    <p className="text-xs text-zinc-600 mb-3">조건 달성 / 가챠 전용 아이템</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {conditionOnly.map(item => (
                                            <ItemCard key={item.id} item={item}
                                                onBuy={handleBuy} onEquip={handleEquip}
                                                buying={buying} equipping={equipping} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {filtered.length === 0 && (
                                <div className="text-center py-12 text-zinc-600">이 카테고리에 아이템이 없습니다.</div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            )}
        </div>
    )
}
