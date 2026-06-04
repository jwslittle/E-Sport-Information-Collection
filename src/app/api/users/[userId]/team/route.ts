import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params

        const myTeam = await prisma.userTeam.findFirst({
            where: { userId },
            include: {
                roster: {
                    include: {
                        player: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        image: true
                        // username: true // User model doesn't have username
                    }
                }
            }
        })

        if (!myTeam) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }

        return NextResponse.json(myTeam)
    } catch (error) {
        console.error('Error fetching user team:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
