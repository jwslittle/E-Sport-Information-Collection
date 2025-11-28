import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PlayerDetail } from './player-detail'

interface PageProps {
    params: {
        id: string
    }
}

export default async function PlayerPage({ params }: PageProps) {
    const player = await prisma.player.findUnique({
        where: {
            id: params.id,
        },
        include: {
            cards: true,
        },
    })

    if (!player) {
        notFound()
    }

    return <PlayerDetail player={player} />
}
