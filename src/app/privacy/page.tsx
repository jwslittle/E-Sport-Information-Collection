import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: '개인정보처리방침 | E-Sport SuperTeam',
    description: 'E-Sport SuperTeam 개인정보처리방침',
}

export default function PrivacyPage() {
    const lastUpdated = '2026년 6월 2일'

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-2xl font-black text-white mb-1">개인정보처리방침</h1>
            <p className="text-zinc-500 text-sm mb-10">최종 업데이트: {lastUpdated}</p>

            <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

                <section>
                    <h2 className="text-base font-bold text-white mb-3">1. 수집하는 개인정보</h2>
                    <p>E-Sport SuperTeam(이하 "서비스")은 Google 로그인을 통해 다음 정보를 수집합니다:</p>
                    <ul className="mt-2 ml-4 space-y-1 list-disc text-zinc-400">
                        <li>이메일 주소 (계정 식별 용도)</li>
                        <li>Google 프로필 이름 및 프로필 사진 (닉네임·아바타 표시 용도)</li>
                    </ul>
                    <p className="mt-2 text-zinc-500">
                        결제 정보, 주민등록번호 등 민감정보는 일절 수집하지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">2. 수집 목적</h2>
                    <ul className="ml-4 space-y-1 list-disc text-zinc-400">
                        <li>회원 가입 및 로그인 처리</li>
                        <li>LCK 경기 예측, 퀴즈, 커뮤니티 서비스 제공</li>
                        <li>GP(게임 포인트) 적립 및 랭킹 관리</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">3. 보존 기간</h2>
                    <p>
                        회원 탈퇴 요청 시 30일 이내에 개인정보를 파기합니다.
                        관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 별도 보관 후 파기합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">4. 제3자 제공</h2>
                    <p>
                        수집한 개인정보를 제3자에게 제공하지 않습니다.
                        서비스 운영을 위해 다음 외부 서비스를 이용합니다:
                    </p>
                    <ul className="mt-2 ml-4 space-y-1 list-disc text-zinc-400">
                        <li>Google LLC — OAuth 인증 (Google 개인정보처리방침 적용)</li>
                        <li>Vercel Inc. — 서버 호스팅</li>
                        <li>OpenAI — AI 분석 기능 (입력한 질문만 전송, 개인정보 미포함)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">5. 정보주체의 권리</h2>
                    <p>
                        이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.
                        요청은 아래 이메일로 문의해 주세요.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">6. 문의</h2>
                    <p className="text-zinc-400">
                        개인정보 관련 문의: 서비스 관리자에게 커뮤니티 또는 이메일로 연락 주세요.
                    </p>
                </section>

                <div className="pt-6 border-t border-zinc-800 text-xs text-zinc-600">
                    <p>
                        본 서비스는 비상업적 팬 프로젝트입니다.
                        Riot Games의 공식 서비스가 아니며 Riot Fan Content Policy를 준수합니다.
                    </p>
                </div>
            </div>

            <div className="mt-10">
                <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
                    ← 홈으로 돌아가기
                </Link>
            </div>
        </div>
    )
}
