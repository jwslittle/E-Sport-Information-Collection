
export const FANTASY_WEIGHTS: Record<string, {
    kill: number
    death: number
    assist: number
    cs: number
    vision: number
    damage: number // per 1 unit of damage (will be small) -> Plan said per 1k, so we divide by 1000 or use small weight. 
    // Let's use per 1 unit weight = value / 1000 * weight_per_1k
    win: number
    penta: number
    quadra: number
}> = {
    // Top: Balanced - increased vision/assist slightly
    TOP: { kill: 3.0, death: -2.0, assist: 2.0, cs: 0.02, vision: 0.1, damage: 0.0004, win: 5.0, penta: 5.0, quadra: 2.0 },
    // Jungle: Vision/Assist favored - increased vision
    JUNGLE: { kill: 3.0, death: -2.0, assist: 2.5, cs: 0.02, vision: 0.2, damage: 0.0003, win: 5.0, penta: 5.0, quadra: 2.0 },
    // Mid: Damage/Kill favored - slight nerf to damage/kill
    MID: { kill: 3.3, death: -2.0, assist: 1.5, cs: 0.02, vision: 0.05, damage: 0.0005, win: 5.0, penta: 5.0, quadra: 2.0 },
    // ADC: Damage/Kill favored - slight nerf to damage/kill
    ADC: { kill: 3.3, death: -2.0, assist: 1.5, cs: 0.02, vision: 0.05, damage: 0.0005, win: 5.0, penta: 5.0, quadra: 2.0 },
    // Support: Vision/Assist heavily favored - buffed assist/vision
    SUPPORT: { kill: 1.5, death: -1.5, assist: 2.5, cs: 0.01, vision: 0.15, damage: 0.0002, win: 5.0, penta: 5.0, quadra: 2.0 },
}

// Fallback for unknown positions
const DEFAULT_WEIGHTS = FANTASY_WEIGHTS.MID

export function calculateFantasyPoints(stats: {
    kills: number
    deaths: number
    assists: number
    cs: number
    vision: number
    damage: number
    pentaKills?: number
    quadraKills?: number
    win?: boolean
}, position: string): number {
    const pos = position.toUpperCase()
    // Map 'BOT' to 'ADC' or 'BOTTOM' to 'ADC' if needed. 
    // Our DB uses 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'. 
    // Also handle 'JNG', 'SUP', 'BOT' just in case.
    const normalizedPos = pos === 'JNG' ? 'JUNGLE' :
        pos === 'SUP' ? 'SUPPORT' :
            pos === 'BOT' ? 'ADC' :
                pos === 'BOTTOM' ? 'ADC' : pos

    const w = FANTASY_WEIGHTS[normalizedPos] || DEFAULT_WEIGHTS

    let score = 0
    score += stats.kills * w.kill
    score += stats.deaths * w.death
    score += stats.assists * w.assist
    score += stats.cs * w.cs
    score += stats.vision * w.vision
    score += stats.damage * w.damage

    if (stats.win) score += w.win
    if (stats.pentaKills) score += stats.pentaKills * w.penta
    if (stats.quadraKills) score += stats.quadraKills * w.quadra

    return parseFloat(score.toFixed(2))
}
