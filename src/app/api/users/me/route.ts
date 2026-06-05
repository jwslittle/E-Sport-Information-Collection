/**
 * GET    /api/users/me  — 내 프로필 조회
 * PATCH  /api/users/me  — 프로필 업데이트 { nickname?, image?, favoriteTeam?, bio? }
 * DELETE /api/users/me  — 계정 영구 탈퇴 (PIPA 제36조 준수)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { LCK_TEAMS } from '@/lib/config/teams'

export const dynamic = 'force-dynamic'

// 닉네임 허용 문자: 한글·영문·숫자·언더스코어 (2~15자)
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,15}$/

/**
 * PATCH /api/users/me
 * 프로필 업데이트 { nickname?, favoriteTeam?, bio? }
 */
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const { nickname, image, favoriteTeam, bio } = body as {
        nickname?: string
        image?: string
        favoriteTeam?: string
        bio?: string
    }

    // ── 프로필 사진 변경 처리 ──────────────────────────────────────────────
    let updatedImage: string | undefined
    if (image !== undefined) {
        // Cloudinary URL만 허용 (외부 URL 주입 방지)
        if (image && !image.startsWith('https://res.cloudinary.com/')) {
            return NextResponse.json({ error: '유효하지 않은 이미지 URL입니다.' }, { status: 400 })
        }
        await prisma.user.update({
            where: { id: userId },
            data: { image: image || null },
        })
        updatedImage = image || undefined
    }

    // ── 닉네임 변경 처리 ─────────────────────────────────────────────────
    let updatedName: string | undefined
    if (nickname !== undefined) {
        const trimmed = nickname.trim()
        if (!trimmed) {
            return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 })
        }
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
        await prisma.user.update({
            where: { id: userId },
            data: { name: trimmed },
        })
        updatedName = trimmed
    }

    // ── 프로필(팀·바이오) 변경 처리 ─────────────────────────────────────
    const profileData: Record<string, string | null> = {}
    if (favoriteTeam !== undefined) {
        if (favoriteTeam && !(LCK_TEAMS as readonly string[]).includes(favoriteTeam)) {
            return NextResponse.json({ error: '유효하지 않은 팀 코드입니다.' }, { status: 400 })
        }
        profileData.favoriteTeam = favoriteTeam || null
    }
    if (bio !== undefined) {
        profileData.bio = bio.slice(0, 100) || null  // 100자 제한
    }

    if (Object.keys(profileData).length > 0) {
        await prisma.userProfile.upsert({
            where: { userId },
            create: { userId, ...profileData },
            update: profileData,
        })
    }

    if (nickname === undefined && image === undefined && Object.keys(profileData).length === 0) {
        return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })
    }

    return NextResponse.json({
        success: true,
        ...(updatedName  ? { nickname: updatedName }  : {}),
        ...(updatedImage ? { image: updatedImage }     : {}),
    })
}

/**
 * DELETE /api/users/me — 계정 영구 탈퇴
 * onDelete: Cascade 설정으로 User 삭제 시 모든 관련 데이터 함께 삭제됨
 * (Account, Session, LckPrediction, Quest, Cosmetics, Community 등)
 */
export async function DELETE() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    try {
        await prisma.user.delete({ where: { id: userId } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Account deletion error:', error)
        return NextResponse.json({ error: '계정 삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            gp: true,
            role: true,
            aiQueryTickets: true,
            profile: true,
            cosmeticItems: {
                where: { isEquipped: true },
                include: { item: true },
            },
        },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        gp: user.gp,
        role: user.role,
        aiQueryTickets: user.aiQueryTickets,
        profile: user.profile,
        equippedCosmetics: user.cosmeticItems.map(ci => ({
            type: ci.item.type,
            name: ci.item.name,
            titleText: ci.item.titleText,
            imageUrl: ci.item.imageUrl,
        })),
    })
}
