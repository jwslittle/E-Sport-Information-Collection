import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const PROBABILITIES = {
    1: { BRONZE: 80, SILVER: 15, GOLD: 4.5, DIAMOND: 0.5, CHALLENGER: 0 },
    2: { BRONZE: 70, SILVER: 20, GOLD: 8, DIAMOND: 1.8, CHALLENGER: 0.2 },
    3: { BRONZE: 60, SILVER: 25, GOLD: 12, DIAMOND: 2.5, CHALLENGER: 0.5 },
    4: { BRONZE: 50, SILVER: 30, GOLD: 15, DIAMOND: 4, CHALLENGER: 1 },
    5: { BRONZE: 40, SILVER: 30, GOLD: 20, DIAMOND: 7, CHALLENGER: 3 },
}

export async function POST() {
    try {
        // 사용자 조회 (임시)
        let user = await prisma.user.findFirst()
        if (!user) {
            user = await prisma.user.create({ data: { username: 'Demo User' } })
        }

        // 레벨별 확률 가져오기
        const level = Math.min(user.gachaLevel, 5)
        // 타입 단언을 사용하여 인덱싱 오류 방지
        const probs = PROBABILITIES[level as keyof typeof PROBABILITIES]

        // 등급 결정
        const rand = Math.random() * 100
        let grade = 'BRONZE'
        let cumulative = 0

        if (rand < (cumulative += probs.BRONZE)) grade = 'BRONZE'
        else if (rand < (cumulative += probs.SILVER)) grade = 'SILVER'
        else if (rand < (cumulative += probs.GOLD)) grade = 'GOLD'
        else if (rand < (cumulative += probs.DIAMOND)) grade = 'DIAMOND'
        else grade = 'CHALLENGER'

        // 해당 등급의 선수 랜덤 선택
        const players = await prisma.player.findMany()
        const randomPlayer = players[Math.floor(Math.random() * players.length)]

        // 카드 생성
        const card = await prisma.card.create({
            data: {
                playerId: randomPlayer.id,
                season: '2024 Spring',
                grade,
                imageUrl: `/images/players/${randomPlayer.name.toLowerCase()}.png`,
            }
        })

        // 사용자에게 카드 지급
        await prisma.userCard.create({
            data: {
                userId: user.id,
                cardId: card.id,
            }
        })

        // 경험치 및 레벨 업데이트
        const newExp = user.gachaExp + 10
        const nextLevelExp = user.gachaLevel * 100
        let newLevel = user.gachaLevel
        if (newExp >= nextLevelExp && user.gachaLevel < 5) {
            newLevel += 1
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                gachaExp: newExp,
                gachaLevel: newLevel,
            }
        })

        return NextResponse.json({
            card,
            player: randomPlayer,
            user: updatedUser,
        })

    } catch (error) {
        console.error('Gacha Error:', error)
        return NextResponse.json({ error: 'Failed to process gacha' }, { status: 500 })
    }
}
