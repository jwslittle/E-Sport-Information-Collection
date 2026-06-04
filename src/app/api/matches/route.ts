
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const round = searchParams.get('round')
        const type = searchParams.get('type') // REAL or SIMULATION

        const whereClause: any = {}
        if (round) whereClause.round = Number(round)
        if (type) whereClause.leagueType = type

        const matches = await prisma.match.findMany({
            where: whereClause,
            include: {
                team1: true,
                team2: true,
                winner: true
            },
            orderBy: {
                matchDate: 'asc'
            }
        })

        return NextResponse.json({ matches })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
    }
}
