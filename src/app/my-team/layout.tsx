import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '내 팀 | E-Sport Information Collection',
    description: 'LCK 판타지 드림팀을 구성하고 선수 로스터를 관리하세요.',
}

export default function MyTeamLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
