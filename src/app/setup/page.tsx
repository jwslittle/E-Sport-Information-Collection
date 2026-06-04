/**
 * /setup — 팀 이름 설정 (추후 오픈 예정)
 */
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Trophy, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect('/auth/signin')

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-zinc-500" />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>준비 중</span>
                </div>
                <h1 className="text-2xl font-bold text-white">팀 설정</h1>
                <p className="text-zinc-400 max-w-sm leading-relaxed">
                    판타지 팀 기능 준비 중입니다.
                    다음 시즌 오픈을 기대해주세요!
                </p>
            </div>
            <Link href="/">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">홈으로</Button>
            </Link>
        </div>
    )
}
