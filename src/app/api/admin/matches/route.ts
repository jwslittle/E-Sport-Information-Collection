/**
 * GET    /api/admin/matches         — 수동 등록 경기 목록
 * POST   /api/admin/matches         — 수동 경기 생성
 * PATCH  /api/admin/matches         — 수동 경기 수정
 * DELETE /api/admin/matches?id=...  — 수동 경기 삭제
 *
 * MANUAL_ prefix가 붙은 externalId를 가진 경기만 수정/삭제 가능
 * ⚠️ ADMIN 전용
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!user?.id || user.role !== 'ADMIN') return null
    return user as { id: string; role: string }
}

// ─── GET: 수동 등록 경기 목록 ───────────────────────────────────────────────
export async function GET(req: Request) {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const season = searchParams.get('season') ?? undefined
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit  = 50
    const offset = (page - 1) * limit

    const where: Record<string, any> = { externalId: { startsWith: 'MANUAL_' } }
    if (season) where.season = season

    const [matches, total] = await Promise.all([
        prisma.lckRealMatch.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            take: limit,
            skip: offset,
        }),
        prisma.lckRealMatch.count({ where }),
    ])

    return NextResponse.json({ matches, total, page })
}

// ─── POST: 수동 경기 생성 ──────────────────────────────────────────────────
export async function POST(req: Request) {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { team1, team2, team1Name, team2Name, team1Logo, team2Logo, scheduledAt, bestOf, season, tournament } = body

    if (!team1 || !team2 || !season || !tournament) {
        return NextResponse.json({ error: '필수 필드 누락: team1, team2, season, tournament' }, { status: 400 })
    }
    const t1 = String(team1).toUpperCase().trim()
    const t2 = String(team2).toUpperCase().trim()
    if (!/^[A-Z0-9]{1,15}$/.test(t1) || !/^[A-Z0-9]{1,15}$/.test(t2)) {
        return NextResponse.json({ error: 'team 코드는 영문 대문자+숫자 1~15자' }, { status: 400 })
    }

    const externalId = `MANUAL_${crypto.randomUUID()}`

    const match = await prisma.lckRealMatch.create({
        data: {
            externalId,
            tournament: String(tournament).trim(),
            displayName: String(tournament).trim(),
            season: String(season).trim(),
            team1: t1,
            team2: t2,
            team1Name: team1Name ? String(team1Name).trim() : null,
            team2Name: team2Name ? String(team2Name).trim() : null,
            team1Logo: team1Logo ? String(team1Logo).trim() : null,
            team2Logo: team2Logo ? String(team2Logo).trim() : null,
            team1Score: 0,
            team2Score: 0,
            winner: null,
            bestOf: [1, 3, 5].includes(Number(bestOf)) ? Number(bestOf) : 3,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: 'SCHEDULED',
            syncedAt: new Date(),
        },
    })

    return NextResponse.json({ match }, { status: 201 })
}

// ─── PATCH: 수동 경기 수정 ─────────────────────────────────────────────────
export async function PATCH(req: Request) {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, team1, team2, team1Name, team2Name, team1Logo, team2Logo,
            scheduledAt, bestOf, season, tournament, status, winner,
            team1Score, team2Score } = body

    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

    const existing = await prisma.lckRealMatch.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: '경기를 찾을 수 없습니다.' }, { status: 404 })
    if (!existing.externalId.startsWith('MANUAL_')) {
        return NextResponse.json({ error: '자동 동기화된 경기는 수정할 수 없습니다.' }, { status: 403 })
    }

    const data: Record<string, any> = { syncedAt: new Date() }
    if (team1      !== undefined) data.team1      = String(team1).toUpperCase().trim()
    if (team2      !== undefined) data.team2      = String(team2).toUpperCase().trim()
    if (team1Name  !== undefined) data.team1Name  = team1Name  ? String(team1Name).trim()  : null
    if (team2Name  !== undefined) data.team2Name  = team2Name  ? String(team2Name).trim()  : null
    if (team1Logo  !== undefined) data.team1Logo  = team1Logo  ? String(team1Logo).trim()  : null
    if (team2Logo  !== undefined) data.team2Logo  = team2Logo  ? String(team2Logo).trim()  : null
    if (tournament !== undefined) data.tournament = String(tournament).trim()
    if (season     !== undefined) data.season     = String(season).trim()
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (bestOf     !== undefined) data.bestOf     = [1, 3, 5].includes(Number(bestOf)) ? Number(bestOf) : 3
    if (status     !== undefined) data.status     = status
    if (winner     !== undefined) data.winner     = winner ?? null
    if (team1Score !== undefined) data.team1Score = Number(team1Score)
    if (team2Score !== undefined) data.team2Score = Number(team2Score)

    const match = await prisma.lckRealMatch.update({ where: { id }, data })

    return NextResponse.json({ match })
}

// ─── DELETE: 수동 경기 삭제 ────────────────────────────────────────────────
export async function DELETE(req: Request) {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

    const existing = await prisma.lckRealMatch.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: '경기를 찾을 수 없습니다.' }, { status: 404 })
    if (!existing.externalId.startsWith('MANUAL_')) {
        return NextResponse.json({ error: '자동 동기화된 경기는 삭제할 수 없습니다.' }, { status: 403 })
    }

    await prisma.lckRealMatch.delete({ where: { id } })

    return NextResponse.json({ ok: true })
}
