import * as Sentry from "@sentry/nextjs"

Sentry.init({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",

    // PIPA 개인정보 보호: IP, 사용자 정보 자동 수집 비활성화
    sendDefaultPii: false,

    beforeSend(event) {
        if (event.request?.headers) {
            delete event.request.headers["authorization"]
            delete event.request.headers["cookie"]
        }
        if (event.request) {
            delete event.request.data
        }
        if (event.user) {
            delete event.user.email
            delete event.user.ip_address
        }
        return event
    },
})
