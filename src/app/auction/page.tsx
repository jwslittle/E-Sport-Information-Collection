import { Metadata } from "next"
import { Gavel, Clock } from "lucide-react"

export const metadata: Metadata = {
    title: "경매장 | E-Sport-SuperTeam",
    description: "코스메틱 아이템 경매장 (준비 중)",
}

export default function AuctionPage() {
    return (
        <div className="container mx-auto py-20 flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
                <Gavel className="w-10 h-10 text-zinc-500" />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">경매장</h1>
                <p className="text-zinc-400 max-w-md leading-relaxed">
                    유저 간 코스메틱 아이템 거래 시스템을 준비하고 있습니다.<br />
                    오픈 일정은 공지사항을 통해 안내드리겠습니다.
                </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/60 rounded-full border border-zinc-700">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500">서비스 준비 중</span>
            </div>
        </div>
    )
}
