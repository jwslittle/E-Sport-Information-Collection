import prisma from '@/lib/prisma'

export async function getHistoricalContext(query: string): Promise<string> {
    // Extract years (2014-2026)
    const yearMatches = query.match(/20[1-2][0-9]/g)
    const years = yearMatches ? yearMatches.map(y => parseInt(y)) : []

    let context = ""

    const words = query.split(/\s+/).filter(w =>
        !w.match(/20[1-2][0-9]/) &&
        w.length > 1 &&
        !['성적', '기록', '알려줘', '어때', '누구', '우승', '몇등'].includes(w)
    )

    if (words.length === 0 && years.length === 0) {
        return ""
    }

    const searchTerms = words.slice(0, 3)
    const results: string[] = []

    for (const term of searchTerms) {
        // Search Teams
        const teamStats = await prisma.historicalTeamStat.findMany({
            where: {
                teamName: { contains: term, mode: 'insensitive' },
                ...(years.length > 0 ? { year: { in: years } } : {})
            },
            take: 5,
            orderBy: { year: 'desc' }
        })

        if (teamStats.length > 0) {
            results.push(`Found Team Stats for "${term}":`)
            teamStats.forEach((stat) => {
                // ✅ M-3 수정: winRate 직접 계산(schema 필드 없음), 없는 필드(averageVisionScore, averageGoldDiffAt15, averageCSDiffAt15) 제거
                const winRate = stat.games > 0
                    ? ((stat.wins / stat.games) * 100).toFixed(1) + '%'
                    : 'N/A'
                results.push(`- ${stat.year} ${stat.tournament}: ${stat.teamName}
  - W/L: ${stat.wins}/${stat.losses} (승률: ${winRate}), Kills: ${stat.totalKills}, Deaths: ${stat.totalDeaths}`)
            })
        }

        // Search Players
        const playerStats = await prisma.historicalPlayerStat.findMany({
            where: {
                playerName: { contains: term, mode: 'insensitive' },
                ...(years.length > 0 ? { year: { in: years } } : {})
            },
            take: 5,
            orderBy: { year: 'desc' }
        })

        if (playerStats.length > 0) {
            results.push(`Found Player Stats for "${term}":`)
            playerStats.forEach((stat) => {
                // ✅ M-3 수정: averageCSPM, averageGoldDiffAt15 제거 (schema 없음), averageVisionScore 유지
                results.push(`- ${stat.year} ${stat.tournament}: ${stat.playerName} (${stat.teamName})
  - KDA: ${stat.averageKDA.toFixed(2)}, W/L: ${stat.wins}/${stat.losses}, DPM: ${stat.averageDPM.toFixed(0)}, Vision: ${stat.averageVisionScore?.toFixed(1) ?? 'N/A'}`)
            })
        }
    }

    if (results.length > 0) {
        context = "Historical Data Context:\n" + results.join("\n")
    } else {
        context = "No historical data found for the given keywords."
    }

    return context
}
