import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QuestClient } from "./quest-client"

export const metadata: Metadata = {
    title: "퀘스트 & 업적 | E-Sport-SuperTeam",
    description: "일일 퀘스트와 업적을 달성하고 보상을 획득하세요.",
}

export default async function QuestPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/auth/signin')

    return (
        <div className="container mx-auto py-8">
            <QuestClient />
        </div>
    )
}
