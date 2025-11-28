'use client'

import { useState } from 'react'
import { Card as PlayerCard, Player } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowUpCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserCardWithPlayer {
    id: string
    card: PlayerCard & { player: Player }
}

interface CollectionClientProps {
    userCards: UserCardWithPlayer[]
}

export function CollectionClient({ userCards }: CollectionClientProps) {
    const router = useRouter()
    const [isEvolving, setIsEvolving] = useState(false)

    // 카드를 선수별, 등급별로 그룹화
    const groupedCards: Record<string, UserCardWithPlayer[]> = {}
    userCards.forEach((uc) => {
        const key = `${uc.card.playerId}-${uc.card.grade}`
        if (!groupedCards[key]) groupedCards[key] = []
        groupedCards[key].push(uc)
    })

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

    const handleEvolve = async (playerId: string, currentGrade: string) => {
        const key = `${playerId}-${currentGrade}`
        const cards = groupedCards[key]
        if (cards.length < 3) return

        if (!confirm(`${currentGrade} 카드 3장을 다음 등급으로 진화시키겠습니까?`)) return

        setIsEvolving(true)
        try {
            const response = await fetch('/api/collection/evolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardIds: cards.slice(0, 3).map(c => c.id),
                    playerId,
                    currentGrade,
                }),
            })

            if (!response.ok) throw new Error('Failed to evolve')

            alert('진화 성공!')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('카드 진화 실패.')
        } finally {
            setIsEvolving(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">나의 보관함</h1>
                <div className="text-zinc-400">
                    총 카드 수: <span className="text-white font-bold">{userCards.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Object.entries(groupedCards).map(([key, cards]) => {
                    const firstCard = cards[0]
                    const count = cards.length
                    const canEvolve = count >= 3 && firstCard.card.grade !== 'CHALLENGER'

                    return (
                        <Card key={key} className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className={`relative p-1 rounded-full border-2 ${getGradeColor(firstCard.card.grade)}`}>
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={`/images/players/${firstCard.card.player.name.toLowerCase()}.png`} />
                                        <AvatarFallback>{firstCard.card.player.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div>
                                    <CardTitle className="text-white text-lg">{firstCard.card.player.name}</CardTitle>
                                    <Badge variant="outline" className={`mt-1 ${getGradeColor(firstCard.card.grade)}`}>
                                        {firstCard.card.grade}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center text-sm text-zinc-400">
                                    <span>보유 수:</span>
                                    <span className="text-white font-bold text-lg">{count}</span>
                                </div>
                            </CardContent>
                            {canEvolve && (
                                <CardFooter className="bg-yellow-500/10 border-t border-yellow-500/20 p-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/20"
                                        onClick={() => handleEvolve(firstCard.card.playerId, firstCard.card.grade)}
                                        disabled={isEvolving}
                                    >
                                        {isEvolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4 mr-2" />}
                                        진화 가능
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    )
                })}
            </div>

            {userCards.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-zinc-400">아직 카드가 없습니다. 상점에서 카드를 획득하세요!</p>
                </div>
            )}
        </div>
    )
}
