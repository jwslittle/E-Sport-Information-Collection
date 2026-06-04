/**
 * LCK 시즌 설정 — 시즌 전환 시 이 파일만 수정
 * 클라이언트/서버 양쪽에서 import 가능
 */

export const CURRENT_SEASON = '2026-SPLIT2' as const
export const CURRENT_YEAR = 2026

export const SEASON_OPTIONS = [
    { value: '2026-SPLIT2', label: 'LCK 2026 Split 2 (현재)' },
    { value: '2026-SPLIT1', label: 'LCK 2026 Split 1' },
    { value: '2025-SUMMER', label: 'LCK 2025 Summer' },
] as const
