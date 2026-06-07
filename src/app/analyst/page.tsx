'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bot, User, Send, Sparkles, Loader2, LogIn, ShoppingBag, TicketX } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AnalystPage() {
    const { data: session, status } = useSession()

    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '안녕하세요! 저는 LCK AI 분석가입니다. 선수, 통계, 팀 추천 등 무엇이든 물어보세요.' }
    ])
    const [input, setInput]           = useState('')
    const [isLoading, setIsLoading]   = useState(false)
    const [tickets, setTickets]       = useState<number | null>(null)
    const [ticketsLoading, setTicketsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // ── 질의권 수량 로드 ───────────────────────────────────────────────────────
    const fetchTickets = useCallback(async () => {
        if (!session?.user) return
        setTicketsLoading(true)
        try {
            const res = await fetch('/api/users/me')
            if (res.ok) {
                const d = await res.json()
                setTickets(d.aiQueryTickets ?? 0)
            }
        } catch { /* ignore */ }
        finally { setTicketsLoading(false) }
    }, [session])

    useEffect(() => { fetchTickets() }, [fetchTickets])

    // ── 스크롤 자동 하단 이동 ─────────────────────────────────────────────────
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── 로그인 상태 로딩 ─────────────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
        )
    }

    // ── 미로그인 ─────────────────────────────────────────────────────────────
    if (!session) {
        return (
            <div className="max-w-4xl mx-auto py-24 flex flex-col items-center gap-6 text-center">
                <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-purple-400" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">AI 분석가</h1>
                    <p className="text-zinc-400">로그인 후 AI 분석가를 이용할 수 있습니다.</p>
                </div>
                <Button onClick={() => signIn('google')} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    <LogIn className="w-4 h-4" /> Google로 로그인
                </Button>
            </div>
        )
    }

    // ── isAdmin/hasTicket — handleSubmit보다 먼저 선언 (클로저 접근 보장)
    const isAdmin   = (session.user as any)?.role === 'ADMIN'
    const hasTicket = tickets === null || tickets > 0

    // ── 메시지 전송 ───────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        // 질의권 클라이언트 사전 체크 (서버에서도 검사함)
        // ✅ BUG-14 수정: 관리자는 질의권 없어도 사용 가능
        if (!isAdmin && tickets !== null && tickets < 1) return

        const userMessage = input.trim()
        const newMessages = [...messages, { role: 'user' as const, content: userMessage }]

        setMessages(newMessages)
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages }),
            })

            if (!response.ok) {
                const err = await response.json()
                setMessages(prev => [...prev, { role: 'assistant', content: err.error || '오류가 발생했습니다.' }])
                return
            }

            // 질의권 1개 소모 반영 (서버에서 차감됨)
            setTickets(prev => (prev !== null ? Math.max(0, prev - 1) : prev))

            // 스트리밍 응답 처리
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = ''
            setMessages(prev => [...prev, { role: 'assistant', content: '' }])

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    assistantMessage += decoder.decode(value)
                    setMessages(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1].content = assistantMessage
                        return updated
                    })
                }
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.'
            setMessages(prev => [...prev, { role: 'assistant', content: `오류: ${msg}` }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">

            {/* ── 헤더 ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-purple-500" />
                    <h1 className="text-2xl font-bold text-white">AI 분석가</h1>
                </div>

                {/* 질의권 뱃지 */}
                <div className="flex items-center gap-2">
                    {ticketsLoading ? (
                        <div className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-full">
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                        </div>
                    ) : isAdmin ? (
                        <div className="px-4 py-2 bg-blue-900/20 border border-blue-700/40 rounded-full text-sm text-blue-300 flex items-center gap-2">
                            <Bot className="w-4 h-4" />
                            <span>관리자 무제한</span>
                        </div>
                    ) : (
                        <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-sm ${
                            (tickets ?? 0) > 0
                                ? 'bg-purple-900/20 border-purple-700/40 text-purple-300'
                                : 'bg-red-900/20 border-red-700/40 text-red-400'
                        }`}>
                            <TicketX className="w-4 h-4" />
                            <span>질의권 <strong>{tickets ?? 0}장</strong></span>
                        </div>
                    )}

                    {/* 질의권 없을 때 구매 버튼 */}
                    {!isAdmin && (tickets ?? 0) === 0 && (
                        <Link href="/shop">
                            <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs gap-1">
                                <ShoppingBag className="w-3.5 h-3.5" /> 질의권 구매
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* ── 채팅 영역 ────────────────────────────────────────────────── */}
            <Card className="flex-1 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <Avatar className={msg.role === 'assistant' ? 'bg-purple-500/10' : 'bg-zinc-800'}>
                                    {msg.role === 'assistant'
                                        ? <Bot className="h-5 w-5 text-purple-500" />
                                        : <AvatarImage src={session.user?.image ?? ''} />
                                    }
                                    <AvatarFallback className="bg-zinc-700 text-xs">
                                        {msg.role === 'user' ? (session.user?.name?.[0] ?? 'U') : 'AI'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`rounded-lg p-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
                                    msg.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-zinc-800 text-zinc-200'
                                }`}>
                                    {msg.content || (isLoading && index === messages.length - 1
                                        ? <span className="text-zinc-500 animate-pulse">분석 중...</span>
                                        : null
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* ── 입력창 ─────────────────────────────────────────────── */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 space-y-2">
                    {/* 질의권 없을 때 안내 */}
                    {!isAdmin && (tickets ?? 0) === 0 && (
                        <p className="text-xs text-center text-red-400 flex items-center justify-center gap-1.5">
                            <TicketX className="w-3.5 h-3.5" />
                            질의권이 없습니다.
                            <Link href="/shop" className="underline text-yellow-400 hover:text-yellow-300">
                                상점에서 구매
                            </Link>
                            하면 바로 이용 가능합니다. (1장 = 50 GP)
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            placeholder={hasTicket || isAdmin ? '질문을 입력하세요...' : '질의권이 필요합니다'}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={isLoading || (!isAdmin && !hasTicket)}
                            aria-label="AI 분석가에게 질문"
                            className="bg-zinc-800 border-zinc-700 text-white focus-visible:ring-purple-500 disabled:opacity-40"
                        />
                        <Button
                            type="submit"
                            aria-label="질문 전송"
                            disabled={isLoading || !input.trim() || (!isAdmin && !hasTicket)}
                            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40"
                        >
                            {isLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Send className="h-4 w-4" />
                            }
                        </Button>
                    </form>

                    {!isAdmin && (tickets ?? 0) > 0 && (
                        <p className="text-[11px] text-zinc-600 text-center">
                            질문 1회당 질의권 1장 소모 · 잔여 {tickets}장 ·
                            <Link href="/shop" className="ml-1 text-zinc-500 hover:text-zinc-400 underline">
                                질의권 추가 구매
                            </Link>
                        </p>
                    )}
                </div>
            </Card>
        </div>
    )
}
