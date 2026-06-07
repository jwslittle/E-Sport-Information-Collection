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

// ── 프롬프트 인젝션 패턴 ────────────────────────────────────────────────────
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
    /이전\s*(지시|명령|프롬프트|규칙).*무시/,
    /system\s*prompt.*ignore/i,
    /jailbreak/i,
    /DAN\s+mode/i,
    /pretend\s+(you\s+are|to\s+be)/i,
    /roleplay\s+as/i,
]

// ── 판타지 리그 패턴 (서비스 종료 — e스포츠 키워드 여부와 무관하게 항상 차단) ──
const FANTASY_PATTERNS = [
    /판타지\s*(리그|팀|선수|포인트|팀편성|draft)/i,
    /가상\s*(선수|팀)/,
    /\b(NGD|VTX|IFN|SSK|NWV|SFX|BTN|FGN|CDR|AKT)\b/,  // 가상 팀 코드
    /\b(Blaze|Echo|Sniper|Phantom|Viper|Storm|Frost|Cipher|Aurora|Neon)\b.*선수/i,
    /salary\s*cap|샐러리\s*캡/i,
    /판타지.*포인트|포인트.*판타지/,
    /팀\s*편성.*판타지|판타지.*팀\s*편성/,
]

// ── 명백히 무관한 주제 패턴 ─────────────────────────────────────────────────
// e스포츠 키워드가 하나라도 있으면 AI에게 위임 — 경계 케이스는 시스템 프롬프트가 처리
const OFF_TOPIC_PATTERNS = [
    /로또|복권|주식|코인|암호화폐|비트코인|투자|부동산/,
    /날씨|기상|온도|미세먼지/,
    /요리|레시피|음식|맛집/,
    /여행|호텔|숙박|항공/,
    /의학|진단|처방|병원|약|증상/,
    /법률|변호사|소송|판결/,
    /연애|사랑|이성|소개팅/,
]
// 판타지 관련 키워드는 ESPORTS_KEYWORDS에서 제외 — 판타지 질문이 우회되지 않도록
const ESPORTS_KEYWORDS = /esport|e스포츠|lck|lol|리그|선수|팀|경기|챔피언|포지션|미드|정글|원딜|서폿|탑|통계|kda|cs|gp/i

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

        // 사용자 확인
        const user = await prisma.user.findUnique({
            where: { id: session.user.id as string },
            select: { id: true, role: true, aiQueryTickets: true },
        })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // ── Step 1: 요청 파싱 & 기본 형식 검증 (티켓 소모 전) ──────────────
        const { messages } = await req.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
        }

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

        // ── Step 2: 보안 검사 (티켓 소모 전) ──────────────────────────────
        const lastUserMsg = messages.slice().reverse().find((m: any) => m.role === 'user')
        const userText: string = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : ''

        // 2-A. 프롬프트 인젝션 차단
        if (INJECTION_PATTERNS.some(p => p.test(userText))) {
            return NextResponse.json(
                { error: '허용되지 않는 요청 형식입니다. LCK e스포츠 관련 질문만 가능합니다.' },
                { status: 400 }
            )
        }

        // 2-B. 판타지 리그 차단 (서비스 종료 — 다른 검사보다 우선 적용)
        if (FANTASY_PATTERNS.some(p => p.test(userText))) {
            return NextResponse.json(
                { error: '현재 판타지 리그 기능은 운영되지 않습니다. LCK 경기 정보 및 통계 관련 질문을 이용해주세요.' },
                { status: 400 }
            )
        }

        // 2-C. 명백히 무관한 주제 차단 — 티켓 낭비 방지
        if (OFF_TOPIC_PATTERNS.some(p => p.test(userText)) && !ESPORTS_KEYWORDS.test(userText)) {
            return NextResponse.json(
                { error: 'AI 분석가는 LCK e스포츠 관련 질문에만 답변할 수 있습니다.' },
                { status: 400 }
            )
        }

        // ── Step 3: 질의권 소모 (검사 통과 후 원자적 차감) ────────────────
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

        // ── Step 4: 컨텍스트 조회 & OpenAI 호출 ───────────────────────────
        let context = ""
        if (lastUserMsg) {
            context = await getHistoricalContext(lastUserMsg.content)
        }

        // ✅ 보안: 'user'/'assistant' 이외의 role 필터링 — system role 인젝션 차단
        const history = messages
            .filter((m: any) => m.role === 'user' || m.role === 'assistant')
            .map((m: any) => {
                if (m.role === 'user') return new HumanMessage(String(m.content ?? ''))
                return new AIMessage(String(m.content ?? ''))
            })

        const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${context}`
        const fullHistory = [new SystemMessage(fullSystemPrompt), ...history]

        const model = new ChatOpenAI({
            modelName: 'gpt-4.1-nano',
            temperature: 0.7,
            streaming: true,
            maxTokens: 1000, // 비용 폭탄 방지: 응답 최대 1000 토큰 (~750 단어)
        })

        const parser = new StringOutputParser()
        const stream = await model.pipe(parser).stream(fullHistory)

        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
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
