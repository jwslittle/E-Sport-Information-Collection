import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            role: string
            points: number
            // gachaLevel 제거 — DB 스키마 없음, JWT에서 미설정 (런타임 항상 undefined)
            isOnboarded: boolean
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        points: number
        // gachaLevel 제거 — 미구현 필드
        isOnboarded: boolean
    }
}
