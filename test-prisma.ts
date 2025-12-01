import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Connecting...')
    const count = await prisma.user.count()
    console.log(`User count: ${count}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
