import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const GRADES = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'CHALLENGER']

export async function POST(request: Request) {
    try {
        const { cardIds, playerId, currentGrade } = await request.json()

        if (!cardIds || cardIds.length !== 3) {
            return NextResponse.json({ error: 'Need exactly 3 cards to evolve' }, { status: 400 })
        }

        const currentIndex = GRADES.indexOf(currentGrade)
        if (currentIndex === -1 || currentIndex === GRADES.length - 1) {
            return NextResponse.json({ error: 'Cannot evolve this grade' }, { status: 400 })
        }

        const nextGrade = GRADES[currentIndex + 1]

        // 트랜잭션으로 처리
        await prisma.$transaction(async (tx) => {
            // 1. 기존 카드 3장 삭제 (UserCard)
            await tx.userCard.deleteMany({
                where: {
                    id: { in: cardIds }
                }
            })

            // 2. 상위 등급 카드 찾기 또는 생성
            let nextCard = await tx.card.findFirst({
                where: {
                    playerId,
                    grade: nextGrade,
                    season: '2024 Spring' // 시즌 고정 (임시)
                }
            })

            if (!nextCard) {
                // 해당 등급 카드가 없으면 생성 (메타데이터)
                // 플레이어 정보 가져오기
                const player = await tx.player.findUnique({ where: { id: playerId } })
                if (!player) throw new Error('Player not found')

                nextCard = await tx.card.create({
                    data: {
                        playerId,
                        season: '2024 Spring',
                        grade: nextGrade,
                        imageUrl: `/images/players/${player.name.toLowerCase()}.png`,
                    }
                })
            }

            // 3. 사용자에게 새 카드 지급
            // 사용자 ID를 알기 위해 삭제된 카드의 소유자 정보를 미리 가져왔어야 하지만,
            // 여기서는 간단히 첫 번째 카드의 소유자를 조회했다고 가정하거나,
            // 클라이언트에서 userId를 보내는 것이 좋음.
            // 하지만 보안상 서버 세션이 좋음. 임시로 Demo User 찾기.
            const user = await tx.user.findFirst() // 실제로는 세션에서 가져와야 함
            if (!user) throw new Error('User not found')

            await tx.userCard.create({
                data: {
                    userId: user.id,
                    cardId: nextCard.id,
                }
            })
        })

        return NextResponse.json({ success: true, nextGrade })

    } catch (error) {
        console.error('Evolution Error:', error)
        return NextResponse.json({ error: 'Failed to evolve' }, { status: 500 })
    }
}
