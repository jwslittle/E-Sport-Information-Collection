import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { teamId, starterId, benchId } = await req.json()

        // Verify ownership
        const team = await prisma.myTeam.findUnique({
            where: { id: teamId },
            include: { user: true }
        })

        if (!team || team.user.email !== session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Transaction to swap isStarter status
        await prisma.$transaction([
            prisma.teamPlayer.update({
                where: { id: starterId },
                data: { isStarter: false }
            }),
            prisma.teamPlayer.update({
                where: { id: benchId },
                data: { isStarter: true }
            })
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to swap roster:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
