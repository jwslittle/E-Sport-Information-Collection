export default function RankingLoading() {
    return (
        <div className="max-w-3xl mx-auto space-y-6 py-6 px-4 animate-pulse">
            <div className="h-9 w-28 bg-zinc-800 rounded" />
            <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-lg" />
            <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <div className="h-6 w-8 bg-zinc-800 rounded" />
                        <div className="h-10 w-10 bg-zinc-800 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-zinc-800 rounded" />
                            <div className="h-3 w-20 bg-zinc-800 rounded" />
                        </div>
                        <div className="h-5 w-16 bg-zinc-800 rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
