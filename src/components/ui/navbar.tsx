'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Trophy, Users, ShoppingBag, Bot, User, Package, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const routes = [
    { href: '/', label: '홈', icon: Trophy },
    { href: '/players', label: '선수', icon: Users },
    { href: '/my-team', label: '나만의 팀', icon: User },
    { href: '/shop', label: '상점', icon: ShoppingBag },
    { href: '/collection', label: '보관함', icon: Package },
    { href: '/ranking', label: '랭킹', icon: Trophy },
    { href: '/simulation', label: '시뮬레이션', icon: Play },
    { href: '/analyst', label: 'AI 분석가', icon: Bot },
]

export function Navbar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
            <div className="container flex h-16 items-center px-4">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        <span className="hidden font-bold sm:inline-block text-white">
                            E-Sport-SuperTeam
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "transition-colors hover:text-white/80",
                                    pathname === route.href ? "text-white" : "text-white/60"
                                )}
                            >
                                {route.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden text-white"
                        >
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">메뉴 열기</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="pr-0 bg-zinc-950 border-zinc-800">
                        <Link href="/" className="flex items-center gap-2 px-2">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            <span className="font-bold text-white">E-Sport-SuperTeam</span>
                        </Link>
                        <nav className="mt-8 flex flex-col gap-4">
                            {routes.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={cn(
                                        "flex items-center gap-2 text-lg font-medium transition-colors hover:text-white",
                                        pathname === route.href ? "text-white" : "text-white/60"
                                    )}
                                >
                                    <route.icon className="h-5 w-5" />
                                    {route.label}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                                        <AvatarFallback>{session.user?.name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-white" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                                        <p className="text-xs leading-none text-zinc-400">
                                            {session.user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem onClick={() => signOut()} className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>로그아웃</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                            <Link href="/auth/signin">
                                로그인
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}
