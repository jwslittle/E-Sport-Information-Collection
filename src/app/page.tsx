import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          E-Sport-SuperTeam
        </h1>
        <p className="mx-auto max-w-[700px] text-zinc-400 md:text-xl">
          나만의 드림팀을 구성하고, 선수 카드를 수집하여 최고의 구단주가 되어보세요.
          실시간 데이터와 AI 분석으로 승리를 쟁취하세요.
        </p>
      </div>

      <div className="flex gap-4">
        <Button asChild size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400">
          <Link href="/my-team">팀 만들기</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="border-zinc-700 text-white hover:bg-zinc-800">
          <Link href="/shop">카드 뽑기</Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3 w-full max-w-5xl">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <Users className="h-10 w-10 text-blue-500 mb-2" />
            <CardTitle className="text-white">드림팀</CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-400">
            LCK 선수들로 나만의 팀을 구성하고 포인트 경쟁에 참여하세요.
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <Trophy className="h-10 w-10 text-yellow-500 mb-2" />
            <CardTitle className="text-white">카드 수집</CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-400">
            Bronze부터 Challenger까지, 다양한 등급의 선수 카드를 수집하고 진화시키세요.
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <Sparkles className="h-10 w-10 text-purple-500 mb-2" />
            <CardTitle className="text-white">AI 분석가</CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-400">
            AI 에이전트와 함께 데이터를 분석하고 최적의 전략을 수립하세요.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
