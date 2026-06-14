// framer-motion 제거 → tw-animate-css CSS 애니메이션으로 교체 (번들 ~90KB gzip 절감)
// 'use client' 불필요 — 서버 컴포넌트로 격상 (추가 절감)
export function PageTransition({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out">
            {children}
        </div>
    )
}
