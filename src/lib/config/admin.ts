/**
 * 어드민 계정 설정 — 관리자 이메일은 반드시 환경변수(ADMIN_EMAILS)로 설정
 * ⚠️ 이메일을 소스 코드에 직접 입력하지 마세요 (GitHub 공개 레포 노출 위험)
 *
 * 여러 관리자 계정을 쉼표로 구분하여 설정합니다:
 *   ADMIN_EMAILS="admin1@gmail.com,admin2@gmail.com"
 *
 * 실제 ADMIN 판별은 DB role 필드(auth.ts에서 자동 설정)로 하는 것이 원칙이며,
 * 이 상수는 auth.ts 초기 세팅 및 이메일 직접 비교가 필요한 곳에서만 사용
 */

const raw = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? ''

if (!raw) {
    console.warn('[Admin] ⚠️ ADMIN_EMAILS 환경변수가 설정되지 않았습니다. 관리자 기능이 비활성화됩니다.')
}

/** 관리자 이메일 목록 (쉼표 구분, 공백 제거) */
export const ADMIN_EMAILS: ReadonlySet<string> = new Set(
    raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
)

/** 하위 호환성 유지 — 단일 이메일 비교가 필요한 곳에서 사용 */
export const ADMIN_EMAIL = [...ADMIN_EMAILS][0] ?? ''

/** 이메일이 관리자인지 확인 */
export function isAdminEmail(email: string): boolean {
    return ADMIN_EMAILS.has(email.toLowerCase())
}
