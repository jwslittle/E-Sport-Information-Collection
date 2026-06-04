'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Player as PrismaPlayer } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// ComparePlayer extends PrismaPlayer with optional legacy fields
// (seasonStats, teamName, cost existed in an older schema)
type ComparePlayer = PrismaPlayer & {
    seasonStats?: string | null
    teamName?: string | null
    cost?: number
}

interface CompareViewProps {
    initialPlayers: ComparePlayer[]
    allPlayers: ComparePlayer[] // 검색용 전체 선수 목록
}

export function CompareView({ initialPlayers, allPlayers }: CompareViewProps) {
    const [selectedPlayers, setSelectedPlayers] = useState<ComparePlayer[]>(initialPlayers)
    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const removePlayer = (id: string) => {
        setSelectedPlayers(selectedPlayers.filter((p) => p.id !== id))
    }

    const addPlayer = (player: ComparePlayer) => {
        if (selectedPlayers.length >= 3) {
            toast.error('선수는 최대 3명까지 비교할 수 있습니다.')
            return
        }
        if (selectedPlayers.find((p) => p.id === player.id)) {
            toast.error('이미 선택된 선수입니다.')
            return
        }
        setSelectedPlayers([...selectedPlayers, player])
        setIsDialogOpen(false)
    }

    const filteredAllPlayers = allPlayers.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) &&
            !selectedPlayers.find((selected) => selected.id === p.id)
    )

    // 차트 데이터 생성 (stats JSON 또는 legacy seasonStats 사용)
    const subjects = ['KDA', 'Win Rate', 'DPM', 'GPM', 'Cost']
    const chartData = subjects.map((subject) => {
        const data: Record<string, unknown> = { subject, fullMark: 100 }
        selectedPlayers.forEach((player) => {
            // stats는 Json? 타입 (Prisma), seasonStats는 레거시 string
            const rawStats = player.seasonStats
                ? JSON.parse(player.seasonStats || '{}')
                : (player.stats as Record<string, number> | null ?? {})
            let value = 0
            if (subject === 'KDA') value = parseFloat(String(rawStats.kda ?? 0)) * 10
            if (subject === 'Win Rate') value = parseFloat(String(rawStats.winRate ?? 0))
            if (subject === 'DPM') value = (Number(rawStats.dpm) || 0) / 10
            if (subject === 'GPM') value = (Number(rawStats.gpm) || 0) / 10
            if (subject === 'Cost') value = (player.cost ?? player.basePrice) * 5
            data[player.name] = value
        })
        return data
    })

    const colors = ['#eab308', '#3b82f6', '#ef4444']

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">선수 비교</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-yellow-500 text-black hover:bg-yellow-400" aria-label="비교할 선수 추가">
                            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> 선수 추가
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle>비교할 선수 추가</DialogTitle>
                        </DialogHeader>
                        <Input
                            placeholder="선수 이름 검색..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="선수 이름 검색"
                        />
                        <div className="max-h-[300px] overflow-y-auto space-y-2 mt-4">
                            {filteredAllPlayers.map((player) => (
                                // ✅ div onClick → button으로 교체 (키보드 접근성 확보)
                                <button
                                    key={player.id}
                                    className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-800 cursor-pointer text-left"
                                    onClick={() => addPlayer(player)}
                                    aria-label={`${player.name} 선수 추가`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={`/images/players/${player.name.toLowerCase()}.png`} />
                                            <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{player.name}</p>
                                            <p className="text-xs text-zinc-400">{player.teamName ?? player.teamId?.slice(0, 3) ?? 'FA'} • {player.position}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-zinc-400 border border-zinc-700 px-2 py-1 rounded">선택</span>
                                </button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* 선택된 선수 카드 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedPlayers.map((player, index) => (
                    <Card key={player.id} className="bg-zinc-900 border-zinc-800 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-zinc-500 hover:text-red-500"
                            onClick={() => removePlayer(player.id)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-16 w-16 border-2" style={{ borderColor: colors[index % colors.length] }}>
                                <AvatarImage src={`/images/players/${player.name.toLowerCase()}.png`} />
                                <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-white" style={{ color: colors[index % colors.length] }}>
                                    {player.name}
                                </CardTitle>
                                <p className="text-zinc-400">{player.teamName ?? player.teamId?.slice(0, 3) ?? 'FA'} • {player.position}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                                    Cost: {player.cost ?? player.basePrice}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 레이더 차트 */}
            {selectedPlayers.length >= 2 && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">능력치 비교</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={chartData}>
                                <PolarGrid stroke="#3f3f46" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} />
                                {selectedPlayers.map((player, index) => (
                                    <Radar
                                        key={player.id}
                                        name={player.name}
                                        dataKey={player.name}
                                        stroke={colors[index % colors.length]}
                                        fill={colors[index % colors.length]}
                                        fillOpacity={0.15}
                                        strokeWidth={2}
                                    />
                                ))}
                                <Tooltip
                                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {selectedPlayers.length < 2 && (
                <div className="text-center py-12 text-zinc-500">
                    <p>비교할 선수를 2명 이상 선택하세요.</p>
                </div>
            )}
        </div>
    )
}
