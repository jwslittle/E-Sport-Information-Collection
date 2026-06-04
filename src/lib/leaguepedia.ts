
const BASE_URL = 'https://lol.fandom.com/api.php';

// Rate Limiting: 10 requests per 1 minute = 1 request every 6 seconds.
// We set it to 7 seconds to be safe.
const DELAY_MS = 7000;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCargo(tables: string, fields: string, where: string, orderBy: string = '', limit: number = 20) {
    const allResults: any[] = [];
    let offset = 0;

    while (true) {
        const params = new URLSearchParams({
            action: 'cargoquery',
            format: 'json',
            tables,
            fields,
            where,
            limit: String(limit),
            offset: String(offset),
            origin: '*'
        });

        if (orderBy) {
            params.append('order_by', orderBy);
        }

        const url = `${BASE_URL}?${params.toString()}`;

        let retries = 5;
        let success = false;
        let batchResults: any[] = [];

        while (retries > 0) {
            try {
                console.log(`[Leaguepedia] Fetching: ${tables} WHERE ${where} (Offset: ${offset})`);
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://lol.fandom.com/wiki/Special:CargoQuery',
                        'Origin': 'https://lol.fandom.com'
                    }
                });

                if (response.status === 429) {
                    console.warn('[Leaguepedia] Rate limited. Waiting 10s...');
                    await sleep(10000);
                    retries--;
                    continue;
                }

                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

                const data = await response.json();

                if (data.error) {
                    if (data.error.code === 'ratelimited') {
                        console.warn('[Leaguepedia] API returned ratelimited error. Waiting 10s...');
                        await sleep(10000);
                        retries--;
                        continue;
                    }
                    throw new Error(`Leaguepedia API Error: ${JSON.stringify(data.error)}`);
                }

                batchResults = data.cargoquery.map((item: any) => item.title);
                success = true;
                break; // Success

            } catch (e) {
                console.error('[Leaguepedia] Error:', e);
                retries--;
                if (retries === 0) throw e;
                await sleep(5000);
            }
        }

        if (!success) throw new Error(`[Leaguepedia] Max retries exceeded for query: ${tables}`);

        allResults.push(...batchResults);

        // If we got fewer results than limit, we are done
        if (batchResults.length < limit) {
            break;
        }

        // Prepare for next batch
        offset += limit;
        await sleep(DELAY_MS);
    }

    return allResults;
}

export async function getLckMatches(year: string, split: string = 'Spring') {
    // Example: Tournament='LCK 2025 Spring'
    // Note: Leaguepedia tournament names can vary. "LCK 2025 Spring" is standard guess.
    // We search for LIKE to be safe.
    const where = `Tournament LIKE "%LCK%${year}%${split}%"`;
    const fields = 'Tournament, Team1, Team2, Winner, DateTime_UTC, MatchId, Score1, Score2';
    return fetchCargo('ScoreboardGames', fields, where, 'DateTime_UTC DESC');
}

export async function getPlayerStats(matchId: string) {
    // MatchId in ScoreboardPlayers links to MatchId in ScoreboardGames
    const where = `MatchId="${matchId}"`;
    const fields = 'Name, Team, Champion, Kills, Deaths, Assists, CS, Gold';
    return fetchCargo('ScoreboardPlayers', fields, where);
}

export async function getTournamentPlayers(year: string, split: string = 'Spring') {
    // Table: TournamentPlayers
    // Fields: Player, Team, Role
    // Where: Tournament LIKE "%LCK%2025%Spring%"
    const where = `Tournament LIKE "%LCK%${year}%${split}%"`;
    const fields = 'Player, Team, Role';
    return fetchCargo('TournamentPlayers', fields, where);
}
