import prisma from '@/lib/prisma'
import { CollectionClient } from './collection-client'

export const dynamic = 'force-dynamic'

export default async function CollectionPage() {
    // 임시 사용자 조회
    const user = await prisma.user.findFirst()

    if (!user) {
        return <div className="text-white text-center py-12">먼저 사용자를 생성해주세요 (상점이나 나만의 팀을 방문하세요).</div>
    }

    const userCards = await prisma.userCard.findMany({
        where: { userId: user.id },
        include: {
            card: {
                include: {
                    player: true
                }
            }
        }
    })

    return <CollectionClient userCards={userCards} />
}
