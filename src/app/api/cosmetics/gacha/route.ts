/**
 * POST /api/cosmetics/gacha — 서비스 종료 (410 Gone)
 * 가챠 시스템이 제거되었습니다. GP 상점에서 직접 구매하세요.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
    return NextResponse.json(
        { error: '가챠 서비스가 종료되었습니다. GP 상점(/shop)에서 직접 아이템을 구매하세요.' },
        { status: 410 }
    )
}
