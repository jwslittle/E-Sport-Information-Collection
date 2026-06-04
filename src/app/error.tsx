'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { RefreshCw, Home } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Sentry로 에러 전송
        Sentry.captureException(error)
    }, [error])

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <p className="text-7xl font-black text-zinc-700 mb-2">500</p>
            <h1 className="text-2xl font-bold text-white mb-2">오류가 발생했습니다</h1>
            <p className="text-zinc-400 mb-2 max-w-sm">
                일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
            {error.digest && (
                <p className="text-xs text-zinc-600 mb-6 font-mono">
                    오류 코드: {error.digest}
                </p>
            )}
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-600/30 text-sm font-medium transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    다시 시도
                </button>
                <a
                    href="/"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
                >
                    <Home className="w-4 h-4" />
                    홈으로
                </a>
            </div>
        </div>
    )
}
