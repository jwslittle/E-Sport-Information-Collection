import { Metadata } from "next"
import { AuctionClient } from "./auction-client"

export const metadata: Metadata = {
    title: "실시간 경매 | E-Sport-SuperTeam",
    description: "희귀한 선수 카드를 실시간 경매로 획득하세요.",
}

export default function AuctionPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">실시간 경매장</h1>
            <AuctionClient />
        </div>
    )
}
