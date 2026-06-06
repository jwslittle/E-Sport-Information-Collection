'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, AlertCircle, UserPlus, LogIn, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'choose' | 'signup'

export default function SignInPage() {
    const [mode, setMode] = useState<Mode>('choose')
    const [agreed, setAgreed] = useState(false)
    const [ageConfirmed, setAgeConfirmed] = useState(false)
    const [showError, setShowError] = useState(false)
    const [loading, setLoading] = useState(false)

    // 기존 회원 → 바로 Google 로그인
    const handleLogin = async () => {
        setLoading(true)
        await signIn('google', { callbackUrl: '/' })
    }

    // 신규 회원 → 약관 동의 후 Google 회원가입
    const handleSignUp = async () => {
        if (!agreed || !ageConfirmed) {
            setShowError(true)
            return
        }
        setLoading(true)
        await signIn('google', { callbackUrl: '/' })
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Trophy className="h-12 w-12 text-yellow-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                        {mode === 'choose' ? '환영합니다' : '신규 회원 가입'}
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        {mode === 'choose'
                            ? 'LCK 경기 예측, 퀴즈, 퀘스트에 참여하세요'
                            : '약관 동의 후 Google 계정으로 가입하세요'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">

                    {/* ── 선택 화면 ─────────────────────────────────── */}
                    {mode === 'choose' && (
                        <>
                            {/* 기존 회원 로그인 */}
                            <Button
                                variant="outline"
                                disabled={loading}
                                className="w-full h-14 bg-white text-black hover:bg-gray-100 font-semibold text-base gap-2"
                                onClick={handleLogin}
                            >
                                <LogIn className="h-5 w-5" />
                                기존 회원 로그인 (Google)
                            </Button>

                            {/* 구분선 */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-zinc-700" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-zinc-900 px-3 text-zinc-500">처음 방문이신가요?</span>
                                </div>
                            </div>

                            {/* 신규 회원 가입 */}
                            <Button
                                variant="outline"
                                disabled={loading}
                                className="w-full h-14 bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-600 font-semibold text-base gap-2"
                                onClick={() => setMode('signup')}
                            >
                                <UserPlus className="h-5 w-5" />
                                신규 회원 가입
                            </Button>

                            <p className="text-center text-[11px] text-zinc-600 leading-relaxed pt-1">
                                이 서비스는 비상업적 LCK 팬 프로젝트입니다.
                            </p>
                        </>
                    )}

                    {/* ── 신규 가입 화면 ────────────────────────────── */}
                    {mode === 'signup' && (
                        <>
                            {/* 뒤로가기 */}
                            <button
                                onClick={() => { setMode('choose'); setShowError(false); setAgreed(false); setAgeConfirmed(false) }}
                                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                로그인 선택으로 돌아가기
                            </button>

                            {/* ✅ PIPA 제15조 — 약관 동의 */}
                            <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                                <p className="text-xs text-zinc-400 font-medium">
                                    서비스 가입을 위해 아래 항목에 동의해주세요
                                </p>

                                {/* 약관 동의 */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={e => { setAgreed(e.target.checked); setShowError(false) }}
                                        className="mt-0.5 h-4 w-4 rounded border-zinc-600 accent-yellow-500 cursor-pointer"
                                    />
                                    <span className="text-xs text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                                        <Link href="/terms" className="text-yellow-400 hover:text-yellow-300 underline" target="_blank">
                                            이용약관
                                        </Link>
                                        {' '}및{' '}
                                        <Link href="/privacy" className="text-yellow-400 hover:text-yellow-300 underline" target="_blank">
                                            개인정보처리방침
                                        </Link>
                                        에 동의합니다.{' '}
                                        <span className="text-zinc-500">(필수)</span>
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
                                        만 14세 이상입니다.{' '}
                                        <span className="text-zinc-500">(필수)</span>
                                    </span>
                                </label>
                            </div>

                            {/* 미동의 경고 */}
                            {showError && (
                                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg p-3">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    모든 항목에 동의하셔야 가입이 가능합니다.
                                </div>
                            )}

                            {/* 가입 버튼 */}
                            <Button
                                variant="outline"
                                disabled={loading}
                                className={cn(
                                    'w-full h-12 bg-white text-black hover:bg-gray-100 font-semibold transition-opacity',
                                    (!agreed || !ageConfirmed) && 'opacity-40'
                                )}
                                onClick={handleSignUp}
                            >
                                Google로 회원가입
                            </Button>

                            <p className="text-center text-[11px] text-zinc-600 leading-relaxed">
                                Google 계정으로 가입하면 위 약관에 동의한 것으로 간주합니다.
                                이 서비스는 비상업적 팬 프로젝트입니다.
                            </p>
                        </>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}
