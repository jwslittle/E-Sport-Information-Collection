'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, UserCheck, Sparkles } from 'lucide-react'

// 허용 문자: 한글, 영문, 숫자, 언더스코어 (2~15자)
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,15}$/

function validate(value: string): string | null {
    if (!value.trim()) return null
    if (value.length < 2) return '최소 2자 이상 입력해주세요.'
    if (value.length > 15) return '15자 이하로 입력해주세요.'
    if (!NICKNAME_REGEX.test(value)) return '한글·영문·숫자·_ 만 사용 가능합니다.'
    return 'ok'
}

export default function OnboardingPage() {
    const { data: session, update } = useSession()
    const router = useRouter()

    const googleName = session?.user?.name ?? ''
    const [nickname, setNickname] = useState(googleName)
    const [submitting, setSubmitting] = useState(false)

    const validationResult = validate(nickname)
    const isValid = validationResult === 'ok'
    const errorMsg = validationResult && validationResult !== 'ok' ? validationResult : null

    const handleSubmit = async () => {
        if (!isValid) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/users/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nickname.trim() }),
            })
            const data = await res.json()

            if (res.ok) {
                // 세션의 isOnboarded + name 업데이트
                await update({
                    user: {
                        isOnboarded: true,
                        name: data.nickname,
                    },
                })
                toast.success(`환영합니다, ${data.nickname}님! 🎉`)
                router.push('/')
                router.refresh()
            } else {
                toast.error(data.error ?? '닉네임 설정에 실패했습니다.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* 로고 / 타이틀 */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-4">
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">E-Sport 팬 커뮤니티</h1>
                    <p className="text-zinc-400">닉네임을 설정하고 시작하세요!</p>
                </div>

                {/* 카드 */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
                    {/* 구글 아바타 */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                            <AvatarImage src={session?.user?.image ?? ''} />
                            <AvatarFallback className="bg-zinc-700 text-white text-lg">
                                {googleName?.[0] ?? 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs text-zinc-500 mb-0.5">Google 계정으로 로그인됨</p>
                            <p className="text-sm text-zinc-300">{session?.user?.email}</p>
                        </div>
                    </div>

                    <hr className="border-zinc-800" />

                    {/* 안내문 */}
                    <div className="space-y-1.5">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-yellow-400" />
                            닉네임 설정
                        </h2>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            커뮤니티에서 사용할 닉네임입니다. 실명 대신 원하는 이름을 사용하세요.
                            한글·영문·숫자·_ 사용 가능 (2~15자)
                        </p>
                    </div>

                    {/* 닉네임 입력 */}
                    <div className="space-y-2">
                        <Input
                            placeholder="닉네임 입력 (예: LCK팬123)"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            maxLength={15}
                            className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600 h-12 text-base"
                            autoFocus
                        />
                        {/* 에러 or 글자수 */}
                        <div className="flex items-center justify-between">
                            <span className={`text-xs ${errorMsg ? 'text-red-400' : 'text-zinc-600'}`}>
                                {errorMsg ?? ' '}
                            </span>
                            <span className="text-xs text-zinc-600">
                                {nickname.length} / 15
                            </span>
                        </div>
                    </div>

                    {/* 주의사항 */}
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500 space-y-1">
                        <p>• 닉네임은 커뮤니티, 예측, 랭킹 등 모든 곳에서 표시됩니다.</p>
                        <p>• 이메일, 전화번호 등 개인정보가 포함되지 않도록 해주세요.</p>
                        <p>• 설정 후에도 프로필 페이지에서 변경 가능합니다.</p>
                    </div>

                    {/* 시작 버튼 */}
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid || submitting}
                        className="w-full h-12 text-base font-bold bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-40"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            '🎮 시작하기'
                        )}
                    </Button>
                </div>

                <p className="text-center text-xs text-zinc-700 mt-4">
                    E-Sport SuperTeam — LCK 팬 커뮤니티
                </p>
            </div>
        </div>
    )
}
