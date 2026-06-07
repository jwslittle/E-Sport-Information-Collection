/**
 * GET /api/lck/live
 *
 * 현재 진행 중인 LCK 경기 실시간 스코어
 * - LoL Esports getLive API를 직접 호출해 가장 최신 세트 스코어 반환
 * - 인증 불필요 (공개 정보)
 * - 클라이언트가 30초마다 폴링
 * - 배경에서 DB 상태/스코어도 갱신 (SCHEDULED → LIVE)
 */

import { NextResponse } from 'next/server'
import { fetchLiveLckMatches, transformEventToMatch } from '@/lib/services/lolesports.service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const liveEvents = await fetchLiveLckMatches()

        if (liveEvents.length === 0) {
            // 라이브 없음 → 혹시 DB에 LIVE 상태로 남아있는 경기가 있다면
            // 다음 full sync 때 정리됨 (지금은 별도 처리 생략)
            return NextResponse.json({ matches: [], liveCount: 0 })
        }

        // LoL Esports 이벤트 → 내부 포맷
        const transformed = liveEvents.map(e => transformEventToMatch(e))

        // DB에서 내부 ID 조회 (externalId 기준)
        const externalIds = transformed.map(m => m.externalId)
        const dbRows = await prisma.lckRealMatch.findMany({
            where: { externalId: { in: externalIds } },
            select: { id: true, externalId: true },
        })
        const idMap = new Map(dbRows.map(r => [r.externalId, r.id]))

        // 배경 DB 업데이트: status = LIVE + 최신 세트 스코어 반영
        Promise.all(
            transformed.map(m =>
                prisma.lckRealMatch.updateMany({
                    where: { externalId: m.externalId },
                    data: {
                        status: 'LIVE',
                        team1Score: m.team1Score,
                        team2Score: m.team2Score,
                    },
                })
            )
        ).catch(err => console.error('[/api/lck/live] DB update error:', err))

        const matches = transformed.map(m => ({
            id: idMap.get(m.externalId) ?? null,
            externalId: m.externalId,
            team1: m.team1,
            team2: m.team2,
            team1Name: m.team1Name,
            team2Name: m.team2Name,
            team1Logo: m.team1Logo,
            team2Logo: m.team2Logo,
            team1Score: m.team1Score,
            team2Score: m.team2Score,
            bestOf: m.bestOf,
            scheduledAt: m.scheduledAt,
        }))

        return NextResponse.json({ matches, liveCount: matches.length })
    } catch (err) {
        console.error('[/api/lck/live]', err)
        // 실패 시 빈 배열 (graceful degradation — 라이브 섹션 미표시)
        return NextResponse.json({ matches: [], liveCount: 0 })
    }
}
