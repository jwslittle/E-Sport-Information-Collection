/**
 * GET /api/stats/tournaments?year=YYYY
 * 해당 연도의 대회 목록을 반환합니다.
 * 2026+: DB에서 실시간 조회 (JSON 파일 없을 때 자동 폴백)
 */
import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import prisma from '@/lib/prisma'

const HISTORY_DIR = path.join(process.cwd(), 'src/data/history')

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')

    if (!year) {
        return NextResponse.json({ error: 'Year is required' }, { status: 400 })
    }

    // ✅ 수정: 문자열 비교 대신 정수 변환 후 비교 (문자열 "999" >= "2026" 오작동 방지)
    const yearNum = parseInt(year, 10)
    if (isNaN(yearNum) || yearNum < 2014 || yearNum > 2026) {
        return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }

    try {
        const filePath = path.join(HISTORY_DIR, `stats_${year}.json`)

        // JSON 파일 있으면 기존 방식
        if (fs.existsSync(filePath)) {
            const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
            return NextResponse.json(json.meta.tournaments)
        }

        // 2026+ JSON 없음 → DB에서 실시간 조회 (season별 표준명 반환)
        if (yearNum >= 2026) {
            // season 코드 → 읽기 쉬운 이름
            const SEASON_LABELS: Record<string, string> = {
                'SPLIT1': 'Spring', 'SPLIT2': 'Summer', 'SPLIT3': 'Fall',
                'PLAYOFFS': 'Playoffs', 'KICKOFF': 'Kickoff',
                'CUP': 'Cup', 'WORLDS': 'Worlds',
            }
            const seasons = await prisma.lckRealMatch.findMany({
                where: { season: { startsWith: String(yearNum) } },
                select: { season: true },
                distinct: ['season'],
                orderBy: { scheduledAt: 'asc' },
            })
            const names = seasons.map(s => {
                const [y, ...rest] = s.season.split('-')
                const code = rest.join('-').toUpperCase()
                return `LCK ${y} ${SEASON_LABELS[code] ?? code}`
            }).filter((v, i, a) => a.indexOf(v) === i)

            return NextResponse.json(names)
        }

        // 해당 연도 데이터 없음
        return NextResponse.json([])
    } catch (error) {
        console.error('Error fetching tournaments:', error)
        return NextResponse.json([], { status: 500 })
    }
}
