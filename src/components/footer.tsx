import Link from 'next/link'

export function Footer() {
    return (
        <footer className="w-full py-8 bg-zinc-950 border-t border-zinc-800 mt-auto mb-16 md:mb-0">
            <div className="container mx-auto px-4">
                {/* 비상업적 고지 박스 */}
                <div className="mb-6 p-4 rounded-lg border border-yellow-800/40 bg-yellow-900/10 text-center">
                    <p className="text-yellow-600 text-xs font-semibold mb-1">⚠ 비상업적 팬 프로젝트 (Non-Commercial Fan Project)</p>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">
                        본 서비스는 <strong className="text-zinc-400">순수 팬 목적</strong>으로 제작된 비영리·비상업적 프로젝트입니다.
                        어떠한 형태의 유료 결제, 광고 수익, 상업적 이익도 발생하지 않습니다.
                        <br />
                        This is a <strong className="text-zinc-400">non-commercial fan project</strong>. No revenue, no advertisements, no commercial gain of any kind.
                    </p>
                </div>

                {/* Riot 공식 면책 */}
                <div className="mb-4 text-center">
                    <p className="text-xs text-zinc-600 leading-relaxed max-w-3xl mx-auto">
                        E-Sport SuperTeam isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games or anyone officially
                        involved in producing or managing League of Legends or Valorant. League of Legends, Valorant, and all associated properties
                        are trademarks or registered trademarks of <strong>Riot Games, Inc.</strong>
                    </p>
                    <p className="text-xs text-zinc-700 mt-1 max-w-3xl mx-auto">
                        본 서비스는 Riot Games의 공식 서비스가 아니며, Riot Games와 무관한 팬 제작 콘텐츠입니다. 리그 오브 레전드, 발로란트 및 관련 모든 재산권은 Riot Games, Inc.에 귀속됩니다.
                    </p>
                </div>

                {/* 데이터 출처 */}
                <div className="mb-4 text-center text-xs text-zinc-600">
                    <p>
                        LCK schedule data sourced from{' '}
                        <a href="https://lolesports.com" target="_blank" rel="noreferrer" className="underline hover:text-zinc-400">LoL Esports</a>
                        {' '}· Historical stats by{' '}
                        <a href="https://oracleselixir.com" target="_blank" rel="noreferrer" className="underline hover:text-zinc-400">Oracle&apos;s Elixir</a>
                    </p>
                    <p className="mt-1 text-zinc-700 text-[10px]">
                        본 프로젝트는 Riot Games의 Fan Content Policy에 따른 비상업적 팬 제작물입니다.
                        경기 일정 정보는 lolesports.com 공개 데이터를 활용하며 어떠한 상업적 이익도 발생하지 않습니다.
                    </p>
                </div>

                {/* 하단 */}
                <div className="text-center text-zinc-500 text-sm border-t border-zinc-900 pt-4">
                    <p>&copy; 2026 E-Sport SuperTeam. All rights reserved.</p>
                    <p className="mt-1">
                        Contact:{' '}
                        <a href="mailto:jworks6365@gmail.com" className="hover:text-zinc-300 underline underline-offset-4">jworks6365@gmail.com</a>
                    </p>
                    {/* 개인정보처리방침 / 이용약관 링크 — Google OAuth 공개 승인 필수 */}
                    <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-600">
                        <Link href="/privacy" className="hover:text-zinc-400 transition-colors underline underline-offset-2">
                            개인정보처리방침
                        </Link>
                        <span className="text-zinc-800">·</span>
                        <Link href="/terms" className="hover:text-zinc-400 transition-colors underline underline-offset-2">
                            이용약관
                        </Link>
                        <span className="text-zinc-800">·</span>
                        <a
                            href="https://www.riotgames.com/en/legal"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-zinc-400 transition-colors underline underline-offset-2"
                        >
                            Fan Content Policy
                        </a>
                    </div>
                    <p className="mt-3 text-[10px] text-zinc-700">
                        모든 선수의 포인트(Cost)는 공식 경기 데이터를 기반으로 자동화된 알고리즘에 의해 산출되었습니다. 운영진의 주관적 견해나 특정 의도가 개입되지 않았음을 밝힙니다.
                    </p>
                </div>
            </div>
        </footer>
    )
}
