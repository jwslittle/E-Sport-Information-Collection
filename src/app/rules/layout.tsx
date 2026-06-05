import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '서비스 안내 | E-Sport Information Collection',
    description: 'GP 획득 방법, 경기 예측 규칙, 코스메틱 시스템 등 서비스 이용 안내를 확인하세요.',
}

export default function RulesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
