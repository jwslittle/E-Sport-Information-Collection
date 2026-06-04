import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params

        const realTeam = await prisma.userTeam.findUnique({
            where: {
                userId_type: {
                    userId,
                    type: 'REAL'
                }
            },
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
                        // Sensitive data hidden
                    }
                }
            }
        })

        const simTeam = await prisma.userTeam.findUnique({
            where: {
                userId_type: {
                    userId,
                    type: 'SIMULATION'
                }
            },
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

        return NextResponse.json({
            real: realTeam,
            sim: simTeam,
            userId
        })
    } catch (error) {
        console.error('Error fetching user teams:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
