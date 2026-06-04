import { redirect } from 'next/navigation'

// /history 는 /info 로 통합됩니다
export default function HistoryPage() {
    redirect('/info')
}
