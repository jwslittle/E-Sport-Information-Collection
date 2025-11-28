'use client'

import { useState, useEffect, useCallback } from 'react'
import { Player } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, X, Save, AlertCircle, Lock } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@/hooks/use-debounce' // Debounce 훅 필요 (없으면 생성)

interface TeamBuilderProps {
    allPlayers: Player[]
    initialTeam?: any // 초기 팀 데이터 (서버에서 전달)
}

const POSITIONS = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
const SALARY_CAP = 100

export function TeamBuilder({ allPlayers, initialTeam }: TeamBuilderProps) {
    const router = useRouter()
    const { data: session, status } = useSession()

    const [teamName, setTeamName] = useState(initialTeam?.name || '')
    const [selectedPlayers, setSelectedPlayers] = useState<Record<string, Player | null>>({
        TOP: initialTeam?.players?.find((p: any) => p.position === 'TOP')?.player || null,
        JUNGLE: initialTeam?.players?.find((p: any) => p.position === 'JUNGLE')?.player || null,
        MID: initialTeam?.players?.find((p: any) => p.position === 'MID')?.player || null,
        ADC: initialTeam?.players?.find((p: any) => p.position === 'ADC')?.player || null,
        SUPPORT: initialTeam?.players?.find((p: any) => p.position === 'SUPPORT')?.player || null,
    })
    const [isFinalized, setIsFinalized] = useState(initialTeam?.isFinalized || false)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentPosition, setCurrentPosition] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    // 자동 저장을 위한 Debounce
    const debouncedTeamName = useDebounce(teamName, 1000)
    const debouncedPlayers = useDebounce(selectedPlayers, 1000)

    const currentCost = Object.values(selectedPlayers).reduce(
        (sum, player) => sum + (player?.cost || 0),
        0
    )

    // 로그인 체크
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
    }, [status, router])

    // 자동 저장 로직
    const saveTeam = useCallback(async (finalize = false) => {
        if (!session?.user) return
        if (isFinalized) return // 이미 확정된 경우 저장 불가

        // 팀 이름이 없거나 선수가 하나도 없으면 자동 저장 스킵 (수동 저장 시에는 알림)
        if (!teamName.trim() && !finalize) return

        setIsSaving(true)
        try {
            const response = await fetch('/api/my-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: teamName,
                    players: Object.entries(selectedPlayers)
                        .filter(([_, player]) => player !== null)
                        .map(([position, player]) => ({
                            playerId: player!.id,
                            position,
                        })),
                    totalCost: currentCost,
                    isFinalized: finalize
                }),
            })

            if (!response.ok) throw new Error('Failed to save team')

            setLastSaved(new Date())
            if (finalize) {
                setIsFinalized(true)
                alert('팀이 성공적으로 확정되었습니다! 더 이상 변경할 수 없습니다.')
            }
        } catch (error) {
            console.error(error)
            // 자동 저장 실패는 조용히 처리하거나 토스트 메시지
        } finally {
            setIsSaving(false)
        }
    }, [teamName, selectedPlayers, currentCost, session, isFinalized])

    // 변경 사항 감지하여 자동 저장 실행
    useEffect(() => {
        if (initialTeam && !isFinalized) {
            // 초기 로딩 후 변경이 있을 때만 저장 (여기서는 단순화를 위해 값 변경 시 무조건 시도)
            // 실제로는 dirty check가 필요할 수 있음
            saveTeam()
        }
    }, [debouncedTeamName, debouncedPlayers, saveTeam, isFinalized, initialTeam])


    const handleAddPlayer = (position: string) => {
        if (isFinalized) return
        setCurrentPosition(position)
        setSearch('')
        setIsDialogOpen(true)
    }

    const selectPlayer = (player: Player) => {
        if (!currentPosition) return

        const isAlreadySelected = Object.values(selectedPlayers).some(
            (p) => p?.id === player.id
        )
        if (isAlreadySelected) {
            alert('이미 팀에 포함된 선수입니다.')
            return
        }

        const newCost = currentCost - (selectedPlayers[currentPosition]?.cost || 0) + player.cost
        if (newCost > SALARY_CAP) {
            alert('샐러리 캡을 초과했습니다!')
            return
        }

        setSelectedPlayers({
            ...selectedPlayers,
            [currentPosition]: player,
        })
        setIsDialogOpen(false)
    }

    const removePlayer = (position: string) => {
        if (isFinalized) return
        setSelectedPlayers({
            ...selectedPlayers,
            [position]: null,
        })
    }

    const handleFinalize = () => {
        if (!teamName.trim()) {
            alert('팀 이름을 입력해주세요.')
            return
        }
        if (Object.values(selectedPlayers).some((p) => p === null)) {
            alert('팀 확정 전 모든 포지션을 채워주세요.')
            return
        }
        if (confirm('팀을 확정하시겠습니까? 확정 후에는 수정할 수 없습니다.')) {
            saveTeam(true)
        }
    }

    const filteredPlayers = allPlayers.filter(
        (p) =>
            currentPosition &&
            p.position === currentPosition &&
            p.name.toLowerCase().includes(search.toLowerCase())
    )

    if (status === 'loading') return <div className="text-white">로딩 중...</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">나만의 팀 빌더</h1>
                    <p className="text-zinc-400">샐러리 캡 내에서 최고의 팀을 구성하세요.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm text-zinc-400">샐러리 캡</p>
                        <p className={`text-2xl font-bold ${currentCost > SALARY_CAP ? 'text-red-500' : 'text-green-500'}`}>
                            {currentCost} / {SALARY_CAP}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {!isFinalized ? (
                            <Button onClick={handleFinalize} disabled={isSaving} className="bg-yellow-500 text-black hover:bg-yellow-400">
                                <Lock className="mr-2 h-4 w-4" />
                                팀 확정
                            </Button>
                        ) : (
                            <Button disabled className="bg-zinc-700 text-zinc-400 cursor-not-allowed">
                                <Lock className="mr-2 h-4 w-4" />
                                확정됨
                            </Button>
                        )}
                        {lastSaved && (
                            <span className="text-xs text-zinc-500">
                                {isSaving ? '저장 중...' : `저장됨: ${lastSaved.toLocaleTimeString()}`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-md">
                <label className="text-sm font-medium text-zinc-400 mb-2 block">팀 이름</label>
                <Input
                    placeholder="팀 이름을 입력하세요"
                    className="bg-zinc-900 border-zinc-800 text-white"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    disabled={isFinalized}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {POSITIONS.map((position) => {
                    const player = selectedPlayers[position]
                    return (
                        <Card key={position} className={`bg-zinc-900 border-zinc-800 ${!player ? 'border-dashed' : ''} ${isFinalized ? 'opacity-80' : ''}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-500 text-center">{position}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                                {player ? (
                                    <>
                                        <div className="relative">
                                            <Avatar className="h-20 w-20 border-2 border-yellow-500">
                                                <AvatarImage src={`/images/players/${player.name.toLowerCase()}.png`} />
                                                <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            {!isFinalized && (
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                    onClick={() => removePlayer(position)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-white">{player.name}</p>
                                            <p className="text-xs text-zinc-400">{player.team}</p>
                                            <Badge variant="outline" className="mt-2 border-zinc-700 text-yellow-500">
                                                Cost: {player.cost}
                                            </Badge>
                                        </div>
                                    </>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        className="h-20 w-20 rounded-full border-2 border-dashed border-zinc-700 text-zinc-500 hover:border-yellow-500 hover:text-yellow-500"
                                        onClick={() => handleAddPlayer(position)}
                                        disabled={isFinalized}
                                    >
                                        <Plus className="h-8 w-8" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>{currentPosition} 선수 선택</DialogTitle>
                    </DialogHeader>
                    <Input
                        placeholder="선수 검색..."
                        className="bg-zinc-800 border-zinc-700 text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="max-h-[300px] overflow-y-auto space-y-2 mt-4">
                        {filteredPlayers.map((player) => (
                            <div
                                key={player.id}
                                className="flex items-center justify-between p-2 rounded hover:bg-zinc-800 cursor-pointer"
                                onClick={() => selectPlayer(player)}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={`/images/players/${player.name.toLowerCase()}.png`} />
                                        <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{player.name}</p>
                                        <p className="text-xs text-zinc-400">{player.team}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-yellow-500">{player.cost} Cost</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
