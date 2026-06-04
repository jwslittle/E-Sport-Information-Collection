'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SignInPage() {
    const [agreed, setAgreed] = useState(false)
    const [ageConfirmed, setAgeConfirmed] = useState(false)
    const [showError, setShowError] = useState(false)

    const handleSignIn = () => {
        if (!agreed || !ageConfirmed) {
            setShowError(true)
            return
        }
        signIn('google', { callbackUrl: '/' })
    }

    const canSignIn = agreed && ageConfirmed

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Trophy className="h-12 w-12 text-yellow-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">환영합니다</CardTitle>
                    <CardDescription className="text-zinc-400">
                        LCK 경기 예측, 퀴즈, 퀘스트에 참여하세요
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* ✅ PIPA 제15조 — 약관 동의 (로그인 전 필수) */}
                    <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <p className="text-xs text-zinc-400 font-medium">서비스 이용을 위해 아래 항목에 동의해주세요</p>

                        {/* 약관 동의 */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={e => { setAgreed(e.target.checked); setShowError(false) }}
                                className="mt-0.5 h-4 w-4 rounded border-zinc-600 accent-yellow-500 cursor-pointer"
                            />
                            <span className="text-xs text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                                <Link href="/terms" className="text-yellow-400 hover:text-yellow-300 underline" target="_blank">이용약관</Link>
                                {' '}및{' '}
                                <Link href="/privacy" className="text-yellow-400 hover:text-yellow-300 underline" target="_blank">개인정보처리방침</Link>
                                에 동의합니다. <span className="text-zinc-500">(필수)</span>
                            </span>
                        </label>

                        {/* ✅ PIPA 제22조의2 — 만 14세 미만 가입 차단 */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={ageConfirmed}
                                onChange={e => { setAgeConfirmed(e.target.checked); setShowError(false) }}
                                className="mt-0.5 h-4 w-4 rounded border-zinc-600 accent-yellow-500 cursor-pointer"
                            />
                            <span className="text-xs text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                                만 14세 이상입니다. <span className="text-zinc-500">(필수)</span>
                            </span>
                        </label>
                    </div>

                    {/* 미동의 경고 */}
                    {showError && (
                        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg p-3">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            모든 항목에 동의하셔야 서비스를 이용할 수 있습니다.
                        </div>
                    )}

                    <Button
                        variant="outline"
                        disabled={!canSignIn}
                        className={cn(
                            'w-full bg-white text-black hover:bg-gray-100 transition-opacity',
                            !canSignIn && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={handleSignIn}
                    >
                        Google로 로그인
                    </Button>

                    <p className="text-center text-[11px] text-zinc-600 leading-relaxed">
                        Google 계정으로 로그인하면 위 약관에 동의한 것으로 간주합니다.
                        이 서비스는 비상업적 팬 프로젝트입니다.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
