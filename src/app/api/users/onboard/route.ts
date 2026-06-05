/**
 * POST /api/users/onboard — 최초 로그인 시 닉네임 설정
 * 닉네임을 User.name에 저장하고 isOnboarded = true로 설정
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 허용 문자: 한글, 영문, 숫자, 언더스코어 (2~15자)
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,15}$/

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const { nickname } = body as { nickname?: string }

    if (!nickname?.trim()) {
        return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 })
    }

    const trimmed = nickname.trim()

    if (!NICKNAME_REGEX.test(trimmed)) {
        return NextResponse.json(
            { error: '닉네임은 한글·영문·숫자·언더스코어만 사용 가능하며, 2~15자여야 합니다.' },
            { status: 400 }
        )
    }

    // 중복 닉네임 체크 (본인 제외)
    const existing = await prisma.user.findFirst({
        where: { name: trimmed, id: { not: userId } },
        select: { id: true },
    })
    if (existing) {
        return NextResponse.json(
            { error: '이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.' },
            { status: 409 }
        )
    }

    // 닉네임 저장 + 온보딩 완료 처리
    await prisma.user.update({
        where: { id: userId },
        data: { name: trimmed, isOnboarded: true },
    })

    return NextResponse.json({ success: true, nickname: trimmed })
}
