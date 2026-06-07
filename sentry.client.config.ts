import * as Sentry from "@sentry/nextjs"

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 성능 모니터링: 10% 샘플링 (무료 플랜 한도 내)
    tracesSampleRate: 0.1,

    // 프로덕션에서만 활성화
    enabled: process.env.NODE_ENV === "production",

    // PIPA 개인정보 보호: IP, 사용자 정보 자동 수집 비활성화
    sendDefaultPii: false,

    // 에러 필터링: 무시할 에러 패턴
    ignoreErrors: [
        // 네트워크 관련 (사용자 환경 문제)
        "Failed to fetch",
        "NetworkError",
        "Load failed",
        // Next.js 정상 동작
        "NEXT_NOT_FOUND",
        "NEXT_REDIRECT",
    ],

    beforeSend(event) {
        if (event.request?.headers) {
            delete event.request.headers["authorization"]
            delete event.request.headers["cookie"]
        }
        if (event.user) {
            delete event.user.email
            delete event.user.ip_address
        }
        return event
    },
})
