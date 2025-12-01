'use client'

import { useState, useEffect, useCallback } from 'react'
import { Player } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, X, Save, Lock } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@/hooks/use-debounce'

interface InitialTeam {
    name: string
    players: {
        position: string
        player: Player
    }[]
    isFinalized: boolean
}

interface TeamBuilderProps {
    allPlayers: Player[]
    initialTeam?: InitialTeam | null
}

const POSITIONS = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT', 'SUB']
const SALARY_CAP = 100 // Adjusted for better balance (Avg ~16 * 6 = 96)

export function TeamBuilder({ allPlayers, initialTeam }: TeamBuilderProps) {
    const router = useRouter()
    const { data: session, status } = useSession()

    const [teamName, setTeamName] = useState(initialTeam?.name || '')
    const [selectedPlayers, setSelectedPlayers] = useState<Record<string, Player | null>>({
        TOP: initialTeam?.players?.find((p) => p.position === 'TOP')?.player || null,
        JUNGLE: initialTeam?.players?.find((p) => p.position === 'JUNGLE')?.player || null,
        MID: initialTeam?.players?.find((p) => p.position === 'MID')?.player || null,
        ADC: initialTeam?.players?.find((p) => p.position === 'ADC')?.player || null,
        SUPPORT: initialTeam?.players?.find((p) => p.position === 'SUPPORT')?.player || null,
        SUB: initialTeam?.players?.find((p) => p.position === 'SUB')?.player || null,
    })
    const [isFinalized, setIsFinalized] = useState(initialTeam?.isFinalized || false)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentPosition, setCurrentPosition] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    const debouncedTeamName = useDebounce(teamName, 1000)
    const debouncedPlayers = useDebounce(selectedPlayers, 1000)

    const currentCost = Object.values(selectedPlayers).reduce(
        (sum, player) => sum + (player?.cost || 0),
        0
    )

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
    }, [status, router])

    const saveTeam = useCallback(async (finalize = false) => {
        if (!session?.user) return
        if (isFinalized) return

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
                            // Default starters: everyone except SUB
                            isStarter: position !== 'SUB'
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
                router.refresh()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }, [teamName, selectedPlayers, currentCost, session, isFinalized, router])

    useEffect(() => {
        if (initialTeam && !isFinalized) {
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

        // Validate Position for Main Roles (SUB can be anyone)
        if (currentPosition !== 'SUB' && player.position !== currentPosition) {
            alert(`이 슬롯에는 ${currentPosition} 포지션의 선수만 배치할 수 있습니다.`)
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
            alert('팀 확정 전 6명의 선수를 모두 채워주세요.')
            return
        }
        if (confirm('팀을 확정하시겠습니까? 확정 후에는 멤버를 교체할 수 없으며, 주전/벤치 설정만 가능합니다.')) {
            saveTeam(true)
        }
    }

    const filteredPlayers = allPlayers.filter(
        (p) => {
            if (!currentPosition) return false
            // SUB slot allows any position, Main slots enforce position
            const positionMatch = currentPosition === 'SUB' ? true : p.position === currentPosition
            const nameMatch = p.name.toLowerCase().includes(search.toLowerCase())
            return positionMatch && nameMatch
        }
    )

    if (status === 'loading') return <div className="text-white">로딩 중...</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">나만의 팀 빌더 (6인 로스터)</h1>
                    <p className="text-zinc-400">5명의 주전과 1명의 서브 멤버를 구성하세요. (Salary Cap: {SALARY_CAP})</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {POSITIONS.map((position) => {
                    const player = selectedPlayers[position]
                    return (
                        <Card key={position} className={`bg-zinc-900 border-zinc-800 ${!player ? 'border-dashed' : ''} ${isFinalized ? 'opacity-80' : ''}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-500 text-center">
                                    {position === 'SUB' ? 'SUB (Any)' : position}
                                </CardTitle>
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
                                            <p className="text-xs text-zinc-500">{player.position}</p>
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
                                        <p className="text-xs text-zinc-400">{player.team} • {player.position}</p>
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
