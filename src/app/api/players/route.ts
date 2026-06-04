import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const players = await prisma.player.findMany({
            include: {
                team: { select: { code: true, name: true, primaryColor: true } },
            },
            orderBy: [{ position: 'asc' }, { basePrice: 'desc' }],
        })
        return NextResponse.json(players)
    } catch (error) {
        console.error('Failed to fetch players:', error)
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
    }
}
