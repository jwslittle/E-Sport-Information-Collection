export default function QuestsLoading() {
    return (
        <div className="space-y-6">
            <div className="h-9 w-40 bg-zinc-800 rounded animate-pulse" />
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 bg-zinc-800 rounded-xl animate-pulse" />
                ))}
            </div>
        </div>
    )
}
