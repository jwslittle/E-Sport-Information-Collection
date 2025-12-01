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

        const body = await request.json()
        const { name, players, totalCost, isFinalized } = body

        // Check Game State for Locking
        const gameState = await (prisma as any).gameState.findFirst()
        const currentRound = gameState ? gameState.currentRound : 0

        if (gameState && gameState.isRoundActive) {
            return NextResponse.json({ error: 'Roster is locked: Match is in progress' }, { status: 400 })
        }

        const existingTeam = await prisma.myTeam.findFirst({
            where: { userId: (session.user as any).id }
        })

        if (existingTeam && (existingTeam as any).lastFinalizedRound === currentRound) {
            return NextResponse.json({ error: 'Roster is finalized for this round' }, { status: 400 })
        }

        let team;

        if (existingTeam) {
            // Update
            await prisma.teamPlayer.deleteMany({
                where: { teamId: existingTeam.id }
            })

            team = await prisma.myTeam.update({
                where: { id: existingTeam.id },
                data: {
                    name,
                    totalCost,
                    isFinalized: isFinalized || false,
                    players: {
                        create: players.map((p: any) => ({
                            playerId: p.playerId,
                            position: p.position,
                            isStarter: p.isStarter ?? true
                        }))
                    }
                }
            })
        } else {
            // Create
            team = await prisma.myTeam.create({
                data: {
                    userId: (session.user as any).id,
                    name,
                    totalCost,
                    isFinalized: isFinalized || false,
                    players: {
                        create: players.map((p: any) => ({
                            playerId: p.playerId,
                            position: p.position,
                            isStarter: p.isStarter ?? true
                        }))
                    }
                }
            })
        }

        return NextResponse.json(team)
    } catch (error) {
        console.error('Save Team Error:', error)
        return NextResponse.json({ error: 'Failed to save team' }, { status: 500 })
    }
}
