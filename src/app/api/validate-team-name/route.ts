import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
    // 인증 필수 (AI 활성화 시 OpenAI 비용 누출 방지)
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ valid: false, reason: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        const { name } = await request.json()

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ valid: false, reason: '유효하지 않은 입력입니다.' }, { status: 400 })
        }

        // 길이 검사
        if (name.length < 2) {
            return NextResponse.json({ valid: false, reason: '팀 이름은 최소 2글자 이상이어야 합니다.' })
        }
        if (name.length > 12) {
            return NextResponse.json({ valid: false, reason: '팀 이름은 최대 12글자까지 가능합니다.' })
        }

        // 기본 금지어 검사 (욕설·비방)
        const BLOCKED_PATTERNS = [/[욕설금지어]/u] // 필요 시 확장
        for (const pattern of BLOCKED_PATTERNS) {
            if (pattern.test(name)) {
                return NextResponse.json({ valid: false, reason: '사용할 수 없는 단어가 포함되어 있습니다.' })
            }
        }

        // TODO: AI 콘텐츠 검사 (OPENAI_API_KEY 필요 시 활성화)
        // const chat = new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0, ... })
        // const result = await chat.invoke([...])

        return NextResponse.json({ valid: true })

    } catch (error) {
        console.error('Validation Error:', error)
        return NextResponse.json({ valid: false, reason: '검증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
    }
}
