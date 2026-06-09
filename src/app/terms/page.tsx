import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: '이용약관 | E-Sport Information Collection',
    description: 'E-Sport Information Collection 이용약관',
}

export default function TermsPage() {
    const lastUpdated = '2026년 6월 8일'

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-2xl font-black text-white mb-1">이용약관</h1>
            <p className="text-zinc-500 text-sm mb-10">최종 업데이트: {lastUpdated}</p>

            <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

                <section>
                    <h2 className="text-base font-bold text-white mb-3">1. 서비스 소개</h2>
                    <p>
                        E-Sport Information Collection(이하 "서비스")은 LCK(League Champions Korea) 팬을 위한
                        비상업적 팬 프로젝트입니다. 경기 예측, 퀴즈, 팀/선수 정보, 커뮤니티, GP 코스메틱 상점,
                        퀘스트, AI 분석가, 글로벌 랭킹 기능을 제공합니다.
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
                    <h2 className="text-base font-bold text-white mb-3">4. 금지 행위 및 제재</h2>
                    <ul className="ml-4 space-y-1 list-disc text-zinc-400">
                        <li>타인의 계정을 도용하거나 부정한 방법으로 GP를 획득하는 행위</li>
                        <li>서비스를 상업적 목적으로 이용하는 행위</li>
                        <li>타인에게 혐오감을 주거나 모욕, 명예훼손, 비방하는 콘텐츠를 게시하는 행위</li>
                        <li>허위 사실을 유포하거나 타인의 개인정보를 침해하는 행위</li>
                        <li>서비스의 정상적인 운영을 방해하는 행위</li>
                    </ul>
                    {/* ✅ L-12 수정: 제재 결과 명시 */}
                    <p className="mt-3 text-zinc-500 text-xs">
                        위 금지 행위 위반 시 사전 통보 없이 게시물 삭제, 계정 이용 제한,
                        영구 이용 정지 등의 조치를 취할 수 있습니다.
                    </p>
                </section>

                {/* ✅ M-12 수정: 계정 삭제 시 데이터 처리 정책 명시 */}
                <section>
                    <h2 className="text-base font-bold text-white mb-3">4-1. 계정 탈퇴 및 데이터 처리</h2>
                    <p>
                        서비스 탈퇴 시 작성한 게시글, 댓글, 예측 기록, GP 내역 등 모든 데이터가
                        즉시 삭제됩니다. 삭제된 데이터는 복구할 수 없으며, 다른 이용자가 작성한
                        게시글에 달린 댓글도 함께 삭제됩니다.
                    </p>
                    <p className="mt-2 text-zinc-500">
                        탈퇴는 서비스 내 계정 설정 페이지에서 직접 하실 수 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">4-2. API 이용 제한(Rate Limiting)</h2>
                    <p>
                        서비스 안정성 보호를 위해 단시간 내 과도한 API 요청은 자동으로 제한될 수 있습니다.
                        이 과정에서 요청 IP 주소가 Upstash Inc.(미국)의 Redis 서버에 일시적으로 저장됩니다.
                        자세한 내용은 개인정보처리방침 4항을 참고하세요.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">5. 서비스 변경 및 종료</h2>
                    <p>
                        비상업적 팬 프로젝트 특성상 서비스가 변경되거나 종료될 수 있습니다.
                        서비스 종료 시에는 부득이한 경우를 제외하고 <strong>최소 7일 전</strong>에 서비스 내 공지 또는
                        이메일로 사전 통보하겠습니다. 단, 긴급한 법적 이유나 불가항력적 상황에서는
                        즉시 종료될 수 있으며, 이 경우 GP는 소멸되고 별도 보상이 제공되지 않습니다.
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

                <section>
                    <h2 className="text-base font-bold text-white mb-3">6-1. 약관 변경</h2>
                    <p>
                        서비스 제공자는 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있습니다.
                        약관이 변경될 경우, 변경 사항은 서비스 내 공지 또는 이용약관 페이지를 통해 공지됩니다.
                        변경된 약관의 적용일 이후에도 서비스를 계속 이용하시면 변경된 약관에 동의한 것으로 간주합니다.
                    </p>
                    <p className="mt-2 text-zinc-500 text-xs">
                        중요한 변경 사항(개인정보 처리 방법, 이용 제한 등)의 경우 최소 7일 전에 사전 공지합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">7. 준거법 및 관할법원</h2>
                    <p>
                        본 약관은 대한민국 법률에 따라 해석·적용됩니다.
                        서비스 이용과 관련하여 분쟁이 발생한 경우, 관할 법원은 민사소송법에 따른 법원으로 합니다.
                    </p>
                    <p className="mt-2 text-zinc-500 text-xs">
                        단, 본 서비스가 비상업적 팬 프로젝트임을 감안하여, 분쟁 발생 시 먼저
                        이메일(jworks6365@gmail.com)로 연락 주시면 원만히 해결하겠습니다.
                    </p>
                </section>

                <div className="pt-6 border-t border-zinc-800 text-xs text-zinc-600">
                    <p>
                        E-Sport Information Collection은 Riot Games의 공식 서비스가 아닙니다.
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
