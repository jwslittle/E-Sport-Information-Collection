/**
 * POST /api/quiz/generate
 * 관리자 전용 — LckRealMatch, HistoricalPlayerStat, HistoricalTeamStat 데이터를
 * 기반으로 퀴즈 문항을 자동 생성해서 DailyQuiz 테이블에 삽입합니다.
 *
 * 현재 생성 로직:
 *   1. LckRealMatch 결승전  → "누가 우승했나" / "스코어는?" 형식
 *   2. LckRealMatch 팀 시즌 전적  → "시즌 승수" 형식
 *   3. HistoricalPlayerStat (데이터 있을 때) → "KDA 1위 선수" 등
 *
 * 새 데이터가 쌓일수록 생성 범위가 자동 확장됩니다.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { SEASON_OPTIONS } from '@/lib/config/season'

export const dynamic = 'force-dynamic'

interface QuizCandidate {
    question: string
    optionA: string
    optionB: string
    optionC?: string
    optionD?: string
    answer: string
    explanation: string
    category: string
    difficulty: string
    gpReward: number
    sourceKey: string   // 중복 방지용 고유 키
}

// 팀 코드 → 한글/영문 표시명
const TEAM_DISPLAY: Record<string, string> = {
    T1: 'T1', GEN: 'Gen.G', HLE: 'Hanwha Life Esports',
    KT: 'KT Rolster', DK: 'Dplus KIA', NS: 'Nongshim Red Force',
    BFX: 'BNK FEARX', DRX: 'Dragon X', KDF: 'Kwangdong Freecs',
    LSB: 'LIIV SANDBOX', FOX: 'OKSavings Bank BRION',
    BRO: 'HANJIN BRION', KRX: 'KIWOOM DRX',
    DNS: 'DN SOOPers',
}

function teamName(code: string, fullName?: string | null): string {
    return fullName || TEAM_DISPLAY[code] || code
}

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5)
}

/** 4지선다 랜덤 배치 후 정답 위치 반환 */
function makeChoices(correct: string, wrongs: string[]): {
    optionA: string; optionB: string; optionC: string; optionD: string; answer: string
} {
    const choices = shuffle([correct, ...wrongs.slice(0, 3)])
    const idx = choices.indexOf(correct)
    return {
        optionA: choices[0],
        optionB: choices[1],
        optionC: choices[2],
        optionD: choices[3],
        answer: ['A', 'B', 'C', 'D'][idx],
    }
}

export async function POST() {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const candidates: QuizCandidate[] = []

    // ──────────────────────────────────────────────────────────────
    // 1. 결승전 기반 문항
    // ──────────────────────────────────────────────────────────────
    const finals = await prisma.lckRealMatch.findMany({
        where: { displayName: { contains: '결승' } },
    })

    for (const m of finals) {
        if (!m.winner) continue
        const seasonLabel = m.season.replace('20', '20').replace('-SPLIT', ' Split ').replace('-SUMMER', ' Summer').replace('-SPRING', ' Spring ')
        const t1n = teamName(m.team1, m.team1Name)
        const t2n = teamName(m.team2, m.team2Name)
        const winName = m.winner === m.team1 ? t1n : t2n
        const loseName = m.winner === m.team1 ? t2n : t1n
        const wScore = m.winner === m.team1 ? m.team1Score : m.team2Score
        const lScore = m.winner === m.team1 ? m.team2Score : m.team1Score

        // 문항 1: 우승팀
        const wrongTeams = Object.values(TEAM_DISPLAY)
            .filter(t => t !== winName && t !== loseName)
        const c1 = makeChoices(winName, shuffle(wrongTeams).slice(0, 3))
        candidates.push({
            question: `${seasonLabel} 결승전 우승팀은?`,
            ...c1,
            explanation: `${seasonLabel} 결승에서 ${winName}이(가) ${loseName}을(를) ${wScore}-${lScore}로 꺾고 우승했습니다.`,
            category: 'HISTORY',
            difficulty: 'NORMAL',
            gpReward: 20,
            sourceKey: `finals_winner_${m.season}`,
        })

        // 문항 2: 결승 스코어
        const correctScore = `${wScore}-${lScore} (${winName} 우승)`
        const scoreWrongs = [
            `${wScore}-${lScore + 1} (${winName} 우승)`,
            `${wScore - 1}-${lScore} (${winName} 우승)`,
            `${lScore}-${wScore} (${loseName} 우승)`,
        ]
        const c2 = makeChoices(correctScore, scoreWrongs)
        candidates.push({
            question: `${seasonLabel} 결승 스코어는? (${t1n} vs ${t2n})`,
            ...c2,
            explanation: `${seasonLabel} 결승 최종 스코어는 ${m.team1Score}-${m.team2Score}로 ${winName}이(가) 우승했습니다.`,
            category: 'HISTORY',
            difficulty: 'HARD',
            gpReward: 25,
            sourceKey: `finals_score_${m.season}`,
        })

        // 문항 3: 결승 상대팀
        const wrongOpps = Object.values(TEAM_DISPLAY)
            .filter(t => t !== loseName && t !== winName)
        const c3 = makeChoices(loseName, shuffle(wrongOpps).slice(0, 3))
        candidates.push({
            question: `${seasonLabel} 결승에서 ${winName}과(와) 맞붙은 팀은?`,
            ...c3,
            explanation: `${seasonLabel} 결승은 ${winName} vs ${loseName} 대전이었으며, ${winName}이(가) ${wScore}-${lScore}로 우승했습니다.`,
            category: 'HISTORY',
            difficulty: 'NORMAL',
            gpReward: 20,
            sourceKey: `finals_opponent_${m.season}`,
        })
    }

    // ──────────────────────────────────────────────────────────────
    // 2. 시즌 팀 전적 기반 문항 (상위 승수 팀)
    // ✅ Q-1 수정: SEASON_OPTIONS에서 자동으로 가져옴 (시즌 전환 시 season.ts만 수정하면 됨)
    // ──────────────────────────────────────────────────────────────
    const seasons = SEASON_OPTIONS.map(s => s.value)
    for (const season of seasons) {
        const seasonLabel = season.replace('-SPLIT', ' Split ').replace('-SUMMER', ' Summer').replace('-SPRING', ' Spring ')

        // 해당 시즌에 등장한 팀 목록
        const seasonMatches = await prisma.lckRealMatch.findMany({
            where: { season, status: 'COMPLETED' },
            select: { team1: true, team2: true, winner: true, team1Name: true, team2Name: true },
        })

        if (seasonMatches.length === 0) continue

        // 팀별 승수 집계
        const winCounts: Record<string, { wins: number; name: string }> = {}
        for (const m of seasonMatches) {
            const t1 = m.team1; const t2 = m.team2
            if (!winCounts[t1]) winCounts[t1] = { wins: 0, name: teamName(t1, m.team1Name) }
            if (!winCounts[t2]) winCounts[t2] = { wins: 0, name: teamName(t2, m.team2Name) }
            if (m.winner) {
                if (winCounts[m.winner]) winCounts[m.winner].wins++
                else winCounts[m.winner] = { wins: 1, name: teamName(m.winner) }
            }
        }

        const sorted = Object.entries(winCounts).sort((a, b) => b[1].wins - a[1].wins)
        if (sorted.length < 4) continue

        const [topCode, topData] = sorted[0]
        const [, secondData]     = sorted[1] ?? [null, { wins: -1 }]
        const otherNames = sorted.slice(1).map(([, v]) => v.name)

        // 동률일 경우 "1위" 문항 생성 불가 → 승수 문항만 생성
        const hasClearWinner = topData.wins > secondData.wins

        if (hasClearWinner) {
            const c = makeChoices(topData.name, shuffle(otherNames).slice(0, 3))
            candidates.push({
                question: `LCK ${seasonLabel} 정규 시즌에서 가장 많이 승리한 팀은?`,
                ...c,
                explanation: `LCK ${seasonLabel}에서 ${topData.name}이(가) ${topData.wins}승을 기록하며 정규 시즌 1위를 차지했습니다.`,
                category: 'HISTORY',
                difficulty: 'NORMAL',
                gpReward: 20,
                sourceKey: `top_win_${season}`,
            })
        }

        // 문항: 특정 팀의 시즌 승수 (top 1팀, 동률 무관)
        const wrongWins = [
            String(topData.wins + 2) + '승',
            String(Math.max(1, topData.wins - 2)) + '승',
            String(topData.wins + 4) + '승',
        ]
        const cw = makeChoices(String(topData.wins) + '승', wrongWins)
        candidates.push({
            question: `LCK ${seasonLabel} 정규 시즌에서 ${topData.name}의 승수는?`,
            ...cw,
            explanation: `${topData.name}은(는) LCK ${seasonLabel} 정규 시즌에서 ${topData.wins}승을 기록했습니다.`,
            category: 'HISTORY',
            difficulty: 'HARD',
            gpReward: 25,
            sourceKey: `team_wins_${season}_${topCode}`,
        })
    }

    // ──────────────────────────────────────────────────────────────
    // 3. HistoricalPlayerStat 기반 (데이터 있을 때만)
    // ──────────────────────────────────────────────────────────────
    const playerStatCount = await prisma.historicalPlayerStat.count()
    if (playerStatCount > 0) {
        const topKda = await prisma.historicalPlayerStat.findMany({
            orderBy: { averageKDA: 'desc' },
            take: 5,
            distinct: ['playerName'],
        })
        if (topKda.length >= 4) {
            const top = topKda[0]
            const wrongNames = topKda.slice(1).map(p => p.playerName)
            const ct = makeChoices(top.playerName, wrongNames)
            candidates.push({
                question: `LCK ${top.year} ${top.tournament}에서 평균 KDA 1위를 기록한 선수는?`,
                ...ct,
                explanation: `${top.playerName}은(는) ${top.year} ${top.tournament}에서 평균 KDA ${top.averageKDA.toFixed(2)}를 기록하며 1위를 차지했습니다.`,
                category: 'PLAYERS',
                difficulty: 'HARD',
                gpReward: 25,
                sourceKey: `top_kda_${top.year}_${top.tournament}`,
            })
        }
    }

    // ──────────────────────────────────────────────────────────────
    // 기존 문항 sourceKey 중복 제거 (question 텍스트 기준)
    // ──────────────────────────────────────────────────────────────
    const existing = await prisma.dailyQuiz.findMany({
        select: { question: true },
    })
    const existingQuestions = new Set(existing.map(q => q.question))

    const newCandidates = candidates.filter(c => !existingQuestions.has(c.question))

    if (newCandidates.length === 0) {
        return NextResponse.json({ message: '추가할 새 문항이 없습니다.', generated: 0 })
    }

    // orderIndex는 현재 최대값 이후부터
    const maxOrder = await prisma.dailyQuiz.aggregate({ _max: { orderIndex: true } })
    let nextIndex = (maxOrder._max.orderIndex ?? -1) + 1

    const data = newCandidates.map(c => ({
        question: c.question,
        optionA: c.optionA,
        optionB: c.optionB,
        optionC: c.optionC ?? null,
        optionD: c.optionD ?? null,
        answer: c.answer,
        explanation: c.explanation,
        category: c.category,
        difficulty: c.difficulty,
        gpReward: c.gpReward,
        orderIndex: nextIndex++,
        isActive: true,
    }))

    await prisma.dailyQuiz.createMany({ data, skipDuplicates: true })

    return NextResponse.json({
        message: `${data.length}개 문항이 생성되었습니다.`,
        generated: data.length,
        questions: data.map(d => d.question),
    })
}
