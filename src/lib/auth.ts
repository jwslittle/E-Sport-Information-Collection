import GoogleProvider from "next-auth/providers/google"
import NaverProvider from "next-auth/providers/naver"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        NaverProvider({
            clientId: process.env.NAVER_CLIENT_ID!,
            clientSecret: process.env.NAVER_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        session: async ({ session, user }: any) => {
            if (session?.user) {
                session.user.id = user.id;
                session.user.points = user.points;
                session.user.gachaLevel = user.gachaLevel;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
}
