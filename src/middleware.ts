import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token

        // Admin route protection
        if (req.nextUrl.pathname.startsWith("/admin")) {
            if (token?.role !== "ADMIN") {
                return NextResponse.redirect(new URL("/", req.url))
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
)

export const config = {
    matcher: [
        "/admin/:path*",
        "/shop/:path*",
        "/league/:path*",
        "/quests/:path*",
        "/auction/:path*",
        "/dashboard/:path*",
        "/simulation/:path*",
        "/analyst/:path*",
        "/prediction/:path*",
        "/profile",
    ]
}
