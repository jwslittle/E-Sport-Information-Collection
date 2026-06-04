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

/** 판타지 리그 가상 선수 샘플 스탯 (AI 분석 참고용) */
export const VIRTUAL_PLAYER_STATS_SAMPLE = [
    {
        name: "Blaze",
        team: "Nexus Guardians (NGD)",
        position: "MID",
        price: 14,
        stats: { KDA: 5.8, CSPM: 9.9, DPM: 770, KP: "67%" },
        note: "최고가 미드라이너. 딜량과 KDA 모두 리그 최상위권.",
    },
    {
        name: "Echo",
        team: "Aurora Knights (AKT)",
        position: "MID",
        price: 14,
        stats: { KDA: 6.0, CSPM: 9.9, DPM: 775, KP: "68%" },
        note: "리그 최고 KDA 미드. 팀 기여도가 매우 높음.",
    },
    {
        name: "Sniper",
        team: "Neon Wolves (NWV)",
        position: "ADC",
        price: 14,
        stats: { KDA: 6.0, CSPM: 10.3, DPM: 748, KP: "64%" },
        note: "CS 1위 원딜. 안정적인 딜링과 높은 생존력.",
    },
    {
        name: "Phantom",
        team: "Shadow Foxes (SFX)",
        position: "JUNGLE",
        price: 14,
        stats: { KDA: 5.1, CSPM: 6.2, DPM: 420, KP: "71%" },
        note: "킬관여율 최상위 정글러. 시야 확보 능력 탁월.",
    },
    {
        name: "Viper",
        team: "Vortex Raiders (VTX)",
        position: "JUNGLE",
        price: 13,
        stats: { KDA: 4.9, CSPM: 6.1, DPM: 415, KP: "70%" },
        note: "공격적인 스타일의 정글러. 킬 가담률 높음.",
    },
];
