// 2024 Spring Season Averages (Approximate)
export const PLAYER_BASE_STATS: Record<string, { kda: number, csm: number, dpm: number, kp: number, vision: number }> = {
    // T1
    'Zeus': { kda: 3.5, csm: 8.8, dpm: 650, kp: 0.55, vision: 1.2 },
    'Oner': { kda: 4.2, csm: 5.5, dpm: 350, kp: 0.65, vision: 2.5 },
    'Faker': { kda: 4.5, csm: 8.5, dpm: 550, kp: 0.62, vision: 1.5 },
    'Gumayusi': { kda: 5.5, csm: 9.8, dpm: 700, kp: 0.60, vision: 1.3 },
    'Keria': { kda: 4.8, csm: 1.2, dpm: 250, kp: 0.70, vision: 3.2 },

    // Gen.G
    'Kiin': { kda: 4.0, csm: 8.6, dpm: 600, kp: 0.58, vision: 1.1 },
    'Canyon': { kda: 5.2, csm: 6.0, dpm: 400, kp: 0.68, vision: 2.4 },
    'Chovy': { kda: 6.5, csm: 10.2, dpm: 750, kp: 0.65, vision: 1.4 },
    'Peyz': { kda: 6.0, csm: 10.0, dpm: 720, kp: 0.63, vision: 1.2 },
    'Lehends': { kda: 4.5, csm: 1.0, dpm: 200, kp: 0.72, vision: 3.5 },

    // HLE
    'Doran': { kda: 3.2, csm: 8.4, dpm: 580, kp: 0.56, vision: 1.2 },
    'Peanut': { kda: 4.8, csm: 5.6, dpm: 320, kp: 0.69, vision: 2.6 },
    'Zeka': { kda: 4.5, csm: 9.2, dpm: 680, kp: 0.61, vision: 1.4 },
    'Viper': { kda: 6.2, csm: 9.9, dpm: 710, kp: 0.64, vision: 1.3 },
    'Delight': { kda: 5.0, csm: 1.1, dpm: 220, kp: 0.73, vision: 3.4 },

    // DK
    'Kingen': { kda: 3.0, csm: 8.2, dpm: 550, kp: 0.54, vision: 1.2 },
    'Lucid': { kda: 3.5, csm: 5.4, dpm: 300, kp: 0.64, vision: 2.3 },
    'ShowMaker': { kda: 4.2, csm: 9.0, dpm: 650, kp: 0.63, vision: 1.5 },
    'Aiming': { kda: 4.8, csm: 9.7, dpm: 690, kp: 0.62, vision: 1.3 },
    'Kellin': { kda: 3.8, csm: 1.1, dpm: 210, kp: 0.68, vision: 3.3 },

    // KT
    'PerfecT': { kda: 2.8, csm: 8.0, dpm: 500, kp: 0.52, vision: 1.1 },
    'Pyosik': { kda: 3.2, csm: 5.3, dpm: 330, kp: 0.66, vision: 2.4 },
    'Bdd': { kda: 4.0, csm: 8.8, dpm: 620, kp: 0.60, vision: 1.4 },
    'Deft': { kda: 4.5, csm: 9.5, dpm: 660, kp: 0.61, vision: 1.3 },
    'BeryL': { kda: 3.5, csm: 1.0, dpm: 230, kp: 0.67, vision: 3.0 },
}

// Default for unknown players
export const DEFAULT_STATS = { kda: 3.0, csm: 8.0, dpm: 500, kp: 0.5, vision: 1.5 }
