/**
 * GET /api/ranking
 * type=global  — 전체 GP 기준 랭킹
 * type=friends — 팔로잉 유저 랭킹
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'global'
    const session = await getServerSession(authOptions)

    if (type === 'friends') {
        if (!session?.user?.id) return NextResponse.json([])

        const following = await prisma.follows.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
        })
        const ids = [session.user.id, ...following.map(f => f.followingId)]

        const users = await prisma.user.findMany({
            where: { id: { in: ids } },
            select: {
                id: true, name: true, image: true, gp: true, role: true,
                profile: { select: { displayTitle: true } },
            },
            orderBy: { gp: 'desc' },
        })

        // ✅ 동점 처리: 같은 GP면 같은 랭크 부여
        let rank = 0
        let prevGp: number | null = null
        return NextResponse.json(users.map((u, i) => {
            if (u.gp !== prevGp) { rank = i + 1; prevGp = u.gp }
            return {
                rank,
                userId: u.id,
                userName: u.name,
                image: u.image,
                gp: u.gp,
                role: u.role,
                title: u.profile?.displayTitle ?? null,
                isMe: u.id === session.user.id,
            }
        }))
    }

    // 기본: GP 기준 글로벌 랭킹
    const users = await prisma.user.findMany({
        select: {
            id: true, name: true, image: true, gp: true, role: true,
            profile: { select: { displayTitle: true } },
        },
        orderBy: { gp: 'desc' },
        take: 100,
    })

    // ✅ 동점 처리: 같은 GP면 같은 랭크 부여
    let rank = 0
    let prevGp: number | null = null
    return NextResponse.json(users.map((u, i) => {
        if (u.gp !== prevGp) { rank = i + 1; prevGp = u.gp }
        return {
            rank,
            userId: u.id,
            userName: u.name,
            image: u.image,
            gp: u.gp,
            role: u.role,
            title: u.profile?.displayTitle ?? null,
            isMe: u.id === session?.user?.id,
        }
    }))
}
