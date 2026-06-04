
import { addDays, format, startOfWeek, addWeeks } from 'date-fns'

export const TEAMS = ['T1', 'GEN', 'HLE', 'DK', 'KT', 'KDF', 'FOX', 'NS', 'DRX', 'BRO']

interface MatchSchedule {
    round: number
    matchId: string
    date: Date
    team1: string
    team2: string
}

// Generate Double Round Robin Schedule
export function generateSeasonSchedule(startDate: Date = new Date('2026-01-14')): MatchSchedule[] {
    const schedule: MatchSchedule[] = []
    const teams = [...TEAMS]
    const n = teams.length
    const rounds = (n - 1) * 2 // 18 rounds per team -> 90 matches total
    // Actually LCK is 90 matches total.
    // Double Round Robin means each pair plays twice.
    // Total pairs = 10 * 9 / 2 = 45.
    // 45 * 2 = 90 matches.

    // We need to distribute these 90 matches over ~9 weeks.
    // 10 matches per week.

    // Berger Table method for Round Robin
    // But we need to randomize the order slightly to mimic real schedule, 
    // or just use a standard rotation.

    const allMatches: { t1: string, t2: string }[] = []

    // First Round Robin
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            allMatches.push({ t1: teams[i], t2: teams[j] })
        }
    }
    // Second Round Robin (swap home/away)
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            allMatches.push({ t1: teams[j], t2: teams[i] })
        }
    }

    // Shuffle matches to create a realistic random schedule
    // In reality, schedules are carefully crafted, but random shuffle is good enough for "simulation"
    // ensuring no team plays twice in same day/too often.

    // Simple shuffle
    const shuffledMatches = allMatches.sort(() => 0.5 - Math.random())

    // Distribute to slots
    // LCK Schedule: Wed(2), Thu(2), Fri(2), Sat(2), Sun(2) = 10 matches/week
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 }) // Monday
    // Adjust to Wednesday start
    let currentDate = addDays(currentWeekStart, 2) // Wednesday

    let matchIndex = 0
    let roundCount = 1

    // We process week by week
    for (let week = 0; week < 9; week++) {
        // Days: Wed, Thu, Fri, Sat, Sun
        const matchDays = [0, 1, 2, 3, 4].map(d => addDays(currentDate, d))

        for (const day of matchDays) {
            // 2 matches per day
            for (let m = 0; m < 2; m++) {
                if (matchIndex >= shuffledMatches.length) break

                const match = shuffledMatches[matchIndex++]
                schedule.push({
                    round: Math.floor(matchIndex / 10) + 1, // Rough "Round" (Week)
                    matchId: `S2026-M${matchIndex}`,
                    date: day,
                    team1: match.t1,
                    team2: match.t2
                })
            }
        }

        // Next week
        currentDate = addWeeks(currentDate, 1)
    }

    return schedule
}

export function getMatchesForRound(round: number, fullSchedule: MatchSchedule[]): MatchSchedule[] {
    // In our logic, a "Round" in the simulation UI might correspond to a "Day" or a "Week".
    // The user wants "Next Round" button to process a chunk of matches.
    // Let's say 1 "Round" in UI = 1 Day of matches (2 matches).
    // This allows for more granular updates.

    const matchesPerRound = 2
    const startIndex = (round - 1) * matchesPerRound
    return fullSchedule.slice(startIndex, startIndex + matchesPerRound)
}
