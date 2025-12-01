import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding Quests and Achievements...')

    // 1. Daily Quests
    const dailyQuests = [
        {
            title: '일일 출석체크',
            description: '매일매일 접속하여 보상을 받으세요!',
            type: 'DAILY',
            actionType: 'LOGIN',
            targetCount: 1,
            rewardPoints: 50,
        },
        {
            title: '시뮬레이션 참여',
            description: '시뮬레이션을 3회 진행하세요.',
            type: 'DAILY',
            actionType: 'SIMULATION_PLAY',
            targetCount: 3,
            rewardPoints: 100,
        },
        {
            title: '카드 수집가',
            description: '상점에서 카드팩을 1회 구매하세요.',
            type: 'DAILY',
            actionType: 'CARD_PACK_OPEN',
            targetCount: 1,
            rewardPoints: 80,
        },
    ]

    for (const q of dailyQuests) {
        await prisma.quest.upsert({
            where: { id: `quest-${q.actionType}-${q.type}` }, // 임시 ID 생성 방식
            update: {},
            create: {
                id: `quest-${q.actionType}-${q.type}`,
                ...q
            },
        })
    }

    // 2. Achievements
    const achievements = [
        {
            title: '첫 걸음',
            description: '첫 번째 시뮬레이션을 완료하세요.',
            actionType: 'SIMULATION_PLAY_TOTAL',
            targetCount: 1,
            rewardPoints: 100,
            icon: '🏁',
        },
        {
            title: '베테랑 감독',
            description: '시뮬레이션을 50회 완료하세요.',
            actionType: 'SIMULATION_PLAY_TOTAL',
            targetCount: 50,
            rewardPoints: 1000,
            icon: '🏆',
        },
        {
            title: '전설의 시작',
            description: '전설(Challenger) 등급 카드를 획득하세요.',
            actionType: 'CARD_COLLECT_CHALLENGER',
            targetCount: 1,
            rewardPoints: 2000,
            icon: '✨',
        },
        {
            title: '부자 되세요',
            description: '10,000 포인트를 모으세요.',
            actionType: 'POINT_COLLECT',
            targetCount: 10000,
            rewardPoints: 500,
            icon: '💰',
        },
    ]

    for (const a of achievements) {
        await prisma.achievement.upsert({
            where: { id: `achieve-${a.actionType}-${a.targetCount}` },
            update: {},
            create: {
                id: `achieve-${a.actionType}-${a.targetCount}`,
                ...a
            },
        })
    }

    console.log('Seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
