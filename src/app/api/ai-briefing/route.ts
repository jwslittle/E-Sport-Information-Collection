
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

// Simple in-memory cache to avoid hitting OpenAI on every request
let cachedTip: { text: string, timestamp: number } | null = null
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Check cache
        if (cachedTip && Date.now() - cachedTip.timestamp < CACHE_DURATION) {
            return NextResponse.json({ tip: cachedTip.text })
        }

        // Fetch upcoming matches (USING Match model, not MatchLog)
        const upcomingMatches = await prisma.match.findMany({
            where: {
                status: 'SCHEDULED',
                matchDate: {
                    gte: new Date()
                }
            },
            include: {
                team1: true,
                team2: true
            },
            orderBy: {
                matchDate: 'asc'
            },
            take: 3
        })

        let matchContext = "No upcoming matches found."
        if (upcomingMatches.length > 0) {
            matchContext = "Upcoming Matches:\n" + upcomingMatches.map(m =>
                `- ${m.team1.name} vs ${m.team2.name} (${m.matchDate.toISOString().split('T')[0]})`
            ).join('\n')
        } else {
            matchContext = "No upcoming matches scheduled at this time."
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ tip: "AI 분석 서비스를 위해 API 키 설정이 필요합니다." })
        }

        // Generate Tip via AI
        const chat = new ChatOpenAI({
            modelName: "gpt-4.1-nano",
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY,
        })

        const systemPrompt = `
You are an expert esports analyst for LCK (League of Legends Champions Korea).
Your job is to provide a ONE-SENTENCE, insightful fantasy league tip based on the upcoming schedule.
Focus on specific players or teams to watch. Be professional but engaging.
Write in Korean.
Example: "이번 T1전에서는 제우스의 탑 캐리력이 기대되니, 탑 라이너 슬롯에 주목해보세요."
`

        const response = await chat.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(`Context:\n${matchContext}\n\nProvide a short tip for fantasy players.`)
        ])

        const tip = response.content.toString().trim()

        // Update cache
        cachedTip = { text: tip, timestamp: Date.now() }

        return NextResponse.json({ tip })

    } catch (error) {
        console.error('AI Briefing Error:', error)
        // Fallback tip if AI fails
        return NextResponse.json({ tip: "LCK 판타지 리그에 오신 것을 환영합니다! 나만의 드림팀을 구성해보세요." })
    }
}
