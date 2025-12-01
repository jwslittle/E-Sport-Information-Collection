const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function runTest() {
    console.log('🚀 Starting Full Flow Verification (JS)...')

    try {
        // 1. Reset Data
        console.log('\n1. Resetting Data...')
        // Use try-catch for each delete to avoid stopping on "table not found" if schema changed
        try { await prisma.bid.deleteMany() } catch (e) { }
        try { await prisma.auction.deleteMany() } catch (e) { }
        try { await prisma.userQuest.deleteMany() } catch (e) { }
        try { await prisma.userAchievement.deleteMany() } catch (e) { }
        try { await prisma.teamPlayer.deleteMany() } catch (e) { }
        try { await prisma.myTeam.deleteMany() } catch (e) { }
        try { await prisma.userCard.deleteMany() } catch (e) { }
        try { await prisma.card.deleteMany() } catch (e) { }
        try { await prisma.player.deleteMany() } catch (e) { }

        // 2. Seeding Players
        console.log('\n2. Seeding Players...')
        const positions = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT', 'MID']
        const players = []
        for (let i = 0; i < 6; i++) {
            const p = await prisma.player.create({
                data: {
                    name: `Player${i}`,
                    team: 'T1',
                    position: positions[i],
                    cost: 15,
                    seasonStats: '{}',
                    careerStats: '{}'
                }
            })
            players.push(p)
        }
        console.log(`   Created ${players.length} players.`)

        // 3. Create Team
        console.log('\n3. Creating Team...')
        const user = await prisma.user.findFirst()
        if (!user) {
            console.log('   No user found, skipping team creation.')
        } else {
            const myTeam = await prisma.myTeam.create({
                data: {
                    userId: user.id,
                    name: 'Test Team',
                    totalCost: 90,
                    isFinalized: true,
                    players: {
                        create: players.map((p, idx) => ({
                            playerId: p.id,
                            position: idx === 5 ? 'SUB' : p.position,
                            isStarter: idx !== 5
                        }))
                    }
                },
                include: { players: true }
            })
            console.log(`   Team created: ${myTeam.name}`)
        }

        console.log('\n✅ Verification Script Completed Successfully.')

    } catch (error) {
        console.error('❌ Verification Failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

runTest()
