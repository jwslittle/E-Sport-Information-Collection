
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params
        const teamId = params.teamId

        const team = await prisma.userTeam.findUnique({
            where: { id: teamId },
            include: {
                roster: {
                    include: {
                        player: {
                            include: {
                                team: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true
                    }
                }
            }
        })

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }

        return NextResponse.json(team)
    } catch (error) {
        console.error('Failed to fetch team:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
