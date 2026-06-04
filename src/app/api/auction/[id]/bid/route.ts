/**
 * POST /api/auction/[id]/bid — 레거시 경매 입찰 엔드포인트 (비활성화)
 * 현재 스키마에 Auction 모델이 없습니다.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
    return NextResponse.json({ error: '서비스 준비 중입니다.' }, { status: 410 })
}
