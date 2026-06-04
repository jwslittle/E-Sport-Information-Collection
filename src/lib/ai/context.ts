import prisma from '@/lib/prisma'

export async function getHistoricalContext(query: string): Promise<string> {
    const lowerQuery = query.toLowerCase()

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

    void lowerQuery // suppress unused variable warning

    const searchTerms = words.slice(0, 3)
    const results: string[] = []

    for (const term of searchTerms) {
        // Search Teams — cast to any[] for optional unlisted fields (winRate, averageVisionScore, etc.)
        const teamStats = await prisma.historicalTeamStat.findMany({
            where: {
                teamName: { contains: term, mode: 'insensitive' },
                ...(years.length > 0 ? { year: { in: years } } : {})
            },
            take: 5,
            orderBy: { year: 'desc' }
        }) as any[]

        if (teamStats.length > 0) {
            results.push(`Found Team Stats for "${term}":`)
            teamStats.forEach((stat: any) => {
                results.push(`- ${stat.year} ${stat.tournament}: ${stat.teamName}
  - Basic: Wins: ${stat.wins}, Losses: ${stat.losses}, Kills: ${stat.totalKills}, WinRate: ${stat.winRate != null ? (stat.winRate * 100).toFixed(1) + '%' : 'N/A'}
  - Advanced: Vision Score: ${stat.averageVisionScore?.toFixed(1) ?? 'N/A'}, Gold Diff@15: ${stat.averageGoldDiffAt15?.toFixed(0) ?? 'N/A'}, CS Diff@15: ${stat.averageCSDiffAt15?.toFixed(1) ?? 'N/A'}`)
            })
        }

        // Search Players — cast to any[] for optional unlisted fields
        const playerStats = await prisma.historicalPlayerStat.findMany({
            where: {
                playerName: { contains: term, mode: 'insensitive' },
                ...(years.length > 0 ? { year: { in: years } } : {})
            },
            take: 5,
            orderBy: { year: 'desc' }
        }) as any[]

        if (playerStats.length > 0) {
            results.push(`Found Player Stats for "${term}":`)
            playerStats.forEach((stat: any) => {
                results.push(`- ${stat.year} ${stat.tournament}: ${stat.playerName} (${stat.teamName})
  - Basic: KDA: ${stat.averageKDA.toFixed(2)}, Wins: ${stat.wins}, Losses: ${stat.losses}, CSPM: ${stat.averageCSPM?.toFixed(1) ?? 'N/A'}
  - Advanced: Vision Score: ${stat.averageVisionScore?.toFixed(1) ?? 'N/A'}, Gold Diff@15: ${stat.averageGoldDiffAt15?.toFixed(0) ?? 'N/A'}, DPM: ${stat.averageDPM.toFixed(0)}`)
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
