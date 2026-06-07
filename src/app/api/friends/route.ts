/**
 * GET  /api/friends  — 팔로잉/팔로워 목록
 * POST /api/friends  — 팔로우 { targetUserId }
 * DELETE /api/friends — 팔로우 취소 { targetUserId }
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateQuestProgress } from '@/lib/quest-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const [following, followers] = await Promise.all([
        // 내가 팔로우하는 유저
        prisma.follows.findMany({
            where: { followerId: userId },
            take: 200,
            include: {
                following: {
                    select: {
                        id: true, name: true, image: true,
                        profile: { select: { displayTitle: true } },
                    },
                },
            },
        }),
        // 나를 팔로우하는 유저
        prisma.follows.findMany({
            where: { followingId: userId },
            take: 200,
            include: {
                follower: {
                    select: {
                        id: true, name: true, image: true,
                        profile: { select: { displayTitle: true } },
                    },
                },
            },
        }),
    ])

    return NextResponse.json({
        following: following.map(f => ({ ...f.following })),
        followers: followers.map(f => ({ ...f.follower })),
    })
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    let targetUserId: string | undefined
    try { ({ targetUserId } = await req.json()) } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId 필요' }, { status: 400 })
    if (userId === targetUserId) return NextResponse.json({ error: '자기 자신을 팔로우할 수 없습니다.' }, { status: 400 })

    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } })
    if (!target) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })

    try {
        await prisma.follows.create({ data: { followerId: userId, followingId: targetUserId } })
        // 팔로우 퀘스트 트리거
        updateQuestProgress(userId, 'FOLLOW_USER').catch(() => {})
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: '이미 팔로우 중입니다.' }, { status: 400 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    let targetUserId: string | undefined
    try { ({ targetUserId } = await req.json()) } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId 필요' }, { status: 400 })

    try {
        await prisma.follows.delete({
            where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
        })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: '팔로우 상태가 아닙니다.' }, { status: 400 })
    }
}
