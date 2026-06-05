import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'AI 분석가 | E-Sport Information Collection',
    description: 'LCK 전문 AI 분석가에게 선수, 팀, 경기 전략에 대해 무엇이든 물어보세요.',
}

export default function AnalystLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
