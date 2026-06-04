import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '내 프로필 | E-Sport Information Collection',
    description: '내 프로필, 코스메틱 아이템, 팔로워 현황을 관리하세요.',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
