import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { NextAuthOptions } from "next-auth"
import { isAdminEmail } from "@/lib/config/admin"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // allowDangerousEmailAccountLinking 제거 — 계정 탈취 방지
            // 단일 OAuth 공급자(Google)만 사용하므로 영향 없음
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        jwt: async ({ token, user, trigger, session }: any) => {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.points = user.gp // Prisma 'gp' → session 'points'
                token.roleRefreshedAt = Date.now() // ✅ role 갱신 시각 기록

                // 관리자 이메일 목록에 포함된 계정 자동 ADMIN 승격
                if (user.email && isAdminEmail(user.email)) {
                    token.role = 'ADMIN'
                    // Update DB asynchronously to ensure persistence
                    prisma.user.update({
                        where: { id: user.id },
                        data: { role: 'ADMIN' }
                    }).catch(err => console.error("Failed to auto-admin user:", err))
                }
            } else if (token.id) {
                // ✅ M-4 수정: 1시간마다 DB에서 role 재확인 (ADMIN 제거 반영)
                const ONE_HOUR = 60 * 60 * 1000
                const lastRefresh = (token.roleRefreshedAt as number) ?? 0
                if (Date.now() - lastRefresh > ONE_HOUR) {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { role: true },
                    }).catch(() => null)
                    if (dbUser) {
                        token.role = dbUser.role
                        token.roleRefreshedAt = Date.now()
                    }
                }
            }
            // 세션 업데이트 시 안전한 필드만 반영 (role·id 변조 방지)
            if (trigger === "update" && session) {
                const safe: Record<string, unknown> = {}
                // 허용 목록: points, gachaLevel만 클라이언트에서 갱신 가능
                if (typeof session.user?.points === 'number') safe.points = session.user.points
                if (typeof session.user?.gp === 'number') safe.points = session.user.gp
                // gachaLevel은 스키마 미구현 — 추후 추가 시 여기서 허용
                return { ...token, ...safe }
            }
            return token
        },
        session: async ({ session, token }: any) => {
            if (session?.user) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.points = token.points
            }
            return session
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
    debug: process.env.NODE_ENV === 'development',
}
