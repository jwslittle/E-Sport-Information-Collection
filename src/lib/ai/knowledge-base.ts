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

export const PRO_PLAYER_STATS_SAMPLE_2024 = [
    {
        name: "Chovy",
        team: "Gen.G",
        position: "MID",
        stats: { KDA: 6.2, CSPM: 10.1, DPM: 750, KP: "68%" },
        signatureChampions: ["Azir", "Yone", "Corki"],
    },
    {
        name: "Faker",
        team: "T1",
        position: "MID",
        stats: { KDA: 4.5, CSPM: 9.2, DPM: 620, KP: "72%" },
        signatureChampions: ["Orianna", "Azir", "Ahri"],
    },
    {
        name: "Viper",
        team: "HLE",
        position: "ADC",
        stats: { KDA: 5.8, CSPM: 10.5, DPM: 780, KP: "70%" },
        signatureChampions: ["Zeri", "Xayah", "Lucian"],
    },
    {
        name: "Canyon",
        team: "Gen.G",
        position: "JUNGLE",
        stats: { KDA: 4.8, CSPM: 6.5, DPM: 450, KP: "75%" },
        signatureChampions: ["Nidalee", "Lee Sin", "Viego"],
    },
    {
        name: "Keria",
        team: "T1",
        position: "SUPPORT",
        stats: { KDA: 4.2, VSPM: 2.8, KP: "78%" },
        signatureChampions: ["Bard", "Renata Glasc", "Pyke"],
    },
];
