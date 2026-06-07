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

    let itemId: string | undefined, equip = true
    try { ({ itemId, equip = true } = await req.json()) } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

    const userItem = await prisma.userCosmeticItem.findUnique({
        where: { userId_itemId: { userId: session.user.id, itemId } },
        include: { item: true },
    })
    if (!userItem) return NextResponse.json({ error: '보유하지 않은 아이템입니다.' }, { status: 404 })

    const type = userItem.item.type

    // UserProfile 필드 결정
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

    // ✅ 원자성: 3단계 쓰기를 트랜잭션으로 묶어 중간 실패 시 DB 불일치 방지
    await prisma.$transaction(async (tx) => {
        // 1. 같은 타입의 기존 장착 해제
        // ✅ Prisma v5: updateMany의 where에 관계 필터 미지원 → itemId IN [...] 방식 사용
        const typeItemIds = (await tx.cosmeticItem.findMany({
            where: { type },
            select: { id: true },
        })).map(i => i.id)
        await tx.userCosmeticItem.updateMany({
            where: { userId: session.user.id, isEquipped: true, itemId: { in: typeItemIds } },
            data: { isEquipped: false },
        })
        // 2. 새 아이템 장착 (equip=false면 전체 해제만)
        if (equip) {
            await tx.userCosmeticItem.update({
                where: { userId_itemId: { userId: session.user.id, itemId } },
                data: { isEquipped: true },
            })
        }
        // 3. UserProfile 비정규화 필드 업데이트
        if (Object.keys(profileUpdate).length > 0) {
            await tx.userProfile.upsert({
                where: { userId: session.user.id },
                create: { userId: session.user.id, ...profileUpdate },
                update: profileUpdate,
            })
        }
    })

    return NextResponse.json({ success: true, equipped: equip })
}
