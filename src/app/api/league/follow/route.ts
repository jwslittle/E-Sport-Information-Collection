/**
 * /api/league/follow — 팔로우 토글 + 팔로잉 목록
 *
 * 팔로우 핵심 로직은 /api/friends 에서 관리합니다.
 * 이 엔드포인트는 /league 페이지 UI에 맞는 응답 형태만 다르게 제공합니다.
 *   POST { targetUserId } → { isFollowing: boolean }  (토글)
 *   GET  → { followingIds: string[] }
 */
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id: string }).id

    const follows = await prisma.follows.findMany({
        where: { followerId: userId },
        select: { followingId: true },
    })
    return NextResponse.json({ followingIds: follows.map(f => f.followingId) })
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id: string }).id

    const { targetUserId } = await request.json()
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId 필요' }, { status: 400 })
    if (userId === targetUserId) return NextResponse.json({ error: '자기 자신을 팔로우할 수 없습니다.' }, { status: 400 })

    const existing = await prisma.follows.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
    })

    if (existing) {
        await prisma.follows.delete({
            where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
        })
        return NextResponse.json({ isFollowing: false })
    } else {
        await prisma.follows.create({ data: { followerId: userId, followingId: targetUserId } })
        return NextResponse.json({ isFollowing: true })
    }
}
