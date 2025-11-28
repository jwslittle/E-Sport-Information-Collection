import prisma from '@/lib/prisma'
import { TeamBuilder } from './team-builder'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MyTeamPage() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        redirect('/auth/signin')
    }

    const allPlayers = await prisma.player.findMany({
        orderBy: { cost: 'desc' }
    })

    const myTeam = await prisma.myTeam.findFirst({
        where: { userId: session.user.id },
        include: {
            players: {
                include: {
                    player: true
                }
            }
        }
    })

    return <TeamBuilder allPlayers={allPlayers} initialTeam={myTeam} />
}
