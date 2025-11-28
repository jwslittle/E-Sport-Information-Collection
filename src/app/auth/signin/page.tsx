'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

export default function SignInPage() {
    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Trophy className="h-12 w-12 text-yellow-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">환영합니다</CardTitle>
                    <CardDescription className="text-zinc-400">
                        팀과 컬렉션을 관리하려면 로그인하세요
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full bg-white text-black hover:bg-gray-100"
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                    >
                        Google로 로그인
                    </Button>
                    <Button
                        className="w-full bg-[#03C75A] hover:bg-[#02b351] text-white"
                        onClick={() => signIn('naver', { callbackUrl: '/' })}
                    >
                        네이버로 로그인
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
