import { Metadata } from "next"
import { DashboardClient } from "./dashboard-client"

export const metadata: Metadata = {
    title: "고급 통계 대시보드 | E-Sport-SuperTeam",
    description: "리그 전체의 선수 통계와 메타 분석을 확인하세요.",
}

export default function DashboardPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">고급 통계 대시보드</h1>
            <DashboardClient />
        </div>
    )
}
