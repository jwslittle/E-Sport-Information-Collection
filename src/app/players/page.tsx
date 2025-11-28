import prisma from '@/lib/prisma'
import { PlayerList } from './player-list'

export const dynamic = 'force-dynamic'

export default async function PlayersPage() {
    const players = await prisma.player.findMany({
        include: {
            cards: true,
        },
        orderBy: {
            cost: 'desc',
        },
    })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">선수 목록</h1>
                <p className="text-zinc-400">
                    LCK 선수들의 상세 정보와 스탯을 확인하세요.
                </p>
            </div>
            <PlayerList initialPlayers={players} />
        </div>
    )
}
