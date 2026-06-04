import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

/** HTTP 보안 헤더 — 모든 응답에 적용 */
const securityHeaders = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-XSS-Protection', value: '1; mode=block' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ]
    },
    images: {
        remotePatterns: [
            // Google OAuth 프로필 사진
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: '*.googleusercontent.com' },
            // LoL Esports 팀 로고 / 선수 사진
            { protocol: 'https', hostname: 'static.lolesports.com' },
            { protocol: 'https', hostname: 'lolstatic-a.akamaihd.net' },
            { protocol: 'https', hostname: '*.riot.com' },
            { protocol: 'https', hostname: 'am-a.akamaihd.net' },
        ],
    },
}

export default withSentryConfig(nextConfig, {
    // Sentry 조직/프로젝트 (선택사항 — 소스맵 업로드용)
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // 소스맵을 Sentry에 업로드 (에러 위치 정확하게 표시)
    silent: true,

    // 빌드 시 Sentry 비활성화 (DSN 없어도 빌드 성공)
    disableLogger: true,
    widenClientFileUpload: true,

    // 서버 함수 자동 계측 활성화 — 에러 자동 캡처 (Sentry 핵심 기능)
    autoInstrumentServerFunctions: true,
})
