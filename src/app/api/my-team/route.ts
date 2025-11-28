import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, players, totalCost, isFinalized } = body

        // 기존 팀 확인
        const existingTeam = await prisma.myTeam.findFirst({
            where: { userId: session.user.id }
        })

        // 타입 단언을 사용하여 빌드 에러 방지
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (existingTeam && (existingTeam as any).isFinalized) {
            return NextResponse.json({ error: 'Team is already finalized' }, { status: 400 })
        }

        let team;

        if (existingTeam) {
            // 업데이트
            // 기존 선수 연결 삭제 후 다시 생성 (단순화)
            await prisma.teamPlayer.deleteMany({
                where: { teamId: existingTeam.id }
            })

            team = await prisma.myTeam.update({
                where: { id: existingTeam.id },
                data: {
                    name,
                    totalCost,
                    isFinalized: isFinalized || false,
                    players: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        create: players.map((p: any) => ({
                            playerId: p.playerId,
                            position: p.position
                        }))
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any // 타입 단언 추가
            })
        } else {
            // 생성
            team = await prisma.myTeam.create({
                data: {
                    userId: session.user.id,
                    name,
                    totalCost,
                    isFinalized: isFinalized || false,
                    players: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        create: players.map((p: any) => ({
                            playerId: p.playerId,
                            position: p.position
                        }))
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any // 타입 단언 추가
            })
        }

        return NextResponse.json(team)
    } catch (error) {
        console.error('Save Team Error:', error)
        return NextResponse.json({ error: 'Failed to save team' }, { status: 500 })
    }
}
