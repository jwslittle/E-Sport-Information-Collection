import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: '이용약관 | E-Sport SuperTeam',
    description: 'E-Sport SuperTeam 이용약관',
}

export default function TermsPage() {
    const lastUpdated = '2026년 6월 2일'

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-2xl font-black text-white mb-1">이용약관</h1>
            <p className="text-zinc-500 text-sm mb-10">최종 업데이트: {lastUpdated}</p>

            <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

                <section>
                    <h2 className="text-base font-bold text-white mb-3">1. 서비스 소개</h2>
                    <p>
                        E-Sport SuperTeam(이하 "서비스")은 LCK(League Champions Korea) 팬을 위한
                        비상업적 팬 프로젝트입니다. 경기 예측, 퀴즈, 팀 정보, 커뮤니티 기능을 제공합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">2. 이용 자격</h2>
                    <ul className="ml-4 space-y-1 list-disc text-zinc-400">
                        <li>Google 계정을 보유한 만 14세 이상의 사용자</li>
                        <li>본 약관에 동의한 경우</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">3. 재화(GP) 관련</h2>
                    <p>
                        서비스 내 GP(Game Points)는 게임 내 가상 재화로, 현금으로의 환전·환급이 불가능합니다.
                        실제 화폐 가치를 갖지 않으며, 서비스 내 코스메틱 아이템 구매에만 사용됩니다.
                    </p>
                    <p className="mt-2 text-zinc-500">
                        서비스 종료 시 GP는 소멸될 수 있으며, 어떠한 보상도 제공되지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">4. 금지 행위</h2>
                    <ul className="ml-4 space-y-1 list-disc text-zinc-400">
                        <li>타인의 계정을 도용하거나 부정한 방법으로 GP를 획득하는 행위</li>
                        <li>서비스를 상업적 목적으로 이용하는 행위</li>
                        <li>타인에게 혐오감을 주는 콘텐츠를 게시하는 행위</li>
                        <li>서비스의 정상적인 운영을 방해하는 행위</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">5. 서비스 변경 및 종료</h2>
                    <p>
                        비상업적 팬 프로젝트 특성상 사전 공지 없이 서비스가 변경되거나 종료될 수 있습니다.
                        서비스 제공자는 이에 대해 어떠한 책임도 부담하지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">6. 지적재산권</h2>
                    <p>
                        League of Legends, LCK 관련 상표·로고·이미지는 Riot Games, Inc.의 소유입니다.
                        본 서비스는 Riot Games Fan Content Policy에 따라 비상업적으로 제작되었습니다.
                    </p>
                    <p className="mt-2">
                        <a
                            href="https://www.riotgames.com/en/legal"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-400 hover:underline"
                        >
                            Riot Games Fan Content Policy 확인 →
                        </a>
                    </p>
                </section>

                <div className="pt-6 border-t border-zinc-800 text-xs text-zinc-600">
                    <p>
                        E-Sport SuperTeam은 Riot Games의 공식 서비스가 아닙니다.
                        Riot Games는 본 서비스를 보증하거나 후원하지 않습니다.
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
