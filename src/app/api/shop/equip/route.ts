/**
 * POST /api/shop/equip — 레거시 장착 엔드포인트 (비활성화)
 * 코스메틱 장착은 /api/cosmetics/equip 을 사용하세요.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
    return NextResponse.json({ error: '서비스 준비 중입니다. /api/cosmetics/equip 을 사용하세요.' }, { status: 410 })
}
