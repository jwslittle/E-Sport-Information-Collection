import { NextResponse } from 'next/server'
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

export async function POST(request: Request) {
    try {
        const { name } = await request.json()

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ valid: false, reason: '유효하지 않은 입력입니다.' }, { status: 400 })
        }

        // 1. Length Check
        if (name.length < 2) {
            return NextResponse.json({ valid: false, reason: '팀 이름은 최소 2글자 이상이어야 합니다.' })
        }
        if (name.length > 12) {
            return NextResponse.json({ valid: false, reason: '팀 이름은 최대 12글자까지 가능합니다.' })
        }

        // 2. AI Content Check (Bypassed for testing/reliability)
        /*
        const chat = new ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0,
            openAIApiKey: process.env.OPENAI_API_KEY,
        })
        // ... (systemPrompt)
        const response = await chat.invoke(...)
        const result = response.content.toString().trim()
        */

        // Always return valid for now
        return NextResponse.json({ valid: true })

    } catch (error) {
        console.error('Validation Error:', error)
        // Fallback: Allow if AI fails, or Block?
        // Better to fail open for UX unless critical, but for safety let's fail closed or log.
        // For now, return generic error.
        return NextResponse.json({ valid: false, reason: '검증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
    }
}
