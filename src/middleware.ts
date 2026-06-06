/**
 * Next.js Edge Middleware
 *
 * - API Rate Limiting (Upstash Redis — 일반: 60req/60s, AI: 5req/60s)
 * - 온보딩 미완료 유저 → /onboarding 강제 이동
 * - 보호 경로 인증 체크 (로그인 필요 / 어드민 전용)
 *
 * 로직은 src/proxy.ts에 분리되어 있습니다.
 */
export { proxy as middleware, config } from './proxy'
