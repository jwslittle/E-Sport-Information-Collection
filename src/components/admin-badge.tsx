/**
 * 관리자 강조 표시 컴포넌트
 * 관리자(role === 'ADMIN')임을 시각적으로 구분해주는 배지 + 닉네임 색상
 */
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminNameProps {
    name: string | null
    role: string
    className?: string
}

/**
 * 닉네임 + 관리자 배지 통합 컴포넌트
 * 관리자면 이름이 빨간색으로 표시되고 🛡️ 관리자 배지가 붙음
 */
export function UserName({ name, role, className }: AdminNameProps) {
    const isAdmin = role === 'ADMIN'
    return (
        <span className={cn('inline-flex items-center gap-1.5', className)}>
            <span className={cn(
                'font-medium',
                isAdmin ? 'text-red-400 font-bold' : ''
            )}>
                {name ?? '익명'}
            </span>
            {isAdmin && <AdminBadge />}
        </span>
    )
}

/**
 * 관리자 배지 단독 컴포넌트 (이름 옆에 붙이는 용도)
 */
export function AdminBadge({ size = 'sm' }: { size?: 'xs' | 'sm' }) {
    return (
        <span className={cn(
            'inline-flex items-center gap-0.5 rounded-full font-bold border',
            'bg-red-950/60 border-red-700/60 text-red-400',
            size === 'xs'
                ? 'text-[9px] px-1 py-0'
                : 'text-[10px] px-1.5 py-0.5'
        )}>
            <Shield className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            관리자
        </span>
    )
}
