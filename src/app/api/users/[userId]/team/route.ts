import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { userId } = await params

        // ✅ IDOR 방지: 본인 팀만 조회 가능
        if (userId !== (session.user as any).id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

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
