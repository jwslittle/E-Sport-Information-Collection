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
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                error: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.'
            }, { status: 503 })
        }

        // Check and consume ticket
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { inventory: true }
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        let consumedTicketId: string | null = null

        // Check ticket or Admin role (Disabled for Beta)
        /*
        if (user.role !== 'ADMIN') {
            const ticket = user.inventory.find(i => i.item.category === 'TICKET' && i.quantity > 0)

            if (!ticket) {
                return NextResponse.json({ error: 'AI 분석가 질문권이 필요합니다.' }, { status: 403 })
            }

            // Consume Ticket
            if (ticket.quantity > 1) {
                await prisma.userInventory.update({
                    where: { id: ticket.id },
                    data: { quantity: { decrement: 1 } }
                })
            } else {
                await prisma.userInventory.delete({
                    where: { id: ticket.id }
                })
            }
            consumedTicketId = ticket.id
        }
        */

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
