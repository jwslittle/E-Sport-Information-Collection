import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RankingList } from './ranking-list'
import { UserSearch } from './user-search'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LeaguePage() {
    return (
        <div className="container mx-auto py-6 space-y-6 max-w-3xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">리그 랭킹</h1>
                <p className="text-muted-foreground">
                    다른 플레이어들과 경쟁하고 순위를 높여보세요.
                </p>
            </div>

            <Tabs defaultValue="real" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="real">실제 리그</TabsTrigger>
                    <TabsTrigger value="simulation">가상 리그</TabsTrigger>
                    <TabsTrigger value="friends">친구 랭킹</TabsTrigger>
                    <TabsTrigger value="wealth">부호 랭킹</TabsTrigger>
                    <TabsTrigger value="search">유저 검색</TabsTrigger>
                </TabsList>

                <TabsContent value="real" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>실제 리그 리더보드</CardTitle>
                            <CardDescription>
                                2026 LCK 실제 리그 기반 랭킹입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RankingList type="global" leagueType="REAL" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="simulation" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>가상 리그 리더보드</CardTitle>
                            <CardDescription>
                                가상 시뮬레이션 리그 기반 랭킹입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RankingList type="global" leagueType="SIMULATION" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="friends" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>친구 리더보드</CardTitle>
                            <CardDescription>
                                내가 팔로우한 유저들 간의 순위입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RankingList type="friends" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="wealth" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>부호 리더보드</CardTitle>
                            <CardDescription>
                                보유한 포인트(재화)를 기준으로 한 순위입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RankingList type="wealth" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="search" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>유저 검색</CardTitle>
                            <CardDescription>
                                다른 팀을 검색하고 팔로우하여 경쟁해보세요.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserSearch />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
