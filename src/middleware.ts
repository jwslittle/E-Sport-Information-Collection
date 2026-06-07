/**
 * Next.js 미들웨어 진입점
 *
 * 실제 로직은 src/proxy.ts 에 있음.
 * Next.js는 이 파일(middleware.ts)만 미들웨어로 인식함.
 */
export { proxy as middleware, config } from '@/proxy'
