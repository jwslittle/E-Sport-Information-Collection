export default function QuizLoading() {
    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-pulse">
            <div className="h-8 w-40 bg-zinc-800 rounded" />
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div className="h-5 w-3/4 bg-zinc-800 rounded" />
                <div className="h-4 w-full bg-zinc-800 rounded" />
                <div className="h-4 w-5/6 bg-zinc-800 rounded" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-14 bg-zinc-800 rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    )
}
