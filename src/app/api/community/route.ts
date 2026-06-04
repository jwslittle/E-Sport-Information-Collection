/**
 * GET  /api/community  — 게시글 목록 (페이지네이션, 카테고리 필터)
 * POST /api/community  — 게시글 작성 { title, content, category }
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateQuestProgress } from '@/lib/quest-utils'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const skip = (page - 1) * PAGE_SIZE

    const where: any = { isDeleted: false }
    if (category && category !== 'ALL') where.category = category

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where,
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: PAGE_SIZE,
            include: {
                author: {
                    select: {
                        id: true, name: true, image: true,
                        profile: { select: { displayTitle: true } },
                    },
                },
                _count: { select: { comments: true, likes: true } },
            },
        }),
        prisma.post.count({ where }),
    ])

    return NextResponse.json({
        posts: posts.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            viewCount: p.viewCount,
            isPinned: p.isPinned,
            createdAt: p.createdAt,
            author: {
                id: p.author.id,
                name: p.author.name,
                image: p.author.image,
                displayTitle: p.author.profile?.displayTitle ?? null,
            },
            commentCount: p._count.comments,
            likeCount: p._count.likes,
        })),
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
    })
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const { title, content, category = 'FREE' } = body

    if (!title?.trim()) return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })
    if (!content?.trim()) return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
    if (title.length > 100) return NextResponse.json({ error: '제목은 100자 이내로 입력해주세요.' }, { status: 400 })
    if (content.length > 5000) return NextResponse.json({ error: '내용은 5000자 이내로 입력해주세요.' }, { status: 400 })

    const VALID_CATEGORIES = ['FREE', 'ANALYSIS', 'PREDICTION', 'INFO']
    if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: '유효하지 않은 카테고리입니다.' }, { status: 400 })
    }

    const post = await prisma.post.create({
        data: { authorId: userId, title: title.trim(), content: content.trim(), category },
        include: {
            author: { select: { id: true, name: true, image: true } },
        },
    })

    // 퀘스트 진행
    updateQuestProgress(userId, 'COMMUNITY_POST').catch(() => {})

    return NextResponse.json(post, { status: 201 })
}
