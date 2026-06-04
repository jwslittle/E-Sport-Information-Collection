import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'LCK 경기 일정 | E-Sport Information Collection',
    description: 'LCK 2026 경기 일정, 결과, 순위를 확인하세요.',
}

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
