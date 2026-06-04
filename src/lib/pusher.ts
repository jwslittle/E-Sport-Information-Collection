/**
 * Pusher 서버 — 경매장 기능 구현 시 활성화
 * 현재 pusher 패키지 미설치 상태 (경매장 미오픈)
 * 활성화 방법: npm install pusher 후 아래 주석 해제
 */

// import Pusher from 'pusher'
// export const pusherServer = new Pusher({
//     appId: process.env.PUSHER_APP_ID!,
//     key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
//     secret: process.env.PUSHER_SECRET!,
//     cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
//     useTLS: true,
// })

export const pusherServer = null as any
