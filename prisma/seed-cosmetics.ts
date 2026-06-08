/**
 * 코스메틱 아이템 시드
 * npx tsx prisma/seed-cosmetics.ts
 *
 * ⚠️ 금지 사항 (저작권/IP):
 *   - 팀 로고, 팀 브랜드 이미지 사용 금지
 *   - 특정 실제 선수 이름/실루엣 사용 금지
 *   - 팀 이름이 들어간 칭호는 반드시 "oo팀 팬" 형식만 허용
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── 칭호 (TITLE) ─────────────────────────────────────────────────────────────
const TITLES = [
    // ── 기본 시작 칭호 ──
    { name: '신인 감독', titleText: '신인 감독', rarity: 'COMMON', gpCost: 0, condition: 'DEFAULT', description: '처음 게임을 시작한 감독에게 주어지는 칭호' },

    // ── GP 상점 구매 칭호 ──
    // 팀 팬 칭호 (LCK 10팀 전체, "oo팀 팬" 형식으로 통일 — 이 형식 외 팀 이름 포함 칭호 절대 금지)
    { name: 'T1팀 팬',  titleText: 'T1팀 팬',  rarity: 'UNCOMMON', gpCost: 500, description: 'T1을 열정적으로 응원하는 팬' },
    { name: 'GEN팀 팬', titleText: 'GEN팀 팬', rarity: 'UNCOMMON', gpCost: 500, description: 'Gen.G를 든든하게 응원하는 팬' },
    { name: 'HLE팀 팬', titleText: 'HLE팀 팬', rarity: 'UNCOMMON', gpCost: 500, description: 'HLE를 열정적으로 응원하는 팬' },
    { name: 'KT팀 팬',  titleText: 'KT팀 팬',  rarity: 'UNCOMMON', gpCost: 500, description: 'KT Rolster를 열정적으로 응원하는 팬' },
    { name: 'DK팀 팬',  titleText: 'DK팀 팬',  rarity: 'UNCOMMON', gpCost: 500, description: 'Dplus KIA를 열정적으로 응원하는 팬' },
    { name: 'KRX팀 팬', titleText: 'KRX팀 팬', rarity: 'UNCOMMON', gpCost: 500, description: 'Kwangdong Freecs를 열정적으로 응원하는 팬' },
    { name: 'BFX팀 팬', titleText: 'BFX팀 팬', rarity: 'UNCOMMON', gpCost: 500, description: 'BFX를 열정적으로 응원하는 팬' },
    { name: 'NS팀 팬',  titleText: 'NS팀 팬',  rarity: 'UNCOMMON', gpCost: 500, description: 'Nongshim RedForce를 열정적으로 응원하는 팬' },
    { name: 'DNS팀 팬', titleText: 'DNS팀 팬', rarity: 'UNCOMMON', gpCost: 500, description: 'DN Esports를 열정적으로 응원하는 팬' },
    { name: 'BRO팀 팬', titleText: 'BRO팀 팬', rarity: 'UNCOMMON', gpCost: 500, description: 'OKSavingsBank BRION을 열정적으로 응원하는 팬' },

    // 특별 칭호 (GP 구매)
    { name: '대역전!',     titleText: '대역전!',     rarity: 'RARE',      gpCost: 2000,  description: 'LCK 역전의 명장면을 사랑하는 팬. 어떤 상황에서도 역전은 가능하다' },
    { name: '전략가',      titleText: '전략가',      rarity: 'RARE',      gpCost: 1500,  description: '치밀한 전략으로 팀을 이끄는 감독' },
    { name: '데이터 마스터', titleText: '데이터 마스터', rarity: 'RARE',    gpCost: 2000,  description: '모든 통계를 꿰뚫어 보는 분석가' },
    { name: '판타지 왕',   titleText: '판타지 왕',   rarity: 'EPIC',      gpCost: 5000,  description: '판타지 리그를 지배하는 왕' },
    { name: '에스포츠 황제', titleText: '에스포츠 황제', rarity: 'LEGENDARY', gpCost: 10000, description: '이스포츠 역사에 이름을 새긴 황제' },

    // ── 업적/조건 달성 칭호 (gpCost=0) ──
    { name: '열정 필자',   titleText: '열정 필자',   rarity: 'UNCOMMON',  gpCost: 0, condition: 'POST_10_COMMUNITY',  description: '커뮤니티에 게시글 10개를 작성한 열정적인 멤버' },
    { name: '예언자',      titleText: '예언자',      rarity: 'RARE',      gpCost: 0, condition: 'PREDICT_10_STREAK', description: '10경기 연속 승부예측 성공' },
    { name: '완벽한 예측', titleText: '완벽한 예측', rarity: 'EPIC',      gpCost: 0, condition: 'PREDICT_30_CORRECT', description: '총 30회 이상 승부예측 성공' },
    { name: 'LCK 마스터',  titleText: 'LCK 마스터',  rarity: 'EPIC',      gpCost: 0, condition: 'TOP_100_RANK',       description: '글로벌 랭킹 100위 이내 달성' },
    { name: '챌린저 감독', titleText: '챌린저 감독', rarity: 'LEGENDARY', gpCost: 0, condition: 'TOP_10_RANK',        description: '글로벌 랭킹 10위 이내 달성' },
    { name: '판타지 레전드', titleText: '판타지 레전드', rarity: 'LEGENDARY', gpCost: 0, condition: 'TOP_1_RANK',     description: '글로벌 랭킹 1위 달성' },
    { name: 'AI의 제자',   titleText: 'AI의 제자',   rarity: 'UNCOMMON',  gpCost: 0, condition: 'USE_AI_50',          description: 'AI 분석가와 50회 이상 대화' },
    { name: '퀘스트 사냥꾼', titleText: '퀘스트 사냥꾼', rarity: 'RARE',  gpCost: 0, condition: 'COMPLETE_50_QUESTS', description: '총 50개 퀘스트 완료' },
    { name: '베테랑',      titleText: '베테랑',      rarity: 'RARE',      gpCost: 0, condition: '2_SEASONS_PLAYED',   description: '2시즌 이상 참여한 베테랑 감독' },
    { name: '컬렉터',      titleText: '컬렉터',      rarity: 'RARE',      gpCost: 0, condition: 'OWN_30_CARDS',       description: '30장 이상의 선수 카드 보유' },
    { name: '챌린저 카드', titleText: '챌린저 카드', rarity: 'EPIC',      gpCost: 0, condition: 'OWN_CHALLENGER_CARD', description: '챌린저 등급 카드 보유' },
    { name: '시즌 MVP',    titleText: '시즌 MVP',    rarity: 'LEGENDARY', gpCost: 0, condition: 'SEASON_END_TOP1',    description: '시즌 종료 시 전체 1위' },
]

// ─── 프로필 프레임 (PROFILE_FRAME) ───────────────────────────────────────────
// ⚠️ 팀 로고/브랜드 프레임 금지 (T1 프레임, GEN.G 프레임 등)
const FRAMES = [
    { name: '기본 프레임',     rarity: 'COMMON',    gpCost: 0,    condition: 'DEFAULT',          description: '기본 프로필 프레임',        imageUrl: '/frames/default.png' },
    { name: '실버 프레임',     rarity: 'UNCOMMON',  gpCost: 800,  description: '은빛으로 빛나는 프레임',      imageUrl: '/frames/silver.png' },
    { name: '골드 프레임',     rarity: 'RARE',      gpCost: 2000, description: '금빛으로 빛나는 프레임',      imageUrl: '/frames/gold.png' },
    { name: '다이아몬드 프레임', rarity: 'EPIC',    gpCost: 5000, description: '다이아몬드처럼 빛나는 프레임', imageUrl: '/frames/diamond.png' },
    { name: '챌린저 프레임',   rarity: 'LEGENDARY', gpCost: 0,    condition: 'TOP_1_RANK',         description: '시즌 1위 달성 시 지급',     imageUrl: '/frames/challenger.png' },
    { name: 'LCK 공식 프레임', rarity: 'EPIC',      gpCost: 0,    condition: 'SEASON_PARTICIPANT', description: '시즌 참가 기념 프레임',     imageUrl: '/frames/lck.png' },
]

// ─── 배경 (BACKGROUND) ───────────────────────────────────────────────────────
// ⚠️ 팀/선수 브랜드 배경 금지 (T1 본진, 페이커의 서재 등)
const BACKGROUNDS = [
    { name: '기본 배경',    rarity: 'COMMON',    gpCost: 0,    condition: 'DEFAULT',     description: '기본 프로필 배경',              imageUrl: '/backgrounds/default.jpg' },
    { name: 'LCK 아레나',  rarity: 'UNCOMMON',  gpCost: 1000, description: 'LCK 경기장 배경',              imageUrl: '/backgrounds/lck-arena.jpg' },
    { name: '픽셀 레트로', rarity: 'UNCOMMON',  gpCost: 1200, description: '레트로 픽셀 아트 스타일 배경',  imageUrl: '/backgrounds/pixel.jpg' },
    { name: '월드컵 무대', rarity: 'EPIC',      gpCost: 5000, description: '리그 오브 레전드 월드 챔피언십 배경', imageUrl: '/backgrounds/worlds.jpg' },
    { name: '갤럭시',      rarity: 'EPIC',      gpCost: 6000, description: '우주를 담은 신비로운 배경',      imageUrl: '/backgrounds/galaxy.jpg' },
    { name: '챌린저 배경', rarity: 'LEGENDARY', gpCost: 0,    condition: 'TOP_10_RANK', description: '랭킹 10위 이내 달성 시 지급',   imageUrl: '/backgrounds/challenger.jpg' },
]

// ─── 스티커 (STICKER) ────────────────────────────────────────────────────────
// ⚠️ 팀 로고 스티커 전면 금지 (저작권) — 일반 이모지/이벤트 스티커만 허용
// ⚠️ 특정 실제 선수 이름 스티커 금지
const STICKERS = [
    // 이벤트 스티커
    { name: '펜타킬!',    emoji: '⚔️', rarity: 'RARE',      gpCost: 500,  description: '펜타킬 달성 기념 스티커' },
    { name: '전략의 신',  emoji: '🧠', rarity: 'RARE',      gpCost: 500,  description: '탁월한 전략을 상징하는 스티커' },
    { name: '불꽃 감독',  emoji: '🔥', rarity: 'RARE',      gpCost: 600,  description: '열정적인 감독을 상징하는 스티커' },
    { name: '트로피',     emoji: '🏆', rarity: 'EPIC',      gpCost: 1500, description: '우승을 상징하는 황금 트로피 스티커' },
    { name: '크리티컬!',  emoji: '💥', rarity: 'UNCOMMON',  gpCost: 300,  description: '크리티컬 히트 스티커' },
    { name: '분석 중...', emoji: '📊', rarity: 'COMMON',    gpCost: 100,  description: '데이터 분석가 스티커' },
    { name: '잠못자요',   emoji: '😤', rarity: 'COMMON',    gpCost: 100,  description: '밤새 경기를 분석하는 스티커' },
    { name: 'GG',         emoji: '🤝', rarity: 'COMMON',    gpCost: 100,  description: '페어플레이 정신 스티커' },
    { name: '???',        emoji: '🤔', rarity: 'COMMON',    gpCost: 100,  description: '당황한 감독 스티커' },
    { name: '월즈 우승',  emoji: '🌍', rarity: 'LEGENDARY', gpCost: 8000, description: '월드 챔피언십 우승을 기념하는 전설 스티커' },

    // 이모지 기반 표정 스티커 (저렴)
    { name: '화이팅!', emoji: '💪', rarity: 'COMMON', gpCost: 80, description: '응원의 스티커' },
    { name: '집중!',   emoji: '👀', rarity: 'COMMON', gpCost: 80, description: '집중하는 스티커' },
    { name: '승리!',   emoji: '✌️', rarity: 'COMMON', gpCost: 80, description: '승리를 자축하는 스티커' },
    { name: '아쉽다',  emoji: '😢', rarity: 'COMMON', gpCost: 80, description: '아쉬운 패배 스티커' },
]

// ─── 플레이어 카드 스킨 (PLAYER_CARD) ────────────────────────────────────────
const PLAYER_CARD_SKINS = [
    { name: '기본 카드',    rarity: 'COMMON',    gpCost: 0,    condition: 'DEFAULT',          description: '기본 선수 카드 디자인' },
    { name: '홀로그램 카드', rarity: 'RARE',     gpCost: 2000, description: '홀로그램 효과가 적용된 카드', imageUrl: '/card-skins/hologram.png' },
    { name: '네온 카드',    rarity: 'EPIC',      gpCost: 5000, description: '네온 빛으로 빛나는 카드',    imageUrl: '/card-skins/neon.png' },
    { name: '황금 카드',    rarity: 'LEGENDARY', gpCost: 8000, description: '황금으로 도금된 카드',       imageUrl: '/card-skins/gold.png' },
    { name: 'LCK 공식 카드', rarity: 'EPIC',     gpCost: 0,    condition: 'LCK_SEASON_REWARD', description: 'LCK 공식 시즌 보상 카드 디자인', imageUrl: '/card-skins/lck-official.png' },
]

// ─── 아바타 (AVATAR) ─────────────────────────────────────────────────────────
// ⚠️ 팀 마스코트/선수 실루엣 아바타 금지 (T1 라이온, 페이커 실루엣 등)
const AVATARS = [
    { name: '기본 아바타',      rarity: 'COMMON',    gpCost: 0,    condition: 'DEFAULT',   description: '기본 프로필 아바타',        imageUrl: '/avatars/default.png' },
    { name: '마스코트 - 드래곤', rarity: 'UNCOMMON',  gpCost: 600,  description: '귀여운 드래곤 마스코트',    imageUrl: '/avatars/dragon.png' },
    { name: '마스코트 - 바론',   rarity: 'RARE',      gpCost: 1800, description: '강력한 바론 마스코트',      imageUrl: '/avatars/baron.png' },
    { name: '마스코트 - 내셔',   rarity: 'UNCOMMON',  gpCost: 600,  description: '내셔 남작 마스코트',        imageUrl: '/avatars/nashor.png' },
    { name: '픽셀 감독',        rarity: 'UNCOMMON',  gpCost: 800,  description: '레트로 픽셀 스타일 감독 아바타', imageUrl: '/avatars/pixel-manager.png' },
    { name: '챌린저 아바타',    rarity: 'LEGENDARY', gpCost: 0,    condition: 'TOP_10_RANK', description: '랭킹 10위 이내 달성 시 지급', imageUrl: '/avatars/challenger.png' },
]

// ─── 삭제 대상 ID 목록 (저작권·구버전) ──────────────────────────────────────
const ITEMS_TO_DELETE = [
    // 구버전 팀 팬 칭호 (형식 통일 전)
    'title-T1-열혈-팬', 'title-GEN.G-지지자', 'title-HLE-홍군',
    'title-KT-롤스터-팬', 'title-DRX-드래곤',
    // 팀 로고 스티커 (저작권 — 전면 금지)
    'sticker-T1-로고', 'sticker-GEN.G-로고', 'sticker-HLE-로고',
    'sticker-KT-로고', 'sticker-DK-로고',
    // 특정 선수 이름 아이템 (IP 침해 우려)
    'sticker-페이커',
    'bg-페이커의-서재',
    'avatar-페이커-실루엣',
    // 팀 브랜드 아이템 (로고/색상 직접 사용)
    'frame-T1-프레임', 'frame-GEN.G-프레임',
    'bg-T1-본진',
    'avatar-T1-라이온',
]

async function main() {
    console.log('🎨 코스메틱 시드 시작...')

    // ── STEP 1: UUID 기반 레거시 아이템 완전 삭제 ──────────────────────────────
    // 이전 세션에서 자동 생성된 UUID ID 아이템 (80,000 GP짜리 등)을 DB에서 제거
    // UserCosmeticItem FK 먼저 정리 → CosmeticItem 삭제
    const uuidPattern = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

    const delUCI = await prisma.$executeRawUnsafe(
        `DELETE FROM "UserCosmeticItem" WHERE "itemId" ~ $1`, uuidPattern
    )
    const delAI = await prisma.$executeRawUnsafe(
        `DELETE FROM "AI_TICKET" WHERE id ~ $1`, uuidPattern
    ).catch(() => 0) // AI_TICKET 테이블 없을 수도 있음
    const delUUID = await prisma.$executeRawUnsafe(
        `DELETE FROM "CosmeticItem" WHERE id ~ $1`, uuidPattern
    )
    if (Number(delUUID) > 0) {
        console.log(`  🗑️  구버전 UUID 아이템 ${delUUID}개 삭제 (관련 소유 기록 ${delUCI}개 포함)`)
    }

    // ── STEP 2: 저작권·구버전 Named 아이템 삭제 ─────────────────────────────
    // UserCosmeticItem FK 먼저 정리
    await prisma.userCosmeticItem.deleteMany({
        where: { itemId: { in: ITEMS_TO_DELETE } }
    })
    const deletedNamed = await prisma.cosmeticItem.deleteMany({
        where: { id: { in: ITEMS_TO_DELETE } }
    })
    if (deletedNamed.count > 0) {
        console.log(`  🗑️  저작권·구버전 아이템 ${deletedNamed.count}개 삭제`)
    }

    let total = 0

    // ── STEP 3: 현재 아이템 Upsert ──────────────────────────────────────────

    // 칭호
    for (const t of TITLES) {
        await prisma.cosmeticItem.upsert({
            where:  { id: `title-${t.name.replace(/\s/g, '-')}` },
            create: { id: `title-${t.name.replace(/\s/g, '-')}`, type: 'TITLE', ...t },
            update: { ...t },
        })
        total++
    }
    console.log(`  ✅ 칭호 ${TITLES.length}개`)

    // 프레임
    for (const f of FRAMES) {
        await prisma.cosmeticItem.upsert({
            where:  { id: `frame-${f.name.replace(/\s/g, '-')}` },
            create: { id: `frame-${f.name.replace(/\s/g, '-')}`, type: 'PROFILE_FRAME', ...f },
            update: { ...f },
        })
        total++
    }
    console.log(`  ✅ 프레임 ${FRAMES.length}개`)

    // 배경
    for (const b of BACKGROUNDS) {
        await prisma.cosmeticItem.upsert({
            where:  { id: `bg-${b.name.replace(/\s/g, '-')}` },
            create: { id: `bg-${b.name.replace(/\s/g, '-')}`, type: 'BACKGROUND', ...b },
            update: { ...b },
        })
        total++
    }
    console.log(`  ✅ 배경 ${BACKGROUNDS.length}개`)

    // 스티커
    for (const s of STICKERS) {
        const { emoji, relatedTeam, relatedPlayer, ...cosmeticFields } = s as any
        const stickerData = { ...cosmeticFields, imageUrl: emoji ?? cosmeticFields.imageUrl ?? null }
        await prisma.cosmeticItem.upsert({
            where:  { id: `sticker-${s.name.replace(/\s/g, '-')}` },
            create: { id: `sticker-${s.name.replace(/\s/g, '-')}`, type: 'STICKER', ...stickerData },
            update: { ...stickerData },
        })
        total++
    }
    console.log(`  ✅ 스티커 ${STICKERS.length}개`)

    // 카드 스킨
    for (const c of PLAYER_CARD_SKINS) {
        await prisma.cosmeticItem.upsert({
            where:  { id: `card-skin-${c.name.replace(/\s/g, '-')}` },
            create: { id: `card-skin-${c.name.replace(/\s/g, '-')}`, type: 'PLAYER_CARD', ...c },
            update: { ...c },
        })
        total++
    }
    console.log(`  ✅ 카드 스킨 ${PLAYER_CARD_SKINS.length}개`)

    // 아바타
    for (const a of AVATARS) {
        await prisma.cosmeticItem.upsert({
            where:  { id: `avatar-${a.name.replace(/\s/g, '-')}` },
            create: { id: `avatar-${a.name.replace(/\s/g, '-')}`, type: 'AVATAR', ...a },
            update: { ...a },
        })
        total++
    }
    console.log(`  ✅ 아바타 ${AVATARS.length}개`)

    console.log(`\n🎉 총 ${total}개 코스메틱 아이템 시드 완료!`)

    // 최종 DB 개수 확인
    const dbCount = await prisma.cosmeticItem.count()
    console.log(`📊 DB 실제 보유 아이템: ${dbCount}개`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
