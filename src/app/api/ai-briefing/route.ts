
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

// 1시간 캐시 — 같은 AI 응답을 반복 호출로 인한 OpenAI 비용 방지
let cachedTip: { text: string, timestamp: number } | null = null
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

export const dynamic = 'force-dynamic'

export async function GET() {
    // 인증 필수 — 비인증 OpenAI 비용 폭탄 방지
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // 캐시 확인 (1시간 이내면 재사용)
        if (cachedTip && Date.now() - cachedTip.timestamp < CACHE_DURATION) {
            return NextResponse.json({ tip: cachedTip.text })
        }

        // ✅ 실제 LCK 경기 데이터 사용 (시뮬레이션 Match 모델 아님)
        const upcomingMatches = await prisma.lckRealMatch.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledAt: {
                    gte: new Date()
                }
            },
            orderBy: {
                scheduledAt: 'asc'
            },
            take: 3
        })

        let matchContext: string
        if (upcomingMatches.length > 0) {
            matchContext = "예정된 LCK 경기:\n" + upcomingMatches.map(m => {
                const date = m.scheduledAt
                    ? new Intl.DateTimeFormat('ko-KR', {
                        timeZone: 'Asia/Seoul',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                    }).format(m.scheduledAt)
                    : '일정 미정'
                return `- ${m.team1Name ?? m.team1} vs ${m.team2Name ?? m.team2} (${date}, BO${m.bestOf})`
            }).join('\n')
        } else {
            // 예정 경기 없으면 최근 완료 경기 기반으로 분석
            const recentMatches = await prisma.lckRealMatch.findMany({
                where: { status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                take: 3
            })
            if (recentMatches.length > 0) {
                matchContext = "최근 LCK 경기 결과:\n" + recentMatches.map(m =>
                    `- ${m.team1Name ?? m.team1} ${m.team1Score}:${m.team2Score} ${m.team2Name ?? m.team2} (승자: ${m.winner ?? '미정'})`
                ).join('\n')
            } else {
                matchContext = "현재 예정된 LCK 경기가 없습니다."
            }
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ tip: "AI 분석 서비스를 위해 OPENAI_API_KEY 환경변수 설정이 필요합니다." })
        }

        const chat = new ChatOpenAI({
            modelName: "gpt-4.1-nano",
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY,
        })

        const systemPrompt = `당신은 LCK(리그 오브 레전드 챔피언스 코리아) 전문 분석가입니다.
주어진 경기 일정/결과를 바탕으로 판타지 리그 참가자에게 유용한 팁을 한 문장으로 제공하세요.
특정 선수나 팀의 강점을 언급하고, 전문적이면서 친근한 톤으로 한국어로 작성하세요.
예시: "이번 T1전에서는 제우스의 탑 캐리력이 기대되니, 탑 라이너 슬롯에 주목해보세요."`

        const response = await chat.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(`${matchContext}\n\n판타지 리그 참가자를 위한 한 문장 팁을 제공해주세요.`)
        ])

        const tip = response.content.toString().trim()

        // 캐시 갱신
        cachedTip = { text: tip, timestamp: Date.now() }

        return NextResponse.json({ tip })

    } catch (error) {
        console.error('AI Briefing Error:', error)
        return NextResponse.json({ tip: "LCK 판타지 리그에 오신 것을 환영합니다! 나만의 드림팀을 구성해보세요." })
    }
}
