import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── KST 날짜/시간 포매팅 ──────────────────────────────────────────────────────
// date-fns format()은 서버(UTC)/클라이언트(KST) 환경 차이로 hydration 불일치 발생 →
// Intl.DateTimeFormat으로 타임존을 명시해 서버·클라이언트 모두 동일한 KST 결과 반환
type FmtKSTMode = 'time' | 'date-short' | 'datetime-short' | 'full'
export function fmtKST(date: Date, mode: FmtKSTMode): string {
    const opts: Intl.DateTimeFormatOptions = mode === 'time'
        ? { hour: '2-digit', minute: '2-digit', hour12: false }
        : mode === 'date-short'
            ? { month: '2-digit', day: '2-digit', weekday: 'short' }
            : mode === 'datetime-short'
                ? { month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }
                : { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }
    const p: Record<string, string> = {}
    new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...opts })
        .formatToParts(date)
        .forEach(({ type, value }) => { p[type] = value })
    if (mode === 'time')            return `${p.hour}:${p.minute}`
    if (mode === 'date-short')      return `${p.month}.${p.day} (${p.weekday})`
    if (mode === 'datetime-short')  return `${p.month}.${p.day} (${p.weekday}) ${p.hour}:${p.minute}`
    return `${p.year}.${p.month}.${p.day} (${p.weekday}) ${p.hour}:${p.minute}`
}
