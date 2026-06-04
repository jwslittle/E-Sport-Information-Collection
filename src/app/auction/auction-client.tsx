"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Timer, Gavel, User as UserIcon } from "lucide-react"

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
    const [auctions, setAuctions] = useState<Auction[]>([])
    const [loading, setLoading] = useState(true)
    const [bidAmount, setBidAmount] = useState<Record<string, number>>({})
    const { toast } = useToast()

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

    // Real-time updates with Pusher + Polling fallback
    useEffect(() => {
        fetchAuctions()

        // Polling fallback (every 5 seconds)
        const interval = setInterval(fetchAuctions, 5000)

        // Pusher Subscription
        let channel: any;
        try {
            const { pusherClient } = require('@/lib/pusher-client')
            channel = pusherClient.subscribe('auction-channel')

            channel.bind('auction-update', (data: any) => {
                setAuctions(prev => prev.map(auction => {
                    if (auction.id === data.auctionId) {
                        return {
                            ...auction,
                            currentPrice: data.currentPrice,
                            highestBidder: { name: 'New Bidder' } // We might need to fetch the name or just show 'New Bidder' temporarily
                        }
                    }
                    return auction
                }))
                // Optionally refresh full data to get bidder name
                fetchAuctions()
            })
        } catch (e) {
            console.warn('Pusher subscription failed:', e)
        }

        return () => {
            clearInterval(interval)
            if (channel) channel.unbind_all()
            if (channel) channel.unsubscribe()
        }
    }, [])

    const handleBid = async (auctionId: string, currentPrice: number) => {
        const amount = bidAmount[auctionId]
        if (!amount || amount <= currentPrice) {
            toast({
                title: "입찰 실패",
                description: "현재 가격보다 높은 금액을 입력해주세요.",
                variant: "destructive"
            })
            return
        }

        try {
            const res = await fetch(`/api/auction/${auctionId}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            })

            const data = await res.json()

            if (res.ok) {
                toast({
                    title: "입찰 성공!",
                    description: `${amount} 포인트로 입찰했습니다.`,
                })
                fetchAuctions() // Immediate refresh
            } else {
                toast({
                    title: "입찰 실패",
                    description: data.error || "알 수 없는 오류가 발생했습니다.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error(error)
        }
    }

    const formatTimeLeft = (endTime: string) => {
        const diff = new Date(endTime).getTime() - new Date().getTime()
        if (diff <= 0) return "종료됨"
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        return `${hours}h ${minutes}m ${seconds}s`
    }

    if (loading) return <div>Loading...</div>

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
                                    onChange={(e) => setBidAmount({ ...bidAmount, [auction.id]: parseInt(e.target.value) })}
                                />
                                <Button onClick={() => handleBid(auction.id, auction.currentPrice)} className="bg-yellow-600 hover:bg-yellow-700">
                                    입찰
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
