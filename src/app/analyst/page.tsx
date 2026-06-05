'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bot, User, Send, Sparkles, Ticket, Loader2, LogIn } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AnalystPage() {
    const { data: session, status } = useSession()
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '안녕하세요! 저는 LCK AI 분석가입니다. 선수, 통계, 팀 추천 등 무엇이든 물어보세요. (현재 베타 기간으로 무료로 이용 가능합니다)' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [ticketCount, setTicketCount] = useState<number | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()

    // ── 인증 가드 ──────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="max-w-4xl mx-auto py-24 flex flex-col items-center gap-6 text-center">
                <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-purple-400" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">AI 분석가</h1>
                    <p className="text-zinc-400">로그인 후 LCK AI 분석가를 무료로 이용할 수 있습니다.</p>
                </div>
                <Button
                    onClick={() => signIn('google')}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                >
                    <LogIn className="w-4 h-4" />
                    Google로 로그인
                </Button>
            </div>
        )
    }

    useEffect(() => {
        fetchTicketCount()
    }, [])

    const fetchTicketCount = async () => {
        // Ticket check disabled due to schema changes
        setTicketCount(999)
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return
        // Ticket check disabled for Beta
        /*
        if (ticketCount === 0) {
            toast({
                title: "티켓 부족",
                description: "AI 분석가 질문권이 필요합니다. 상점에서 구매해주세요.",
                variant: "destructive"
            })
            return
        }
        */

        const userMessage = input.trim()
        const newMessages = [...messages, { role: 'user', content: userMessage }] as Message[]

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
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch response')
            }

            // Handle streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = ''

            setMessages(prev => [...prev, { role: 'assistant', content: '' }])

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    const chunk = decoder.decode(value)
                    assistantMessage += chunk
                    setMessages(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1].content = assistantMessage
                        return updated
                    })
                }
            }

            // Deduct ticket locally
            setTicketCount(prev => (prev ? prev - 1 : 0))

        } catch (error: any) {
            console.error(error)
            setMessages((prev) => [...prev, { role: 'assistant', content: `오류가 발생했습니다: ${error.message}` }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-purple-500" />
                    <h1 className="text-2xl font-bold text-white">AI 분석가</h1>
                </div>
                <div className="bg-zinc-900 px-4 py-2 rounded-full border border-purple-500/30 flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-zinc-400">이용권:</span>
                    <span className="font-bold text-green-400">무제한 (Beta)</span>
                </div>
            </div>

            <Card className="flex-1 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <Avatar className={msg.role === 'assistant' ? 'bg-purple-500/10' : 'bg-zinc-800'}>
                                    {msg.role === 'assistant' ? (
                                        <Bot className="h-5 w-5 text-purple-500" />
                                    ) : (
                                        <User className="h-5 w-5 text-zinc-400" />
                                    )}
                                </Avatar>
                                <div
                                    className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-zinc-800 text-zinc-200'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <Avatar className="bg-purple-500/10">
                                    <Bot className="h-5 w-5 text-purple-500" />
                                </Avatar>
                                <div className="bg-zinc-800 rounded-lg p-3 text-zinc-400 animate-pulse">
                                    분석 중...
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            placeholder="질문을 입력하세요..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            aria-label="AI 분석가에게 질문"
                            className="bg-zinc-800 border-zinc-700 text-white focus-visible:ring-purple-500"
                        />
                        <Button type="submit" aria-label="질문 전송" disabled={isLoading} className="bg-purple-600 hover:bg-purple-500">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                    {/* 
                    {ticketCount === 0 && (
                        <p className="text-xs text-red-400 mt-2 text-center">
                            * 상점에서 'AI 분석가 질문권'을 구매해야 이용할 수 있습니다.
                        </p>
                    )} 
                    */}
                </div>
            </Card>
        </div>
    )
}
