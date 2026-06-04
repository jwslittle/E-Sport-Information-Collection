import type { Metadata } from 'next'
import { RankingClient } from './ranking-client'

export const metadata: Metadata = {
    title: '랭킹 | E-Sport Information Collection',
    description: 'LCK 판타지 리그 GP 랭킹. 상위 플레이어들의 순위와 GP 현황을 확인하세요.',
}

// ✅ L-3 수정: force-dynamic 불필요 제거 — RankingClient가 클라이언트 사이드 fetch 사용


// 랭킹 페이지는 공개 정보 — 비로그인도 볼 수 있도록 리다이렉트 제거
// 개인화(내 순위 강조 등)는 RankingClient 내부 useSession()으로 처리됨
export default function RankingPage() {
    return <RankingClient />
}
