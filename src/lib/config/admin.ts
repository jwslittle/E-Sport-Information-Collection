/**
 * 어드민 계정 설정 — 관리자 이메일은 반드시 환경변수(ADMIN_EMAIL)로 설정
 * ⚠️ 이메일을 소스 코드에 직접 입력하지 마세요 (GitHub 공개 레포 노출 위험)
 * 실제 ADMIN 판별은 DB role 필드(auth.ts에서 자동 설정)로 하는 것이 원칙이며,
 * 이 상수는 auth.ts 초기 세팅 및 이메일 직접 비교가 필요한 곳에서만 사용
 */

if (!process.env.ADMIN_EMAIL) {
    console.warn('[Admin] ⚠️ ADMIN_EMAIL 환경변수가 설정되지 않았습니다. 관리자 기능이 비활성화됩니다.')
}

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
