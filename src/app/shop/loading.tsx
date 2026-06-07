import { Loader2 } from 'lucide-react'

export default function ShopLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
    )
}
