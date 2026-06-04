/**
 * GET  /api/admin/community — 커뮤니티 현황 통계 + 최근 게시글 목록 (어드민 전용)
 * DELETE /api/admin/community?postId=xxx — 게시글 강제 삭제
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [totalPosts, totalComments, postsToday, commentsToday, recentPosts] = await Promise.all([
        prisma.post.count({ where: { isDeleted: false } }),
        prisma.comment.count({ where: { isDeleted: false } }),
        prisma.post.count({ where: { isDeleted: false, createdAt: { gte: todayStart } } }),
        prisma.comment.count({ where: { isDeleted: false, createdAt: { gte: todayStart } } }),
        prisma.post.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                author: { select: { id: true, name: true, image: true } },
                _count: { select: { likes: true, comments: { where: { isDeleted: false } } } },
            },
        }),
    ])

    return NextResponse.json({
        stats: { totalPosts, totalComments, postsToday, commentsToday },
        recentPosts: recentPosts.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            viewCount: p.viewCount,
            likeCount: p._count.likes,
            commentCount: p._count.comments,
            createdAt: p.createdAt,
            author: p.author,
        })),
    })
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('postId')
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    await prisma.post.update({
        where: { id: postId },
        data: { isDeleted: true },
    })

    return NextResponse.json({ ok: true })
}
