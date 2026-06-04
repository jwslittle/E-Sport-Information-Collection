/**
 * GET    /api/community/[id]  — 게시글 상세 + 조회수 증가
 * DELETE /api/community/[id]  — 게시글 삭제 (작성자 or 관리자)
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true, name: true, image: true,
                    profile: { select: { displayTitle: true } },
                },
            },
            _count: { select: { comments: true, likes: true } },
        },
    })

    if (!post || post.isDeleted) {
        return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 조회수 비동기 증가 (실패해도 무방)
    prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

    // 내가 좋아요 했는지
    let isLiked = false
    if (session?.user?.id) {
        const like = await prisma.postLike.findUnique({
            where: { postId_userId: { postId: id, userId: session.user.id } },
        })
        isLiked = !!like
    }

    return NextResponse.json({
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        viewCount: post.viewCount + 1,
        isPinned: post.isPinned,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
            id: post.author.id,
            name: post.author.name,
            image: post.author.image,
            displayTitle: post.author.profile?.displayTitle ?? null,
        },
        commentCount: post._count.comments,
        likeCount: post._count.likes,
        isLiked,
    })
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const userId = session.user.id
    const isAdmin = (session.user as any)?.role === 'ADMIN'

    const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } })
    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    if (post.authorId !== userId && !isAdmin) {
        return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.post.update({ where: { id }, data: { isDeleted: true } })
    return NextResponse.json({ success: true })
}
