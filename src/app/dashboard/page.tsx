
import { Metadata } from "next"
import { DashboardClient } from "./dashboard-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

export const metadata: Metadata = {
    title: "고급 통계 대시보드 | E-Sport-SuperTeam",
    description: "리그 전체의 선수 통계와 메타 분석을 확인하세요.",
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
                <Button asChild><Link href="/auth/signin">로그인하기</Link></Button>
            </div>
        )
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true }
    })

    if (!user) return <div>User not found</div>

    const isAdmin = user.role === 'ADMIN'
    // TODO: 프리미엄 구독 기능 준비 중 — 오픈 시 실제 구독 여부로 교체
    const isActive = true

    if (!isAdmin && !isActive) {
        return (
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold mb-6">고급 통계 대시보드</h1>
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center">
                    <Lock className="w-16 h-16 text-yellow-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">프리미엄 기능 잠김</h2>
                    <p className="text-zinc-400 mb-6 max-w-md">
                        고급 통계 대시보드는 프리미엄 이용권이 필요합니다.<br />
                        상점에서 이용권을 구매하여 1주일간 자유롭게 이용해보세요!
                    </p>
                    <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                        <Link href="/shop">상점으로 이동</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">고급 통계 대시보드</h1>
                {isActive && !isAdmin && (
                    <span className="text-sm text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                        이용 가능: 무제한 (베타 기간)
                    </span>
                )}
                {isAdmin && (
                    <span className="text-sm text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full border border-purple-400/20">
                        관리자 권한 (무제한)
                    </span>
                )}
            </div>
            <DashboardClient />
        </div>
    )
}
