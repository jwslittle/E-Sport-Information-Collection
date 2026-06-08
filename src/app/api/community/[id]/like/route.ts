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

    const post = await prisma.post.findUnique({ where: { id: postId, isDeleted: false }, select: { id: true } })
    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

    const existing = await prisma.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
    })

    if (existing) {
        await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } })
        const likeCount = await prisma.postLike.count({ where: { postId } })
        return NextResponse.json({ liked: false, likeCount })
    } else {
        // ✅ M-6 수정: race condition 대비 unique 제약 위반(P2002)을 정상 처리
        try {
            await prisma.postLike.create({ data: { postId, userId } })
        } catch (e: any) {
            // 동시 요청으로 이미 좋아요가 생성된 경우 — 정상으로 처리
            if (e?.code !== 'P2002') throw e
        }
        const likeCount = await prisma.postLike.count({ where: { postId } })
        return NextResponse.json({ liked: true, likeCount })
    }
}
