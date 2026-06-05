/**
 * /api/matches — 레거시 엔드포인트 (판타지 시스템 제거됨)
 * LCK 경기 데이터는 /api/lck/matches를 사용하세요.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({ matches: [] })
}
