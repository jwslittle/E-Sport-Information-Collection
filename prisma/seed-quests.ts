/**
 * 퀘스트 & 업적 시드
 * npx tsx prisma/seed-quests.ts
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const DAILY_QUESTS = [
    { id: 'dq-login',        title: '오늘의 접속',    description: '오늘 서비스에 접속하기',           category: 'GENERAL',    icon: '🌅', targetCount: 1, rewardGp: 30  },
    { id: 'dq-predict-1',   title: '오늘의 예측',    description: '오늘 경기 결과 1건 예측하기',       category: 'PREDICTION', icon: '🎯', targetCount: 1, rewardGp: 50  },
    { id: 'dq-predict-3',   title: '예측 전문가',    description: '오늘 경기 결과 3건 예측하기',       category: 'PREDICTION', icon: '📊', targetCount: 3, rewardGp: 100 },
    { id: 'dq-check-match', title: '경기 확인',      description: '경기 일정 페이지 방문하기',         category: 'GENERAL',    icon: '📅', targetCount: 1, rewardGp: 20  },
    { id: 'dq-check-player',title: '선수 스카우팅',  description: '선수 상세 페이지 1명 확인하기',     category: 'FANTASY',    icon: '🔍', targetCount: 1, rewardGp: 30  },
    { id: 'dq-ai-chat',     title: 'AI와 대화',      description: 'AI 분석가와 1회 대화하기',          category: 'GENERAL',    icon: '🤖', targetCount: 1, rewardGp: 40  },
]

const WEEKLY_QUESTS = [
    { id: 'wq-predict-5',       title: '이번 주 예측왕',  description: '이번 주 경기 5건 예측하기',       category: 'PREDICTION', icon: '🏆', targetCount: 5, rewardGp: 200 },
    { id: 'wq-predict-correct', title: '예측 적중',       description: '이번 주 예측 3건 적중하기',       category: 'PREDICTION', icon: '✅', targetCount: 3, rewardGp: 300 },
    { id: 'wq-team-update',     title: '로스터 관리',     description: '이번 주 팀 로스터 수정하기',      category: 'FANTASY',    icon: '⚙️', targetCount: 1, rewardGp: 100 },
    { id: 'wq-login-5',         title: '꾸준한 감독',     description: '이번 주 5일 이상 접속하기',       category: 'GENERAL',    icon: '📆', targetCount: 5, rewardGp: 150 },
    { id: 'wq-gacha-3',         title: '카드 수집가',     description: '이번 주 카드팩 3개 개봉하기',     category: 'COLLECTION', icon: '🃏', targetCount: 3, rewardGp: 120 },
    { id: 'wq-check-history',   title: '역사학자',        description: '역대 기록 페이지 방문하기',       category: 'GENERAL',    icon: '📚', targetCount: 1, rewardGp: 80  },
]

const ACHIEVEMENTS = [
    { id: 'ach-predict-first',   title: '첫 예측',             description: '경기 결과를 처음으로 예측하다',     category: 'PREDICTION', icon: '🎯', targetCount: 1,    rewardGp: 100  },
    { id: 'ach-predict-10',      title: '예측 10회',            description: '경기 결과를 10회 예측하다',         category: 'PREDICTION', icon: '📊', targetCount: 10,   rewardGp: 200  },
    { id: 'ach-predict-50',      title: '예측 50회',            description: '경기 결과를 50회 예측하다',         category: 'PREDICTION', icon: '📈', targetCount: 50,   rewardGp: 500  },
    { id: 'ach-correct-streak-5',title: '연속 5회 적중',        description: '예측을 5회 연속으로 맞히다',        category: 'PREDICTION', icon: '🔥', targetCount: 5,    rewardGp: 500  },
    { id: 'ach-correct-streak-10',title:'연속 10회 적중',       description: '예측을 10회 연속으로 맞히다',       category: 'PREDICTION', icon: '⚡', targetCount: 10,   rewardGp: 1500 },
    { id: 'ach-team-first',      title: '첫 팀 결성',           description: '나의 첫 번째 판타지 팀을 구성하다', category: 'FANTASY',    icon: '⚽', targetCount: 1,    rewardGp: 100  },
    { id: 'ach-points-100',      title: '포인트 100 돌파',      description: '판타지 팀 총 포인트 100 달성',      category: 'FANTASY',    icon: '💯', targetCount: 100,  rewardGp: 200  },
    { id: 'ach-points-500',      title: '포인트 500 돌파',      description: '판타지 팀 총 포인트 500 달성',      category: 'FANTASY',    icon: '🌟', targetCount: 500,  rewardGp: 500  },
    { id: 'ach-points-1000',     title: '포인트 1000 돌파',     description: '판타지 팀 총 포인트 1000 달성',     category: 'FANTASY',    icon: '💫', targetCount: 1000, rewardGp: 1000 },
    { id: 'ach-card-first',      title: '첫 카드',              description: '선수 카드를 처음으로 획득하다',     category: 'COLLECTION', icon: '🃏', targetCount: 1,    rewardGp: 100  },
    { id: 'ach-card-10',         title: '카드 10장',            description: '선수 카드 10장 보유',               category: 'COLLECTION', icon: '📦', targetCount: 10,   rewardGp: 300  },
    { id: 'ach-card-30',         title: '카드 30장',            description: '선수 카드 30장 보유',               category: 'COLLECTION', icon: '🗃️', targetCount: 30,   rewardGp: 600  },
    { id: 'ach-gold-card',       title: '골드 카드 획득',       description: 'GOLD 등급 이상 카드 획득',          category: 'COLLECTION', icon: '✨', targetCount: 1,    rewardGp: 300  },
    { id: 'ach-challenger-card', title: '챌린저 카드 획득',     description: 'CHALLENGER 등급 카드 획득',         category: 'COLLECTION', icon: '👑', targetCount: 1,    rewardGp: 2000 },
    { id: 'ach-login-7',         title: '7일 연속 접속',        description: '7일 연속으로 접속하다',             category: 'GENERAL',    icon: '📅', targetCount: 7,    rewardGp: 300  },
    { id: 'ach-login-30',        title: '30일 접속',            description: '총 30일 이상 접속하다',             category: 'GENERAL',    icon: '🗓️', targetCount: 30,   rewardGp: 700  },
    { id: 'ach-ai-10',           title: 'AI 단골손님',          description: 'AI 분석가와 10회 대화하다',         category: 'GENERAL',    icon: '🤖', targetCount: 10,   rewardGp: 200  },
    { id: 'ach-gp-1000',         title: 'GP 1000 달성',         description: '보유 GP 1000 이상',                 category: 'GENERAL',    icon: '💰', targetCount: 1000, rewardGp: 200  },
    { id: 'ach-gp-5000',         title: 'GP 5000 달성',         description: '보유 GP 5000 이상',                 category: 'GENERAL',    icon: '💎', targetCount: 5000, rewardGp: 500  },
    { id: 'ach-cosmetic-first',  title: '첫 코스메틱',          description: '코스메틱 아이템을 처음으로 획득',   category: 'COLLECTION', icon: '🎨', targetCount: 1,    rewardGp: 150  },
]

async function main() {
    console.log('🎮 퀘스트 시드 시작...')
    let total = 0

    for (const q of DAILY_QUESTS) {
        await prisma.quest.upsert({ where: { id: q.id }, create: { ...q, type: 'DAILY' }, update: { ...q, type: 'DAILY' } })
        total++
    }
    console.log(`  ✅ 일일 퀘스트 ${DAILY_QUESTS.length}개`)

    for (const q of WEEKLY_QUESTS) {
        await prisma.quest.upsert({ where: { id: q.id }, create: { ...q, type: 'WEEKLY' }, update: { ...q, type: 'WEEKLY' } })
        total++
    }
    console.log(`  ✅ 주간 퀘스트 ${WEEKLY_QUESTS.length}개`)

    for (const a of ACHIEVEMENTS) {
        await prisma.quest.upsert({ where: { id: a.id }, create: { ...a, type: 'ACHIEVEMENT' }, update: { ...a, type: 'ACHIEVEMENT' } })
        total++
    }
    console.log(`  ✅ 업적 ${ACHIEVEMENTS.length}개`)

    console.log(`\n🎉 총 ${total}개 퀘스트/업적 시드 완료!`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
