import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PlayerDetail } from './player-detail'

export default async function PlayerPage({ params }: { params: { id: string } }) {
    const player = await prisma.player.findUnique({
        where: { id: params.id },
        include: { team: true },
    })
    if (!player) notFound()

    // 실제 경기 스탯 히스토리 (LckPlayerGameStat)
    const realGameStats = await prisma.lckPlayerGameStat.findMany({
        where: { playerName: player.name },
        include: {
            game: {
                include: { match: { select: { team1: true, team2: true, displayName: true, scheduledAt: true } } }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
    })

    return <PlayerDetail player={player as any} realGameStats={realGameStats as any} />
}
