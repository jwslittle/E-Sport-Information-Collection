'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Trophy, Users, Swords, Coins, Target, Zap, Info, ShoppingBag, Bot, AlertTriangle, BookOpen, Star } from 'lucide-react'

export default function RulesPage() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-white">E-Sport Fantasy 가이드</h1>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                    E-Sport Fantasy League에 오신 것을 환영합니다!<br />
                    아래 가이드를 통해 게임 이용 방법과 규칙을 상세히 확인하세요.
                </p>
            </div>

            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4 lg:grid-cols-8 bg-zinc-900 border-zinc-800 mb-8 p-2 gap-2">
                    <TabsTrigger value="intro" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><Info className="w-4 h-4 mr-2" />소개</TabsTrigger>
                    <TabsTrigger value="start" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><BookOpen className="w-4 h-4 mr-2" />시작하기</TabsTrigger>
                    <TabsTrigger value="myteam" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><Users className="w-4 h-4 mr-2" />마이팀</TabsTrigger>
                    <TabsTrigger value="league" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><Trophy className="w-4 h-4 mr-2" />리그</TabsTrigger>
                    <TabsTrigger value="prediction" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><Target className="w-4 h-4 mr-2" />승부예측</TabsTrigger>
                    <TabsTrigger value="shop" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><ShoppingBag className="w-4 h-4 mr-2" />상점</TabsTrigger>
                    <TabsTrigger value="ai" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><Bot className="w-4 h-4 mr-2" />AI 분석</TabsTrigger>
                    <TabsTrigger value="caution" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm text-yellow-500"><AlertTriangle className="w-4 h-4 mr-2" />주의사항</TabsTrigger>
                </TabsList>

                {/* 1. 소개 */}
                <TabsContent value="intro" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-white">E-Sport Fantasy League란?</CardTitle>
                            <CardDescription>나만의 LCK 드림팀을 만들고 최고의 감독이 되어보세요!</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-zinc-300 leading-relaxed">
                            <p>
                                <strong>E-Sport Fantasy League</strong>는 실제 LCK(League of Legends Champions Korea) 선수들의 데이터를 기반으로
                                나만의 가상 팀을 운영하는 판타지 스포츠 게임입니다.
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>실제 경기 데이터와 연동되는 <strong>Real League</strong></li>
                                <li>가상의 시뮬레이션 결과로 진행되는 <strong>Simulation League</strong></li>
                                <li>경기 승패를 예측하고 포인트를 얻는 <strong>승부 예측</strong></li>
                                <li>AI 분석가의 도움을 받아 <strong>데이터 기반 전략 수립</strong></li>
                            </ul>
                            <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mt-4">
                                <h3 className="text-lg font-bold text-yellow-400 mb-2">핵심 목표</h3>
                                <p>주어진 예산 내에서 최적의 선수 조합(Roster)을 구성하여 가장 높은 포인트를 획득하고, 전 세계 유저들과 랭킹을 경쟁하는 것입니다.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. 시작하기 */}
                <TabsContent value="start" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">게임 시작 가이드</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-zinc-300">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                    <span className="bg-blue-500/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                    회원가입 및 로그인
                                </h3>
                                <p className="pl-8 text-sm">구글 또는 네이버 계정을 통해 간편하게 로그인할 수 있습니다. 최초 로그인 시 초기 설정 페이지로 이동합니다.</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                    <span className="bg-blue-500/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                    팀 생성 (Setup)
                                </h3>
                                <p className="pl-8 text-sm">자신만의 팀 이름, 로고, 그리고 마스코트(Pet)를 설정합니다. 마스코트는 팀의 아이덴티티를 나타내며 추후 상점에서 변경 가능합니다.</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                    <span className="bg-blue-500/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                    튜토리얼 완료
                                </h3>
                                <p className="pl-8 text-sm">설정이 완료되면 메인 대시보드로 이동합니다. 이곳에서 내 팀의 현황, 포인트, 랭킹 등을 한눈에 확인할 수 있습니다.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. 마이팀 */}
                <TabsContent value="myteam" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">팀 관리 및 로스터 규칙</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-zinc-300">
                            <Tabs defaultValue="real" className="w-full">
                                <TabsList className="bg-zinc-800 mb-4">
                                    <TabsTrigger value="real">Real League</TabsTrigger>
                                    <TabsTrigger value="simulation">Simulation League</TabsTrigger>
                                </TabsList>
                                <TabsContent value="real" className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-2">
                                    <h4 className="font-bold text-white">실제 리그 (Real League)</h4>
                                    <p className="text-sm">실제 LCK 경기 일정에 맞춰 진행됩니다. 선수의 실제 경기 성적(KDA, 딜량, 시야 등)이 내 팀의 포인트로 환산됩니다.</p>
                                    <Alert className="bg-zinc-900 border-yellow-700 text-yellow-500">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>로스터 잠금 (Lock)</AlertTitle>
                                        <AlertDescription>
                                            실제 경기 시작 <strong>1시간 전</strong>에 로스터가 잠깁니다. 잠금 시간 이후에는 선수를 교체할 수 없습니다.
                                        </AlertDescription>
                                    </Alert>
                                </TabsContent>
                                <TabsContent value="simulation" className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-2">
                                    <h4 className="font-bold text-white">시뮬레이션 리그 (Simulation League)</h4>
                                    <p className="text-sm">가상의 일정으로 진행되는 리그입니다. 24시간 언제든지 진행할 수 있으며, 시스템이 시뮬레이션한 결과에 따라 포인트가 지급됩니다.</p>
                                    <Alert className="bg-zinc-900 border-blue-700 text-blue-500">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>자유로운 진행</AlertTitle>
                                        <AlertDescription>
                                            언제든지 '다음 라운드 진행' 버튼을 눌러 결과를 확인할 수 있습니다.
                                        </AlertDescription>
                                    </Alert>
                                </TabsContent>
                            </Tabs>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-green-400">로스터 구성</h4>
                                    <ul className="text-sm list-disc pl-5 space-y-1">
                                        <li>TOP, JUNGLE, MID, ADC, SUPPORT 각 1명</li>
                                        <li>WILDCARD (포지션 무관) 1명</li>
                                        <li>총 6명의 주전 선수 구성</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-red-400">샐러리 캡 (Salary Cap)</h4>
                                    <ul className="text-sm list-disc pl-5 space-y-1">
                                        <li>모든 팀은 <strong>50 Cost</strong>의 예산 제한이 있습니다.</li>
                                        <li>선수들의 Cost는 활약도에 따라 변동될 수 있습니다.</li>
                                        <li>예산을 초과하여 로스터를 저장할 수 없습니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 4. 리그/랭킹 */}
                <TabsContent value="league" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">리그 및 랭킹 시스템</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-zinc-300">
                            <p>
                                획득한 모든 포인트는 누적되어 랭킹에 반영됩니다.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                <div className="bg-zinc-800/30 p-4 rounded border border-zinc-700">
                                    <Badge className="mb-2 bg-yellow-600">Global Ranking</Badge>
                                    <h4 className="font-bold text-white mb-2">글로벌 랭킹</h4>
                                    <p className="text-sm">전체 유저 중 나의 순위를 확인하세요. 시즌 종료 시 상위 랭커에게는 특별한 칭호와 보상이 지급됩니다.</p>
                                </div>
                                <div className="bg-zinc-800/30 p-4 rounded border border-zinc-700">
                                    <Badge className="mb-2 bg-blue-600">Friends Ranking</Badge>
                                    <h4 className="font-bold text-white mb-2">친구 랭킹</h4>
                                    <p className="text-sm">팔로우한 친구들과의 경쟁 순위만을 따로 모아볼 수 있습니다. 친구를 추가하고 경쟁해보세요!</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 5. 승부예측 */}
                <TabsContent value="prediction" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">승부 예측 (Prediction)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-zinc-300">
                            <p>
                                매주 진행되는 LCK 경기의 승리 팀을 예측하고 보상을 획득하세요.
                                승부예측은 <strong>참여 비용이 무료</strong>입니다.
                            </p>

                            <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg">
                                <h4 className="font-bold text-yellow-400 flex items-center gap-2">
                                    <Coins className="w-5 h-5" />
                                    보상 시스템 (Unified GP)
                                </h4>
                                <ul className="mt-2 text-sm space-y-2">
                                    <li className="flex justify-between">
                                        <span>승리 팀 예측 성공 시</span>
                                        <span className="font-bold text-yellow-500">+50 GP</span>
                                    </li>
                                    <li>
                                        <p className="text-zinc-400 text-xs mt-1">
                                            * 획득한 GP(Game Point)는 판타지 팀 운영 포인트와 통합되어, 상점에서 아이템을 구매하거나 랭킹을 올리는 데 사용됩니다.
                                        </p>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 6. 상점 */}
                <TabsContent value="shop" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">상점 및 아이템</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-zinc-300">
                            <div className="flex items-start gap-4">
                                <ShoppingBag className="w-10 h-10 text-purple-500 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white text-lg">카드 뽑기 (Card Gacha)</h4>
                                    <p className="text-sm mt-1 mb-3">
                                        보유한 GP를 사용하여 선수 카드를 뽑을 수 있습니다.
                                        카드는 팀 로스터에 등록하거나 수집할 수 있습니다.
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-zinc-800 p-2 rounded">노말 (N)</div>
                                        <div className="bg-zinc-800 p-2 rounded text-blue-400">레어 (R)</div>
                                        <div className="bg-zinc-800 p-2 rounded text-purple-400">에픽 (E)</div>
                                        <div className="bg-zinc-800 p-2 rounded text-orange-400">레전더리 (L)</div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-zinc-800 pt-4 flex items-start gap-4">
                                <Bot className="w-10 h-10 text-green-500 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white text-lg">AI 분석권</h4>
                                    <p className="text-sm mt-1">
                                        AI 분석가에게 심층적인 전략 조언을 구할 수 있는 티켓입니다.
                                        상점에서 GP로 구매할 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7. AI 분석가 */}
                <TabsContent value="ai" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">AI 분석가 활용</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-zinc-300">
                            <p>
                                최신 LLM 기술이 적용된 AI 분석가가 여러분의 팀 운영을 돕습니다.
                                선수 추천, 상대 전력 분석, 메타 파악 등 다양한 질문을 던져보세요.
                            </p>

                            <Alert className="bg-zinc-900 border-red-900 text-red-400">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>주의사항</AlertTitle>
                                <AlertDescription>
                                    AI 분석가는 게임의 재미와 공정성을 위해 <strong>구체적인 포인트 산정 공식이나 내부 로직 데이터</strong>는 공개하지 않습니다.
                                    전략적인 조언을 얻는 용도로만 활용해주세요.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 8. 주의사항 */}
                <TabsContent value="caution" className="space-y-6">
                    {/* 비상업적 프로젝트 공식 고지 */}
                    <Card className="bg-zinc-900 border-yellow-700/50">
                        <CardHeader>
                            <CardTitle className="text-yellow-400 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                비상업적 팬 프로젝트 공식 고지
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-zinc-300">
                            <div className="bg-yellow-900/15 border border-yellow-700/40 p-4 rounded-lg space-y-3">
                                <div>
                                    <h4 className="font-bold text-yellow-300 mb-1">🇰🇷 한국어</h4>
                                    <p className="text-sm leading-relaxed text-zinc-300">
                                        본 서비스(<strong>E-Sport Information Collection</strong>)는 리그 오브 레전드 및 발로란트를 사랑하는 팬이 자발적으로 제작한
                                        <strong className="text-yellow-400"> 비영리·비상업적 팬 프로젝트</strong>입니다.
                                        이 서비스는 어떠한 형태의 <strong>유료 결제, 광고 수익, 후원금, 상업적 이익도 발생하지 않으며</strong>,
                                        앞으로도 발생할 계획이 없습니다.
                                        게임 내 모든 재화(GP)는 오직 게임 플레이(판타지 점수, 퀘스트)를 통해서만 획득할 수 있으며,
                                        현금으로 구매할 수 없습니다.
                                    </p>
                                </div>
                                <div className="border-t border-yellow-800/30 pt-3">
                                    <h4 className="font-bold text-yellow-300 mb-1">🌐 English</h4>
                                    <p className="text-sm leading-relaxed text-zinc-400">
                                        E-Sport Information Collection is a <strong className="text-yellow-400">non-commercial, non-profit fan project</strong> created
                                        purely out of passion for League of Legends and Valorant esports. This service generates
                                        <strong> no revenue of any kind</strong> — no paid transactions, no ads, no sponsorships, no commercial gain.
                                        All in-game currency (GP) is earned exclusively through gameplay (fantasy points &amp; quests)
                                        and cannot be purchased with real money.
                                    </p>
                                </div>
                            </div>

                            {/* Riot Games 공식 면책 */}
                            <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2 text-sm">Riot Games 공식 면책 조항</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    E-Sport Information Collection isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games
                                    or anyone officially involved in producing or managing League of Legends or Valorant.
                                    <strong className="text-zinc-300"> League of Legends, Valorant, and all associated properties are trademarks or
                                    registered trademarks of Riot Games, Inc.</strong>
                                </p>
                                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                                    본 서비스는 Riot Games의 공식 서비스가 아니며, Riot Games와 전혀 무관한 팬 제작 콘텐츠입니다.
                                    리그 오브 레전드, 발로란트 및 관련 모든 재산권은 Riot Games, Inc.에 귀속됩니다.
                                </p>
                            </div>

                            {/* 데이터 출처 */}
                            <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2 text-sm">데이터 출처 (Data Sources)</h4>
                                <ul className="text-xs text-zinc-400 space-y-1">
                                    <li>• 역대 통계 데이터: <a href="https://oracleselixir.com" target="_blank" rel="noreferrer" className="underline text-blue-400 hover:text-blue-300">Oracle&apos;s Elixir</a></li>
                                    <li>• 경기 일정 데이터: <a href="https://lolesports.com" target="_blank" rel="noreferrer" className="underline text-blue-400 hover:text-blue-300">LoL Esports</a> — Riot Games 공식 e스포츠 데이터</li>
                                    <li>• 모든 데이터는 공개된 비상업적 소스에서 수집되었습니다.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-yellow-500">서비스 이용 주의사항</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-zinc-300">
                            <div className="bg-yellow-900/10 border border-yellow-700/50 p-4 rounded-lg">
                                <h4 className="font-bold text-yellow-400 flex items-center gap-2 mb-2">
                                    <Star className="w-4 h-4" />
                                    Beta 서비스 안내
                                </h4>
                                <p className="text-sm leading-relaxed">
                                    현재 서비스는 <strong>Beta 테스트 단계</strong>입니다.
                                    <br /><br />
                                    1. <strong>데이터 초기화</strong>: 정식 출시 또는 대규모 업데이트 시 모든 게임 데이터(계정 정보, 포인트, 아이템 등)가 예고 없이 초기화될 수 있습니다.
                                    <br />
                                    2. <strong>버그 제보</strong>: 이용 중 오류를 발견하시면 개발자에게 제보 부탁드립니다.
                                    <br />
                                    3. <strong>서버 점검</strong>: 안정화 작업을 위해 수시로 서버 점검이 진행될 수 있습니다.
                                </p>
                            </div>
                            <p className="text-xs text-zinc-500 text-center pt-4">
                                Copyright © 2026 E-Sport Information Collection. All rights reserved.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
