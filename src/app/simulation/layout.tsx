import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '시뮬레이션 리그 | E-Sport Information Collection',
    description: 'LCK 시뮬레이션 리그에서 가상 경기 결과를 예측하고 판타지 팀을 운영해보세요.',
}

export default function SimulationLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
