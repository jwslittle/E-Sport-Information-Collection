'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Save, Trophy, History, Settings, Upload, X, Crown, RefreshCw } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

interface Player {
    id: string
    name: string
    teamName: string | null
    position: string
    basePrice: number
    seasonStats?: string
}

interface TeamPlayer {
    id: string
    playerId: string
    position: string
    isCaptain?: boolean
    player: Player
}

interface RoundScore {
    round: number
    points: number
    details: string // JSON
}

interface RosterManagerProps {
    teamId: string
    players: TeamPlayer[]
    totalPoints: number
    roundScores: RoundScore[]
    teamImage?: string | null
    hasSwapTicket: boolean
    allPlayers: Player[]
    teamType?: string // 'REAL' | 'SIMULATION'
}

export function RosterManager({ teamId, players: initialPlayers, totalPoints, roundScores, teamImage: initialTeamImage, hasSwapTicket, allPlayers, teamType = 'REAL' }: RosterManagerProps) {
    const router = useRouter()
    const [players, setPlayers] = useState<TeamPlayer[]>(initialPlayers)
    const [teamImage, setTeamImage] = useState(initialTeamImage)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUpdatingImage, setIsUpdatingImage] = useState(false)
    const [isSwapping, setIsSwapping] = useState(false)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleUpdateImage = async () => {
        if (!selectedFile) return
        setIsUpdatingImage(true)

        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('teamId', teamId)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error('Upload failed')

            const data = await res.json()
            setTeamImage(data.url)
            setIsDialogOpen(false)
            setPreviewUrl(null)
            setSelectedFile(null)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('이미지 업로드에 실패했습니다.')
        } finally {
            setIsUpdatingImage(false)
        }
    }

    const handleSwap = async (starterId: string, benchId: string) => {
        if (!hasSwapTicket && teamType === 'REAL') {
            alert('선수 교체권이 필요합니다.')
            return
        }

        if (!confirm('선수를 교체하시겠습니까?')) return

        setIsSwapping(true)
        try {
            const res = await fetch('/api/my-team/roster', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, starterId, benchId, type: teamType })
            })

            if (!res.ok) throw new Error('Swap failed')

            // Optimistic update
            setPlayers(prev => {
                const starter = prev.find(p => p.id === starterId)
                const bench = prev.find(p => p.id === benchId)
                if (!starter || !bench) return prev

                const newStarterPos = bench.position
                const newBenchPos = starter.position

                return prev.map(p => {
                    if (p.id === starterId) return { ...p, position: newStarterPos }
                    if (p.id === benchId) return { ...p, position: newBenchPos }
                    return p
                })
            })

            router.refresh()
        } catch (error) {
            console.error(error)
            alert('선수 교체에 실패했습니다.')
        } finally {
            setIsSwapping(false)
        }
    }

    const starters = players.filter(p => p.position !== 'BENCH')
    const bench = players.filter(p => p.position === 'BENCH')

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {teamType === 'SIMULATION' ? '가상 시뮬레이션 팀 관리' : '나의 팀 관리'}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                                <DialogHeader>
                                    <DialogTitle>팀 이미지 변경</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div
                                        className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-yellow-500 transition-colors cursor-pointer relative"
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        <input
                                            id="file-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        {previewUrl ? (
                                            <div className="relative w-32 h-32 mx-auto">
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-full border-2 border-yellow-500" />
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedFile(null)
                                                        setPreviewUrl(null)
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="w-10 h-10 text-zinc-500 mx-auto" />
                                                <p className="text-sm text-zinc-400">
                                                    클릭하여 이미지를 선택하거나<br />여기로 드래그하세요
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={handleUpdateImage}
                                        disabled={isUpdatingImage || !selectedFile}
                                        className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
                                    >
                                        {isUpdatingImage ? '업로드 중...' : '변경하기'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </h2>
                    <p className="text-zinc-400">선발/벤치 선수를 교체하고 로스터를 확정하세요.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-zinc-400">총 획득 포인트</p>
                    <p className="text-3xl font-bold text-yellow-500 flex items-center justify-end gap-2">
                        <Trophy className="w-6 h-6" />
                        {totalPoints.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pts
                    </p>
                </div>
            </div>

            <Tabs defaultValue="roster" className="w-full">
                <TabsList className="bg-zinc-900 border-zinc-800">
                    <TabsTrigger value="roster">로스터 관리</TabsTrigger>
                    <TabsTrigger value="history">라운드 기록</TabsTrigger>
                </TabsList>

                <TabsContent value="roster" className="space-y-6 mt-6">
                    {/* Starters */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-green-400 flex items-center gap-2">
                                선발 라인업 (Starters)
                                <Badge variant="outline" className="text-xs font-normal border-yellow-600 text-yellow-500">
                                    <Crown className="w-3 h-3 mr-1 inline" />
                                    주장(Captain): 2배 점수
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {starters.map((tp) => (
                                    <div key={tp.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 relative group">
                                        <div className="text-center space-y-2">
                                            <div className="relative inline-block">
                                                <Avatar className="h-20 w-20 border-2 border-green-500 mx-auto">
                                                    <AvatarImage src={`/images/players/${tp.player.name.toLowerCase()}.png`} />
                                                    <AvatarFallback>{tp.player.name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                {tp.isCaptain && (
                                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full">
                                                        <Crown className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{tp.player.name}</p>
                                                <p className="text-xs text-zinc-400">{tp.player.teamName}</p>
                                                <div className="flex flex-col gap-1 items-center mt-1">
                                                    <Badge variant="secondary">{tp.position}</Badge>
                                                    {teamType === 'SIMULATION' && (
                                                        <span className="text-xs text-yellow-500 font-bold">
                                                            {(() => {
                                                                try {
                                                                    const stats = typeof tp.player.seasonStats === 'string'
                                                                        ? JSON.parse(tp.player.seasonStats)
                                                                        : tp.player.seasonStats
                                                                    return (stats?.fantasyPoints || 0).toFixed(1)
                                                                } catch { return '0.0' }
                                                            })()} pts
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bench / Wildcard */}
                    {bench.length > 0 && (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-zinc-400">벤치 / 와일드카드 (Bench)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {bench.map((tp) => (
                                        <div key={tp.id} className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50 relative">
                                            <div className="text-center space-y-2">
                                                <Avatar className="h-16 w-16 border-2 border-zinc-600 mx-auto grayscale">
                                                    <AvatarImage src={`/images/players/${tp.player.name.toLowerCase()}.png`} />
                                                    <AvatarFallback>{tp.player.name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-zinc-300">{tp.player.name}</p>
                                                    <p className="text-xs text-zinc-500">{tp.player.teamName}</p>
                                                    <Badge variant="outline" className="mt-1 border-zinc-700 text-zinc-500">{tp.position}</Badge>
                                                </div>

                                                {/* Swap Button */}
                                                <div className="pt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full text-xs border-zinc-600 hover:bg-zinc-700"
                                                        onClick={() => {
                                                            // Find a starter to swap with? 
                                                            // For simplicity, maybe just show a dialog or swap with same position?
                                                            // Or just alert that swap is not fully implemented in this UI yet if complex.
                                                            // But let's try to find a starter of same position.
                                                            const starter = starters.find(s => s.position === tp.position)
                                                            if (starter) {
                                                                handleSwap(starter.id, tp.id)
                                                            } else {
                                                                alert('교체할 선발 선수가 없습니다.')
                                                            }
                                                        }}
                                                        disabled={isSwapping}
                                                    >
                                                        <RefreshCw className="w-3 h-3 mr-1" />
                                                        교체
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle>라운드별 획득 포인트</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-4">
                                    {roundScores.length === 0 ? (
                                        <p className="text-center text-zinc-500 py-8">아직 기록된 점수가 없습니다.</p>
                                    ) : (
                                        roundScores.map((score) => (
                                            <div key={score.round} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                                                <span className="font-bold text-white">Round {score.round}</span>
                                                <span className="text-yellow-500 font-bold">{score.points} pts</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
