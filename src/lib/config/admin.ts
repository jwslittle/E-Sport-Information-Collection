/**
 * 어드민 계정 설정 — 관리자 이메일 변경 시 이 파일만 수정
 * 실제 ADMIN 판별은 DB role 필드(auth.ts에서 자동 설정)로 하는 것이 원칙이며,
 * 이 상수는 auth.ts 초기 세팅 및 이메일 직접 비교가 필요한 곳에서만 사용
 */

export const ADMIN_EMAIL = 'jwslittle@gmail.com' as const
