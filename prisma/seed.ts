/**
 * E-Sport SuperTeam — 가상 판타지 리그 시드 데이터
 *
 * 판타지 게임은 완전히 가상의 팀/선수를 사용합니다.
 * 실제 선수/팀명과 무관하며 저작권 문제가 없습니다.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ─── 가상 팀 10개 ────────────────────────────────────────────────────
const VIRTUAL_TEAMS = [
    { code: 'NGD', name: 'Nexus Guardians', shortName: 'NGD', primaryColor: '#1E90FF' },
    { code: 'VTX', name: 'Vortex Raiders',  shortName: 'VTX', primaryColor: '#8B00FF' },
    { code: 'IFN', name: 'Iron Phoenix',    shortName: 'IFN', primaryColor: '#FF4500' },
    { code: 'SSK', name: 'Storm Seekers',   shortName: 'SSK', primaryColor: '#00CED1' },
    { code: 'NWV', name: 'Neon Wolves',     shortName: 'NWV', primaryColor: '#32CD32' },
    { code: 'SFX', name: 'Shadow Foxes',    shortName: 'SFX', primaryColor: '#708090' },
    { code: 'BTN', name: 'Blaze Titans',    shortName: 'BTN', primaryColor: '#FFD700' },
    { code: 'FGN', name: 'Frost Giants',    shortName: 'FGN', primaryColor: '#87CEEB' },
    { code: 'CDR', name: 'Cipher Dragons',  shortName: 'CDR', primaryColor: '#FF1493' },
    { code: 'AKT', name: 'Aurora Knights',  shortName: 'AKT', primaryColor: '#9370DB' },
]

// ─── 가상 선수 50명 (팀당 5명, 포지션당 1명) ────────────────────────
// price: 판타지 샐러리캡 비용 (4~15 범위)
// stats: 시뮬레이션 및 포인트 계산에 사용되는 수치
const VIRTUAL_PLAYERS = [
    // ── NGD - Nexus Guardians ─────────────────────────────────────
    { team: 'NGD', name: 'Aegis',   position: 'TOP',     price:  7, kda: 3.1, csm: 8.1, dpm: 545, kp: 0.55, vision: 1.2, avgK: 3.0, avgD: 2.8, avgA: 5.5 },
    { team: 'NGD', name: 'Shadow',  position: 'JUNGLE',  price: 10, kda: 4.3, csm: 5.8, dpm: 375, kp: 0.68, vision: 2.7, avgK: 3.5, avgD: 2.0, avgA: 7.2 },
    { team: 'NGD', name: 'Blaze',   position: 'MID',     price: 14, kda: 5.8, csm: 9.9, dpm: 770, kp: 0.67, vision: 1.5, avgK: 5.8, avgD: 2.0, avgA: 6.5 },
    { team: 'NGD', name: 'Bullet',  position: 'ADC',     price: 11, kda: 5.4, csm: 9.7, dpm: 705, kp: 0.63, vision: 1.3, avgK: 5.2, avgD: 1.8, avgA: 6.0 },
    { team: 'NGD', name: 'Oracle',  position: 'SUPPORT', price:  8, kda: 4.0, csm: 1.1, dpm: 225, kp: 0.69, vision: 3.3, avgK: 1.2, avgD: 2.5, avgA: 8.5 },

    // ── VTX - Vortex Raiders ─────────────────────────────────────
    { team: 'VTX', name: 'Bastion', position: 'TOP',     price: 11, kda: 3.9, csm: 8.6, dpm: 605, kp: 0.57, vision: 1.5, avgK: 3.5, avgD: 2.2, avgA: 6.5 },
    { team: 'VTX', name: 'Viper',   position: 'JUNGLE',  price: 13, kda: 4.9, csm: 6.1, dpm: 415, kp: 0.70, vision: 2.9, avgK: 4.2, avgD: 1.8, avgA: 8.0 },
    { team: 'VTX', name: 'Storm',   position: 'MID',     price:  9, kda: 4.1, csm: 9.0, dpm: 635, kp: 0.60, vision: 1.4, avgK: 4.0, avgD: 2.3, avgA: 5.5 },
    { team: 'VTX', name: 'Arrow',   position: 'ADC',     price:  8, kda: 4.6, csm: 9.3, dpm: 668, kp: 0.60, vision: 1.3, avgK: 4.5, avgD: 2.1, avgA: 5.2 },
    { team: 'VTX', name: 'Sage',    position: 'SUPPORT', price:  9, kda: 4.3, csm: 1.1, dpm: 240, kp: 0.72, vision: 3.5, avgK: 1.3, avgD: 2.3, avgA: 9.0 },

    // ── IFN - Iron Phoenix ───────────────────────────────────────
    { team: 'IFN', name: 'Colossus', position: 'TOP',    price:  9, kda: 3.6, csm: 8.3, dpm: 570, kp: 0.56, vision: 1.3, avgK: 3.3, avgD: 2.4, avgA: 6.0 },
    { team: 'IFN', name: 'Ghost',    position: 'JUNGLE', price:  7, kda: 3.6, csm: 5.5, dpm: 330, kp: 0.63, vision: 2.3, avgK: 2.8, avgD: 2.3, avgA: 6.5 },
    { team: 'IFN', name: 'Frost',    position: 'MID',    price: 13, kda: 5.5, csm: 9.8, dpm: 755, kp: 0.66, vision: 1.5, avgK: 5.5, avgD: 2.0, avgA: 6.2 },
    { team: 'IFN', name: 'Bolt',     position: 'ADC',    price: 14, kda: 6.2, csm:10.4, dpm: 755, kp: 0.64, vision: 1.4, avgK: 6.0, avgD: 1.7, avgA: 6.5 },
    { team: 'IFN', name: 'Mystic',   position: 'SUPPORT',price:  7, kda: 3.5, csm: 1.0, dpm: 205, kp: 0.67, vision: 3.1, avgK: 1.0, avgD: 2.6, avgA: 8.0 },

    // ── SSK - Storm Seekers ──────────────────────────────────────
    { team: 'SSK', name: 'Fortress', position: 'TOP',    price: 12, kda: 4.2, csm: 8.7, dpm: 615, kp: 0.58, vision: 1.6, avgK: 3.8, avgD: 2.1, avgA: 6.8 },
    { team: 'SSK', name: 'Hunter',   position: 'JUNGLE', price:  9, kda: 4.0, csm: 5.7, dpm: 355, kp: 0.65, vision: 2.5, avgK: 3.2, avgD: 2.1, avgA: 7.0 },
    { team: 'SSK', name: 'Nova',     position: 'MID',    price: 10, kda: 4.5, csm: 9.2, dpm: 680, kp: 0.62, vision: 1.4, avgK: 4.3, avgD: 2.2, avgA: 5.8 },
    { team: 'SSK', name: 'Laser',    position: 'ADC',    price: 11, kda: 5.3, csm: 9.6, dpm: 700, kp: 0.62, vision: 1.3, avgK: 5.0, avgD: 1.9, avgA: 5.8 },
    { team: 'SSK', name: 'Aura',     position: 'SUPPORT',price:  8, kda: 4.0, csm: 1.1, dpm: 230, kp: 0.71, vision: 3.4, avgK: 1.2, avgD: 2.4, avgA: 8.8 },

    // ── NWV - Neon Wolves ────────────────────────────────────────
    { team: 'NWV', name: 'Rampart',  position: 'TOP',    price:  6, kda: 2.8, csm: 7.9, dpm: 490, kp: 0.52, vision: 1.1, avgK: 2.6, avgD: 2.7, avgA: 5.2 },
    { team: 'NWV', name: 'Cobra',    position: 'JUNGLE', price: 11, kda: 4.5, csm: 5.9, dpm: 385, kp: 0.67, vision: 2.7, avgK: 3.8, avgD: 1.9, avgA: 7.5 },
    { team: 'NWV', name: 'Arc',      position: 'MID',    price: 11, kda: 4.8, csm: 9.3, dpm: 695, kp: 0.63, vision: 1.4, avgK: 4.6, avgD: 2.1, avgA: 5.9 },
    { team: 'NWV', name: 'Sniper',   position: 'ADC',    price: 14, kda: 6.0, csm:10.3, dpm: 748, kp: 0.64, vision: 1.4, avgK: 5.8, avgD: 1.7, avgA: 6.3 },
    { team: 'NWV', name: 'Pulse',    position: 'SUPPORT',price:  8, kda: 3.8, csm: 1.0, dpm: 218, kp: 0.70, vision: 3.3, avgK: 1.1, avgD: 2.5, avgA: 8.5 },

    // ── SFX - Shadow Foxes ───────────────────────────────────────
    { team: 'SFX', name: 'Boulder',  position: 'TOP',    price:  8, kda: 3.3, csm: 8.2, dpm: 555, kp: 0.54, vision: 1.2, avgK: 3.1, avgD: 2.6, avgA: 5.8 },
    { team: 'SFX', name: 'Phantom',  position: 'JUNGLE', price: 14, kda: 5.1, csm: 6.2, dpm: 420, kp: 0.71, vision: 3.0, avgK: 4.4, avgD: 1.7, avgA: 8.2 },
    { team: 'SFX', name: 'Volt',     position: 'MID',    price:  8, kda: 4.0, csm: 8.9, dpm: 625, kp: 0.60, vision: 1.3, avgK: 3.9, avgD: 2.3, avgA: 5.4 },
    { team: 'SFX', name: 'Flash',    position: 'ADC',    price: 10, kda: 5.0, csm: 9.5, dpm: 688, kp: 0.61, vision: 1.3, avgK: 4.8, avgD: 2.0, avgA: 5.5 },
    { team: 'SFX', name: 'Ember',    position: 'SUPPORT',price: 10, kda: 4.3, csm: 1.2, dpm: 248, kp: 0.72, vision: 3.6, avgK: 1.3, avgD: 2.2, avgA: 9.0 },

    // ── BTN - Blaze Titans ───────────────────────────────────────
    { team: 'BTN', name: 'Titan',    position: 'TOP',    price: 13, kda: 4.4, csm: 8.9, dpm: 670, kp: 0.59, vision: 1.7, avgK: 4.0, avgD: 2.0, avgA: 6.7 },
    { team: 'BTN', name: 'Reaper',   position: 'JUNGLE', price:  8, kda: 3.7, csm: 5.6, dpm: 340, kp: 0.64, vision: 2.4, avgK: 3.0, avgD: 2.2, avgA: 6.8 },
    { team: 'BTN', name: 'Surge',    position: 'MID',    price: 12, kda: 5.2, csm: 9.6, dpm: 730, kp: 0.65, vision: 1.5, avgK: 5.0, avgD: 2.1, avgA: 6.0 },
    { team: 'BTN', name: 'Striker',  position: 'ADC',    price:  9, kda: 4.8, csm: 9.4, dpm: 676, kp: 0.61, vision: 1.3, avgK: 4.6, avgD: 2.1, avgA: 5.5 },
    { team: 'BTN', name: 'Beacon',   position: 'SUPPORT',price:  8, kda: 3.8, csm: 1.0, dpm: 215, kp: 0.70, vision: 3.3, avgK: 1.1, avgD: 2.5, avgA: 8.3 },

    // ── FGN - Frost Giants ───────────────────────────────────────
    { team: 'FGN', name: 'Sentinel', position: 'TOP',    price: 10, kda: 3.8, csm: 8.4, dpm: 588, kp: 0.56, vision: 1.4, avgK: 3.4, avgD: 2.3, avgA: 6.2 },
    { team: 'FGN', name: 'Stalker',  position: 'JUNGLE', price: 10, kda: 4.2, csm: 5.8, dpm: 365, kp: 0.66, vision: 2.6, avgK: 3.4, avgD: 2.1, avgA: 7.1 },
    { team: 'FGN', name: 'Flux',     position: 'MID',    price:  7, kda: 3.8, csm: 8.8, dpm: 608, kp: 0.59, vision: 1.3, avgK: 3.7, avgD: 2.4, avgA: 5.3 },
    { team: 'FGN', name: 'Trigger',  position: 'ADC',    price: 13, kda: 5.8, csm:10.2, dpm: 740, kp: 0.63, vision: 1.4, avgK: 5.6, avgD: 1.8, avgA: 6.2 },
    { team: 'FGN', name: 'Shield',   position: 'SUPPORT',price: 10, kda: 4.2, csm: 1.1, dpm: 235, kp: 0.72, vision: 3.5, avgK: 1.3, avgD: 2.3, avgA: 8.9 },

    // ── CDR - Cipher Dragons ─────────────────────────────────────
    { team: 'CDR', name: 'Ironclad', position: 'TOP',    price:  9, kda: 3.5, csm: 8.3, dpm: 565, kp: 0.55, vision: 1.3, avgK: 3.2, avgD: 2.5, avgA: 6.0 },
    { team: 'CDR', name: 'Wraith',   position: 'JUNGLE', price: 12, kda: 4.7, csm: 6.0, dpm: 405, kp: 0.69, vision: 2.8, avgK: 4.0, avgD: 1.9, avgA: 7.8 },
    { team: 'CDR', name: 'Zap',      position: 'MID',    price:  9, kda: 4.2, csm: 9.1, dpm: 648, kp: 0.61, vision: 1.4, avgK: 4.1, avgD: 2.2, avgA: 5.6 },
    { team: 'CDR', name: 'Ace',      position: 'ADC',    price: 12, kda: 5.6, csm:10.0, dpm: 725, kp: 0.63, vision: 1.3, avgK: 5.4, avgD: 1.9, avgA: 6.1 },
    { team: 'CDR', name: 'Ward',     position: 'SUPPORT',price:  8, kda: 3.8, csm: 1.0, dpm: 212, kp: 0.69, vision: 3.2, avgK: 1.1, avgD: 2.5, avgA: 8.2 },

    // ── AKT - Aurora Knights ─────────────────────────────────────
    { team: 'AKT', name: 'Vanguard', position: 'TOP',    price:  8, kda: 3.3, csm: 8.1, dpm: 548, kp: 0.54, vision: 1.2, avgK: 3.0, avgD: 2.6, avgA: 5.7 },
    { team: 'AKT', name: 'Lynx',     position: 'JUNGLE', price:  9, kda: 3.9, csm: 5.7, dpm: 350, kp: 0.64, vision: 2.5, avgK: 3.1, avgD: 2.2, avgA: 6.9 },
    { team: 'AKT', name: 'Echo',     position: 'MID',    price: 14, kda: 6.0, csm: 9.9, dpm: 775, kp: 0.68, vision: 1.6, avgK: 5.9, avgD: 2.0, avgA: 6.6 },
    { team: 'AKT', name: 'Swift',    position: 'ADC',    price: 11, kda: 5.2, csm: 9.6, dpm: 698, kp: 0.62, vision: 1.3, avgK: 5.0, avgD: 1.9, avgA: 5.8 },
    { team: 'AKT', name: 'Halo',     position: 'SUPPORT',price:  8, kda: 3.9, csm: 1.1, dpm: 220, kp: 0.71, vision: 3.4, avgK: 1.2, avgD: 2.4, avgA: 8.7 },
]

// ─── 메인 ───────────────────────────────────────────────────────────
async function main() {
    console.log('🌱 가상 판타지 리그 시드 시작...\n')

    // 1. 기존 데이터 정리
    console.log('🧹 기존 데이터 정리 중...')
    await prisma.player.deleteMany({})
    await prisma.team.deleteMany({})
    console.log('  ✅ 기존 데이터 정리 완료')

    // 2. 가상 팀 10개 생성
    console.log('\n🏟️  가상 팀 생성 중...')
    for (const t of VIRTUAL_TEAMS) {
        await prisma.team.upsert({
            where: { code: t.code },
            create: t,
            update: t,
        })
    }
    console.log(`  ✅ 가상 팀 ${VIRTUAL_TEAMS.length}개 생성 완료`)
    console.log('  팀 목록:', VIRTUAL_TEAMS.map(t => `${t.code}(${t.name})`).join(', '))

    // 3. 가상 선수 50명 생성
    console.log('\n👤 가상 선수 생성 중...')
    const allTeams = await prisma.team.findMany()
    const teamMap = new Map(allTeams.map(t => [t.code, t.id]))

    for (const p of VIRTUAL_PLAYERS) {
        const teamId = teamMap.get(p.team)
        if (!teamId) { console.warn(`  ⚠️ 팀 없음: ${p.team}`); continue }

        const playerData = {
            position: p.position,
            status: 'ACTIVE',
            basePrice: p.price,
            teamId,
            stats: {
                kda:        p.kda,
                csm:        p.csm,
                dpm:        p.dpm,
                kp:         p.kp,
                vision:     p.vision,
                avgKills:   p.avgK,
                avgDeaths:  p.avgD,
                avgAssists: p.avgA,
                avgCS:      Math.round(p.csm * 30),
                avgDamage:  Math.round(p.dpm * 30),
                avgVision:  Math.round(p.vision * 30),
            },
        }
        await prisma.player.upsert({
            where: { name_teamId: { name: p.name, teamId } },
            create: { name: p.name, ...playerData },
            update: playerData,
        })
    }
    console.log(`  ✅ 가상 선수 ${VIRTUAL_PLAYERS.length}명 생성 완료`)

    // 포지션별 통계
    const positions = ['TOP','JUNGLE','MID','ADC','SUPPORT']
    for (const pos of positions) {
        const posPlayers = VIRTUAL_PLAYERS.filter(p => p.position === pos)
        const prices = posPlayers.map(p => p.price)
        console.log(`  ${pos}: ${posPlayers.length}명 (가격 ${Math.min(...prices)}~${Math.max(...prices)}, 평균 ${(prices.reduce((a,b)=>a+b,0)/prices.length).toFixed(1)})`)
    }

    // 4. 어드민 계정 생성
    console.log('\n👑 어드민 계정 설정...')
    const admin = await prisma.user.findFirst({ where: { email: 'jwslittle@gmail.com' } })
    if (admin) {
        await prisma.user.update({
            where: { id: admin.id },
            data: { role: 'ADMIN', gp: 9999 },
        })
        console.log('  ✅ 어드민 권한 부여 완료')
    } else {
        console.log('  ℹ️  어드민 계정 없음 (로그인 후 자동 설정됨)')
    }

    console.log('\n🎉 시드 완료!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`  가상 팀: ${VIRTUAL_TEAMS.length}개`)
    console.log(`  가상 선수: ${VIRTUAL_PLAYERS.length}명`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch(console.error).finally(() => prisma.$disconnect())
