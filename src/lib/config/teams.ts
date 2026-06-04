/**
 * LCK 팀 설정 — 팀 추가/삭제 시 이 파일만 수정
 * 클라이언트/서버 양쪽에서 import 가능
 */

export const LCK_TEAMS = [
    'T1', 'GEN', 'HLE', 'KT', 'DK',
    'NS', 'BFX', 'FOX', 'DRX', 'KDF', 'LSB',
    // 2026 Split 2 추가 팀
    'KRX', 'DNS', 'BRO',
] as const

export type LckTeamCode = typeof LCK_TEAMS[number]

/** LCK 팀 메인 컬러 (hex) — 인라인 style={{ color }} 에 사용 */
export const TEAM_COLORS: Record<string, string> = {
    // 공통
    T1:  '#C89B3C',
    GEN: '#B8970A',
    HLE: '#E8611A',
    KT:  '#CC0000',
    DK:  '#1A56C4',
    NS:  '#1FAB53',
    BFX: '#6B21A8',
    // 이전 시즌
    FOX: '#EA580C',
    DRX: '#1D4ED8',
    KDF: '#A855F7',
    LSB: '#6D28D9',
    // 2026 Split 2
    KRX: '#9333EA',   // Kiwoom DRX — 보라
    DNS: '#0EA5E9',   // DN SOOPers — 스카이블루
    BRO: '#10B981',   // HANJIN BRION — 에메랄드
}
