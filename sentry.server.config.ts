import * as Sentry from "@sentry/nextjs"

Sentry.init({
    // ✅ M-9 수정: 서버는 SENTRY_DSN 우선, 없으면 공개 DSN fallback
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 서버 에러는 더 많이 수집
    tracesSampleRate: 0.2,

    enabled: process.env.NODE_ENV === "production",
})
