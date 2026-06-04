export default function PlayersLoading() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <div className="h-9 w-48 bg-zinc-800 rounded animate-pulse" />
                <div className="h-5 w-72 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-48 bg-zinc-800 rounded-xl animate-pulse" />
                ))}
            </div>
        </div>
    )
}
