/**
 * 가상 판타지 리그 — 시뮬레이션용 선수 기본 스탯
 * 모든 선수는 완전히 가상의 캐릭터이며 실제 인물과 무관합니다.
 */

export const PLAYER_BASE_STATS: Record<string, {
    kda: number; csm: number; dpm: number; kp: number; vision: number
}> = {
    // ── NGD - Nexus Guardians ──────────────────────────────────────
    'Aegis':    { kda: 3.1, csm: 8.1, dpm: 545, kp: 0.55, vision: 1.2 },
    'Shadow':   { kda: 4.3, csm: 5.8, dpm: 375, kp: 0.68, vision: 2.7 },
    'Blaze':    { kda: 5.8, csm: 9.9, dpm: 770, kp: 0.67, vision: 1.5 },
    'Bullet':   { kda: 5.4, csm: 9.7, dpm: 705, kp: 0.63, vision: 1.3 },
    'Oracle':   { kda: 4.0, csm: 1.1, dpm: 225, kp: 0.69, vision: 3.3 },

    // ── VTX - Vortex Raiders ──────────────────────────────────────
    'Bastion':  { kda: 3.9, csm: 8.6, dpm: 605, kp: 0.57, vision: 1.5 },
    'Viper':    { kda: 4.9, csm: 6.1, dpm: 415, kp: 0.70, vision: 2.9 },
    'Storm':    { kda: 4.1, csm: 9.0, dpm: 635, kp: 0.60, vision: 1.4 },
    'Arrow':    { kda: 4.6, csm: 9.3, dpm: 668, kp: 0.60, vision: 1.3 },
    'Sage':     { kda: 4.3, csm: 1.1, dpm: 240, kp: 0.72, vision: 3.5 },

    // ── IFN - Iron Phoenix ────────────────────────────────────────
    'Colossus': { kda: 3.6, csm: 8.3, dpm: 570, kp: 0.56, vision: 1.3 },
    'Ghost':    { kda: 3.6, csm: 5.5, dpm: 330, kp: 0.63, vision: 2.3 },
    'Frost':    { kda: 5.5, csm: 9.8, dpm: 755, kp: 0.66, vision: 1.5 },
    'Bolt':     { kda: 6.2, csm: 10.4, dpm: 755, kp: 0.64, vision: 1.4 },
    'Mystic':   { kda: 3.5, csm: 1.0, dpm: 205, kp: 0.67, vision: 3.1 },

    // ── SSK - Storm Seekers ───────────────────────────────────────
    'Fortress': { kda: 4.2, csm: 8.7, dpm: 615, kp: 0.58, vision: 1.6 },
    'Hunter':   { kda: 4.0, csm: 5.7, dpm: 355, kp: 0.65, vision: 2.5 },
    'Nova':     { kda: 4.5, csm: 9.2, dpm: 680, kp: 0.62, vision: 1.4 },
    'Laser':    { kda: 5.3, csm: 9.6, dpm: 700, kp: 0.62, vision: 1.3 },
    'Aura':     { kda: 4.0, csm: 1.1, dpm: 230, kp: 0.71, vision: 3.4 },

    // ── NWV - Neon Wolves ─────────────────────────────────────────
    'Rampart':  { kda: 2.8, csm: 7.9, dpm: 490, kp: 0.52, vision: 1.1 },
    'Cobra':    { kda: 4.5, csm: 5.9, dpm: 385, kp: 0.67, vision: 2.7 },
    'Arc':      { kda: 4.8, csm: 9.3, dpm: 695, kp: 0.63, vision: 1.4 },
    'Sniper':   { kda: 6.0, csm: 10.3, dpm: 748, kp: 0.64, vision: 1.4 },
    'Pulse':    { kda: 3.8, csm: 1.0, dpm: 218, kp: 0.70, vision: 3.3 },

    // ── SFX - Shadow Foxes ────────────────────────────────────────
    'Boulder':  { kda: 3.3, csm: 8.2, dpm: 555, kp: 0.54, vision: 1.2 },
    'Phantom':  { kda: 5.1, csm: 6.2, dpm: 420, kp: 0.71, vision: 3.0 },
    'Volt':     { kda: 4.0, csm: 8.9, dpm: 625, kp: 0.60, vision: 1.3 },
    'Flash':    { kda: 5.0, csm: 9.5, dpm: 688, kp: 0.61, vision: 1.3 },
    'Ember':    { kda: 4.3, csm: 1.2, dpm: 248, kp: 0.72, vision: 3.6 },

    // ── BTN - Blaze Titans ────────────────────────────────────────
    'Titan':    { kda: 4.4, csm: 8.9, dpm: 670, kp: 0.59, vision: 1.7 },
    'Reaper':   { kda: 3.7, csm: 5.6, dpm: 340, kp: 0.64, vision: 2.4 },
    'Surge':    { kda: 5.2, csm: 9.6, dpm: 730, kp: 0.65, vision: 1.5 },
    'Striker':  { kda: 4.8, csm: 9.4, dpm: 676, kp: 0.61, vision: 1.3 },
    'Beacon':   { kda: 3.8, csm: 1.0, dpm: 215, kp: 0.70, vision: 3.3 },

    // ── FGN - Frost Giants ────────────────────────────────────────
    'Sentinel': { kda: 3.8, csm: 8.4, dpm: 588, kp: 0.56, vision: 1.4 },
    'Stalker':  { kda: 4.2, csm: 5.8, dpm: 365, kp: 0.66, vision: 2.6 },
    'Flux':     { kda: 3.8, csm: 8.8, dpm: 608, kp: 0.59, vision: 1.3 },
    'Trigger':  { kda: 5.8, csm: 10.2, dpm: 740, kp: 0.63, vision: 1.4 },
    'Shield':   { kda: 4.2, csm: 1.1, dpm: 235, kp: 0.72, vision: 3.5 },

    // ── CDR - Cipher Dragons ──────────────────────────────────────
    'Ironclad': { kda: 3.5, csm: 8.3, dpm: 565, kp: 0.55, vision: 1.3 },
    'Wraith':   { kda: 4.7, csm: 6.0, dpm: 405, kp: 0.69, vision: 2.8 },
    'Zap':      { kda: 4.2, csm: 9.1, dpm: 648, kp: 0.61, vision: 1.4 },
    'Ace':      { kda: 5.6, csm: 10.0, dpm: 725, kp: 0.63, vision: 1.3 },
    'Ward':     { kda: 3.8, csm: 1.0, dpm: 212, kp: 0.69, vision: 3.2 },

    // ── AKT - Aurora Knights ──────────────────────────────────────
    'Vanguard': { kda: 3.3, csm: 8.1, dpm: 548, kp: 0.54, vision: 1.2 },
    'Lynx':     { kda: 3.9, csm: 5.7, dpm: 350, kp: 0.64, vision: 2.5 },
    'Echo':     { kda: 6.0, csm: 9.9, dpm: 775, kp: 0.68, vision: 1.6 },
    'Swift':    { kda: 5.2, csm: 9.6, dpm: 698, kp: 0.62, vision: 1.3 },
    'Halo':     { kda: 3.9, csm: 1.1, dpm: 220, kp: 0.71, vision: 3.4 },
}

export const DEFAULT_STATS = { kda: 3.5, csm: 8.0, dpm: 500, kp: 0.55, vision: 1.5 }

/** 팀 전체 강도 점수 (시뮬레이션 승패 계산용) */
export const TEAM_STRENGTH: Record<string, number> = {
    NGD: 82,
    VTX: 79,
    IFN: 85,
    SSK: 80,
    NWV: 83,
    SFX: 81,
    BTN: 84,
    FGN: 78,
    CDR: 80,
    AKT: 82,
}
