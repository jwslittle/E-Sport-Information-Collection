import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        // Fetch all shop items
        const items = await prisma.shopItem.findMany({
            orderBy: { price: 'asc' }
        })

        let userInventory: any[] = []
        let userPoints = 0

        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                include: { inventory: true }
            })
            if (user) {
                userInventory = user.inventory
                userPoints = user.gp
            }
        }

        return NextResponse.json({ items, userInventory, userPoints })
    } catch (error) {
        console.error('Failed to fetch shop items:', error)
        return NextResponse.json({ error: 'Failed to fetch shop items' }, { status: 500 })
    }
}
