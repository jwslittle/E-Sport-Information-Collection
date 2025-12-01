import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Find the first user (likely the one I'm logged in as, or I can specify email)
    const user = await prisma.user.findFirst()

    if (!user) {
        console.log('No user found')
        return
    }

    console.log(`Resetting team for user: ${user.email}`)

    const deleted = await prisma.myTeam.deleteMany({
        where: { userId: user.id }
    })

    console.log(`Deleted ${deleted.count} teams.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
