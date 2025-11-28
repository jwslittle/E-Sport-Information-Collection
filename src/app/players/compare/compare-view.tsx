'use client'

import { useState } from 'react'
import { Player } from '@prisma/client'
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

interface CompareViewProps {
    initialPlayers: Player[]
    allPlayers: Player[] // 검색용 전체 선수 목록 (최적화 필요 시 API 호출로 변경)
}

export function CompareView({ initialPlayers, allPlayers }: CompareViewProps) {
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>(initialPlayers)
    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const removePlayer = (id: string) => {
        setSelectedPlayers(selectedPlayers.filter((p) => p.id !== id))
    }

    const addPlayer = (player: Player) => {
        if (selectedPlayers.length >= 3) {
            alert('You can compare up to 3 players.')
            return
        }
        if (selectedPlayers.find((p) => p.id === player.id)) {
            alert('Player already selected.')
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

    // 차트 데이터 생성
    const subjects = ['KDA', 'Win Rate', 'DPM', 'GPM', 'Cost']
    const chartData = subjects.map((subject) => {
        const data: any = { subject, fullMark: 100 }
        selectedPlayers.forEach((player) => {
            const stats = JSON.parse(player.seasonStats)
            let value = 0
            if (subject === 'KDA') value = parseFloat(stats.kda || '0') * 10
            if (subject === 'Win Rate') value = parseFloat(stats.winRate || '0')
            if (subject === 'DPM') value = (stats.dpm || 0) / 10
            if (subject === 'GPM') value = (stats.gpm || 0) / 10
            if (subject === 'Cost') value = player.cost * 5

            data[player.name] = value
        })
        return data
    })

    const colors = ['#eab308', '#3b82f6', '#ef4444'] // Yellow, Blue, Red

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Player Comparison</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                            <Plus className="mr-2 h-4 w-4" /> Add Player
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Add Player to Compare</DialogTitle>
                        </DialogHeader>
                        <Input
                            placeholder="Search players..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="max-h-[300px] overflow-y-auto space-y-2 mt-4">
                            {filteredAllPlayers.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center justify-between p-2 rounded hover:bg-zinc-800 cursor-pointer"
                                    onClick={() => addPlayer(player)}
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
                                    <Button size="sm" variant="ghost">Select</Button>
                                </div>
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
                                <p className="text-zinc-400">{player.team} • {player.position}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                                    Cost: {player.cost}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 비교 차트 */}
            {selectedPlayers.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Stats Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#3f3f46" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                {selectedPlayers.map((player, index) => (
                                    <Radar
                                        key={player.id}
                                        name={player.name}
                                        dataKey={player.name}
                                        stroke={colors[index % colors.length]}
                                        strokeWidth={3}
                                        fill={colors[index % colors.length]}
                                        fillOpacity={0.1}
                                    />
                                ))}
                                <Legend />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
