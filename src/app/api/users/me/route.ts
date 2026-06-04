/**
 * GET /api/users/me
 * 현재 로그인한 유저 기본 정보 + 프로필 + 장착 코스메틱
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/users/me
 * 프로필 업데이트 { favoriteTeam?, bio? }
 */
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { favoriteTeam, bio } = body as { favoriteTeam?: string; bio?: string }

    const VALID_TEAMS = ['T1', 'GEN', 'HLE', 'KT', 'DK', 'NS', 'BFX', 'FOX', 'DRX', 'KDF', 'LSB']

    const profileData: Record<string, string | null> = {}
    if (favoriteTeam !== undefined) {
        if (favoriteTeam && !VALID_TEAMS.includes(favoriteTeam)) {
            return NextResponse.json({ error: '유효하지 않은 팀 코드입니다.' }, { status: 400 })
        }
        profileData.favoriteTeam = favoriteTeam || null
    }
    if (bio !== undefined) {
        profileData.bio = bio.slice(0, 100) || null  // 100자 제한
    }

    if (Object.keys(profileData).length === 0) {
        return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })
    }

    await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, ...profileData },
        update: profileData,
    })

    return NextResponse.json({ success: true })
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
        profile: user.profile,
        equippedCosmetics: user.cosmeticItems.map(ci => ({
            type: ci.item.type,
            name: ci.item.name,
            titleText: ci.item.titleText,
            imageUrl: ci.item.imageUrl,
        })),
    })
}
