import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = (session.user as any).id
        console.log('Finalizing for user:', userId)

        // Get Current Round
        const gameState = await (prisma as any).gameState.findFirst()
        const currentRound = gameState ? gameState.currentRound : 0
        console.log('Current Round:', currentRound)

        // Update MyTeam
        const team = await prisma.myTeam.findFirst({ where: { userId } })
        if (!team) {
            console.error('Team not found for user:', userId)
            return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }

        console.log('Updating team:', team.id, 'with round:', currentRound)

        await (prisma as any).myTeam.update({
            where: { id: team.id },
            data: { lastFinalizedRound: currentRound }
        })

        console.log('Team finalized successfully')
        return NextResponse.json({ success: true, currentRound })

    } catch (error) {
        console.error('Finalize Team Error:', error)
        return NextResponse.json({ error: 'Failed to finalize team' }, { status: 500 })
    }
}
