'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bot, User, Send, Sparkles } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AnalystPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '안녕하세요! 저는 LCK AI 분석가입니다. 선수, 통계, 팀 추천 등 무엇이든 물어보세요.' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            })

            if (!response.ok) throw new Error('Failed to fetch response')

            const data = await response.json()
            setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
        } catch (error) {
            console.error(error)
            setMessages((prev) => [...prev, { role: 'assistant', content: '죄송합니다. 오류가 발생했습니다. 나중에 다시 시도해주세요.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
                <h1 className="text-2xl font-bold text-white">AI 분석가</h1>
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
                                    생각 중...
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            placeholder="페이커의 스탯에 대해 물어보거나, 쵸비와 쇼메이커를 비교해보세요..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white focus-visible:ring-purple-500"
                        />
                        <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-500">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
