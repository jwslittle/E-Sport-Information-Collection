import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

/** HTTP 보안 헤더 — 모든 응답에 적용 */
const securityHeaders = [
    // Clickjacking 방지
    { key: 'X-Frame-Options', value: 'DENY' },
    // MIME 스니핑 방지
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // ✅ deprecated X-XSS-Protection 제거 → CSP로 대체
    // HTTPS 강제 (2년, 서브도메인 포함)
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    // 레퍼러 정책
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // 카메라/마이크/위치 권한 제한
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    // ✅ CSP — XSS 방어 핵심
    // Next.js는 인라인 스크립트/스타일을 사용하므로 unsafe-inline/unsafe-eval 필요
    // Google OAuth, Sentry, Cloudinary, Upstash, OpenAI 도메인 허용
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            // Next.js 런타임 인라인 스크립트 + Sentry SDK
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io",
            // Tailwind CSS 인라인 스타일 + Google Fonts
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            // 이미지: 자체 + data URI + Google/LoL Esports/Cloudinary CDN
            "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://static.lolesports.com https://lolstatic-a.akamaihd.net https://*.riot.com https://am-a.akamaihd.net https://res.cloudinary.com",
            // 폰트: Google Fonts CDN
            "font-src 'self' https://fonts.gstatic.com",
            // API 연결: 자체 + Sentry + Upstash
            "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io https://*.upstash.io",
            // Google OAuth iframe 허용
            "frame-src https://accounts.google.com",
            // 플러그인 비활성화
            "object-src 'none'",
            // base 태그 제한
            "base-uri 'self'",
            // 폼 제출 대상 제한
            "form-action 'self' https://accounts.google.com",
        ].join('; '),
    },
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
