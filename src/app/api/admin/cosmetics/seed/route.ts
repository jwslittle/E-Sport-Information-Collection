/**
 * POST /api/admin/cosmetics/seed
 * 기본 코스메틱 아이템을 DB에 시딩 (어드민 전용)
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const SEED_ITEMS = [
    // ── AI 질의권 (AI_TICKET) — 소모성 아이템, 구매 시 aiQueryTickets +1 ──────
    { name: 'AI 분석가 질의권', type: 'AI_TICKET', rarity: 'COMMON', gpCost: 50,
      description: 'AI 분석가에게 1회 질문할 수 있는 이용권. 구매 즉시 사용 가능합니다.' },

    // ── 칭호 (TITLE) ──────────────────────────────────────────────────────────
    { name: 'T1 열혈 팬', type: 'TITLE', titleText: 'T1 열혈 팬', rarity: 'UNCOMMON', gpCost: 500, description: 'T1을 사랑하는 열정적인 팬' },
    { name: 'GEN.G 지지자', type: 'TITLE', titleText: 'GEN.G 지지자', rarity: 'UNCOMMON', gpCost: 500, description: 'Gen.G의 든든한 응원군' },
    { name: 'HLE 홍군', type: 'TITLE', titleText: 'HLE 홍군', rarity: 'UNCOMMON', gpCost: 500, description: 'HLE를 응원하는 붉은 군단' },
    { name: 'KT 롤스터 팬', type: 'TITLE', titleText: 'KT 롤스터 팬', rarity: 'UNCOMMON', gpCost: 500, description: 'KT Rolster의 충성 팬' },
    { name: 'DK 팬', type: 'TITLE', titleText: 'DK 팬', rarity: 'UNCOMMON', gpCost: 500, description: 'Dplus KIA의 충성 팬' },
    { name: '전략가', type: 'TITLE', titleText: '전략가', rarity: 'RARE', gpCost: 1500, description: '치밀한 전략으로 팀을 이끄는 분석가' },
    { name: '데이터 마스터', type: 'TITLE', titleText: '데이터 마스터', rarity: 'RARE', gpCost: 2000, description: '모든 통계를 꿰뚫어 보는 분석가' },
    { name: 'LCK 예언자', type: 'TITLE', titleText: 'LCK 예언자', rarity: 'EPIC', gpCost: 5000, description: 'LCK의 흐름을 꿰뚫어 보는 예언자' },
    { name: '에스포츠 황제', type: 'TITLE', titleText: '에스포츠 황제', rarity: 'LEGENDARY', gpCost: 15000, description: '이스포츠 역사에 이름을 새긴 황제' },

    // ── 스티커 (STICKER) ──────────────────────────────────────────────────────
    { name: '화이팅!', type: 'STICKER', rarity: 'COMMON', gpCost: 80, description: '응원의 스티커' },
    { name: '집중!', type: 'STICKER', rarity: 'COMMON', gpCost: 80, description: '집중하는 스티커' },
    { name: '승리!', type: 'STICKER', rarity: 'COMMON', gpCost: 80, description: '승리를 자축하는 스티커' },
    { name: 'GG', type: 'STICKER', rarity: 'COMMON', gpCost: 100, description: '페어플레이 정신 스티커' },
    { name: '분석 중...', type: 'STICKER', rarity: 'COMMON', gpCost: 100, description: '데이터 분석가 스티커' },
    { name: 'T1 로고', type: 'STICKER', rarity: 'UNCOMMON', gpCost: 200, description: 'T1 팀 스티커' },
    { name: 'GEN.G 로고', type: 'STICKER', rarity: 'UNCOMMON', gpCost: 200, description: 'Gen.G 팀 스티커' },
    { name: 'HLE 로고', type: 'STICKER', rarity: 'UNCOMMON', gpCost: 200, description: 'HLE 팀 스티커' },
    { name: 'KT 로고', type: 'STICKER', rarity: 'UNCOMMON', gpCost: 200, description: 'KT Rolster 팀 스티커' },
    { name: '펜타킬!', type: 'STICKER', rarity: 'RARE', gpCost: 500, description: '펜타킬 달성 기념 스티커' },
    { name: '전략의 신', type: 'STICKER', rarity: 'RARE', gpCost: 500, description: '탁월한 전략을 상징하는 스티커' },
    { name: '트로피', type: 'STICKER', rarity: 'EPIC', gpCost: 1500, description: '우승을 상징하는 황금 트로피 스티커' },
    { name: '월즈 우승', type: 'STICKER', rarity: 'LEGENDARY', gpCost: 10000, description: '월드 챔피언십 우승 기념 전설 스티커' },

    // ── 프레임 (PROFILE_FRAME) ────────────────────────────────────────────────
    { name: '실버 프레임', type: 'PROFILE_FRAME', rarity: 'UNCOMMON', gpCost: 800, description: '은빛으로 빛나는 프레임' },
    { name: '골드 프레임', type: 'PROFILE_FRAME', rarity: 'RARE', gpCost: 2000, description: '금빛으로 빛나는 프레임' },
    { name: '다이아몬드 프레임', type: 'PROFILE_FRAME', rarity: 'EPIC', gpCost: 5000, description: '다이아몬드처럼 빛나는 프레임' },
    { name: 'T1 프레임', type: 'PROFILE_FRAME', rarity: 'RARE', gpCost: 3000, description: 'T1 팀 컬러 프레임' },
    { name: 'GEN.G 프레임', type: 'PROFILE_FRAME', rarity: 'RARE', gpCost: 3000, description: 'GEN.G 팀 컬러 프레임' },

    // ── 배경 (BACKGROUND) ─────────────────────────────────────────────────────
    { name: 'LCK 아레나', type: 'BACKGROUND', rarity: 'UNCOMMON', gpCost: 1000, description: 'LCK 경기장 배경' },
    { name: 'T1 본진', type: 'BACKGROUND', rarity: 'RARE', gpCost: 2500, description: 'T1 팀 컬러 배경' },
    { name: '월드컵 무대', type: 'BACKGROUND', rarity: 'EPIC', gpCost: 6000, description: '리그 오브 레전드 월드 챔피언십 배경' },
    { name: '갤럭시', type: 'BACKGROUND', rarity: 'EPIC', gpCost: 7000, description: '우주를 담은 신비로운 배경' },
    { name: '픽셀 레트로', type: 'BACKGROUND', rarity: 'UNCOMMON', gpCost: 1200, description: '레트로 픽셀 아트 스타일 배경' },

    // ── 가챠 전용 칭호 (gpCost: 0 = 가챠로만 획득) ───────────────────────────
    { name: '관전러', type: 'TITLE', titleText: '관전러', rarity: 'COMMON', gpCost: 0, description: 'LCK 경기를 즐겨보는 충성 관전러' },
    { name: '예측왕', type: 'TITLE', titleText: '예측왕', rarity: 'UNCOMMON', gpCost: 0, description: '승부 예측의 달인' },
    { name: '퀴즈왕', type: 'TITLE', titleText: '퀴즈왕', rarity: 'UNCOMMON', gpCost: 0, description: '지식으로 무장한 퀴즈 정복자' },
    { name: '슈퍼팬', type: 'TITLE', titleText: '슈퍼팬', rarity: 'RARE', gpCost: 0, description: '팬심이 넘쳐흐르는 슈퍼팬' },
    { name: '드래프터', type: 'TITLE', titleText: '드래프터', rarity: 'RARE', gpCost: 0, description: '선수 가치를 꿰뚫어 보는 안목의 소유자' },
    { name: 'LCK 황태자', type: 'TITLE', titleText: 'LCK 황태자', rarity: 'EPIC', gpCost: 0, description: 'LCK를 손에 넣을 황태자' },
    { name: '가챠 중독', type: 'TITLE', titleText: '가챠 중독', rarity: 'EPIC', gpCost: 0, description: '가챠를 멈출 수가 없어...' },

    // ── 가챠 전용 스티커 ──────────────────────────────────────────────────────
    { name: '럭키!', type: 'STICKER', rarity: 'COMMON', gpCost: 0, description: '행운을 비는 특별 스티커' },
    { name: '대역전!', type: 'STICKER', rarity: 'COMMON', gpCost: 0, description: '극적인 역전 순간을 기념하는 스티커' },
    { name: '용 사냥꾼', type: 'STICKER', rarity: 'UNCOMMON', gpCost: 0, description: '드래곤을 먹은 팀을 상징하는 스티커' },
    { name: '카운터픽', type: 'STICKER', rarity: 'RARE', gpCost: 0, description: '완벽한 카운터픽을 상징하는 스티커' },
    { name: '솔로킬!', type: 'STICKER', rarity: 'EPIC', gpCost: 0, description: '1:1 솔로킬 달성 기념 스티커' },

    // ── 가챠 전용 프레임 ──────────────────────────────────────────────────────
    { name: '별빛 프레임', type: 'PROFILE_FRAME', rarity: 'UNCOMMON', gpCost: 0, description: '밤하늘 별빛을 담은 신비로운 프레임' },
    { name: '챔피언 프레임', type: 'PROFILE_FRAME', rarity: 'RARE', gpCost: 0, description: '챔피언만이 걸칠 수 있는 특별 프레임' },
    { name: '홀로그램 프레임', type: 'PROFILE_FRAME', rarity: 'EPIC', gpCost: 0, description: '빛을 굴절시키는 홀로그램 프레임' },

    // ── 가챠 전용 배경 ────────────────────────────────────────────────────────
    { name: '네온 아레나', type: 'BACKGROUND', rarity: 'UNCOMMON', gpCost: 0, description: '네온 빛으로 물든 e스포츠 경기장 배경' },
    { name: '드래곤 둥지', type: 'BACKGROUND', rarity: 'RARE', gpCost: 0, description: '바론과 드래곤이 지키는 신비로운 배경' },
]

export async function POST() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    let created = 0
    let skipped = 0

    for (const item of SEED_ITEMS) {
        const existing = await prisma.cosmeticItem.findFirst({
            where: { name: item.name, type: item.type }
        })
        if (existing) { skipped++; continue }

        await prisma.cosmeticItem.create({
            data: { ...item, isActive: true }
        })
        created++
    }

    return NextResponse.json({ ok: true, created, skipped, total: SEED_ITEMS.length })
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const count = await prisma.cosmeticItem.count()
    return NextResponse.json({ count })
}
