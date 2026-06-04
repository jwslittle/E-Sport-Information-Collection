/**
 * POST /api/my-team/finalize — 판타지 팀 확정 기능 (서비스 준비 중)
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
    return NextResponse.json({ error: '서비스 준비 중입니다.' }, { status: 410 })
}
