import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { SYSTEM_PROMPT } from '@/lib/ai/prompt'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getHistoricalContext } from '@/lib/ai/context'
import { updateQuestProgress } from '@/lib/quest-utils'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        // ✅ session.user.id 직접 사용 (email 기반 DB 조회 제거)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                error: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.'
            }, { status: 503 })
        }

        // 사용자 확인 + 질의권 체크
        const user = await prisma.user.findUnique({
            where: { id: session.user.id as string },
            select: { id: true, role: true, aiQueryTickets: true },
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // ── 질의권 소모 (원자적 체크 + 차감) ─────────────────────────────────
        // 어드민은 질의권 없이도 이용 가능 (테스트·관리 목적)
        if (user.role !== 'ADMIN') {
            try {
                await prisma.$transaction(async (tx) => {
                    const fresh = await tx.user.findUnique({
                        where: { id: user.id },
                        select: { aiQueryTickets: true },
                    })
                    if (!fresh || fresh.aiQueryTickets < 1) throw new Error('NO_TICKET')
                    await tx.user.update({
                        where: { id: user.id },
                        data: { aiQueryTickets: { decrement: 1 } },
                    })
                })
            } catch (err: unknown) {
                if (err instanceof Error && err.message === 'NO_TICKET') {
                    return NextResponse.json(
                        { error: '질의권이 없습니다. 상점에서 구매해주세요.' },
                        { status: 402 }
                    )
                }
                throw err
            }
        }

        const { messages } = await req.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
        }

        // OpenAI 비용 폭탄 방지: 메시지 수 + 각 메시지 길이 제한
        const MAX_MESSAGES = 30
        const MAX_MSG_LENGTH = 2000
        if (messages.length > MAX_MESSAGES) {
            return NextResponse.json({ error: `대화 기록이 너무 깁니다. (최대 ${MAX_MESSAGES}개)` }, { status: 400 })
        }
        for (const msg of messages) {
            if (typeof msg?.content === 'string' && msg.content.length > MAX_MSG_LENGTH) {
                return NextResponse.json({ error: `메시지가 너무 깁니다. (최대 ${MAX_MSG_LENGTH}자)` }, { status: 400 })
            }
        }

        // Get Historical Context based on the last user message
        const lastUserMessage = messages.slice().reverse().find((m: any) => m.role === 'user')
        let context = ""
        if (lastUserMessage) {
            context = await getHistoricalContext(lastUserMessage.content)
        }

        const history = messages.map((m: any) => {
            if (m.role === 'user') return new HumanMessage(m.content)
            if (m.role === 'assistant') return new AIMessage(m.content)
            return new SystemMessage(m.content)
        })

        // Prepend System Prompt with Context
        const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${context}`
        const fullHistory = [new SystemMessage(fullSystemPrompt), ...history]

        const model = new ChatOpenAI({
            modelName: 'gpt-4.1-nano',
            temperature: 0.7,
            streaming: true,
            maxTokens: 1000, // ✅ 비용 폭탄 방지: 응답 최대 1000 토큰 (~750 단어)
        })

        const parser = new StringOutputParser()
        const stream = await model.pipe(parser).stream(fullHistory)

        // Create a ReadableStream for the response
        let fullResponse = ""
        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    fullResponse += chunk
                    controller.enqueue(new TextEncoder().encode(chunk))
                }
                controller.close()

                // 퀘스트 업데이트 (AI 채팅 완료)
                if (user?.id) {
                    updateQuestProgress(user.id, 'AI_CHAT').catch(() => {})
                }
            },
        })

        return new NextResponse(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

    } catch (error) {
        console.error('Chat API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
