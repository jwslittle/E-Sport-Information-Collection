/**
 * LCK 시즌 설정 — 시즌 전환 시 이 파일만 수정
 * 클라이언트/서버 양쪽에서 import 가능
 *
 * ⚠️ 시즌 전환 체크리스트 (Split 2 → 다음 시즌, ~2026-06-14 이후):
 *   1. CURRENT_SEASON 값 변경 (LoL Esports API 싱크 후 DB에 생성된 season 키 확인)
 *   2. CURRENT_YEAR 필요 시 변경
 *   3. SEASON_OPTIONS 상단에 새 시즌 추가, 이전 "(현재)" 레이블 제거
 *   4. 배포 전 /matches 페이지에서 시즌 전환 확인
 *
 * DB에서 현재 season 키 확인 방법:
 *   SELECT DISTINCT season FROM "LckRealMatch" ORDER BY season DESC LIMIT 5;
 */

export const CURRENT_SEASON = '2026-SPLIT2' as const   // ← 2026-06-14 이후 교체 필요
export const CURRENT_YEAR = 2026

export const SEASON_OPTIONS = [
    { value: '2026-SPLIT2', label: 'LCK 2026 Split 2 (현재)' },
    { value: '2026-SPLIT1', label: 'LCK 2026 Split 1' },
    { value: '2025-SUMMER', label: 'LCK 2025 Summer' },
] as const

/**
 * 시즌 전환 예시 (참고용, 실제 다음 시즌 키는 API 싱크 후 확인):
 *
 * export const CURRENT_SEASON = '2026-SUMMER' as const
 * export const SEASON_OPTIONS = [
 *     { value: '2026-SUMMER', label: 'LCK 2026 Summer Playoffs (현재)' },
 *     { value: '2026-SPLIT2', label: 'LCK 2026 Split 2' },
 *     { value: '2026-SPLIT1', label: 'LCK 2026 Split 1' },
 *     { value: '2025-SUMMER', label: 'LCK 2025 Summer' },
 * ] as const
 */
