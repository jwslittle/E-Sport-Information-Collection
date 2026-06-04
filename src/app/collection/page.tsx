/**
 * /collection — 카드 컬렉션 시스템 제거됨
 * 상점(/shop)으로 리다이렉트
 */
import { redirect } from 'next/navigation'

export default function CollectionPage() {
    redirect('/shop')
}
