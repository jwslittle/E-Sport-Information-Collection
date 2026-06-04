import { RankingClient } from './ranking-client'

export const dynamic = 'force-dynamic'

// 랭킹 페이지는 공개 정보 — 비로그인도 볼 수 있도록 리다이렉트 제거
// 개인화(내 순위 강조 등)는 RankingClient 내부 useSession()으로 처리됨
export default function RankingPage() {
    return <RankingClient />
}
