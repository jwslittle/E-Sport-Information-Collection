import * as Sentry from "@sentry/nextjs"

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 서버 에러는 더 많이 수집
    tracesSampleRate: 0.2,

    enabled: process.env.NODE_ENV === "production",
})
