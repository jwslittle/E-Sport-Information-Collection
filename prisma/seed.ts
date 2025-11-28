import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 기존 데이터 삭제 (초기화)
    await prisma.teamPlayer.deleteMany()
    await prisma.myTeam.deleteMany()
    await prisma.userCard.deleteMany()
    await prisma.card.deleteMany()
    await prisma.player.deleteMany()
    await prisma.user.deleteMany()

    console.log('Deleted existing data.')

    // 선수 데이터 (2024 LCK 기준 주요 선수)
    const players = [
        // T1
        { name: 'Zeus', realName: 'Choi Woo-je', team: 'T1', position: 'TOP', cost: 15 },
        { name: 'Oner', realName: 'Moon Hyeon-joon', team: 'T1', position: 'JUNGLE', cost: 14 },
        { name: 'Faker', realName: 'Lee Sang-hyeok', team: 'T1', position: 'MID', cost: 20 },
        { name: 'Gumayusi', realName: 'Lee Min-hyeong', team: 'T1', position: 'ADC', cost: 16 },
        { name: 'Keria', realName: 'Ryu Min-seok', team: 'T1', position: 'SUPPORT', cost: 18 },
        // Gen.G
        { name: 'Kiin', realName: 'Kim Gi-in', team: 'Gen.G', position: 'TOP', cost: 18 },
        { name: 'Canyon', realName: 'Kim Geon-bu', team: 'Gen.G', position: 'JUNGLE', cost: 19 },
        { name: 'Chovy', realName: 'Jeong Ji-hoon', team: 'Gen.G', position: 'MID', cost: 20 },
        { name: 'Peyz', realName: 'Kim Su-hwan', team: 'Gen.G', position: 'ADC', cost: 17 },
        { name: 'Lehends', realName: 'Son Si-woo', team: 'Gen.G', position: 'SUPPORT', cost: 15 },
        // HLE
        { name: 'Doran', realName: 'Choi Hyeon-joon', team: 'HLE', position: 'TOP', cost: 14 },
        { name: 'Peanut', realName: 'Han Wang-ho', team: 'HLE', position: 'JUNGLE', cost: 16 },
        { name: 'Zeka', realName: 'Kim Geon-woo', team: 'HLE', position: 'MID', cost: 17 },
        { name: 'Viper', realName: 'Park Do-hyeon', team: 'HLE', position: 'ADC', cost: 19 },
        { name: 'Delight', realName: 'Yoo Hwan-joong', team: 'HLE', position: 'SUPPORT', cost: 15 },
        // DK
        { name: 'Kingen', realName: 'Hwang Seong-hoon', team: 'DK', position: 'TOP', cost: 13 },
        { name: 'Lucid', realName: 'Choi Yong-hyeok', team: 'DK', position: 'JUNGLE', cost: 12 },
        { name: 'ShowMaker', realName: 'Heo Su', team: 'DK', position: 'MID', cost: 18 },
        { name: 'Aiming', realName: 'Kim Ha-ram', team: 'DK', position: 'ADC', cost: 16 },
        { name: 'Kellin', realName: 'Kim Hyeong-gyu', team: 'DK', position: 'SUPPORT', cost: 13 },
        // KT
        { name: 'PerfecT', realName: 'Lee Seung-min', team: 'KT', position: 'TOP', cost: 11 },
        { name: 'Pyosik', realName: 'Hong Chang-hyeon', team: 'KT', position: 'JUNGLE', cost: 14 },
        { name: 'Bdd', realName: 'Gwak Bo-seong', team: 'KT', position: 'MID', cost: 16 },
        { name: 'Deft', realName: 'Kim Hyuk-kyu', team: 'KT', position: 'ADC', cost: 17 },
        { name: 'BeryL', realName: 'Cho Geon-hee', team: 'KT', position: 'SUPPORT', cost: 16 },
    ]

    for (const p of players) {
        const player = await prisma.player.create({
            data: {
                name: p.name,
                realName: p.realName,
                team: p.team,
                position: p.position,
                cost: p.cost,
                seasonStats: JSON.stringify({
                    kda: (Math.random() * 5 + 2).toFixed(2),
                    dpm: Math.floor(Math.random() * 500 + 300),
                    gpm: Math.floor(Math.random() * 300 + 300),
                    winRate: (Math.random() * 40 + 40).toFixed(1),
                }),
                careerStats: JSON.stringify({
                    totalGames: Math.floor(Math.random() * 500 + 100),
                    totalWins: Math.floor(Math.random() * 300 + 50),
                }),
            },
        })

        // 각 선수별 기본 카드 생성 (시즌 2024 Spring)
        await prisma.card.create({
            data: {
                playerId: player.id,
                season: '2024 Spring',
                grade: 'BRONZE',
                imageUrl: `/images/players/${p.name.toLowerCase()}.png`, // 플레이스홀더
            }
        })
    }

    console.log(`Seeded ${players.length} players and cards.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
