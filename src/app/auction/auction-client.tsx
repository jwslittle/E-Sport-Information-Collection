"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Timer, Gavel, User as UserIcon, Loader2 } from "lucide-react"

interface Auction {
    id: string
    card: {
        player: {
            name: string
            position: string
            teamName: string | null
        }
        grade: string
        season: string
    }
    seller: {
        name: string
    }
    currentPrice: number
    highestBidder?: {
        name: string
    }
    endTime: string
}

export function AuctionClient() {
    const { data: session } = useSession()
    const [auctions, setAuctions] = useState<Auction[]>([])
    const [loading, setLoading] = useState(true)
    const [bidAmount, setBidAmount] = useState<Record<string, number>>({})
    // 경매별 개별 로딩 상태 (연타 방지)
    const [submitting, setSubmitting] = useState<string | null>(null)
    // ✅ 1초 카운트다운: tick이 바뀔 때마다 리렌더 → formatTimeLeft가 최신 시각 사용
    const [, setTick] = useState(0)
    // Pusher 채널 ref (cleanup용)
    const channelRef = useRef<any>(null)

    const fetchAuctions = async () => {
        try {
            const res = await fetch('/api/auction')
            const data = await res.json()
            if (data.auctions) setAuctions(data.auctions)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // ✅ 1초 카운트다운 인터벌 (컴포넌트 언마운트 시 자동 정리)
    useEffect(() => {
        const countdown = setInterval(() => setTick(t => t + 1), 1000)
        return () => clearInterval(countdown)
    }, [])

    // Real-time updates with Pusher + Polling fallback
    useEffect(() => {
        fetchAuctions()

        // Polling fallback (30초 — Pusher 연결 시 보조 역할)
        const interval = setInterval(fetchAuctions, 30000)

        // Pusher Subscription — 동적 임포트로 빌드 오류 방지
        import('@/lib/pusher-client')
            .then(({ pusherClient }) => {
                const channel = pusherClient.subscribe('auction-channel')
                channelRef.current = channel

                channel.bind('auction-update', (data: any) => {
                    setAuctions(prev => prev.map(auction => {
                        if (auction.id === data.auctionId) {
                            return {
                                ...auction,
                                currentPrice: data.currentPrice,
                                highestBidder: { name: 'New Bidder' }
                            }
                        }
                        return auction
                    }))
                    fetchAuctions()
                })
            })
            .catch(e => console.warn('Pusher 연결 실패 (폴링으로 대체):', e))

        return () => {
            clearInterval(interval)
            if (channelRef.current) {
                channelRef.current.unbind_all()
                channelRef.current.unsubscribe()
            }
        }
    }, [])

    const handleBid = async (auctionId: string, currentPrice: number) => {
        // 로그인 확인
        if (!session?.user) {
            toast.error('입찰하려면 로그인이 필요합니다.')
            return
        }

        const amount = bidAmount[auctionId]
        // NaN 및 유효성 검사
        if (!amount || isNaN(amount) || amount <= currentPrice) {
            toast.error('현재 가격보다 높은 금액을 입력해주세요.')
            return
        }

        setSubmitting(auctionId)
        try {
            const res = await fetch(`/api/auction/${auctionId}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(`${amount.toLocaleString()} 포인트로 입찰했습니다.`)
                fetchAuctions()
            } else {
                toast.error(data.error ?? '알 수 없는 오류가 발생했습니다.')
            }
        } catch (error) {
            console.error(error)
            toast.error('입찰 중 오류가 발생했습니다.')
        } finally {
            setSubmitting(null)
        }
    }

    // ✅ formatTimeLeft: tick 상태 변경마다 재호출되어 실시간 카운트다운 표시
    const formatTimeLeft = (endTime: string) => {
        const diff = new Date(endTime).getTime() - new Date().getTime()
        if (diff <= 0) return '종료됨'
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        if (hours > 0) return `${hours}시간 ${minutes}분 ${seconds}초`
        if (minutes > 0) return `${minutes}분 ${seconds}초`
        return `${seconds}초`
    }

    if (loading) return <div className="text-center py-12 text-zinc-500">로딩 중...</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map(auction => (
                <Card key={auction.id} className="overflow-hidden border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge variant="outline" className="mb-2">{auction.card.season}</Badge>
                                <CardTitle className="text-xl">{auction.card.player.name}</CardTitle>
                                <p className="text-sm text-zinc-400">{auction.card.player.teamName} • {auction.card.player.position}</p>
                            </div>
                            <Badge className={
                                auction.card.grade === 'CHALLENGER' ? 'bg-blue-500' :
                                    auction.card.grade === 'DIAMOND' ? 'bg-cyan-500' :
                                        auction.card.grade === 'GOLD' ? 'bg-yellow-500' :
                                            auction.card.grade === 'SILVER' ? 'bg-zinc-400' : 'bg-orange-700'
                            }>
                                {auction.card.grade}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm bg-zinc-950/50 p-3 rounded-lg">
                                <span className="text-zinc-400 flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" /> 판매자
                                </span>
                                <span>{auction.seller.name}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm bg-zinc-950/50 p-3 rounded-lg">
                                <span className="text-zinc-400 flex items-center gap-2">
                                    <Gavel className="w-4 h-4" /> 현재가
                                </span>
                                <span className="text-yellow-400 font-bold text-lg">{auction.currentPrice.toLocaleString()} P</span>
                            </div>

                            {auction.highestBidder && (
                                <div className="text-xs text-right text-zinc-500">
                                    최고 입찰자: {auction.highestBidder.name}
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-red-400 font-medium justify-center py-2">
                                <Timer className="w-4 h-4" />
                                {formatTimeLeft(auction.endTime)}
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="입찰가"
                                    className="bg-zinc-950 border-zinc-700"
                                    value={bidAmount[auction.id] || ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10)
                                        if (e.target.value === '') {
                                            const updated = { ...bidAmount }
                                            delete updated[auction.id]
                                            setBidAmount(updated)
                                        } else if (!isNaN(val) && val > 0) {
                                            setBidAmount({ ...bidAmount, [auction.id]: val })
                                        }
                                    }}
                                />
                                <Button
                                    onClick={() => handleBid(auction.id, auction.currentPrice)}
                                    disabled={submitting === auction.id}
                                    className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                    {submitting === auction.id
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : '입찰'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {auctions.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500">
                    현재 진행 중인 경매가 없습니다.
                </div>
            )}
        </div>
    )
}
