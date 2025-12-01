import prisma from '@/lib/prisma'
import { TeamBuilder } from './team-builder'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { RosterManager } from "./roster-manager"

export const dynamic = 'force-dynamic'

export default async function MyTeamPage() {
    const session = await getServerSession(authOptions)

    const allPlayers = await prisma.player.findMany({
        orderBy: { cost: 'desc' }
    })

    let initialTeam = null
    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                myTeam: {
                    include: {
                        players: {
                            include: {
                                player: true
                            }
                        },
                        roundScores: {
                            orderBy: { round: 'desc' }
                        }
                    }
                }
            }
        })

        if (user?.myTeam) {
            initialTeam = {
                name: user.myTeam.name,
                players: user.myTeam.players,
                isFinalized: user.myTeam.isFinalized
            }
        }

        // If team is finalized, show Roster Manager
        if (user?.myTeam?.isFinalized) {
            return (
                <div className="container mx-auto py-8">
                    <RosterManager
                        teamId={user.myTeam.id}
                        players={user.myTeam.players}
                        totalPoints={user.myTeam.totalPoints}
                        roundScores={(user.myTeam as any).roundScores || []}
                    />
                </div>
            )
        }
    }

    return (
        <div className="container mx-auto py-8">
            <TeamBuilder allPlayers={allPlayers} initialTeam={initialTeam} />
        </div>
    )
}
