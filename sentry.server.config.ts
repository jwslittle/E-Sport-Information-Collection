import * as Sentry from "@sentry/nextjs"

Sentry.init({
    // ✅ M-9 수정: 서버는 SENTRY_DSN 우선, 없으면 공개 DSN fallback
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 서버 에러는 더 많이 수집
    tracesSampleRate: 0.2,

    enabled: process.env.NODE_ENV === "production",

    // PIPA 개인정보 보호: IP, 사용자 정보 자동 수집 비활성화
    sendDefaultPii: false,

    beforeSend(event) {
        if (event.request?.headers) {
            delete event.request.headers["authorization"]
            delete event.request.headers["cookie"]
        }
        // 요청 바디에 패스워드/토큰 등 민감 데이터가 포함될 수 있으므로 제거
        if (event.request) {
            delete event.request.data
        }
        // 사용자 이메일 제거 (사용자 ID만 유지)
        if (event.user) {
            delete event.user.email
            delete event.user.ip_address
        }
        return event
    },
})
