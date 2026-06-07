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
    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const { itemId } = body
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

    const item = await prisma.cosmeticItem.findUnique({ where: { id: itemId } })
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    if (!item.isActive) return NextResponse.json({ error: '구매할 수 없는 아이템입니다.' }, { status: 400 })
    if (item.gpCost === 0) return NextResponse.json({ error: '이 아이템은 직접 구매할 수 없습니다.' }, { status: 400 })

    // ── AI_TICKET: 소모성 질의권 — 중복 구매 허용, aiQueryTickets 카운터 증가 ────
    if (item.type === 'AI_TICKET') {
        let updated: { gp: number; aiQueryTickets: number }
        try {
            updated = await prisma.$transaction(async (tx) => {
                const freshUser = await tx.user.findUnique({
                    where: { id: userId },
                    select: { gp: true },
                })
                if (!freshUser || freshUser.gp < item.gpCost) throw new Error('GP_INSUFFICIENT')
                return tx.user.update({
                    where: { id: userId },
                    data: { gp: { decrement: item.gpCost }, aiQueryTickets: { increment: 1 } },
                    select: { gp: true, aiQueryTickets: true },
                })
            })
        } catch (err: unknown) {
            if (err instanceof Error && err.message === 'GP_INSUFFICIENT') {
                return NextResponse.json({ error: 'GP가 부족합니다.' }, { status: 400 })
            }
            console.error('cosmetics/unlock (AI_TICKET) error:', err)
            return NextResponse.json({ error: '구매 중 오류가 발생했습니다.' }, { status: 500 })
        }
        return NextResponse.json({
            success: true,
            remainingGp: updated.gp,
            aiQueryTickets: updated.aiQueryTickets,
            item,
        })
    }

    // ── 일반 코스메틱: GP 차감 + UserCosmeticItem 생성 (race condition 방지) ────
    let updatedUser: { gp: number }
    try {
        updatedUser = await prisma.$transaction(async (tx) => {
            const freshUser = await tx.user.findUnique({
                where: { id: userId },
                select: { gp: true },
            })
            if (!freshUser || freshUser.gp < item.gpCost) throw new Error('GP_INSUFFICIENT')

            const alreadyOwned = await tx.userCosmeticItem.findUnique({
                where: { userId_itemId: { userId, itemId } },
            })
            if (alreadyOwned) throw new Error('ALREADY_OWNED')

            const updated = await tx.user.update({
                where: { id: userId },
                data: { gp: { decrement: item.gpCost } },
            })
            await tx.userCosmeticItem.create({
                data: { userId, itemId, obtainedBy: 'SHOP' },
            })
            return updated
        })
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (err.message === 'GP_INSUFFICIENT') {
                return NextResponse.json({ error: 'GP가 부족합니다.' }, { status: 400 })
            }
            if (err.message === 'ALREADY_OWNED') {
                return NextResponse.json({ error: '이미 보유한 아이템입니다.' }, { status: 400 })
            }
        }
        console.error('cosmetics/unlock error:', err)
        return NextResponse.json({ error: '구매 중 오류가 발생했습니다.' }, { status: 500 })
    }

    updateQuestProgress(userId, 'GET_COSMETIC').catch(() => {})
    return NextResponse.json({ success: true, remainingGp: updatedUser.gp, item })
}
