/**
 * POST /api/cosmetics/unlock
 * GP를 소모하여 코스메틱 아이템 구매
 *
 * Body: { itemId: string }
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateQuestProgress } from '@/lib/quest-utils'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await req.json()
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

    const [item, user] = await Promise.all([
        prisma.cosmeticItem.findUnique({ where: { id: itemId } }),
        prisma.user.findUnique({ where: { id: session.user.id }, select: { gp: true } }),
    ])

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    if (item.gpCost === 0) return NextResponse.json({ error: '이 아이템은 직접 구매할 수 없습니다.' }, { status: 400 })
    if (!user || user.gp < item.gpCost) {
        return NextResponse.json({ error: 'GP가 부족합니다.' }, { status: 400 })
    }

    // 이미 보유 중?
    const existing = await prisma.userCosmeticItem.findUnique({
        where: { userId_itemId: { userId: session.user.id, itemId } },
    })
    if (existing) return NextResponse.json({ error: '이미 보유한 아이템입니다.' }, { status: 400 })

    // 트랜잭션: GP 차감 + 아이템 지급
    const [updatedUser, newItem] = await prisma.$transaction([
        prisma.user.update({
            where: { id: session.user.id },
            data: { gp: { decrement: item.gpCost } },
        }),
        prisma.userCosmeticItem.create({
            data: {
                userId: session.user.id,
                itemId,
                obtainedBy: 'SHOP',
            },
        }),
    ])

    // 첫 코스메틱 구매 퀘스트 트리거
    updateQuestProgress(session.user.id, 'GET_COSMETIC').catch(() => {})

    return NextResponse.json({ success: true, remainingGp: updatedUser.gp, item })
}
