import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '커뮤니티 | E-Sport Information Collection',
    description: 'LCK 팬들과 경기 분석, 예측, 정보를 공유하는 커뮤니티입니다.',
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
