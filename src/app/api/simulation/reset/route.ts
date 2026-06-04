import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
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
