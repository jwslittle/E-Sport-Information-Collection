/**
 * GET /api/shop — 레거시 엔드포인트
 * 상점 페이지는 /api/cosmetics를 직접 사용합니다.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({ items: [], userInventory: [], userPoints: 0 })
}
