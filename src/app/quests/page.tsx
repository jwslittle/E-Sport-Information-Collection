import { Metadata } from "next"
import { QuestClient } from "./quest-client"

export const metadata: Metadata = {
    title: "퀘스트 & 업적 | E-Sport-SuperTeam",
    description: "일일 퀘스트와 업적을 달성하고 보상을 획득하세요.",
}

export default function QuestPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">퀘스트 & 업적</h1>
            <QuestClient />
        </div>
    )
}
