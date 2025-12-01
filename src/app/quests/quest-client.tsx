"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, CheckCircle, Lock, Gift } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Quest {
    id: string
    title: string
    description: string
    type: string
    targetCount: number
    rewardPoints: number
    progress: number
    isCompleted: boolean
    isClaimed: boolean
    icon?: string
}

export function QuestClient() {
    const [quests, setQuests] = useState<Quest[]>([])
    const [achievements, setAchievements] = useState<Quest[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const fetchQuests = async () => {
        try {
            const res = await fetch('/api/quests')
            const data = await res.json()
            if (data.quests) setQuests(data.quests)
            if (data.achievements) setAchievements(data.achievements)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQuests()
    }, [])

    const handleClaim = async (type: 'QUEST' | 'ACHIEVEMENT', id: string, reward: number) => {
        try {
            const res = await fetch('/api/quests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id })
            })

            if (res.ok) {
                toast({
                    title: "보상 획득!",
                    description: `${reward} 포인트를 획득했습니다.`,
                })
                fetchQuests() // Refresh data
                // TODO: Update global user points context if available
            } else {
                toast({
                    title: "오류 발생",
                    description: "보상을 수령할 수 없습니다.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error(error)
        }
    }

    const QuestItem = ({ item, type }: { item: Quest, type: 'QUEST' | 'ACHIEVEMENT' }) => {
        const percent = Math.min(100, Math.floor((item.progress / item.targetCount) * 100))

        return (
            <Card className="mb-4">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="bg-zinc-800 p-3 rounded-full">
                            {item.icon ? <span className="text-2xl">{item.icon}</span> : <Trophy className="w-6 h-6 text-yellow-500" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <p className="text-zinc-400 text-sm mb-2">{item.description}</p>
                            <div className="flex items-center gap-2">
                                <Progress value={percent} className="h-2 w-32" />
                                <span className="text-xs text-zinc-500">{item.progress} / {item.targetCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-yellow-400 font-bold flex items-center gap-1">
                            <Gift className="w-4 h-4" />
                            {item.rewardPoints} P
                        </div>
                        {item.isClaimed ? (
                            <Button disabled variant="secondary" size="sm">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                완료됨
                            </Button>
                        ) : item.isCompleted ? (
                            <Button onClick={() => handleClaim(type, item.id, item.rewardPoints)} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                                보상 받기
                            </Button>
                        ) : (
                            <Button disabled variant="outline" size="sm">
                                <Lock className="w-4 h-4 mr-2" />
                                진행 중
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (loading) return <div>Loading...</div>

    return (
        <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="daily">일일 퀘스트</TabsTrigger>
                <TabsTrigger value="achievement">업적</TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
                <div className="space-y-4">
                    {quests.map(quest => (
                        <QuestItem key={quest.id} item={quest} type="QUEST" />
                    ))}
                    {quests.length === 0 && <p className="text-center text-zinc-500">진행 중인 퀘스트가 없습니다.</p>}
                </div>
            </TabsContent>

            <TabsContent value="achievement">
                <div className="space-y-4">
                    {achievements.map(achieve => (
                        <QuestItem key={achieve.id} item={achieve} type="ACHIEVEMENT" />
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    )
}
