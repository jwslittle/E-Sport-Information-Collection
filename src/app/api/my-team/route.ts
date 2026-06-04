/**
 * /api/my-team — 판타지 팀 기능 (서비스 준비 중)
 * 가상 선수 팀 빌딩 기능은 추후 오픈 예정입니다.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({ error: '서비스 준비 중입니다.' }, { status: 410 })
}

export async function POST() {
    return NextResponse.json({ error: '서비스 준비 중입니다.' }, { status: 410 })
}
