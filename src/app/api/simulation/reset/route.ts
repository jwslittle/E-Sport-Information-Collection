import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    // ADMIN 전용 — 일반 유저 및 비로그인 즉시 차단
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    try {
        console.log('--- Resetting Simulation Season ---')

        await prisma.$transaction(async (tx) => {
            // 1. Reset Matches
            await tx.match.updateMany({
                data: {
                    status: 'SCHEDULED',
                    team1Score: 0,
                    team2Score: 0,
                    winnerId: null,
                    // details: null 은 Prisma JsonNull 필요 — 초기화 생략
                }
            })

            // 2. Delete Player Performances
            // Note: deleteMany without where deletes ALL records.
            // Since we are resetting the whole season, this is correct.
            await tx.playerPerformance.deleteMany({})

            // 3. Reset User Team Points
            await tx.userTeam.updateMany({
                data: {
                    totalPoints: 0
                }
            })
        })

        console.log('Season Reset Completed')

        return NextResponse.json({ success: true, message: 'Season reset successfully' })

    } catch (error: any) {
        console.error('Reset Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
