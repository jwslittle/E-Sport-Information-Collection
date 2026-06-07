import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PlayerDetail } from './player-detail'

// ✅ Next.js 16: params는 Promise — await로 언래핑 필요
type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const player = await prisma.player.findUnique({
        where: { id },
        include: { team: true },
    })
    if (!player) return { title: '선수 없음 | E-Sport Information Collection' }
    return {
        title: `${player.name} | 선수 정보 | E-Sport Information Collection`,
        description: `${player.team?.name ?? ''} ${player.position} ${player.name} 선수의 LCK 경기 스탯과 판타지 리그 정보를 확인하세요.`,
    }
}

export default async function PlayerPage({ params }: Props) {
    const { id } = await params
    const player = await prisma.player.findUnique({
        where: { id },
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
