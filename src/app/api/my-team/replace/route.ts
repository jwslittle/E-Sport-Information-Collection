/**
 * POST /api/my-team/replace — 판타지 팀 선수 교체 (서비스 준비 중)
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
    return NextResponse.json({ error: '서비스 준비 중입니다.' }, { status: 410 })
}
