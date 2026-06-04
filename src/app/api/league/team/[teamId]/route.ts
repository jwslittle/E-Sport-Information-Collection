
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
    request: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

        // ✅ IDOR 방지 — 본인 팀만 조회 가능
        if (team.user.id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json(team)
    } catch (error) {
        console.error('Failed to fetch team:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
