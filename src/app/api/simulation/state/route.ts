import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Get or Create GameState
        let gameState = await (prisma as any).gameState.findFirst()
        if (!gameState) {
            gameState = await (prisma as any).gameState.create({
                data: {
                    currentRound: 0,
                    isRoundActive: false
                }
            })
        }

        // Fetch logs for current round (or all logs if needed, but let's limit to recent)
        const logs = await (prisma as any).matchLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return NextResponse.json({
            success: true,
            gameState,
            logs: logs.map(l => ({
                ...l,
                details: JSON.parse(l.details)
            }))
        })
    } catch (error) {
        console.error('Failed to fetch simulation state:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
