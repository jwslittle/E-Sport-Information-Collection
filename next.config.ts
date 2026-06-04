import type { NextConfig } from "next";

/** HTTP 보안 헤더 — 모든 응답에 적용 */
const securityHeaders = [
    // 클릭재킹(Clickjacking) 방지
    { key: 'X-Frame-Options', value: 'DENY' },
    // MIME 스니핑 방지
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // XSS 필터 (레거시 브라우저용)
    { key: 'X-XSS-Protection', value: '1; mode=block' },
    // 리퍼러 정보 최소화
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // 불필요한 브라우저 기능 비활성화
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                // 모든 라우트에 보안 헤더 적용
                source: '/(.*)',
                headers: securityHeaders,
            },
        ]
    },
}

export default nextConfig;
