/**
 * GET /api/users/[userId] — 공개 프로필 조회
 * (로그인 불필요, 공개 정보만 반환)
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
    const session = await getServerSession(authOptions)
    const myId = (session?.user as any)?.id
    const { userId } = await params

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            image: true,
            gp: true,
            createdAt: true,
            profile: {
                select: {
                    displayTitle: true,
                    bio: true,
                    favoriteTeam: true,
                },
            },
            cosmeticItems: {
                where: { isEquipped: true },
                include: {
                    item: { select: { type: true, name: true, titleText: true, imageUrl: true } },
                },
            },
            _count: {
                select: {
                    following: true,
                    followedBy: true,
                    // ✅ C-3 수정: 소프트 삭제된 게시글 제외
                    posts: { where: { isDeleted: false } },
                    quizAnswers: true,
                    lckPredictions: true,
                },
            },
        },
    })

    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })

    // 팔로우 여부 (로그인한 경우)
    let isFollowing = false
    if (myId && myId !== userId) {
        const follow = await prisma.follows.findUnique({
            where: { followerId_followingId: { followerId: myId, followingId: userId } },
        })
        isFollowing = !!follow
    }

    // 최근 게시글 3개
    const recentPosts = await prisma.post.findMany({
        where: { authorId: userId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
            id: true, title: true, category: true, createdAt: true,
            // ✅ C-3 수정: 소프트 삭제된 댓글 제외
            _count: { select: { comments: { where: { isDeleted: false } }, likes: true } },
        },
    })

    return NextResponse.json({
        id: user.id,
        name: user.name,
        image: user.image,
        gp: user.id === myId ? user.gp : undefined, // GP는 본인만 볼 수 있음
        createdAt: user.createdAt,
        profile: user.profile,
        equippedCosmetics: user.cosmeticItems.map(ec => ({
            type: ec.item.type,
            name: ec.item.name,
            titleText: ec.item.titleText,
            imageUrl: ec.item.imageUrl,
        })),
        stats: {
            following: user._count.following,
            followers: user._count.followedBy,
            posts: user._count.posts,
            predictions: user._count.lckPredictions,
            quizAnswers: user._count.quizAnswers,
        },
        isFollowing,
        isMe: myId === userId,
        recentPosts: recentPosts.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            createdAt: p.createdAt,
            commentCount: p._count.comments,
            likeCount: p._count.likes,
        })),
    })
    } catch (error) {
        console.error('[GET /api/users/[userId]] Error:', error)
        return NextResponse.json({ error: '프로필을 불러올 수 없습니다.' }, { status: 500 })
    }
}
