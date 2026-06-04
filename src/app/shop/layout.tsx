import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '코스메틱 샵 | E-Sport Information Collection',
    description: 'GP로 프로필 꾸미기 아이템을 구매하거나 가챠를 통해 희귀 코스메틱을 획득하세요.',
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
