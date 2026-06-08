'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
    Crown, ShoppingBag, Tag, Smile, ImageIcon, Loader2, CheckCircle2,
    Lock, Star, RefreshCw, TicketX, Bot, Trophy, Info,
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

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const RARITY_COLORS: Record<string, string> = {
    COMMON:    'border-zinc-600 text-zinc-400 bg-zinc-800',
    UNCOMMON:  'border-green-700 text-green-400 bg-green-900/20',
    RARE:      'border-blue-700 text-blue-400 bg-blue-900/20',
    EPIC:      'border-purple-700 text-purple-400 bg-purple-900/20',
    LEGENDARY: 'border-yellow-600 text-yellow-400 bg-yellow-900/20',
}
const RARITY_KO: Record<string, string> = {
    COMMON: '일반', UNCOMMON: '고급', RARE: '희귀', EPIC: '영웅', LEGENDARY: '전설',
}
const TYPE_ICONS: Record<string, React.ReactNode> = {
    TITLE:         <Tag className="w-4 h-4" />,
    STICKER:       <Smile className="w-4 h-4" />,
    PROFILE_FRAME: <Crown className="w-4 h-4" />,
    BACKGROUND:    <ImageIcon className="w-4 h-4" />,
    AI_TICKET:     <Bot className="w-4 h-4" />,
}

// 탭 구성 (가챠 제거됨)
const SHOP_TABS = [
    { value: 'ALL',           label: '전체',   icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { value: 'TITLE',         label: '칭호',   icon: <Tag className="w-3.5 h-3.5" /> },
    { value: 'STICKER',       label: '스티커', icon: <Smile className="w-3.5 h-3.5" /> },
    { value: 'PROFILE_FRAME', label: '프레임', icon: <Crown className="w-3.5 h-3.5" /> },
    { value: 'BACKGROUND',    label: '배경',   icon: <ImageIcon className="w-3.5 h-3.5" /> },
]

// ─── 아이템 카드 ──────────────────────────────────────────────────────────────
function ItemCard({
    item, onBuy, onEquip, buying, equipping,
}: {
    item: CosmeticItem
    onBuy: (id: string) => void
    onEquip: (id: string, equip: boolean) => void
    buying: string | null
    equipping: string | null
}) {
    const rc               = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.COMMON
    const isAchievementOnly = item.gpCost === 0

    return (
        <div className={cn(
            'border rounded-xl p-4 flex flex-col gap-3 transition-all',
            item.owned
                ? 'border-zinc-700 bg-zinc-900/60'
                : isAchievementOnly
                    ? 'border-zinc-800/40 bg-zinc-900/20 opacity-55'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:shadow-md hover:shadow-black/40',
        )}>
            {/* 아이콘 */}
            <div className={cn('h-20 rounded-lg flex items-center justify-center border relative', rc)}>
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name}
                        className="h-14 w-14 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                    TYPE_ICONS[item.type] ?? <Star className="w-6 h-6" />
                )}
                {isAchievementOnly && !item.owned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <Lock className="w-6 h-6 text-zinc-500" />
                    </div>
                )}
            </div>

            {/* 정보 */}
            <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                    <p className="font-bold text-white text-sm leading-tight">{item.name}</p>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 shrink-0', rc)}>
                        {RARITY_KO[item.rarity]}
                    </Badge>
                </div>
                {item.titleText && (
                    <p className="text-xs text-yellow-400 font-mono">&quot;{item.titleText}&quot;</p>
                )}
                {item.description && (
                    <p className="text-[11px] text-zinc-500 leading-snug line-clamp-3">{item.description}</p>
                )}
                {isAchievementOnly && !item.owned && (
                    <p className="text-[11px] text-amber-600 italic flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> 업적 달성 시 획득
                    </p>
                )}
                {item.owned && item.obtainedBy && item.obtainedBy !== 'SHOP' && (
                    <p className="text-[10px] text-amber-500 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> 업적 획득
                    </p>
                )}
            </div>

            {/* 액션 */}
            <div className="flex items-center justify-between gap-2">
                <div className="shrink-0">
                    {isAchievementOnly ? (
                        <span className="text-xs text-zinc-600 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> 업적 전용
                        </span>
                    ) : (
                        <span className="text-sm font-black text-yellow-400">
                            {item.gpCost.toLocaleString()}
                            <span className="text-xs font-medium text-yellow-600 ml-1">GP</span>
                        </span>
                    )}
                </div>

                {item.owned ? (
                    <Button
                        size="sm"
                        variant={item.equipped ? 'default' : 'outline'}
                        className={cn(
                            'text-xs h-7 shrink-0',
                            item.equipped
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-black font-bold'
                                : 'border-zinc-600 text-zinc-300 hover:border-zinc-500',
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
                ) : isAchievementOnly ? (
                    <Button size="sm" variant="outline" disabled
                        className="text-xs h-7 border-zinc-800 text-zinc-700 shrink-0">
                        <Lock className="w-3 h-3 mr-1" /> 잠금
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs h-7 shrink-0"
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

// ─── 탭 콘텐츠 (구매 가능 / 업적 보유 / 업적 잠금) ──────────────────────────
function TabItems({
    items, onBuy, onEquip, buying, equipping,
}: {
    items: CosmeticItem[]
    onBuy: (id: string) => void
    onEquip: (id: string, equip: boolean) => void
    buying: string | null
    equipping: string | null
}) {
    const purchasable      = items.filter(i => i.gpCost > 0)
    const achievementOwned = items.filter(i => i.gpCost === 0 && i.owned)
    const achievementLocked = items.filter(i => i.gpCost === 0 && !i.owned)

    if (items.length === 0) {
        return <p className="text-center py-16 text-zinc-600">이 카테고리에 아이템이 없습니다.</p>
    }

    return (
        <div className="space-y-10">
            {/* 구매 가능 */}
            {purchasable.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingBag className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-zinc-200">GP로 구매 가능</span>
                        <span className="text-xs text-zinc-600">
                            ({purchasable.filter(i => i.owned).length}/{purchasable.length} 보유)
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {purchasable.map(item => (
                            <ItemCard key={item.id} item={item}
                                onBuy={onBuy} onEquip={onEquip}
                                buying={buying} equipping={equipping} />
                        ))}
                    </div>
                </section>
            )}

            {/* 업적으로 획득한 아이템 */}
            {achievementOwned.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-semibold text-zinc-200">업적으로 획득</span>
                        <span className="text-xs text-zinc-600">({achievementOwned.length}개 보유)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {achievementOwned.map(item => (
                            <ItemCard key={item.id} item={item}
                                onBuy={onBuy} onEquip={onEquip}
                                buying={buying} equipping={equipping} />
                        ))}
                    </div>
                </section>
            )}

            {/* 업적 전용 잠금 (미리보기) */}
            {achievementLocked.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-4 h-4 text-zinc-600" />
                        <span className="text-sm font-semibold text-zinc-500">업적 달성 시 획득 가능</span>
                        <Link href="/quests"
                            className="text-xs text-zinc-600 hover:text-zinc-400 underline ml-1">
                            퀘스트 확인 →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {achievementLocked.map(item => (
                            <ItemCard key={item.id} item={item}
                                onBuy={onBuy} onEquip={onEquip}
                                buying={buying} equipping={equipping} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

// ─── 질의권 탭 ────────────────────────────────────────────────────────────────
function TicketTab({
    aiTickets, gp, ticketItem, buying, onBuy,
}: {
    aiTickets: number
    gp: number
    ticketItem: CosmeticItem | undefined
    buying: string | null
    onBuy: (id: string) => void
}) {
    return (
        <div className="space-y-6 max-w-md">
            <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900 border border-blue-800/40 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-bold text-white">AI 분석가 질의권</h2>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                    AI 분석가에게 <strong className="text-white">1회 질문</strong>할 수 있는 이용권입니다.
                    구매 후 <Link href="/analyst" className="text-blue-400 underline">AI 분석가</Link> 페이지에서 바로 사용하세요.
                </p>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-zinc-800 rounded-lg px-3 py-2 text-sm">
                        <TicketX className="w-4 h-4 text-blue-400" />
                        <span className="text-zinc-400">현재 보유</span>
                        <span className="font-black text-white">{aiTickets}장</span>
                    </div>
                    <span className="text-xs text-zinc-600">질문 1회 = 질의권 1장 소모</span>
                </div>
            </div>

            {ticketItem ? (
                <div className="border border-blue-800/40 rounded-xl p-5 space-y-4 bg-zinc-900">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-bold text-white">{ticketItem.name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{ticketItem.description}</p>
                        </div>
                        <p className="text-xl font-black text-yellow-400 shrink-0 ml-2">{ticketItem.gpCost} GP</p>
                    </div>
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2"
                        disabled={buying === ticketItem.id || gp < ticketItem.gpCost}
                        onClick={() => onBuy(ticketItem.id)}
                    >
                        {buying === ticketItem.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <TicketX className="w-4 h-4" />}
                        {gp < ticketItem.gpCost ? 'GP 부족' : `질의권 1장 구매 (${ticketItem.gpCost} GP)`}
                    </Button>
                    <p className="text-[11px] text-zinc-600 text-center">여러 장 구매하려면 반복 클릭하세요</p>
                </div>
            ) : (
                <p className="text-zinc-600 text-sm text-center py-4">
                    현재 준비 중입니다. 잠시 후 다시 확인해주세요.
                </p>
            )}
        </div>
    )
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function ShopPage() {
    const { data: session } = useSession()
    const [items, setItems]         = useState<CosmeticItem[]>([])
    const [gp, setGp]               = useState(0)
    const [aiTickets, setAiTickets] = useState(0)
    const [loading, setLoading]     = useState(true)
    const [buying, setBuying]       = useState<string | null>(null)
    const [equipping, setEquipping] = useState<string | null>(null)
    const [tab, setTab]             = useState('ALL')

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
                setAiTickets(u.aiQueryTickets ?? 0)
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
            toast.error(`GP 부족 (필요 ${item.gpCost.toLocaleString()} / 보유 ${gp.toLocaleString()})`)
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
                if (item.type === 'AI_TICKET') {
                    toast.success(`질의권 구매! (잔여 GP: ${d.remainingGp.toLocaleString()}, 보유 질의권: ${d.aiQueryTickets}장)`)
                    setGp(d.remainingGp)
                    setAiTickets(d.aiQueryTickets)
                } else {
                    toast.success(`"${item.name}" 구매 완료! (잔여 GP: ${d.remainingGp.toLocaleString()})`)
                    setGp(d.remainingGp)
                    setItems(prev => prev.map(i =>
                        i.id === itemId ? { ...i, owned: true, obtainedBy: 'SHOP' } : i
                    ))
                }
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
                // ✅ BUG-8 수정: type이 undefined이면 같은 타입 해제 로직 스킵
                const type = item?.type
                setItems(prev => prev.map(i =>
                    i.id === itemId
                        ? { ...i, equipped: equip }
                        : (type !== undefined && i.type === type && equip ? { ...i, equipped: false } : i)
                ))
            } else {
                toast.error(d.error ?? '장착 실패')
            }
        } finally { setEquipping(null) }
    }

    const cosmeticItems = items.filter(i => i.type !== 'AI_TICKET')
    const ticketItem    = items.find(i => i.type === 'AI_TICKET')
    const filtered      = tab === 'ALL' ? cosmeticItems : cosmeticItems.filter(i => i.type === tab)

    const ownedCount = (type: string) =>
        type === 'ALL'
            ? cosmeticItems.filter(i => i.owned).length
            : cosmeticItems.filter(i => i.type === type && i.owned).length
    const totalCount = (type: string) =>
        type === 'ALL'
            ? cosmeticItems.length
            : cosmeticItems.filter(i => i.type === type).length

    return (
        <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">

            {/* 헤더 */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <ShoppingBag className="w-7 h-7 text-yellow-500" />
                        GP 상점
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        GP를 모아 프로필을 꾸며보세요. 칭호의 대부분은 업적 달성으로 얻습니다.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {session ? (
                        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-black text-lg">{gp.toLocaleString()}</span>
                            <span className="text-yellow-600 text-sm font-medium">GP</span>
                        </div>
                    ) : (
                        <Link href="/auth/signin">
                            <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                                로그인하고 구매하기
                            </Button>
                        </Link>
                    )}
                    <Button variant="ghost" size="icon" aria-label="새로고침" onClick={fetchAll} className="hover:bg-zinc-800">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* 안내 배너 */}
            <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-yellow-500/5 border border-yellow-800/30 rounded-xl p-3 flex items-start gap-2 text-xs text-yellow-700">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    GP는 현금 구매 불가. 퀘스트·예측 적중·퀴즈 활동으로만 획득됩니다.
                </div>
                <div className="bg-amber-500/5 border border-amber-800/30 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700">
                    <Trophy className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>칭호는 대부분 <strong>업적 달성 전용</strong>입니다. 구매 가능한 칭호는 팀 팬 칭호 5종뿐입니다.</span>
                </div>
            </div>

            {/* 탭 */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div>
            ) : (
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="w-full flex flex-wrap h-auto bg-zinc-900 border border-zinc-800 p-1 gap-1 rounded-xl">
                        {/* 질의권 */}
                        <TabsTrigger
                            value="AI_TICKET"
                            className="gap-1.5 data-[state=active]:bg-blue-900/60 data-[state=active]:text-blue-300 text-xs px-3 py-2"
                        >
                            <Bot className="w-3.5 h-3.5" />
                            질의권
                            {aiTickets > 0 && (
                                <span className="ml-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {aiTickets}
                                </span>
                            )}
                        </TabsTrigger>

                        {/* 코스메틱 탭 */}
                        {SHOP_TABS.map(t => (
                            <TabsTrigger
                                key={t.value}
                                value={t.value}
                                className="gap-1.5 data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-xs px-3 py-2"
                            >
                                {t.icon}
                                {t.label}
                                {t.value !== 'ALL' && totalCount(t.value) > 0 && (
                                    <span className="ml-1 text-zinc-600 text-[10px]">
                                        {ownedCount(t.value)}/{totalCount(t.value)}
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* 질의권 탭 콘텐츠 */}
                    <TabsContent value="AI_TICKET" className="mt-6">
                        <TicketTab
                            aiTickets={aiTickets}
                            gp={gp}
                            ticketItem={ticketItem}
                            buying={buying}
                            onBuy={handleBuy}
                        />
                    </TabsContent>

                    {/* 코스메틱 탭 콘텐츠 */}
                    {SHOP_TABS.map(t => (
                        <TabsContent key={t.value} value={t.value} className="mt-6">
                            {!session ? (
                                <div className="text-center py-12 space-y-3">
                                    <p className="text-zinc-500 text-sm">로그인 후 아이템을 구매하고 장착할 수 있습니다.</p>
                                    <Link href="/auth/signin">
                                        <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                                            로그인하기
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <TabItems
                                    items={filtered}
                                    onBuy={handleBuy}
                                    onEquip={handleEquip}
                                    buying={buying}
                                    equipping={equipping}
                                />
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            )}
        </div>
    )
}
