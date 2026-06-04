import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const userId = (session.user as any).id
        const predictions = await prisma.matchPrediction.findMany({
            where: { userId }
        })

        return NextResponse.json(predictions)
    } catch (error) {
        console.error('Error fetching predictions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
