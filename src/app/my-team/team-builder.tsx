'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Player as PrismaPlayer, Team } from '@prisma/client'
// team 릴레이션을 포함한 확장 타입 (비공개 필드, 런타임 쿼리에 include 필요)
type Player = PrismaPlayer & { team?: Team | null }
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, X, Lock, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@/hooks/use-debounce'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { AIBriefing } from "@/components/ai-briefing"

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
    teamType?: string // 'REAL' | 'SIMULATION'
    label?: string
    desc?: string
}

const POSITIONS = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT', 'WILDCARD']
const SALARY_CAP = 60  // 가상 선수 평균가격(~50) + 와일드카드 여유분

export function TeamBuilder({ allPlayers, initialTeam, teamType = 'REAL', label, desc }: TeamBuilderProps) {
    const router = useRouter()
    const { data: session, status } = useSession()

    const [teamName, setTeamName] = useState(initialTeam?.name || '')
    const [selectedPlayers, setSelectedPlayers] = useState<Record<string, Player | null>>({
        TOP:      initialTeam?.players?.find((p) => p.position === 'TOP')?.player || null,
        JUNGLE:   initialTeam?.players?.find((p) => p.position === 'JUNGLE')?.player || null,
        MID:      initialTeam?.players?.find((p) => p.position === 'MID')?.player || null,
        ADC:      initialTeam?.players?.find((p) => p.position === 'ADC' || p.position === 'BOTTOM')?.player || null,
        SUPPORT:  initialTeam?.players?.find((p) => p.position === 'SUPPORT')?.player || null,
        WILDCARD: initialTeam?.players?.find((p) => p.position === 'WILDCARD' || p.position === 'SUB')?.player || null,
    })
    const [isFinalized, setIsFinalized] = useState(initialTeam?.isFinalized || false)

    const [isCaptainDialogOpen, setIsCaptainDialogOpen] = useState(false)
    const [selectedCaptainId, setSelectedCaptainId] = useState<string | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentPosition, setCurrentPosition] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    const debouncedPlayers = useDebounce(selectedPlayers, 1000)

    const currentCost = Object.values(selectedPlayers).reduce(
        (sum, player) => sum + (player?.basePrice || 0),
        0
    )

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
    }, [status, router])

    const saveTeam = useCallback(async (finalize = false, manualCaptainId?: string) => {
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
                    type: teamType,
                    players: Object.entries(selectedPlayers)
                        .filter(([_, player]) => player !== null)
                        .map(([position, player]) => {
                            const allSelected = Object.values(selectedPlayers).filter(p => p !== null) as Player[]

                            let captainId = manualCaptainId
                            // If auto-save (not finalized) and no manual captain, defaults to max price (or none)
                            if (!finalize && !captainId) {
                                const maxCost = Math.max(...allSelected.map(p => p.basePrice || 0))
                                captainId = allSelected.find(p => (p.basePrice || 0) === maxCost)?.id
                            }

                            return {
                                playerId: player!.id,
                                position,
                                isStarter: position !== 'WILDCARD',
                                isCaptain: player!.id === captainId
                            }
                        }),
                    totalCost: currentCost,
                    isFinalized: finalize
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to save team')
            }

            setLastSaved(new Date())
            if (finalize) {
                setIsFinalized(true)
                setIsCaptainDialogOpen(false)
                toast.success('팀이 확정되었습니다! 더 이상 변경할 수 없습니다.')
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || '팀 저장에 실패했습니다.')
        } finally {
            setIsSaving(false)
        }
    }, [teamName, selectedPlayers, currentCost, session, isFinalized, router, teamType])

    useEffect(() => {
        if (initialTeam && !isFinalized) {
            saveTeam()
        }
    }, [debouncedPlayers, saveTeam, isFinalized, initialTeam])

    const handleAddPlayer = (position: string) => {
        if (isFinalized) return
        setCurrentPosition(position)
        setSearch('')
        setIsDialogOpen(true)
    }

    const selectPlayer = (player: Player) => {
        if (!currentPosition) return

        // Check if already selected
        const isAlreadySelected = Object.values(selectedPlayers).some(
            (p) => p?.id === player.id
        )
        if (isAlreadySelected) {
            toast.error('이미 팀에 포함된 선수입니다.')
            return
        }

        // Validate position match (Handling ADC/BOTTOM mismatch)
        if (currentPosition !== 'WILDCARD' && player.position !== currentPosition) {
            toast.error(`이 슬롯에는 ${currentPosition} 포지션의 선수만 배치할 수 있습니다.`)
            return
        }

        const newCost = currentCost - (selectedPlayers[currentPosition]?.basePrice || 0) + (player.basePrice || 0)
        if (newCost > SALARY_CAP) {
            toast.error('샐러리 캡을 초과했습니다!')
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
            toast.error('팀 이름을 입력해주세요.')
            return
        }

        const mainPositions = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
        const missingPositions = mainPositions.filter(pos => !selectedPlayers[pos])

        if (missingPositions.length > 0) {
            const missingText = missingPositions.map(p => p === 'BOTTOM' ? 'ADC' : p).join(', ')
            toast.error(`다음 포지션이 비어있습니다: ${missingText}. 주전 5명은 모두 선택해야 합니다.`)
            return
        }

        // Extra safety check
        const requiredPositions = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
        const filled = requiredPositions.every(pos => selectedPlayers[pos] !== null)

        if (!filled) {
            toast.error('모든 주전 포지션을 채워야 합니다.')
            return
        }

        // Open Captain Selection Dialog instead of direct confirm
        setIsCaptainDialogOpen(true)
    }

    const confirmCaptainAndFinalize = () => {
        if (!selectedCaptainId) {
            toast.error('주장을 선택해주세요.')
            return
        }
        if (confirm('팀을 확정하시겠습니까? 확정 후에는 멤버를 교체할 수 없습니다.')) {
            saveTeam(true, selectedCaptainId)
        }
    }

    const filteredPlayers = allPlayers.filter(
        // ... existing filter logic ...
        (p) => {
            if (!currentPosition) return false
            const dbPosition = currentPosition  // ADC is already 'ADC'
            const positionMatch = currentPosition === 'WILDCARD' ? true : p.position === dbPosition
            const nameMatch = p.name.toLowerCase().includes(search.toLowerCase())
            return positionMatch && nameMatch
        }
    )

    if (status === 'loading') return <div className="text-white">로딩 중...</div>

    return (
        <div className="space-y-8">
            {/* ... Header and Alerts ... */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {label ?? '팀 빌더'}
                    </h1>
                    <p className="text-zinc-400">
                        {desc ?? `가상 선수 5명(+와일드카드 선택)으로 팀을 구성하세요. 예산: ${SALARY_CAP}`}
                    </p>
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

            <AIBriefing />

            <Alert className="bg-blue-900/20 border-blue-800 text-blue-200">
                <Info className="h-4 w-4" />
                <AlertTitle>와일드카드 전략 가이드</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                        <li><strong>와일드카드는 선택사항입니다.</strong> 필수로 채우지 않아도 팀 확정이 가능합니다.</li>
                        <li>와일드카드 슬롯에 배치된 선수는 <strong>획득 포인트의 1/3만 적용</strong>됩니다.</li>
                        <li>
                            주전 5명에게 예산을 집중하여 확실한 점수를 얻을지,
                            와일드카드를 포함해 추가 점수를 노릴지는 <strong>당신의 선택</strong>입니다.
                        </li>
                    </ul>
                </AlertDescription>
            </Alert>

            <div className="flex items-end gap-3 mb-4">
                <div className="flex-1">
                    <label className="text-sm font-medium text-zinc-400 mb-1 block">팀 이름</label>
                    <div className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-yellow-500">Lv.1</span>
                        {teamName || '알 수 없는 팀'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {POSITIONS.map((position) => {
                    const player = selectedPlayers[position]
                    return (
                        <motion.div
                            key={position}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Card className={`bg-zinc-900 border-zinc-800 h-full transition-colors ${!player ? 'border-dashed hover:border-yellow-500/50' : 'hover:border-yellow-500'} ${isFinalized ? 'opacity-80' : ''}`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-zinc-500 text-center">
                                        {position === 'SUB' ? 'SUB (Any)' : position}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-4">
                                    {player ? (
                                        <div
                                            className={`flex flex-col items-center gap-4 w-full h-full justify-center ${!isFinalized ? 'cursor-pointer hover:opacity-80' : ''}`}
                                            onClick={() => !isFinalized && handleAddPlayer(position)}
                                        >
                                            <div className="relative">
                                                <Avatar className="h-20 w-20 border-2 border-yellow-500">
                                                    <AvatarImage src={`/images/players/${player.name.toLowerCase()}.png`} />
                                                    <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                {/* Captain Badge UI if desired */}
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-white">{player.name}</p>
                                                <p className="text-xs text-zinc-400">{player.team?.code ?? player.teamId?.slice(0,3)}</p>
                                                <p className="text-xs text-zinc-500">{player.position}</p>
                                                <Badge variant="outline" className="mt-2 border-zinc-700 text-yellow-500">
                                                    Cost: {player.basePrice}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.div
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                        >
                                            <Button
                                                variant="ghost"
                                                className="h-20 w-20 rounded-full border-2 border-dashed border-zinc-700 text-zinc-500 hover:border-yellow-500 hover:text-yellow-500"
                                                onClick={() => handleAddPlayer(position)}
                                                disabled={isFinalized}
                                            >
                                                <Plus className="h-8 w-8" />
                                            </Button>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            {/* Player Selection Dialog (Existing) */}
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
                                        <p className="text-xs text-zinc-400">{player.team?.code ?? ''} · {player.position}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center justify-end gap-1">
                                    <span className="font-bold text-yellow-500">{player.basePrice} Cost</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-3 w-3 text-zinc-500 hover:text-zinc-300" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs bg-zinc-900 border-zinc-800 text-zinc-300 text-xs p-3">
                                                <p>
                                                    <strong>선수 포인트 산정 기준 안내</strong><br />
                                                    본 서비스의 선수 포인트는 지난 시즌의 정량적 지표(KDA, DPM, 시야 점수 등)를 독자적인 스코어링 시스템에 대입하여 산출된 결과입니다.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Captain Selection Dialog (New) */}
            <Dialog open={isCaptainDialogOpen} onOpenChange={setIsCaptainDialogOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            👑 주장 선택 (Select Captain)
                        </DialogTitle>
                    </DialogHeader>
                    <Alert className="bg-yellow-500/10 border-yellow-500/30 text-yellow-200 mb-4">
                        <Info className="h-4 w-4 text-yellow-500" />
                        <AlertTitle>주장 보너스</AlertTitle>
                        <AlertDescription>
                            선택한 주장은 해당 라운드에서 <strong>포인트 1.5배</strong>를 획득합니다.<br />
                            팀의 핵심 선수를 주장으로 임명하세요!
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 gap-2">
                        {['TOP', 'JUNGLE', 'MID', 'BOTTOM', 'SUPPORT'].map(pos => {
                            const player = selectedPlayers[pos]
                            if (!player) return null
                            return (
                                <div
                                    key={pos}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedCaptainId === player.id ? 'bg-yellow-500/20 border-yellow-500' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}`}
                                    onClick={() => setSelectedCaptainId(player.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-zinc-600">
                                            <AvatarImage src={`/images/players/${player.name.toLowerCase()}.png`} />
                                            <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-white">{player.name}</p>
                                            <p className="text-xs text-zinc-400">{pos} • {player.team?.code ?? player.teamId?.slice(0, 3) ?? 'FA'}</p>
                                        </div>
                                    </div>
                                    {selectedCaptainId === player.id && (
                                        <Badge className="bg-yellow-500 text-black hover:bg-yellow-400">Selected</Badge>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsCaptainDialogOpen(false)}>취소</Button>
                        <Button className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold" onClick={confirmCaptainAndFinalize}>
                            확정 및 저장
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
