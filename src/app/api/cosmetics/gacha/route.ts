/**
 * POST /api/cosmetics/gacha
 * GP를 소모하여 코스메틱 가챠를 뽑습니다.
 *
 * Body: { count: 1 | 10 }
 *
 * 비용: 1회 150 GP / 10회 1,350 GP
 * 확률: COMMON(+UNCOMMON) 60% / RARE 30% / EPIC 10%
 * 중복 시 GP 환급:
 *   COMMON/UNCOMMON → 30 GP
 *   RARE            → 75 GP
 *   EPIC            → 150 GP
 *   LEGENDARY       → 200 GP
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateQuestProgress } from '@/lib/quest-utils'

export const dynamic = 'force-dynamic'

// ─── 상수 ────────────────────────────────────────────────────────────────────
const GACHA_COST: Record<number, number> = { 1: 150, 10: 1350 }

// 가챠 등급 티어 확률 (LEGENDARY는 가챠 풀에서 제외)
const TIER_WEIGHTS: [string[], number][] = [
    [['COMMON', 'UNCOMMON'], 0.60],
    [['RARE'],               0.30],
    [['EPIC'],               0.10],
]

// 중복 시 GP 환급
const DUPLICATE_REFUND: Record<string, number> = {
    COMMON:    30,
    UNCOMMON:  30,
    RARE:      75,
    EPIC:      150,
    LEGENDARY: 200,
}

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

/** 가중치 기반 랜덤 티어 선택 */
function rollTier(itemsByRarity: Map<string, string[]>): string[] {
    const rand = Math.random()
    let cumulative = 0
    for (const [rarities, weight] of TIER_WEIGHTS) {
        cumulative += weight
        // 해당 티어에 아이템이 있으면 선택
        const available = rarities.filter(r => (itemsByRarity.get(r)?.length ?? 0) > 0)
        if (available.length > 0 && rand < cumulative) return available
    }
    // 폴백: COMMON/UNCOMMON 반환
    return ['COMMON', 'UNCOMMON']
}

/** 주어진 희귀도 목록에서 랜덤 아이템 ID 선택 */
function pickItem(rarities: string[], itemsByRarity: Map<string, string[]>): string | null {
    const pool: string[] = rarities.flatMap(r => itemsByRarity.get(r) ?? [])
    if (pool.length === 0) return null
    return pool[Math.floor(Math.random() * pool.length)]
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const count: number = body.count === 10 ? 10 : 1

    const cost = GACHA_COST[count]

    // ── 유저 GP 확인 ──────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { gp: true } })
    if (!user || user.gp < cost) {
        return NextResponse.json(
            { error: `GP가 부족합니다. (필요: ${cost.toLocaleString()} GP, 보유: ${user?.gp.toLocaleString() ?? 0} GP)` },
            { status: 400 }
        )
    }

    // ── 가챠 풀 로드 (LEGENDARY 제외) ─────────────────────────────────────
    const allItems = await prisma.cosmeticItem.findMany({
        where: { isActive: true, rarity: { notIn: ['LEGENDARY'] } },
        select: { id: true, rarity: true },
    })

    if (allItems.length === 0) {
        return NextResponse.json({ error: '가챠 풀이 비어있습니다. 관리자에게 문의하세요.' }, { status: 400 })
    }

    // 희귀도별 아이템 ID 맵
    const itemsByRarity = new Map<string, string[]>()
    for (const item of allItems) {
        if (!itemsByRarity.has(item.rarity)) itemsByRarity.set(item.rarity, [])
        itemsByRarity.get(item.rarity)!.push(item.id)
    }

    // ── 이미 보유한 아이템 조회 ────────────────────────────────────────────
    const owned = await prisma.userCosmeticItem.findMany({
        where: { userId },
        select: { itemId: true },
    })
    const ownedSet = new Set(owned.map(o => o.itemId))

    // ── 가챠 뽑기 ─────────────────────────────────────────────────────────
    const draws: { itemId: string; isDuplicate: boolean }[] = []

    for (let i = 0; i < count; i++) {
        const tierRarities = rollTier(itemsByRarity)
        const itemId = pickItem(tierRarities, itemsByRarity)
        if (!itemId) continue
        draws.push({ itemId, isDuplicate: ownedSet.has(itemId) })
    }

    if (draws.length === 0) {
        return NextResponse.json({ error: '가챠 풀에 아이템이 없습니다.' }, { status: 400 })
    }

    // ── 결과 아이템 데이터 조회 ────────────────────────────────────────────
    const itemIds = [...new Set(draws.map(d => d.itemId))]
    const itemData = await prisma.cosmeticItem.findMany({
        where: { id: { in: itemIds } },
    })
    const itemMap = new Map(itemData.map(i => [i.id, i]))

    // ── 신규 아이템 지급 + GP 차감 (인터랙티브 트랜잭션 — Race Condition 방지) ────
    let totalRefund = 0
    const newItems = draws.filter(d => !d.isDuplicate)
    const duplicates = draws.filter(d => d.isDuplicate)

    // 중복 환급액 계산
    for (const d of duplicates) {
        const item = itemMap.get(d.itemId)
        if (item) totalRefund += DUPLICATE_REFUND[item.rarity] ?? 30
    }

    // 음수 방지: 중복 환급이 비용보다 크더라도 최소 0 (GP 증가 버그 차단)
    const netCost = Math.max(0, cost - totalRefund)

    try {
        await prisma.$transaction(async (tx) => {
            // GP 재확인 — 동시 요청이 먼저 소모했을 경우 차단
            const currentUser = await tx.user.findUnique({ where: { id: userId }, select: { gp: true } })
            if (!currentUser || currentUser.gp < cost) {
                throw new Error('GP_INSUFFICIENT')
            }

            // GP 차감 (순비용)
            await tx.user.update({
                where: { id: userId },
                data: { gp: { decrement: netCost } },
            })

            // 신규 아이템 생성
            for (const d of newItems) {
                await tx.userCosmeticItem.upsert({
                    where: { userId_itemId: { userId, itemId: d.itemId } },
                    create: { userId, itemId: d.itemId, obtainedBy: 'GACHA' },
                    update: {},
                })
            }
        })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'GP_INSUFFICIENT') {
            return NextResponse.json(
                { error: 'GP가 부족합니다. 동시 요청으로 인해 잔액이 변경되었을 수 있습니다.' },
                { status: 400 }
            )
        }
        throw err
    }

    // 실제 잔여 GP 조회
    const updatedUser = await prisma.user.findUnique({ where: { id: userId }, select: { gp: true } })

    // 퀘스트 진행 (fire-and-forget)
    updateQuestProgress(userId, 'GACHA', count).catch(() => {})
    // 첫 코스메틱 획득 퀘스트
    if (newItems.length > 0) {
        updateQuestProgress(userId, 'GET_COSMETIC').catch(() => {})
    }

    // ── 응답 구성 ─────────────────────────────────────────────────────────
    const results = draws.map(d => {
        const item = itemMap.get(d.itemId)!
        return {
            item: {
                id: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                description: item.description,
                titleText: item.titleText,
                imageUrl: item.imageUrl,
            },
            isDuplicate: d.isDuplicate,
            gpRefund: d.isDuplicate ? (DUPLICATE_REFUND[item.rarity] ?? 30) : 0,
        }
    })

    return NextResponse.json({
        results,
        totalCost: cost,
        totalRefund,
        netCost,
        remainingGp: updatedUser?.gp ?? 0,
    })
}
