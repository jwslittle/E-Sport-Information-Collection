import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: '개인정보처리방침 | E-Sport Information Collection',
    description: 'E-Sport Information Collection 개인정보처리방침',
}

export default function PrivacyPage() {
    const lastUpdated = '2026년 6월 8일 (6차 개정)'

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-2xl font-black text-white mb-1">개인정보처리방침</h1>
            <p className="text-zinc-500 text-sm mb-10">최종 업데이트: {lastUpdated}</p>

            <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

                {/* ✅ H-13 수정: 활동 데이터 수집 항목 상세 명시 (PIPA 제15조) */}
                <section>
                    <h2 className="text-base font-bold text-white mb-3">1. 수집하는 개인정보</h2>
                    <p className="mb-2">E-Sport Information Collection(이하 "서비스")은 Google 로그인을 통해 다음 정보를 수집합니다:</p>

                    <p className="font-medium text-zinc-300 mt-3 mb-1">■ Google 계정 정보 (최초 로그인 시 수집)</p>
                    <ul className="ml-4 space-y-1 list-disc text-zinc-400">
                        <li>이메일 주소 (계정 식별 용도)</li>
                        <li>Google 프로필 이름 및 프로필 사진 (닉네임·아바타 표시 용도)</li>
                    </ul>

                    <p className="font-medium text-zinc-300 mt-3 mb-1">■ 서비스 이용 과정에서 자동 생성되는 정보</p>
                    <ul className="ml-4 space-y-1 list-disc text-zinc-400">
                        <li>경기 예측 기록 (예측 팀, 예측 점수, 정답 여부)</li>
                        <li>일일 퀴즈 응답 기록 (선택 답안, 정답 여부)</li>
                        <li>GP(Game Points) 적립·차감 내역</li>
                        <li>커뮤니티 게시글·댓글 작성 내용</li>
                        <li>코스메틱 아이템 보유 현황</li>
                        <li>퀘스트 달성 기록</li>
                        <li>팔로우·팔로잉 관계</li>
                        <li>서비스 이용 일시</li>
                        <li>접속 IP 주소 (서비스 오류 로그 및 API 남용 방지 목적)</li>
                    </ul>

                    <p className="font-medium text-zinc-300 mt-3 mb-1">■ 쿠키 및 세션 정보 (서비스 이용 중 자동 생성)</p>
                    <ul className="ml-4 space-y-1 list-disc text-zinc-400">
                        <li>NextAuth.js 세션 쿠키 (로그인 상태 유지 목적, 브라우저 종료 시 만료)</li>
                    </ul>

                    <p className="mt-3 text-zinc-500">
                        결제 정보, 주민등록번호 등 민감정보는 일절 수집하지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">2. 수집 목적</h2>
                    <ul className="ml-4 space-y-1 list-disc text-zinc-400">
                        <li>회원 가입 및 로그인 처리</li>
                        <li>LCK 경기 예측, 퀴즈, 커뮤니티 서비스 제공</li>
                        <li>GP(게임 포인트) 적립 및 랭킹 관리</li>
                        <li>서비스 품질 개선 및 오류 처리</li>
                    </ul>
                </section>

                {/* ✅ 파기 절차 상세화 */}
                <section>
                    <h2 className="text-base font-bold text-white mb-3">3. 보존 기간 및 파기</h2>
                    <p>
                        회원 탈퇴 요청 즉시 데이터베이스에서 계정 및 모든 연관 데이터(예측·퀴즈·커뮤니티·GP 기록 등)가 삭제됩니다.
                        백업 데이터는 탈퇴 후 7일 이내에 파기합니다.
                        관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 별도 보관 후 파기합니다.
                    </p>
                    <p className="mt-2 text-zinc-500">
                        파기 방법: 전자적 파일 형태의 경우 복원이 불가능한 방법으로 영구 삭제합니다.
                    </p>
                </section>

                {/* ✅ Cloudinary 추가, OpenAI 설명 수정 */}
                <section>
                    <h2 className="text-base font-bold text-white mb-3">4. 개인정보 처리 위탁</h2>
                    <p>
                        수집한 개인정보를 제3자에게 판매하거나 제공하지 않습니다.
                        서비스 운영을 위해 다음 수탁업체에 처리를 위탁합니다:
                    </p>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs text-zinc-400 border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-700">
                                    <th className="text-left py-2 pr-4 text-zinc-300 font-medium">수탁업체</th>
                                    <th className="text-left py-2 pr-4 text-zinc-300 font-medium">위탁 업무</th>
                                    <th className="text-left py-2 text-zinc-300 font-medium">소재국</th>
                                </tr>
                            </thead>
                            <tbody className="space-y-1">
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">Google LLC</td>
                                    <td className="py-2 pr-4">OAuth 인증</td>
                                    <td className="py-2">미국</td>
                                </tr>
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">Vercel Inc.</td>
                                    <td className="py-2 pr-4">서버 호스팅</td>
                                    <td className="py-2">미국</td>
                                </tr>
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">Neon Inc.</td>
                                    <td className="py-2 pr-4">데이터베이스 저장</td>
                                    <td className="py-2">미국/싱가포르</td>
                                </tr>
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">Cloudinary Ltd.</td>
                                    <td className="py-2 pr-4">프로필 이미지 저장</td>
                                    <td className="py-2">미국</td>
                                </tr>
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">OpenAI LLC</td>
                                    <td className="py-2 pr-4">AI 채팅 분석</td>
                                    <td className="py-2">미국</td>
                                </tr>
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">LangChain, Inc. (LangSmith)</td>
                                    <td className="py-2 pr-4">AI 채팅 트레이싱·모니터링 <span className="text-zinc-600">(현재 비활성화)</span></td>
                                    <td className="py-2">미국</td>
                                </tr>
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">Functional Software Inc. (Sentry)</td>
                                    <td className="py-2 pr-4">서비스 오류 모니터링 및 에러 로그 수집</td>
                                    <td className="py-2">미국</td>
                                </tr>
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">Upstash Inc.</td>
                                    <td className="py-2 pr-4">API 요청 빈도 제한(Rate Limiting) 처리</td>
                                    <td className="py-2">미국</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-2 text-zinc-500 text-xs">
                        * OpenAI에는 사용자가 AI 채팅창에 직접 입력한 내용만 전송됩니다.
                          이름, 이메일 등 계정 정보는 전송되지 않습니다.<br />
                        * LangSmith(LangChain): 현재 비활성화 상태입니다(LANGCHAIN_TRACING_V2=false).
                          AI 채팅 내용이 LangSmith로 전송되지 않습니다.<br />
                        * Sentry에는 서비스 오류 발생 시 에러 내용 및 요청 정보가 전송됩니다.
                          사용자가 직접 입력한 개인정보는 전송되지 않습니다.<br />
                        * Upstash에는 API 남용 방지를 위한 요청 횟수 추적 목적으로 요청 IP가 일시 저장됩니다.
                    </p>
                </section>

                {/* ✅ H-14 수정: 국외이전 전용 조항 (PIPA 제28조의8) */}
                <section>
                    <h2 className="text-base font-bold text-white mb-3">5. 개인정보의 국외이전</h2>
                    <p className="mb-2">
                        서비스 운영을 위해 위 위탁업체들(미국 소재)로 개인정보가 국외이전됩니다.
                        각 업체는 다음과 같은 적절한 개인정보 보호 조치를 갖추고 있습니다:
                    </p>
                    <ul className="ml-4 space-y-1 list-disc text-zinc-400">
                        <li>Google LLC — EU-U.S. Data Privacy Framework 인증, Google 개인정보처리방침 적용</li>
                        <li>Vercel Inc. — SOC 2 Type 2 인증, GDPR 준수</li>
                        <li>Neon Inc. — SOC 2 인증, 데이터 암호화</li>
                        <li>Cloudinary Ltd. — ISO 27001 인증, GDPR 준수</li>
                        <li>OpenAI LLC — API 데이터 처리 계약(DPA) 적용</li>
                        <li>LangChain, Inc. (LangSmith) — 개인정보 처리 계약(DPA) 적용</li>
                        <li>Functional Software Inc. (Sentry) — SOC 2 Type 2 인증, GDPR 준수</li>
                        <li>Upstash Inc. — SOC 2 인증, GDPR 준수</li>
                    </ul>
                    <p className="mt-2 text-zinc-500 text-xs">
                        이전 목적: 서비스 제공 및 운영 유지.<br />
                        이전 항목: 위 4항의 수집 항목과 동일.<br />
                        이전 기간: 회원 탈퇴 또는 계약 종료 시까지.<br />
                        국외이전 관련 문의: jworks6365@gmail.com
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">6. 정보주체의 권리</h2>
                    <p>
                        이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.
                        서비스 내 계정 탈퇴 기능을 통해 직접 삭제하시거나, 아래 개인정보 보호책임자에게
                        이메일로 요청하실 수 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-3">7. 개인정보 보호책임자(CPO)</h2>
                    <div className="bg-zinc-900 rounded-lg p-4 text-zinc-400">
                        <p><span className="text-zinc-300 font-medium">이름:</span> 조우상</p>
                        <p className="mt-1"><span className="text-zinc-300 font-medium">직책:</span> 개인정보보호책임자</p>
                        <p className="mt-1"><span className="text-zinc-300 font-medium">소속:</span> 운영팀</p>
                        <p className="mt-1"><span className="text-zinc-300 font-medium">이메일:</span> jworks6365@gmail.com</p>
                        <p className="mt-1 text-xs text-zinc-600">
                            개인정보 관련 문의, 열람·정정·삭제 요청은 위 이메일로 연락 주세요.
                            확인 후 30일 이내에 처리하겠습니다.
                        </p>
                    </div>
                </section>

                {/* ✅ M-11 수정: 개인정보 유출 통지 절차 (PIPA 제34조) */}
                <section>
                    <h2 className="text-base font-bold text-white mb-3">8. 개인정보 침해 신고 및 유출 통지</h2>
                    <p>
                        개인정보 침해가 발생한 경우, 개인정보보호법 제34조에 따라 지체 없이
                        피해 이용자에게 통지하고 관계 기관에 신고합니다.
                        개인정보 침해 관련 신고·상담은 아래 기관에 문의하실 수 있습니다:
                    </p>
                    <ul className="mt-2 ml-4 space-y-1 list-disc text-zinc-400">
                        <li>개인정보 침해신고센터: privacy.kisa.or.kr (국번없이 118)</li>
                        <li>개인정보 분쟁조정위원회: www.kopico.go.kr (1833-6972)</li>
                    </ul>
                </section>

                {/* ✅ 쿠키 정책 추가 (PIPA 시행령 제14조의2) */}
                <section>
                    <h2 className="text-base font-bold text-white mb-3">9. 쿠키 정책</h2>
                    <p className="mb-2">
                        서비스는 로그인 상태 유지를 위해 세션 쿠키를 사용합니다.
                    </p>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs text-zinc-400 border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-700">
                                    <th className="text-left py-2 pr-4 text-zinc-300 font-medium">쿠키명</th>
                                    <th className="text-left py-2 pr-4 text-zinc-300 font-medium">목적</th>
                                    <th className="text-left py-2 text-zinc-300 font-medium">보존 기간</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">next-auth.session-token</td>
                                    <td className="py-2 pr-4">로그인 상태 유지 (세션 인증)</td>
                                    <td className="py-2">브라우저 종료 시 또는 30일</td>
                                </tr>
                                <tr className="border-b border-zinc-800">
                                    <td className="py-2 pr-4">next-auth.csrf-token</td>
                                    <td className="py-2 pr-4">CSRF 공격 방지</td>
                                    <td className="py-2">브라우저 세션 종료 시</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-2 text-zinc-500 text-xs">
                        브라우저 설정에서 쿠키를 비활성화할 수 있으나, 이 경우 로그인이 필요한 서비스 이용이 불가합니다.
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
