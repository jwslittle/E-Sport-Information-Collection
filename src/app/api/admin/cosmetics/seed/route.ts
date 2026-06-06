/**
 * POST /api/admin/cosmetics/seed
 * 기본 코스메틱 아이템을 DB에 시딩 (어드민 전용)
 *
 * 설계 원칙:
 *  - 팀 로고·상표권 아이템 일절 없음 (Riot 정책, 팀 IP 보호)
 *  - 칭호: 구매 가능 칭호는 팀 팬 칭호 5종만. 나머지 칭호는 모두 업적 전용 (gpCost: 0)
 *  - 프레임/배경: 구매 가능하지만 고가 (수주~수개월치 활동 GP 필요)
 *  - 스티커: 적당한 가격의 구매 가능 + 일부 업적 전용
 *  - AI_TICKET: 소모성, aiQueryTickets 카운터로 처리
 *
 * 실행 시:
 *  - 새 아이템 생성
 *  - 기존 아이템 가격/설명 변경 시 업데이트
 *  - 제거된 팀 로고 아이템 비활성화 (isActive: false)
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// ── 더 이상 사용하지 않는 아이템 (팀 로고·상표권) ──────────────────────────────
const DEPRECATED_NAMES = [
    'T1 로고', 'GEN.G 로고', 'HLE 로고', 'KT 로고',   // 팀 로고 스티커
    'T1 프레임', 'GEN.G 프레임',                        // 팀 로고 프레임
    'T1 본진',                                          // 팀 브랜딩 배경
    '가챠 중독',                                        // 운영 정책상 제거
]

const SEED_ITEMS = [

    // ══════════════════════════════════════════════════════════════════
    // AI 질의권 (AI_TICKET) — 소모성, 구매 즉시 aiQueryTickets +1
    // ══════════════════════════════════════════════════════════════════
    {
        name: 'AI 분석가 질의권',
        type: 'AI_TICKET',
        rarity: 'COMMON',
        gpCost: 50,
        description: 'AI 분석가에게 1회 질문할 수 있는 이용권. 구매 즉시 사용 가능합니다.',
    },

    // ══════════════════════════════════════════════════════════════════
    // 칭호 (TITLE) — 구매 가능 (팀 팬 칭호 5종만)
    // ══════════════════════════════════════════════════════════════════
    {
        name: 'T1 열혈 팬',
        type: 'TITLE',
        titleText: 'T1 열혈 팬',
        rarity: 'UNCOMMON',
        gpCost: 5000,
        description: 'T1을 향한 뜨거운 팬심의 증거. 상점 구매 전용.',
    },
    {
        name: 'GEN.G 지지자',
        type: 'TITLE',
        titleText: 'GEN.G 지지자',
        rarity: 'UNCOMMON',
        gpCost: 5000,
        description: 'Gen.G의 든든한 응원군. 상점 구매 전용.',
    },
    {
        name: 'HLE 홍군',
        type: 'TITLE',
        titleText: 'HLE 홍군',
        rarity: 'UNCOMMON',
        gpCost: 5000,
        description: 'HLE를 응원하는 붉은 군단. 상점 구매 전용.',
    },
    {
        name: 'KT 롤스터 팬',
        type: 'TITLE',
        titleText: 'KT 롤스터 팬',
        rarity: 'UNCOMMON',
        gpCost: 5000,
        description: 'KT Rolster의 충성 팬. 상점 구매 전용.',
    },
    {
        name: 'DK 팬',
        type: 'TITLE',
        titleText: 'DK 팬',
        rarity: 'UNCOMMON',
        gpCost: 5000,
        description: 'Dplus KIA의 충성 팬. 상점 구매 전용.',
    },

    // ══════════════════════════════════════════════════════════════════
    // 칭호 (TITLE) — 업적 전용 (gpCost: 0, 상점 직접 구매 불가)
    // ══════════════════════════════════════════════════════════════════
    {
        name: '관전러',
        type: 'TITLE',
        titleText: '관전러',
        rarity: 'COMMON',
        gpCost: 0,
        description: '경기 예측을 100회 완료하면 획득. LCK를 사랑하는 충성 관전러.',
    },
    {
        name: '예측왕',
        type: 'TITLE',
        titleText: '예측왕',
        rarity: 'UNCOMMON',
        gpCost: 0,
        description: '예측 정확도 70% 이상 달성 시 획득. 승부 예측의 달인.',
    },
    {
        name: '퀴즈왕',
        type: 'TITLE',
        titleText: '퀴즈왕',
        rarity: 'UNCOMMON',
        gpCost: 0,
        description: '오늘의 퀴즈를 30일 이상 풀면 획득. 지식으로 무장한 퀴즈 정복자.',
    },
    {
        name: '슈퍼팬',
        type: 'TITLE',
        titleText: '슈퍼팬',
        rarity: 'RARE',
        gpCost: 0,
        description: '팔로워 10명 달성 시 획득. 팬심이 넘쳐흐르는 슈퍼팬.',
    },
    {
        name: '드래프터',
        type: 'TITLE',
        titleText: '드래프터',
        rarity: 'RARE',
        gpCost: 0,
        description: '예측 50회 + 정확도 60% 이상 달성 시 획득. 선수 가치를 꿰뚫는 안목.',
    },
    {
        name: '전략가',
        type: 'TITLE',
        titleText: '전략가',
        rarity: 'RARE',
        gpCost: 0,
        description: '예측 100회 + 정확도 75% 이상 달성 시 획득. 치밀한 전략의 분석가.',
    },
    {
        name: '데이터 마스터',
        type: 'TITLE',
        titleText: '데이터 마스터',
        rarity: 'RARE',
        gpCost: 0,
        description: '퀴즈 정답 100개 이상 달성 시 획득. 모든 통계를 꿰뚫어 보는 분석가.',
    },
    {
        name: 'LCK 황태자',
        type: 'TITLE',
        titleText: 'LCK 황태자',
        rarity: 'EPIC',
        gpCost: 0,
        description: '시즌 랭킹 TOP 10 달성 시 지급. LCK를 손에 넣을 황태자.',
    },
    {
        name: 'LCK 예언자',
        type: 'TITLE',
        titleText: 'LCK 예언자',
        rarity: 'EPIC',
        gpCost: 0,
        description: '예측 적중 100회 달성 시 획득. LCK의 흐름을 꿰뚫어 보는 예언자.',
    },
    {
        name: '에스포츠 황제',
        type: 'TITLE',
        titleText: '에스포츠 황제',
        rarity: 'LEGENDARY',
        gpCost: 0,
        description: '시즌 랭킹 1위 달성 시 지급. e스포츠 역사에 이름을 새긴 황제.',
    },

    // ══════════════════════════════════════════════════════════════════
    // 스티커 (STICKER) — 구매 가능 (팀 로고 제외, 오리지널 디자인)
    // ══════════════════════════════════════════════════════════════════
    // 기본 스티커: 2~4일치 활동 GP
    { name: '화이팅!',      type: 'STICKER', rarity: 'COMMON',    gpCost: 300,   description: '응원의 스티커' },
    { name: '집중!',        type: 'STICKER', rarity: 'COMMON',    gpCost: 300,   description: '집중하는 스티커' },
    { name: '승리!',        type: 'STICKER', rarity: 'COMMON',    gpCost: 300,   description: '승리를 자축하는 스티커' },
    { name: 'GG',           type: 'STICKER', rarity: 'COMMON',    gpCost: 500,   description: '페어플레이 정신 스티커' },
    { name: '분석 중...',   type: 'STICKER', rarity: 'COMMON',    gpCost: 500,   description: '데이터 분석가 스티커' },
    // 오리지널 e스포츠 스티커: 5~6일치 GP (팀 로고 스티커 4종 대체)
    { name: '왕귀 폼!',    type: 'STICKER', rarity: 'UNCOMMON',   gpCost: 800,   description: '폭발적인 성장세를 상징하는 스티커. 캐리가 터질 때!' },
    { name: '완봉승!',     type: 'STICKER', rarity: 'UNCOMMON',   gpCost: 800,   description: '깔끔한 스윕 승리를 기념하는 스티커.' },
    { name: '스플릿 푸시!', type: 'STICKER', rarity: 'UNCOMMON', gpCost: 800,   description: '사이드 라인을 장악하는 전략 스티커.' },
    { name: '드라마!',     type: 'STICKER', rarity: 'UNCOMMON',   gpCost: 800,   description: '극적인 역전극을 상징하는 스티커.' },
    // 희귀 스티커: 2~3주치 GP
    { name: '펜타킬!',     type: 'STICKER', rarity: 'RARE',       gpCost: 2000,  description: '펜타킬 달성 기념 스티커' },
    { name: '전략의 신',   type: 'STICKER', rarity: 'RARE',       gpCost: 2000,  description: '탁월한 전략을 상징하는 스티커' },
    // 고급 스티커: 한 달치 GP
    { name: '트로피',      type: 'STICKER', rarity: 'EPIC',       gpCost: 5000,  description: '우승을 상징하는 황금 트로피 스티커' },
    // 전설 스티커: 2개월치+ GP
    { name: '월즈 우승',   type: 'STICKER', rarity: 'LEGENDARY',  gpCost: 20000, description: '롤드컵 우승 기념 전설 스티커. 최고를 향한 팬의 열정.' },

    // ══════════════════════════════════════════════════════════════════
    // 스티커 (STICKER) — 업적 전용 (gpCost: 0)
    // ══════════════════════════════════════════════════════════════════
    { name: '럭키!',      type: 'STICKER', rarity: 'COMMON',   gpCost: 0, description: '예측 5연속 적중 달성 시 획득. 행운을 비는 특별 스티커.' },
    { name: '대역전!',    type: 'STICKER', rarity: 'COMMON',   gpCost: 0, description: '커뮤니티 게시글 10개 달성 시 획득. 극적인 역전 순간 기념.' },
    { name: '용 사냥꾼',  type: 'STICKER', rarity: 'UNCOMMON', gpCost: 0, description: '예측 정확도 70%+ 달성 시 획득. 드래곤 사냥꾼 스티커.' },
    { name: '카운터픽',   type: 'STICKER', rarity: 'RARE',     gpCost: 0, description: '예측 적중 50회 달성 시 획득. 완벽한 카운터픽 스티커.' },
    { name: '솔로킬!',    type: 'STICKER', rarity: 'EPIC',     gpCost: 0, description: '예측 적중 100회 달성 시 획득. 1:1 솔로킬 기념 스티커.' },

    // ══════════════════════════════════════════════════════════════════
    // 프로필 프레임 (PROFILE_FRAME) — 구매 가능 (오리지널 디자인)
    // ══════════════════════════════════════════════════════════════════
    { name: '실버 프레임',      type: 'PROFILE_FRAME', rarity: 'UNCOMMON', gpCost: 8000,  description: '은빛으로 빛나는 프레임. 꾸준히 활동한 플레이어의 증표.' },
    { name: '플래티넘 프레임',  type: 'PROFILE_FRAME', rarity: 'RARE',     gpCost: 15000, description: '플래티넘 빛으로 빛나는 고급 프레임. 꾸준한 활동의 결실.' },
    { name: '에메랄드 프레임',  type: 'PROFILE_FRAME', rarity: 'RARE',     gpCost: 18000, description: '에메랄드빛으로 빛나는 희귀 프레임. 수집가의 자부심.' },
    { name: '골드 프레임',      type: 'PROFILE_FRAME', rarity: 'RARE',     gpCost: 25000, description: '금빛으로 빛나는 프레임. 오랜 활동의 자부심.' },
    { name: '다이아몬드 프레임', type: 'PROFILE_FRAME', rarity: 'EPIC',    gpCost: 60000, description: '다이아몬드처럼 빛나는 프레임. 최상위 플레이어의 상징.' },

    // ══════════════════════════════════════════════════════════════════
    // 프로필 프레임 (PROFILE_FRAME) — 업적 전용 (gpCost: 0)
    // ══════════════════════════════════════════════════════════════════
    { name: '별빛 프레임',   type: 'PROFILE_FRAME', rarity: 'UNCOMMON', gpCost: 0, description: '퀴즈 7일 연속 달성 시 획득. 밤하늘 별빛을 담은 신비로운 프레임.' },
    { name: '챔피언 프레임', type: 'PROFILE_FRAME', rarity: 'RARE',     gpCost: 0, description: '예측 10연속 적중 달성 시 획득. 챔피언만이 걸칠 수 있는 특별 프레임.' },
    { name: '홀로그램 프레임', type: 'PROFILE_FRAME', rarity: 'EPIC',   gpCost: 0, description: '시즌 랭킹 TOP 50 달성 시 지급. 빛을 굴절시키는 홀로그램 프레임.' },

    // ══════════════════════════════════════════════════════════════════
    // 프로필 배경 (BACKGROUND) — 구매 가능 (오리지널 디자인)
    // ══════════════════════════════════════════════════════════════════
    { name: 'LCK 아레나',    type: 'BACKGROUND', rarity: 'UNCOMMON', gpCost: 10000, description: 'e스포츠 경기장의 열기를 담은 배경.' },
    { name: '픽셀 레트로',   type: 'BACKGROUND', rarity: 'UNCOMMON', gpCost: 12000, description: '레트로 픽셀 아트 스타일 배경. 추억을 담은 감성 배경.' },
    { name: 'e스포츠 스튜디오', type: 'BACKGROUND', rarity: 'RARE',   gpCost: 20000, description: '최첨단 e스포츠 스튜디오 배경. 프로 선수처럼.' },
    { name: '월드컵 무대',   type: 'BACKGROUND', rarity: 'EPIC',     gpCost: 50000, description: '세계 최고의 무대에서 펼쳐지는 전설의 배경.' },
    { name: '갤럭시',        type: 'BACKGROUND', rarity: 'EPIC',     gpCost: 80000, description: '우주를 담은 신비로운 배경. 이 사이트에서 가장 비싼 구매 배경.' },

    // ══════════════════════════════════════════════════════════════════
    // 프로필 배경 (BACKGROUND) — 업적 전용 (gpCost: 0)
    // ══════════════════════════════════════════════════════════════════
    { name: '네온 아레나',  type: 'BACKGROUND', rarity: 'UNCOMMON', gpCost: 0, description: '예측 50회 달성 시 획득. 네온 빛으로 물든 e스포츠 경기장 배경.' },
    { name: '드래곤 둥지',  type: 'BACKGROUND', rarity: 'RARE',     gpCost: 0, description: '예측 정확도 80%+ (100경기) 달성 시 획득. 바론과 드래곤이 지키는 배경.' },
]

export async function POST() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // ── 1. 제거된 팀 로고 아이템 비활성화 ─────────────────────────────────
    const deactivated = await prisma.cosmeticItem.updateMany({
        where: { name: { in: DEPRECATED_NAMES }, isActive: true },
        data: { isActive: false },
    })

    // ── 2. 아이템 시딩 (생성 / 업데이트) ──────────────────────────────────
    let created = 0
    let skipped = 0
    let updated = 0

    for (const item of SEED_ITEMS) {
        const existing = await prisma.cosmeticItem.findFirst({
            where: { name: item.name, type: item.type }
        })

        if (existing) {
            // 가격·설명이 변경됐으면 업데이트 + 활성화 보장
            if (
                existing.gpCost !== item.gpCost ||
                existing.description !== item.description ||
                !existing.isActive
            ) {
                await prisma.cosmeticItem.update({
                    where: { id: existing.id },
                    data: {
                        gpCost: item.gpCost,
                        description: item.description,
                        isActive: true,
                    },
                })
                updated++
            } else {
                skipped++
            }
            continue
        }

        await prisma.cosmeticItem.create({
            data: { ...item, isActive: true }
        })
        created++
    }

    return NextResponse.json({
        ok: true,
        deactivated: deactivated.count,
        created,
        updated,
        skipped,
        total: SEED_ITEMS.length,
        message: `비활성화 ${deactivated.count}개 · 생성 ${created}개 · 업데이트 ${updated}개 · 스킵 ${skipped}개`,
    })
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const count = await prisma.cosmeticItem.count({ where: { isActive: true } })
    const byType = await prisma.cosmeticItem.groupBy({
        by: ['type'],
        where: { isActive: true },
        _count: { id: true },
    })
    return NextResponse.json({ count, byType })
}
