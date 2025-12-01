'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface PackResult {
    card: {
        grade: string
    }
    player: {
        name: string
        team: string
        position: string
    }
    user: {
        gachaLevel: number
    }
}

export function ShopClient() {
    const [isOpening, setIsOpening] = useState(false)
    const [result, setResult] = useState<PackResult | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    const buyPack = async () => {
        setIsOpening(true)
        setIsOpen(true)
        setResult(null)

        try {
            await new Promise(resolve => setTimeout(resolve, 1500))

            const response = await fetch('/api/shop/buy', {
                method: 'POST',
            })

            if (!response.ok) throw new Error('Failed to buy pack')

            const data = await response.json()
            setResult(data)
        } catch (error) {
            console.error(error)
            setIsOpen(false)
            alert('팩 구매 실패')
        } finally {
            setIsOpening(false)
        }
    }

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'BRONZE': return 'text-orange-700 border-orange-700'
            case 'SILVER': return 'text-zinc-400 border-zinc-400'
            case 'GOLD': return 'text-yellow-500 border-yellow-500'
            case 'DIAMOND': return 'text-cyan-400 border-cyan-400'
            case 'CHALLENGER': return 'text-purple-500 border-purple-500'
            default: return 'text-white border-white'
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">상점</h1>
                <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                    <span className="text-zinc-400 mr-2">포인트:</span>
                    <span className="text-yellow-500 font-bold">∞</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-yellow-500/50 transition-colors">
                    <CardHeader className="text-center">
                        <Package className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                        <CardTitle className="text-white">스탠다드 팩</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-zinc-400">
                        <p>랜덤 선수 카드 1장이 포함되어 있습니다.</p>
                        <p className="text-sm mt-2">가챠 레벨이 높을수록 높은 등급의 카드가 나올 확률이 증가합니다.</p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button onClick={buyPack} className="bg-yellow-500 text-black hover:bg-yellow-400 w-full">
                            100 포인트로 구매
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {isOpening ? '팩 개봉 중...' : '팩 개봉 완료!'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center py-8 min-h-[300px]">
                        {isOpening ? (
                            <div className="animate-pulse">
                                <Package className="w-32 h-32 text-yellow-500" />
                            </div>
                        ) : result ? (
                            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
                                <div className={`relative inline-block p-1 rounded-full border-4 ${getGradeColor(result.card.grade)}`}>
                                    <Avatar className="w-32 h-32">
                                        <AvatarImage src={`/images/players/${result.player.name.toLowerCase()}.png`} />
                                        <AvatarFallback className="text-2xl bg-zinc-800">{result.player.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                                        <Badge className={`bg-zinc-900 ${getGradeColor(result.card.grade)}`}>
                                            {result.card.grade}
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold text-white">{result.player.name}</h3>
                                    <p className="text-zinc-400">{result.player.team} • {result.player.position}</p>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mt-4">
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                    <span>가챠 레벨: {result.user.gachaLevel}</span>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
