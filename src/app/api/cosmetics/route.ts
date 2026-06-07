/**
 * GET /api/cosmetics
 * 상점에 진열된 코스메틱 아이템 목록 + 내 보유 여부
 *
 * Query:
 *   type - TITLE | AVATAR | STICKER | PLAYER_CARD | PROFILE_FRAME | BACKGROUND (optional)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? undefined

    const where: any = { isActive: true }
    if (type) where.type = type

    const [items, owned] = await Promise.all([
        prisma.cosmeticItem.findMany({ where, orderBy: [{ rarity: 'desc' }, { gpCost: 'asc' }], take: 200 }),
        session?.user?.id
            ? prisma.userCosmeticItem.findMany({
                where: { userId: session.user.id },
                select: { itemId: true, isEquipped: true, obtainedBy: true },
            })
            : Promise.resolve([]),
    ])

    const ownedMap = new Map(owned.map(o => [o.itemId, o]))

    return NextResponse.json(
        items.map(item => ({
            ...item,
            owned: ownedMap.has(item.id),
            equipped: ownedMap.get(item.id)?.isEquipped ?? false,
            obtainedBy: ownedMap.get(item.id)?.obtainedBy ?? null,
        }))
    )
}
