import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '경기 예측 | E-Sport Information Collection',
    description: 'LCK 경기 결과를 예측하고 GP를 획득하세요. 승팀과 스코어를 맞히면 보너스 지급!',
}

export default function PredictionLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
