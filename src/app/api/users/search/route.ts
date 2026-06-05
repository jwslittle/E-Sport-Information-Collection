/**
 * GET /api/users/search?q=검색어
 * 이름 또는 이메일로 유저 검색 (친구 추가용)
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json([])

    const users = await prisma.user.findMany({
        where: {
            AND: [
                { id: { not: session.user.id } },   // 자기 자신 제외
                {
                    // 이메일 검색 제거 — 이메일 열거 공격(User Enumeration) 방지
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                    ],
                },
            ],
        },
        select: {
            id: true, name: true, image: true,
            profile: { select: { displayTitle: true } },
            followedBy: {
                where: { followerId: session.user.id },
                select: { followerId: true },
            },
        },
        take: 10,
    })

    return NextResponse.json(users.map(u => ({
        id: u.id,
        name: u.name,
        image: u.image,
        title: u.profile?.displayTitle ?? null,
        isFollowing: u.followedBy.length > 0,
    })))
}
