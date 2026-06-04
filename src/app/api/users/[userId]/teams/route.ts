import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    // 로그인 필수 — 타인 팀 정보 보호
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
