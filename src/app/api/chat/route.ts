import { NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { message } = await request.json()

        // OpenAI API Key 확인
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                reply: "I'm sorry, but the OpenAI API key is not configured. I cannot process your request at the moment. (This is a demo response)"
            })
        }

        // 선수 데이터 조회 (컨텍스트용)
        const players = await prisma.player.findMany()
        const playersContext = players.map(p =>
            `Name: ${p.name}, Team: ${p.team}, Position: ${p.position}, Cost: ${p.cost}, Stats: ${p.seasonStats}`
        ).join('\n')

        // LangChain 설정
        const model = new ChatOpenAI({
            modelName: 'gpt-3.5-turbo',
            temperature: 0.7,
        })

        const template = `You are an expert LCK (League of Legends Champions Korea) analyst.
    Use the following player data to answer the user's question.
    If the answer is not in the data, say you don't have that information but try to be helpful based on general LoL knowledge.
    
    Player Data:
    {context}
    
    User Question: {question}
    
    Answer:`

        const prompt = PromptTemplate.fromTemplate(template)
        const outputParser = new StringOutputParser()

        const chain = RunnableSequence.from([
            prompt,
            model,
            outputParser,
        ])

        const response = await chain.invoke({
            context: playersContext,
            question: message,
        })

        return NextResponse.json({ reply: response })

    } catch (error) {
        console.error('AI Error:', error)
        return NextResponse.json({ reply: "I encountered an error processing your request." }, { status: 500 })
    }
}
