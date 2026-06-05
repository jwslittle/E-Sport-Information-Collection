import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'LCK 정보 | E-Sport Information Collection',
    description: 'LCK 팀, 선수, 토너먼트 역대 통계 및 경기 기록을 확인하세요.',
}

export default function InfoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
