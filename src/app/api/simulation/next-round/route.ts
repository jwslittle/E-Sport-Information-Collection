import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { simulateSeries } from '@/lib/simulation/engine'
import { updateQuestProgress } from '@/lib/quest-utils'

export async function POST(req: Request) {
    // ADMIN 전용 — 일반 유저 및 비로그인 즉시 차단
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    try {
        console.log('--- Starting Next Round Simulation ---')

        // 1. Determine Current Round
        const nextMatch = await prisma.match.findFirst({
            where: { status: 'SCHEDULED' },
            orderBy: { matchDate: 'asc' }
        })

        if (!nextMatch) {
            console.log('No scheduled matches found. Season completed.')
            return NextResponse.json({ message: 'Season Completed', finished: true })
        }

        const currentRound = nextMatch.round
        console.log('Current Round:', currentRound)

        // 2. Get All Matches for this Round
        const matchesToPlay = await prisma.match.findMany({
            where: {
                round: currentRound,
                status: 'SCHEDULED'
            },
            include: {
                team1: true,
                team2: true
            }
        })

        console.log('Matches to play:', matchesToPlay.length)

        if (matchesToPlay.length === 0) {
            return NextResponse.json({ message: 'No matches found for this round' })
        }

        // 3. Fetch All Players
        const allPlayers = await prisma.player.findMany()
        console.log('Total Players fetched:', allPlayers.length)

        // Helper to get starters with fuzzy position matching
        const getStarters = (teamId: string) => {
            const players = allPlayers.filter((p: any) => p.teamId === teamId)
            const targetPositions = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

            const starters = targetPositions.map(targetPos => {
                return players.find((p: any) => {
                    let pPos = p.position.toUpperCase()
                    if (pPos === 'JNG') pPos = 'JUNGLE'
                    if (pPos === 'BOT' || pPos === 'BOTTOM') pPos = 'ADC'
                    if (pPos === 'SUP') pPos = 'SUPPORT'
                    return pPos === targetPos
                }) || players[0] // Fallback to first player if specific position missing (should be rare)
            }).filter(Boolean)

            // Deduplicate in case fallback picked same player twice
            return [...new Set(starters)].slice(0, 5)
        }

        const results = []

        // 4. Simulate Each Match
        for (const match of matchesToPlay) {
            const t1Players = getStarters(match.team1Id)
            const t2Players = getStarters(match.team2Id)

            console.log(`Match ${match.id}: ${match.team1.name} (${t1Players.length}) vs ${match.team2.name} (${t2Players.length})`)

            if (t1Players.length < 5 || t2Players.length < 5) {
                console.error(`Not enough players for match ${match.id}`)
                // In production, maybe forfeit? For now, skip to avoid crash, but log error.
                // Or better, just proceed with fewer players (sim engine might handle it or crash)
                // Engine expects array. We'll try. 
                // But generally 5v5 logic. 
                // We'll skip and mark as ERROR in log, but status remains SCHEDULED? 
                // If we leave it SCHEDULED, the round never completes.
                // We should probably FORCE completion or fake sim.
                // We will try running sim anyway. Logic above `slice(0,5)` might produce <5.
                // Sim engine will average 5 players. If 4, avg might be weak.
            }

            const simResult = simulateSeries(match.team1, t1Players, match.team2, t2Players)

            // 5. Save Results
            await prisma.$transaction(async (tx) => {
                // Update Match
                await tx.match.update({
                    where: { id: match.id },
                    data: {
                        status: 'COMPLETED',
                        team1Score: simResult.team1Score,
                        team2Score: simResult.team2Score,
                        winnerId: simResult.winnerId,
                        details: JSON.stringify(simResult.games)
                    }
                })

                // Create Player Performances
                for (const game of simResult.games) {
                    for (const [playerId, stats] of Object.entries(game.stats)) {
                        await tx.playerPerformance.create({
                            data: {
                                matchId: match.id,
                                playerId: playerId,
                                kills: stats.kills,
                                deaths: stats.deaths,
                                assists: stats.assists,
                                cs: stats.cs,
                                visionScore: stats.vision,
                                damage: stats.damage,
                                fantasyPoints: stats.points
                            }
                        })
                    }
                }
            })

            results.push(simResult)
        }

        // 6. Update User Points (Simulation Teams ONLY)
        console.log('Updating User Points for Simulation Drafts...')

        // Fetch all updated performances from this batch
        // Optimization: We can calculate points per player from `results`
        const playerPointsMap: Record<string, number> = {}
        results.forEach(res => {
            res.games.forEach(game => {
                Object.entries(game.stats).forEach(([pid, stats]: any) => {
                    playerPointsMap[pid] = (playerPointsMap[pid] || 0) + stats.points
                })
            })
        })

        // Find all UserTeams (SIMULATION type) that own these players
        const simTeams = await prisma.userTeam.findMany({
            where: { type: 'SIMULATION', isFinalized: true },
            include: { roster: true }
        })

        for (const team of simTeams) {
            let roundPoints = 0
            for (const slot of team.roster) {
                if (playerPointsMap[slot.playerId]) {
                    const rawPoints = playerPointsMap[slot.playerId]
                    // Multiplier Logic
                    let multiplier = 1.0
                    if (slot.position === 'WILDCARD') {
                        multiplier = 0.33
                    } else if (slot.isCaptain) {
                        multiplier = 1.5
                    }
                    roundPoints += rawPoints * multiplier
                }
            }

            if (roundPoints > 0) {
                await prisma.userTeam.update({
                    where: { id: team.id },
                    data: { totalPoints: { increment: roundPoints } }
                })

                // Also update User GP (1/10 ratio of Fantasy Points, rounded up)
                const earnedGP = Math.ceil(roundPoints / 10)
                await prisma.user.update({
                    where: { id: team.userId },
                    data: { gp: { increment: earnedGP } }
                })
            }
        }

        // 7. 예측 자동 정산 ───────────────────────────────────────────
        console.log('Processing predictions...')
        const completedMatchIds = matchesToPlay.map(m => m.id)
        const completedMatches = await prisma.match.findMany({
            where: { id: { in: completedMatchIds } },
            select: { id: true, winnerId: true, team1Id: true, team2Id: true, team1: { select: { code: true } }, team2: { select: { code: true } } }
        })

        // 완료된 경기에 대한 미처리 예측 조회
        const pendingPredictions = await prisma.matchPrediction.findMany({
            where: { matchId: { in: completedMatchIds }, isProcessed: false },
        })

        for (const pred of pendingPredictions) {
            const match = completedMatches.find(m => m.id === pred.matchId)
            if (!match) continue

            // 승리 팀 코드 판별
            const winnerTeamId = match.winnerId
            const winnerCode = match.team1Id === winnerTeamId ? match.team1.code : match.team2.code

            const isCorrect = pred.target === winnerCode || pred.target === winnerTeamId
            const gp = isCorrect ? 50 : 0

            await prisma.$transaction([
                prisma.matchPrediction.update({
                    where: { id: pred.id },
                    data: { isProcessed: true, isCorrect, pointsEarned: gp },
                }),
                ...(isCorrect ? [
                    prisma.user.update({
                        where: { id: pred.userId },
                        data: { gp: { increment: gp } },
                    }),
                ] : []),
            ])

            // 예측 성공 퀘스트 트리거
            if (isCorrect) {
                updateQuestProgress(pred.userId, 'PREDICT_CORRECT').catch(console.error)
            }
        }
        console.log(`Predictions processed: ${pendingPredictions.length} (correct: ${pendingPredictions.filter(p => {
            const m = completedMatches.find(m => m.id === p.matchId)
            if (!m) return false
            const wCode = m.team1Id === m.winnerId ? m.team1.code : m.team2.code
            return p.target === wCode || p.target === m.winnerId
        }).length})`)

        console.log('Simulation Completed. Matches simulated:', results.length)

        return NextResponse.json({
            success: true,
            round: currentRound,
            matchesSimulated: results.length,
            predictionsProcessed: pendingPredictions.length,
        })

    } catch (error: any) {
        console.error('Simulation Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
