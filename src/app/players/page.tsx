import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { PlayerList } from './player-list'

export const metadata: Metadata = {
    title: '선수 목록 | E-Sport Information Collection',
    description: 'LCK 판타지 리그 선수 50명의 스탯과 포지션을 확인하고 나만의 드림팀을 구성하세요.',
}

export const dynamic = 'force-dynamic'

export default async function PlayersPage() {
    const players = await prisma.player.findMany({
        include: {
            team: true,
        },
        orderBy: {
            basePrice: 'desc',
        },
    })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">판타지 선수 목록</h1>
                <p className="text-zinc-400">
                    가상 판타지 리그의 선수 50명 — 예산에 맞게 팀을 구성하세요.
                </p>
            </div>
            <PlayerList initialPlayers={players} />
        </div>
    )
}
