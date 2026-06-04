'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

/**
 * 로그인 상태에서 로그인 퀘스트를 자동으로 트리거합니다.
 * 렌더 트리에 상태를 추가하지 않으며, 세션당 1회만 실행됩니다.
 */
export function QuestTracker() {
    const { status } = useSession()
    const fired = useRef(false)

    useEffect(() => {
        if (status === 'authenticated' && !fired.current) {
            fired.current = true
            fetch('/api/quests/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'LOGIN' }),
            }).catch(() => {})
        }
    }, [status])

    return null
}
