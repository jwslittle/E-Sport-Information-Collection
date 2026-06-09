'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
    Trophy, Calendar, Target, Brain, TrendingUp,
    ShoppingBag, User, Users, LogOut, Zap, Coins,
    Home, BarChart2, Bot, Database, MessageSquare,
    Globe, Youtube, Tv,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ─── 메인 네비게이션 (데스크탑 상단)
const MAIN_ROUTES = [
    { href: '/matches',    label: '경기',     icon: Calendar },
    { href: '/prediction', label: '예측',     icon: Target },
    { href: '/community',  label: '커뮤니티', icon: MessageSquare },
    { href: '/ranking',    label: '랭킹',     icon: TrendingUp },
    { href: '/quiz',       label: '퀴즈',     icon: Brain },
    { href: '/info',       label: '통계',     icon: Database },
    { href: '/shop',       label: '상점',     icon: ShoppingBag },
]

// ─── 모바일 바텀 네비 (5개 고정)
const BOTTOM_ROUTES = [
    { href: '/',           label: '홈',       icon: Home },
    { href: '/matches',    label: '경기',     icon: Calendar },
    { href: '/prediction', label: '예측',     icon: Target },
    { href: '/community',  label: '커뮤니티', icon: MessageSquare },
    { href: '/shop',       label: '상점',     icon: ShoppingBag },
]

export function Navbar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [gp, setGp] = useState<number | null>(null)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    // ✅ BUG-9 수정: AbortController로 경로 변경 시 이전 fetch 취소 (race condition 방지)
    useEffect(() => {
        if (!session) { setGp(null); return }
        const controller = new AbortController()
        fetch('/api/users/me', { signal: controller.signal })
            .then(r => r.json())
            .then(d => { if (d.gp !== undefined) setGp(d.gp) })
            .catch(e => { if (e.name !== 'AbortError') console.error('[Navbar] GP fetch error:', e) })
        return () => controller.abort()
    }, [session, pathname]) // pathname 변경 시마다 갱신

    // 하위 경로 → 부모 탭 매핑 (팀 상세 페이지 등)
    const ROUTE_PARENTS: Record<string, string> = {
        '/teams': '/matches',
    }

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        if (pathname.startsWith(href)) return true
        for (const [prefix, parent] of Object.entries(ROUTE_PARENTS)) {
            if (pathname.startsWith(prefix) && parent === href) return true
        }
        return false
    }

    return (
        <>
            {/* ─── 상단 헤더 ───────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto flex h-14 items-center px-4 gap-4">

                    {/* 로고 */}
                    <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="font-black text-white text-sm hidden sm:block">
                            E-Sport <span className="text-yellow-400">IC</span>
                        </span>
                    </Link>

                    {/* 메인 탭 (데스크탑 전용) */}
                    <nav className="hidden md:flex items-center gap-1 flex-1">
                        {MAIN_ROUTES.map(route => {
                            const active = isActive(route.href)
                            return (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                        active
                                            ? 'bg-yellow-500/10 text-yellow-400'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                    )}
                                >
                                    <route.icon className="w-3.5 h-3.5" />
                                    {route.label}
                                </Link>
                            )
                        })}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                    isActive('/admin')
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60'
                                )}
                            >
                                <BarChart2 className="w-3.5 h-3.5" />
                                관리자
                            </Link>
                        )}
                    </nav>

                    {/* 우측: 라이엇공식 + GP + 유저 메뉴 */}
                    <div className="flex items-center gap-2 ml-auto">

                        {/* 라이엇공식 드롭다운 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all border border-zinc-800 hover:border-zinc-700 outline-none">
                                    <Globe className="w-3.5 h-3.5 shrink-0" />
                                    <span className="hidden sm:inline">라이엇공식</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56 bg-zinc-900 border-zinc-800 text-white"
                                align="end"
                            >
                                <DropdownMenuLabel className="text-[11px] text-zinc-500 font-normal pb-1">
                                    공식 채널 &amp; 사이트
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem asChild>
                                    <a
                                        href="https://lck.kr"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 cursor-pointer py-2"
                                    >
                                        <Globe className="w-4 h-4 text-yellow-400 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium leading-tight">LCK 공식 홈페이지</p>
                                            <p className="text-[10px] text-zinc-500 mt-0.5">lck.kr</p>
                                        </div>
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a
                                        href="https://www.youtube.com/@LCK"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 cursor-pointer py-2"
                                    >
                                        <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium leading-tight">YouTube 공식 채널</p>
                                            <p className="text-[10px] text-zinc-500 mt-0.5">youtube.com/@LCK</p>
                                        </div>
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a
                                        href="https://www.sooplive.co.kr/lck"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 cursor-pointer py-2"
                                    >
                                        <Tv className="w-4 h-4 text-violet-400 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium leading-tight">숲 공식 채널</p>
                                            <p className="text-[10px] text-zinc-500 mt-0.5">sooplive.co.kr/lck</p>
                                        </div>
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* GP 배지 */}
                        {session && gp !== null && (
                            <Link href="/shop" className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-1.5 hover:bg-yellow-500/20 transition-colors">
                                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-yellow-400 font-black text-sm">{gp.toLocaleString()}</span>
                                <span className="text-yellow-600 text-[10px] font-medium">GP</span>
                            </Link>
                        )}

                        {/* 유저 드롭다운 */}
                        {session ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={session.user?.image ?? ''} />
                                            <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                                                {session.user?.name?.[0] ?? 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-52 bg-zinc-900 border-zinc-800 text-white"
                                    align="end"
                                >
                                    <DropdownMenuLabel className="font-normal">
                                        <p className="text-sm font-bold truncate">{session.user?.name ?? '사용자'}</p>
                                        <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                            <User className="w-4 h-4 text-zinc-400" /> 내 프로필
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/quests" className="flex items-center gap-2 cursor-pointer">
                                            <Zap className="w-4 h-4 text-purple-400" /> 퀘스트
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/shop" className="flex items-center gap-2 cursor-pointer">
                                            <ShoppingBag className="w-4 h-4 text-orange-400" /> 상점
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/analyst" className="flex items-center gap-2 cursor-pointer">
                                            <Bot className="w-4 h-4 text-purple-400" /> AI 분석가
                                        </Link>
                                    </DropdownMenuItem>
                                    {isAdmin && (
                                        <>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-blue-400">
                                                    <BarChart2 className="w-4 h-4" /> 관리자
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuItem
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                                    >
                                        <LogOut className="w-4 h-4" /> 로그아웃
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/auth/signin">
                                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs h-8">
                                    로그인
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ─── 모바일 바텀 네비 (md 미만에서만 표시) ──────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-xl">
                <div className="flex items-stretch h-16">
                    {BOTTOM_ROUTES.map(route => {
                        const active = isActive(route.href)
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors py-2',
                                    active ? 'text-yellow-400' : 'text-zinc-500 active:text-zinc-300'
                                )}
                            >
                                <div className={cn(
                                    'w-8 h-1.5 rounded-full mb-0.5 transition-all',
                                    active ? 'bg-yellow-400' : 'bg-transparent'
                                )} />
                                <route.icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
                                <span>{route.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
