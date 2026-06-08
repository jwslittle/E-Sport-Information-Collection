/**
 * LCK 시즌 설정 — 시즌 전환 시 이 파일만 수정
 * 클라이언트/서버 양쪽에서 import 가능
 *
 * ⚠️ 다음 시즌 전환 체크리스트 (Split 3 → 그 다음 시즌):
 *   1. CURRENT_SEASON 값 변경 (getSeasonKeyFromDate 로직 + DB season 키 확인)
 *   2. CURRENT_YEAR 필요 시 변경
 *   3. SEASON_OPTIONS 상단에 새 시즌 추가, 이전 "(현재)" 레이블 제거
 *   4. 배포 전 /matches 페이지에서 시즌 전환 확인
 *
 * DB에서 현재 season 키 확인 방법:
 *   SELECT DISTINCT season FROM "LckRealMatch" ORDER BY season DESC LIMIT 5;
 */

export const CURRENT_SEASON = '2026-SPLIT3' as const   // 2026-06-14 SPLIT2 종료 후 전환
export const CURRENT_YEAR = 2026

export const SEASON_OPTIONS = [
    { value: '2026-SPLIT3', label: 'LCK 2026 Split 3 (현재)' },
    { value: '2026-SPLIT2', label: 'LCK 2026 Split 2' },
    { value: '2026-SPLIT1', label: 'LCK 2026 Split 1' },
    { value: '2025-SUMMER', label: 'LCK 2025 Summer' },
] as const
