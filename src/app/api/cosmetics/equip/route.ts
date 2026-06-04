/**
 * POST /api/cosmetics/equip
 * 보유한 아이템 장착/해제
 *
 * Body: { itemId: string, equip: boolean }
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId, equip = true } = await req.json()
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

    const userItem = await prisma.userCosmeticItem.findUnique({
        where: { userId_itemId: { userId: session.user.id, itemId } },
        include: { item: true },
    })
    if (!userItem) return NextResponse.json({ error: '보유하지 않은 아이템입니다.' }, { status: 404 })

    const type = userItem.item.type

    // 같은 타입의 기존 장착 해제 (타입당 1개만 장착)
    await prisma.userCosmeticItem.updateMany({
        where: {
            userId: session.user.id,
            isEquipped: true,
            item: { type },
        },
        data: { isEquipped: false },
    })

    if (equip) {
        await prisma.userCosmeticItem.update({
            where: { userId_itemId: { userId: session.user.id, itemId } },
            data: { isEquipped: true },
        })
    }

    // UserProfile 업데이트 (빠른 조회용 denormalize)
    const profileUpdate: any = {}
    if (type === 'TITLE') {
        profileUpdate.displayTitle = equip ? userItem.item.titleText : null
        profileUpdate.equippedTitleId = equip ? itemId : null
    } else if (type === 'AVATAR') {
        profileUpdate.equippedAvatarId = equip ? itemId : null
    } else if (type === 'PROFILE_FRAME') {
        profileUpdate.equippedFrameId = equip ? itemId : null
    } else if (type === 'BACKGROUND') {
        profileUpdate.equippedBackgroundId = equip ? itemId : null
    }

    if (Object.keys(profileUpdate).length > 0) {
        await prisma.userProfile.upsert({
            where: { userId: session.user.id },
            create: { userId: session.user.id, ...profileUpdate },
            update: profileUpdate,
        })
    }

    return NextResponse.json({ success: true, equipped: equip })
}
