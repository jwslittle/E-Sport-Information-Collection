/**
 * POST /api/community/[id]/like — 좋아요 토글
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id
    const postId = (await params).id

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

    const existing = await prisma.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
    })

    if (existing) {
        await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } })
        const likeCount = await prisma.postLike.count({ where: { postId } })
        return NextResponse.json({ liked: false, likeCount })
    } else {
        await prisma.postLike.create({ data: { postId, userId } })
        const likeCount = await prisma.postLike.count({ where: { postId } })
        return NextResponse.json({ liked: true, likeCount })
    }
}
