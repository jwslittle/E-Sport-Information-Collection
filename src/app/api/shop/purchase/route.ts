/**
 * POST /api/shop/purchase — 레거시 구매 엔드포인트 (비활성화)
 * 현재 스키마에 item.category, userInventory.quantity 필드가 없으므로 410 반환
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
    return NextResponse.json({ error: '서비스 준비 중입니다.' }, { status: 410 })
}
