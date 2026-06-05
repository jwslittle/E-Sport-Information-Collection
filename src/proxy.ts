import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ─── Rate Limiter 초기화 (Upstash 환경변수 없으면 비활성화) ──────────────────
let generalLimiter: Ratelimit | null = null
let strictLimiter: Ratelimit | null = null

function getLimiters() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        // ✅ M-5 수정: 프로덕션에서 Upstash 미설정 시 경고 (레이트리밋 우회 방지)
        if (process.env.NODE_ENV === 'production') {
            console.error('[Rate Limit] UPSTASH 환경변수 미설정 — 레이트리밋 비활성화 상태. Vercel 환경변수를 확인하세요.')
        }
        return { general: null, strict: null }
    }
    if (!generalLimiter) {
        const redis = Redis.fromEnv()
        // 일반 API: 60초에 60회
        generalLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(60, "60 s"),
            analytics: false,
            prefix: "rl:general",
        })
        // AI 채팅: 60초에 5회 (OpenAI 비용 절감)
        strictLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(5, "60 s"),
            analytics: false,
            prefix: "rl:strict",
        })
    }
    return { general: generalLimiter, strict: strictLimiter }
}

// ─── 보호된 페이지 경로 ──────────────────────────────────────────────────────
const PROTECTED_PATHS = [
    "/admin", "/shop", "/quests", "/auction",
    "/dashboard", "/analyst", "/prediction", "/profile",
]

export async function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname

    // ── 1. API Rate Limiting ─────────────────────────────────────────────────
    if (path.startsWith("/api/")) {
        // Cron 엔드포인트는 CRON_SECRET으로 자체 인증 — Rate Limiting 제외
        if (!path.startsWith("/api/cron/") && !path.startsWith("/api/auth/")) {
            const { general, strict } = getLimiters()

            // AI 채팅은 더 엄격하게 제한
            const limiter = path.startsWith("/api/chat") ? strict : general

            if (limiter) {
                const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
                    ?? req.headers.get("x-real-ip")
                    ?? "anonymous"

                const { success, limit, remaining, reset } = await limiter.limit(`${ip}`)

                if (!success) {
                    return NextResponse.json(
                        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
                        {
                            status: 429,
                            headers: {
                                "X-RateLimit-Limit": String(limit),
                                "X-RateLimit-Remaining": String(remaining),
                                "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
                            },
                        }
                    )
                }
            }
        }
        return NextResponse.next()
    }

    // ── 2. 페이지 인증 보호 ──────────────────────────────────────────────────
    const isProtected = PROTECTED_PATHS.some(p => path.startsWith(p))
    if (!isProtected) return NextResponse.next()

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    // 로그인 안 된 경우 → 로그인 페이지로
    if (!token) {
        const signInUrl = new URL("/auth/signin", req.url)
        signInUrl.searchParams.set("callbackUrl", req.url)
        return NextResponse.redirect(signInUrl)
    }

    // Admin 전용 경로 → 비관리자는 홈으로
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // API 라우트 (인증·정적 파일 제외)
        "/api/((?!_next|favicon).)*",
        // 보호된 페이지 경로
        "/admin/:path*",
        "/shop/:path*",
        "/quests/:path*",
        "/auction/:path*",
        "/dashboard/:path*",
        "/analyst/:path*",
        "/prediction/:path*",
        "/profile",
    ],
}
