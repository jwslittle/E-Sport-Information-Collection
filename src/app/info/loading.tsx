/**
 * /info 페이지 로딩 스켈레톤
 * Next.js App Router loading.tsx — 페이지 서버 컴포넌트 준비 전 자동 표시
 */
export default function InfoLoading() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-pulse">
            {/* 탭 바 스켈레톤 */}
            <div className="flex gap-2 border-b border-zinc-800 pb-2">
                {[120, 100, 90, 110].map((w, i) => (
                    <div key={i} className="h-9 rounded-t bg-zinc-800" style={{ width: w }} />
                ))}
            </div>

            {/* 필터 행 스켈레톤 */}
            <div className="flex flex-wrap gap-3">
                <div className="h-9 w-32 rounded bg-zinc-800" />
                <div className="h-9 w-44 rounded bg-zinc-800" />
                <div className="h-9 w-28 rounded bg-zinc-800" />
            </div>

            {/* 테이블 헤더 스켈레톤 */}
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <div className="h-10 bg-zinc-800/70" />
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex gap-4 px-4 py-3 border-t border-zinc-800/50">
                        <div className="h-4 w-6 rounded bg-zinc-800" />
                        <div className="h-4 flex-1 rounded bg-zinc-800" />
                        <div className="h-4 w-12 rounded bg-zinc-800" />
                        <div className="h-4 w-12 rounded bg-zinc-800" />
                        <div className="h-4 w-12 rounded bg-zinc-800" />
                    </div>
                ))}
            </div>
        </div>
    )
}
