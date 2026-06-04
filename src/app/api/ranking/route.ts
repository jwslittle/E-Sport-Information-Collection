/**
 * GET /api/ranking
 * type=global  — 전체 GP 기준 랭킹
 * type=friends — 팔로잉 유저 랭킹
 * type=points  — 판타지 포인트 기준 랭킹
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
                id: true, name: true, image: true, gp: true,
                profile: { select: { displayTitle: true } },
                userTeams: { select: { name: true, totalPoints: true } },
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
                title: u.profile?.displayTitle ?? null,
                teamName: u.userTeams[0]?.name ?? '-',
                fantasyPoints: u.userTeams.reduce((s, t) => s + t.totalPoints, 0),
                isMe: u.id === session.user.id,
            }
        }))
    }

    if (type === 'points') {
        // 판타지 포인트 기준 (UserTeam.totalPoints 합계)
        const teams = await prisma.userTeam.groupBy({
            by: ['userId'],
            _sum: { totalPoints: true },
            orderBy: { _sum: { totalPoints: 'desc' } },
            take: 100,
        })

        const userIds = teams.map(t => t.userId)
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, image: true, profile: { select: { displayTitle: true } } },
        })
        const userMap = new Map(users.map(u => [u.id, u]))

        // ✅ 동점 처리
        let rank = 0
        let prevPts: number | null = null
        return NextResponse.json(teams.map((t, i) => {
            const pts = t._sum.totalPoints ?? 0
            if (pts !== prevPts) { rank = i + 1; prevPts = pts }
            return {
                rank,
                userId: t.userId,
                userName: userMap.get(t.userId)?.name ?? '-',
                image: userMap.get(t.userId)?.image ?? null,
                title: userMap.get(t.userId)?.profile?.displayTitle ?? null,
                fantasyPoints: pts,
                isMe: t.userId === session?.user?.id,
            }
        }))
    }

    // 기본: GP 기준 글로벌 랭킹
    const users = await prisma.user.findMany({
        select: {
            id: true, name: true, image: true, gp: true,
            profile: { select: { displayTitle: true } },
            userTeams: { select: { name: true, totalPoints: true } },
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
            title: u.profile?.displayTitle ?? null,
            teamName: u.userTeams[0]?.name ?? '-',
            fantasyPoints: u.userTeams.reduce((s, t) => s + t.totalPoints, 0),
            isMe: u.id === session?.user?.id,
        }
    }))
}
