import prisma from '@/lib/prisma'
import { CompareView } from './compare-view'

interface PageProps {
    searchParams: {
        p1?: string
        p2?: string
        p3?: string
    }
}

export default async function ComparePage({ searchParams }: PageProps) {
    const ids = [searchParams.p1, searchParams.p2, searchParams.p3].filter(Boolean) as string[]

    const initialPlayers = ids.length > 0
        ? await prisma.player.findMany({
            where: { id: { in: ids } }
        })
        : []

    const allPlayers = await prisma.player.findMany({
        orderBy: { name: 'asc' }
    })

    return <CompareView initialPlayers={initialPlayers} allPlayers={allPlayers} />
}
