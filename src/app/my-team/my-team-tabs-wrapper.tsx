'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TeamBuilder } from './team-builder'
import { RosterManager } from './roster-manager'
import { Users, MonitorPlay } from 'lucide-react'

interface Props {
    allPlayers: any[]
    realTeam: any
    simTeam: any
    hasSwapTicket: boolean
}

export default function MyTeamTabsWrapper({ allPlayers, realTeam, simTeam, hasSwapTicket }: Props) {
    return (
        <Tabs defaultValue="simulation" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border-zinc-800 mb-8 p-1">
                <TabsTrigger value="simulation"
                    className="data-[state=active]:bg-zinc-800 data-[state=active]:text-yellow-500 py-3 gap-2">
                    <MonitorPlay className="w-4 h-4" />
                    판타지 팀 (시뮬레이션)
                </TabsTrigger>
                <TabsTrigger value="real"
                    className="data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-400 py-3 gap-2">
                    <Users className="w-4 h-4" />
                    보조 팀 (시즌2용)
                </TabsTrigger>
            </TabsList>

            {/* 메인 팀: 시뮬레이션 */}
            <TabsContent value="simulation" className="mt-0">
                <TeamContent
                    team={simTeam}
                    allPlayers={allPlayers}
                    hasSwapTicket={hasSwapTicket}
                    type="SIMULATION"
                    label="판타지 시뮬레이션 팀"
                    desc="가상 선수들로 팀을 구성하세요. 시뮬레이션 라운드가 진행될 때마다 포인트를 획득합니다."
                />
            </TabsContent>

            {/* 보조 팀: 실제 리그 (나중에 활성화) */}
            <TabsContent value="real" className="mt-0">
                <div className="bg-blue-500/5 border border-blue-800/30 rounded-lg p-4 text-sm text-blue-300 mb-6">
                    이 슬롯은 향후 시즌 2 또는 별도 리그를 위한 보조 팀입니다.
                    현재는 시뮬레이션 탭의 판타지 팀을 사용하세요.
                </div>
                <TeamContent
                    team={realTeam}
                    allPlayers={allPlayers}
                    hasSwapTicket={hasSwapTicket}
                    type="REAL"
                    label="보조 팀 빌더"
                    desc="별도 리그나 시즌 2용으로 두 번째 팀을 구성할 수 있습니다."
                />
            </TabsContent>
        </Tabs>
    )
}

function TeamContent({ team, allPlayers, hasSwapTicket, type, label, desc, realTeamName }: {
    team: any; allPlayers: any[]; hasSwapTicket: boolean
    type: string; label?: string; desc?: string; realTeamName?: string
}) {
    if (team?.isFinalized) {
        return (
            <RosterManager
                teamId={team.id}
                players={team.players}
                totalPoints={team.totalPoints}
                roundScores={team.roundScores || []}
                teamImage={team.image}
                hasSwapTicket={hasSwapTicket}
                allPlayers={allPlayers}
                teamType={type}
            />
        )
    }

    let initialTeam = team ? {
        name: team.name,
        players: team.players,
        isFinalized: team.isFinalized,
    } : null

    if (type === 'SIMULATION' && !initialTeam && realTeamName) {
        initialTeam = { name: `${realTeamName} (가상)`, players: [], isFinalized: false }
    }

    return (
        <TeamBuilder
            allPlayers={allPlayers}
            initialTeam={initialTeam}
            teamType={type}
            label={label}
            desc={desc}
        />
    )
}
