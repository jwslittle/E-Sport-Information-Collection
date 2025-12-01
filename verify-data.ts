import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.player.count()
    console.log(`Total Players: ${count}`)

    const players = await prisma.player.findMany({
        take: 5,
        select: { name: true, team: true, position: true }
    })
    console.log('Sample Players:', players)
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
