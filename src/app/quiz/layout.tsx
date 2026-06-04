import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '일일 퀴즈 | E-Sport Information Collection',
    description: 'LCK 관련 일일 퀴즈에 도전하고 GP를 획득하세요. 매일 새로운 문제가 출제됩니다.',
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
