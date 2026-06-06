export const LOL_METRICS = [
    {
        name: "KDA (Kill-Death-Assist Ratio)",
        description: "((Kills + Assists) / Deaths). Measures a player's combat efficiency and survival skills. A KDA above 3.0 is generally considered good, while elite players often maintain 5.0+.",
    },
    {
        name: "CSPM (Creep Score Per Minute)",
        description: "Average minions killed per minute. Indicates farming efficiency and economic scaling. Pro laners typically aim for 9-10+ CSPM.",
    },
    {
        name: "DPM (Damage Per Minute)",
        description: "Average damage dealt to champions per minute. Key metric for carries (Mid/ADC) to measure offensive output. Elite carries often exceed 600-700 DPM.",
    },
    {
        name: "GPM (Gold Per Minute)",
        description: "Average gold earned per minute. Reflects overall economic efficiency including farming, kills, and objectives.",
    },
    {
        name: "Vision Score Per Minute (VSPM)",
        description: "Vision contribution normalized by game time. Crucial for Supports and Junglers. High VSPM indicates strong map control.",
    },
    {
        name: "KP% (Kill Participation)",
        description: "Percentage of team's kills the player was involved in. High KP% indicates strong teamfight presence and roaming.",
    },
    {
        name: "GD@15 (Gold Difference at 15 min)",
        description: "Gold difference versus lane opponent at 15 minutes. Measures laning phase dominance.",
    },
    {
        name: "CSD@15 (CS Difference at 15 min)",
        description: "CS difference versus lane opponent at 15 minutes. Measures laning skill.",
    },
];

export const DATA_SOURCES = [
    {
        name: "Riot Data Dragon (Static Data)",
        url: "https://ddragon.leagueoflegends.com/cdn/14.1.1/data/ko_KR/champion.json",
        description: "Official static data for champions, items, and runes. No API key required. Use this to look up champion details, spell names, and base stats.",
        type: "JSON",
    },
    {
        name: "Leaguepedia API",
        url: "https://lol.fandom.com/api.php",
        description: "Community wiki API. Good for historical match results, roster changes, and tournament info. Requires parsing MediaWiki format.",
        type: "API",
    },
    {
        name: "Oracle's Elixir (Reference)",
        url: "https://oracleselixir.com/",
        description: "Premier source for advanced esports stats. While they don't have a public free API, their definitions and CSV downloads are the industry standard for analysis.",
        type: "Website/CSV",
    },
];

// ✅ M-2 수정: VIRTUAL_PLAYER_STATS_SAMPLE 제거 (가상 선수 데이터는 더 이상 사용하지 않음)
// 실제 LCK 선수 데이터는 getHistoricalContext() (context.ts)에서 DB 조회로 제공
