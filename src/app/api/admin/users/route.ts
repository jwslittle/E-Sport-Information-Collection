/**
 * GET  /api/admin/users          — 회원 목록 조회 (검색·정렬·페이지네이션)
 * PATCH /api/admin/users         — 역할 변경 / GP 설정·증감
 * DELETE /api/admin/users?userId — 회원 삭제
 *
 * ⚠️ ADMIN 전용 — 일반 유저 접근 불가
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ─── 인증 헬퍼 ──────────────────────────────────────────────────────────────
async function requireAdmin() {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!user?.id || user.role !== 'ADMIN') return null
    return user as { id: string; role: string }
}

// ─── GET: 회원 목록 ──────────────────────────────────────────────────────────
export async function GET(req: Request) {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q       = searchParams.get('q')?.trim() ?? ''
    const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const sort    = searchParams.get('sort') ?? 'gp_desc'
    const limit   = 20

    // 정렬 매핑
    const orderBy: any =
        sort === 'gp_asc'      ? { gp: 'asc' }
        : sort === 'joined_new' ? { createdAt: 'desc' }
        : sort === 'joined_old' ? { createdAt: 'asc' }
        : { gp: 'desc' } // default: gp_desc

    // 검색 조건 (어드민은 이메일도 검색 가능)
    const where: any = q.length >= 1 ? {
        OR: [
            { name:  { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
        ],
    } : {}

    const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id:              true,
                name:            true,
                email:           true,
                image:           true,
                role:            true,
                gp:              true,
                isOnboarded:     true,
                termsAgreedAt:   true,
                privacyAgreedAt: true,
                createdAt:       true,
                updatedAt:       true,
                profile: {
                    select: { displayTitle: true, favoriteTeam: true },
                },
                _count: {
                    select: {
                        lckPredictions: true,
                        posts:          { where: { isDeleted: false } },
                        quizAnswers:    true,
                    },
                },
            },
        }),
    ])

    return NextResponse.json({
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    })
}

// ─── PATCH: 역할 변경 / GP 조정 ──────────────────────────────────────────────
export async function PATCH(req: Request) {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

    const { userId, action, value } = body as {
        userId: string
        action: 'setRole' | 'setGp' | 'addGp'
        value: string | number
    }

    if (!userId || !action) {
        return NextResponse.json({ error: 'userId, action 필드가 필요합니다.' }, { status: 400 })
    }

    // 대상 유저 존재 확인
    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, gp: true, name: true },
    })
    if (!target) return NextResponse.json({ error: '존재하지 않는 유저입니다.' }, { status: 404 })

    // ── setRole ─────────────────────────────────────────────────────────────
    if (action === 'setRole') {
        const newRole = String(value)
        if (!['USER', 'ADMIN'].includes(newRole)) {
            return NextResponse.json({ error: '유효하지 않은 역할입니다.' }, { status: 400 })
        }
        // 본인 강등 금지
        if (userId === admin.id && newRole !== 'ADMIN') {
            return NextResponse.json({ error: '자기 자신의 ADMIN 권한을 제거할 수 없습니다.' }, { status: 403 })
        }
        const updated = await prisma.user.update({
            where: { id: userId },
            data:  { role: newRole },
            select: { id: true, role: true, name: true },
        })
        return NextResponse.json({ ok: true, user: updated })
    }

    // ── setGp ───────────────────────────────────────────────────────────────
    if (action === 'setGp') {
        const gp = parseInt(String(value), 10)
        if (isNaN(gp) || gp < 0 || gp > 9_999_999) {
            return NextResponse.json({ error: 'GP는 0 ~ 9,999,999 범위여야 합니다.' }, { status: 400 })
        }
        const updated = await prisma.user.update({
            where: { id: userId },
            data:  { gp },
            select: { id: true, gp: true, name: true },
        })
        return NextResponse.json({ ok: true, user: updated })
    }

    // ── addGp ───────────────────────────────────────────────────────────────
    if (action === 'addGp') {
        const delta = parseInt(String(value), 10)
        if (isNaN(delta) || Math.abs(delta) > 1_000_000) {
            return NextResponse.json({ error: '증감액은 ±1,000,000 범위여야 합니다.' }, { status: 400 })
        }
        const newGp = Math.max(0, target.gp + delta)
        const updated = await prisma.user.update({
            where: { id: userId },
            data:  { gp: newGp },
            select: { id: true, gp: true, name: true },
        })
        return NextResponse.json({ ok: true, user: updated })
    }

    return NextResponse.json({ error: '알 수 없는 action입니다.' }, { status: 400 })
}

// ─── DELETE: 회원 삭제 ───────────────────────────────────────────────────────
export async function DELETE(req: Request) {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 })

    // 본인 삭제 금지
    if (userId === admin.id) {
        return NextResponse.json({ error: '자기 자신의 계정을 삭제할 수 없습니다.' }, { status: 403 })
    }

    // 존재 확인
    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
    })
    if (!target) return NextResponse.json({ error: '존재하지 않는 유저입니다.' }, { status: 404 })

    // SystemLog는 FK 없음 → 먼저 삭제
    await prisma.systemLog.deleteMany({ where: { userId } })

    // 나머지는 Cascade 처리
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ ok: true, deleted: { id: userId, name: target.name } })
}
