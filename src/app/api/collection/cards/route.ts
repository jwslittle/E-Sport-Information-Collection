/**
 * GET /api/collection/cards — 카드 컬렉션 시스템 제거됨 (410)
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({ error: '카드 컬렉션 서비스가 종료되었습니다.' }, { status: 410 })
}
