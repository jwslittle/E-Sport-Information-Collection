import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { NextAuthOptions } from "next-auth"
import { ADMIN_EMAIL } from "@/lib/config/admin"

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
                token.points = user.gp // Map Prisma 'gp' to session 'points'
                token.gachaLevel = user.gachaLevel

                // Auto-grant ADMIN to specific email
                if (user.email === ADMIN_EMAIL) {
                    token.role = 'ADMIN'
                    // Update DB asynchronously to ensure persistence
                    prisma.user.update({
                        where: { id: user.id },
                        data: { role: 'ADMIN' }
                    }).catch(err => console.error("Failed to auto-admin user:", err))
                }
            }
            // Update token if session is updated (e.g. points change)
            if (trigger === "update" && session) {
                return { ...token, ...session.user }
            }
            return token
        },
        session: async ({ session, token }: any) => {
            if (session?.user) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.points = token.points
                session.user.gachaLevel = token.gachaLevel
            }
            return session
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
    debug: process.env.NODE_ENV === 'development',
}
