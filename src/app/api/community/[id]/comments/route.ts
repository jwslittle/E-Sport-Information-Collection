/**
 * GET    /api/community/[id]/comments            — 댓글 목록
 * POST   /api/community/[id]/comments            — 댓글 작성 { content }
 * DELETE /api/community/[id]/comments?cid=<cid>  — 댓글 삭제 (작성자 or 관리자)
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateQuestProgress } from '@/lib/quest-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const postId = (await params).id

    const comments = await prisma.comment.findMany({
        where: { postId, isDeleted: false },
        orderBy: { createdAt: 'asc' },
        // ✅ 댓글 무제한 조회 방지 — 메모리 DoS 차단
        take: 200,
        include: {
            author: {
                select: {
                    id: true, name: true, image: true, role: true,
                    profile: { select: { displayTitle: true } },
                },
            },
        },
    })

    return NextResponse.json(
        comments.map(c => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            author: {
                id: c.author.id,
                name: c.author.name,
                image: c.author.image,
                role: c.author.role,
                displayTitle: c.author.profile?.displayTitle ?? null,
            },
        }))
    )
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id
    const postId = (await params).id

    const body = await req.json().catch(() => ({}))
    const { content } = body

    if (!content?.trim()) return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
    if (content.length > 1000) return NextResponse.json({ error: '댓글은 1000자 이내로 입력해주세요.' }, { status: 400 })

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, isDeleted: true } })
    if (!post || post.isDeleted) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

    const comment = await prisma.comment.create({
        data: { postId, authorId: userId, content: content.trim() },
        include: {
            author: {
                select: {
                    id: true, name: true, image: true, role: true,
                    profile: { select: { displayTitle: true } },
                },
            },
        },
    })

    // 퀘스트 진행
    updateQuestProgress(userId, 'COMMUNITY_COMMENT').catch(() => {})

    return NextResponse.json({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
            id: comment.author.id,
            name: comment.author.name,
            image: comment.author.image,
            role: comment.author.role,
            displayTitle: comment.author.profile?.displayTitle ?? null,
        },
    }, { status: 201 })
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id
    const isAdmin = (session.user as any)?.role === 'ADMIN'
    await params // postId는 URL path에서만 쓰임

    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('cid')
    if (!commentId) return NextResponse.json({ error: '댓글 ID(cid)가 필요합니다.' }, { status: 400 })

    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, isDeleted: true },
    })
    if (!comment || comment.isDeleted) {
        return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }
    if (comment.authorId !== userId && !isAdmin) {
        return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.comment.update({ where: { id: commentId }, data: { isDeleted: true } })
    return NextResponse.json({ success: true })
}
