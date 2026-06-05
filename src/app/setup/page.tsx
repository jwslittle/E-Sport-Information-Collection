/**
 * /setup — 프로필 초기 설정
 * 첫 로그인 후 프로필 페이지로 리다이렉트
 */
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function SetupPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect('/auth/signin')

    // 프로필 설정 페이지로 리다이렉트
    redirect('/profile')
}
