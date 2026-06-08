'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Trophy, Coins, Target, Zap, Info, ShoppingBag, Bot, AlertTriangle, BookOpen, Star } from 'lucide-react'

export default function RulesPage() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-white">E-Sport IC 가이드</h1>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                    LCK 경기 예측 리그에 오신 것을 환영합니다!<br />
                    아래 가이드를 통해 서비스 이용 방법과 규칙을 상세히 확인하세요.
                </p>
            </div>

            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4 lg:grid-cols-6 bg-zinc-900 border-zinc-800 mb-8 p-2 gap-2">
                    <TabsTrigger value="intro" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><Info className="w-4 h-4 mr-2" />소개</TabsTrigger>
                    <TabsTrigger value="start" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><BookOpen className="w-4 h-4 mr-2" />시작하기</TabsTrigger>
                    <TabsTrigger value="prediction" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><Target className="w-4 h-4 mr-2" />승부예측</TabsTrigger>
                    <TabsTrigger value="gp" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><Coins className="w-4 h-4 mr-2" />GP 시스템</TabsTrigger>
                    <TabsTrigger value="shop" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm"><ShoppingBag className="w-4 h-4 mr-2" />상점</TabsTrigger>
                    <TabsTrigger value="caution" className="data-[state=active]:bg-zinc-800 text-xs md:text-sm text-yellow-500"><AlertTriangle className="w-4 h-4 mr-2" />주의사항</TabsTrigger>
                </TabsList>

                {/* 1. 소개 */}
                <TabsContent value="intro" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-white">E-Sport IC란?</CardTitle>
                            <CardDescription>LCK 경기 예측과 퀴즈로 GP를 쌓고 랭킹을 경쟁하세요!</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-zinc-300 leading-relaxed">
                            <p>
                                <strong>E-Sport Information Collection</strong>은 LCK(League of Legends Champions Korea) 경기 정보를
                                바탕으로 예측, 퀴즈, 커뮤니티를 즐길 수 있는 비상업적 팬 서비스입니다.
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>실제 LCK 경기 일정을 확인하고 <strong>승부 예측</strong>으로 GP 획득</li>
                                <li>매일 제공되는 <strong>LCK 퀴즈</strong>로 지식을 뽐내고 GP 획득</li>
                                <li>GP로 <strong>코스메틱 아이템</strong>을 구매하고 프로필을 꾸미기</li>
                                <li>퀘스트를 완료하여 추가 보상 획득</li>
                                <li>글로벌 GP 랭킹과 예측 적중률 리더보드에서 경쟁</li>
                            </ul>
                            <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mt-4">
                                <h3 className="text-lg font-bold text-yellow-400 mb-2">핵심 목표</h3>
                                <p>경기 예측과 퀴즈로 GP를 쌓고, 코스메틱으로 개성 있는 프로필을 만들어 전 세계 유저들과 랭킹을 경쟁하세요!</p>
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
                                <p className="pl-8 text-sm">구글 계정을 통해 간편하게 로그인할 수 있습니다. 최초 로그인 시 초기 설정 페이지로 이동합니다.</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                    <span className="bg-blue-500/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                    기본 GP 지급
                                </h3>
                                <p className="pl-8 text-sm">최초 가입 시 기본 100 GP가 지급됩니다. 이 GP로 상점 아이템을 구매하거나 코스메틱을 획득할 수 있습니다.</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                    <span className="bg-blue-500/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                    첫 번째 예측 참여
                                </h3>
                                <p className="pl-8 text-sm">LCK 메뉴에서 예정된 경기를 확인하고 승부를 예측해보세요. 예측은 무료이며 정답 시 GP를 획득합니다.</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                    <span className="bg-blue-500/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                                    일일 퀴즈 참여
                                </h3>
                                <p className="pl-8 text-sm">매일 새로운 퀴즈가 출제됩니다. 하루 한 번 참여 가능하며 정답 시 GP가 지급됩니다.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. 승부예측 */}
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
                                    보상 시스템
                                </h4>
                                <ul className="mt-2 text-sm space-y-2">
                                    <li className="flex justify-between">
                                        <span>승리 팀 예측 성공 시</span>
                                        <span className="font-bold text-yellow-500">+10 GP</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>스코어까지 정확히 맞힌 경우</span>
                                        <span className="font-bold text-yellow-500">+30 GP</span>
                                    </li>
                                </ul>
                            </div>

                            <Alert className="bg-zinc-900 border-zinc-700 text-zinc-300">
                                <Info className="h-4 w-4" />
                                <AlertTitle>예측 마감 시간</AlertTitle>
                                <AlertDescription>
                                    각 경기 시작 <strong>5분 전</strong>에 예측이 마감됩니다. 이후에는 예측을 변경할 수 없습니다.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 4. GP 시스템 */}
                <TabsContent value="gp" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">GP (Game Points) 시스템</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-zinc-300">
                            <p>GP는 서비스 내 모든 활동의 핵심 재화입니다. GP를 쌓아 랭킹을 올리거나 상점에서 코스메틱을 구매하세요.</p>

                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-zinc-800/30 p-4 rounded border border-zinc-700">
                                    <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> GP 획득 방법
                                    </h4>
                                    <ul className="text-sm space-y-1.5">
                                        <li className="flex justify-between"><span>승부 예측 정답</span><span className="text-yellow-400">+10 GP</span></li>
                                        <li className="flex justify-between"><span>스코어 예측 정답</span><span className="text-yellow-400">+30 GP</span></li>
                                        <li className="flex justify-between"><span>일일 퀴즈 정답</span><span className="text-yellow-400">+15~25 GP</span></li>
                                        <li className="flex justify-between"><span>퀘스트 완료</span><span className="text-yellow-400">+퀘스트별 상이</span></li>
                                    </ul>
                                </div>
                                <div className="bg-zinc-800/30 p-4 rounded border border-zinc-700">
                                    <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                                        <Trophy className="w-4 h-4" /> GP 활용
                                    </h4>
                                    <ul className="text-sm space-y-1.5">
                                        <li>코스메틱 아이템 구매 (칭호, 프레임 등)</li>
                                        <li>GP 기준 글로벌 랭킹</li>
                                        <li>시즌 종료 시 상위 랭커 보상</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 5. 상점 */}
                <TabsContent value="shop" className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">상점 및 코스메틱</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-zinc-300">
                            <div className="flex items-start gap-4">
                                <ShoppingBag className="w-10 h-10 text-purple-500 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white text-lg">코스메틱 아이템</h4>
                                    <p className="text-sm mt-1 mb-3">
                                        보유한 GP를 사용하여 프로필 코스메틱을 구매할 수 있습니다.
                                        칭호, 아바타 프레임, 배경 등으로 개성 있는 프로필을 꾸며보세요.
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-zinc-800 p-2 rounded">일반 (COMMON)</div>
                                        <div className="bg-zinc-800 p-2 rounded text-blue-400">희귀 (RARE)</div>
                                        <div className="bg-zinc-800 p-2 rounded text-purple-400">에픽 (EPIC)</div>
                                        <div className="bg-zinc-800 p-2 rounded text-orange-400">전설 (LEGENDARY)</div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-zinc-800 pt-4 flex items-start gap-4">
                                <Bot className="w-10 h-10 text-green-500 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white text-lg">AI 분석</h4>
                                    <p className="text-sm mt-1">
                                        AI 분석가에게 LCK 경기에 대한 심층적인 인사이트를 얻어보세요.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 6. 주의사항 */}
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
                                    <h4 className="font-bold text-yellow-300 mb-1">한국어</h4>
                                    <p className="text-sm leading-relaxed text-zinc-300">
                                        본 서비스(<strong>E-Sport Information Collection</strong>)는 리그 오브 레전드를 사랑하는 팬이 자발적으로 제작한
                                        <strong className="text-yellow-400"> 비영리·비상업적 팬 프로젝트</strong>입니다.
                                        이 서비스는 어떠한 형태의 <strong>유료 결제, 광고 수익, 후원금, 상업적 이익도 발생하지 않으며</strong>,
                                        앞으로도 발생할 계획이 없습니다.
                                        게임 내 모든 재화(GP)는 오직 게임 플레이(경기 예측, 퀴즈, 퀘스트)를 통해서만 획득할 수 있으며,
                                        현금으로 구매할 수 없습니다.
                                    </p>
                                </div>
                                <div className="border-t border-yellow-800/30 pt-3">
                                    <h4 className="font-bold text-yellow-300 mb-1">English</h4>
                                    <p className="text-sm leading-relaxed text-zinc-400">
                                        E-Sport Information Collection is a <strong className="text-yellow-400">non-commercial, non-profit fan project</strong> created
                                        purely out of passion for League of Legends esports. This service generates
                                        <strong> no revenue of any kind</strong> — no paid transactions, no ads, no sponsorships, no commercial gain.
                                        All in-game currency (GP) is earned exclusively through gameplay (predictions, quizzes &amp; quests)
                                        and cannot be purchased with real money.
                                    </p>
                                </div>
                            </div>

                            {/* Riot Games 공식 면책 */}
                            <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2 text-sm">Riot Games 공식 면책 조항</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    E-Sport Information Collection isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games
                                    or anyone officially involved in producing or managing League of Legends.
                                    <strong className="text-zinc-300"> League of Legends and all associated properties are trademarks or
                                    registered trademarks of Riot Games, Inc.</strong>
                                </p>
                                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                                    본 서비스는 Riot Games의 공식 서비스가 아니며, Riot Games와 전혀 무관한 팬 제작 콘텐츠입니다.
                                    리그 오브 레전드 및 관련 모든 재산권은 Riot Games, Inc.에 귀속됩니다.
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
