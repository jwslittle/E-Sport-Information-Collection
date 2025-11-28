'use client'

import { useState } from 'react'
import { Player, Card as PlayerCard } from '@prisma/client'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Filter } from 'lucide-react'
import Link from 'next/link'

interface PlayerWithCards extends Player {
    cards: PlayerCard[]
}

interface PlayerListProps {
    initialPlayers: PlayerWithCards[]
}

export function PlayerList({ initialPlayers }: PlayerListProps) {
    const [search, setSearch] = useState('')
    const [position, setPosition] = useState('ALL')

    const filteredPlayers = initialPlayers.filter((player) => {
        const matchesSearch =
            player.name.toLowerCase().includes(search.toLowerCase()) ||
            (player.realName && player.realName.toLowerCase().includes(search.toLowerCase())) ||
            player.team.toLowerCase().includes(search.toLowerCase())

        const matchesPosition = position === 'ALL' || player.position === position

        return matchesSearch && matchesPosition
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="선수, 팀 검색..."
                        className="pl-9 bg-zinc-900 border-zinc-800 text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-[200px]">
                    <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-zinc-500" />
                                <SelectValue placeholder="포지션" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="ALL">모든 포지션</SelectItem>
                            <SelectItem value="TOP">Top</SelectItem>
                            <SelectItem value="JUNGLE">Jungle</SelectItem>
                            <SelectItem value="MID">Mid</SelectItem>
                            <SelectItem value="ADC">ADC</SelectItem>
                            <SelectItem value="SUPPORT">Support</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPlayers.map((player) => (
                    <Link key={player.id} href={`/players/${player.id}`}>
                        <Card className="h-full bg-zinc-900 border-zinc-800 hover:border-yellow-500/50 transition-colors cursor-pointer group">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar className="h-12 w-12 border-2 border-zinc-700 group-hover:border-yellow-500 transition-colors">
                                    <AvatarImage src={`/images/players/${player.name.toLowerCase()}.png`} alt={player.name} />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-400">{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <CardTitle className="text-lg text-white group-hover:text-yellow-400 transition-colors">
                                        {player.name}
                                    </CardTitle>
                                    <span className="text-xs text-zinc-500">{player.realName}</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                                        {player.team}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                                        {player.position}
                                    </Badge>
                                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-0">
                                        {player.cost} Cost
                                    </Badge>
                                </div>
                                {/* 간단한 스탯 미리보기 (추후 구현) */}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {filteredPlayers.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                    조건에 맞는 선수가 없습니다.
                </div>
            )}
        </div>
    )
}
