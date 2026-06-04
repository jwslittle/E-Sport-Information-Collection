'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'

export function AIBriefing({ className }: { className?: string }) {
    const [tip, setTip] = useState('')
    const [displayedTip, setDisplayedTip] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/ai-briefing')
            .then(res => res.json())
            .then(data => {
                setTip(data.tip)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setTip("AI 시스템이 데이터를 분석 중입니다...")
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        if (!tip) return

        let currentIndex = 0
        const interval = setInterval(() => {
            if (currentIndex <= tip.length) {
                setDisplayedTip(tip.slice(0, currentIndex))
                currentIndex++
            } else {
                clearInterval(interval)
            }
        }, 50) // Typing speed

        return () => clearInterval(interval)
    }, [tip])

    if (loading) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 backdrop-blur-sm ${className}`}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 mt-1">
                    <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">AI Analyst Insight</span>
                        <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                    </div>
                    <p className="text-sm md:text-base text-indigo-100 font-medium leading-relaxed min-h-[1.5em]">
                        {displayedTip}
                        <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
