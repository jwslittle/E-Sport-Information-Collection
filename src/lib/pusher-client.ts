/**
 * Pusher 클라이언트 — 경매장 기능 구현 시 활성화
 * 현재 pusher-js 패키지 미설치 상태 (경매장 미오픈)
 * 활성화 방법: npm install pusher-js 후 아래 주석 해제
 */

// import Pusher from 'pusher-js'
// export const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
//     cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
// })

export const pusherClient = null as any
