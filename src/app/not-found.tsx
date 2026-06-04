'use client'

import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <p className="text-7xl font-black text-zinc-700 mb-2">404</p>
            <h1 className="text-2xl font-bold text-white mb-2">페이지를 찾을 수 없습니다</h1>
            <p className="text-zinc-400 mb-8 max-w-sm">
                요청하신 페이지가 존재하지 않거나 이동되었습니다.
            </p>
            <div className="flex gap-3">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
                >
                    <Home className="w-4 h-4" />
                    홈으로
                </Link>
                <Link
                    href="/matches"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-600/30 text-sm font-medium transition-colors"
                >
                    <Search className="w-4 h-4" />
                    경기 보기
                </Link>
            </div>
        </div>
    )
}
