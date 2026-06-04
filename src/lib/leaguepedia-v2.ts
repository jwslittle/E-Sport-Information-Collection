
const BASE_URL = 'https://lol.fandom.com/api.php';

// Rate Limiting: 10 requests per 1 minute.
// With joined queries, we need far fewer requests, so 7s delay is acceptable.
const DELAY_MS = 7000;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCargo(
    tables: string,
    fields: string,
    where: string,
    joinOn: string = '',
    orderBy: string = '',
    limit: number = 50
) {
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

        if (joinOn) {
            params.append('join_on', joinOn);
        }
        if (orderBy) {
            params.append('order_by', orderBy);
        }

        const url = `${BASE_URL}?${params.toString()}`;

        let retries = 5;
        let success = false;
        let batchResults: any[] = [];

        while (retries > 0) {
            try {
                console.log(`[Leaguepedia V2] Fetching: ${tables} (Offset: ${offset})`);
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://lol.fandom.com/wiki/Special:CargoQuery',
                        'Origin': 'https://lol.fandom.com'
                    }
                });

                if (response.status === 429) {
                    console.warn('[Leaguepedia V2] Rate limited. Waiting 10s...');
                    await sleep(10000);
                    retries--;
                    continue;
                }

                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

                const data = await response.json();

                if (data.error) {
                    if (data.error.code === 'ratelimited') {
                        console.warn('[Leaguepedia V2] API returned ratelimited error. Waiting 10s...');
                        await sleep(10000);
                        retries--;
                        continue;
                    }
                    throw new Error(`Leaguepedia API Error: ${JSON.stringify(data.error)}`);
                }

                batchResults = data.cargoquery.map((item: any) => item.title);
                success = true;
                break;

            } catch (e) {
                console.error('[Leaguepedia V2] Error:', e);
                retries--;
                if (retries === 0) throw e;
                await sleep(5000);
            }
        }

        if (!success) throw new Error(`[Leaguepedia V2] Max retries exceeded.`);

        allResults.push(...batchResults);

        if (batchResults.length < limit) {
            break;
        }

        offset += limit;
        await sleep(DELAY_MS);
    }

    return allResults;
}

export async function getMatchesWithStats(year: string, split: string = 'Spring') {
    // Join ScoreboardGames (SG) and ScoreboardPlayers (SP)
    // Note: Cargo joins can be tricky with field names. We use aliases.
    const tables = 'ScoreboardGames=SG,ScoreboardPlayers=SP';
    const joinOn = 'SG.MatchId=SP.MatchId';
    const fields = `
        SG.MatchId,
        SG.DateTime_UTC,
        SG.Team1,
        SG.Team2,
        SG.Winner,
        SG.Score1,
        SG.Score2,
        SP.Name,
        SP.Team,
        SP.Role,
        SP.Champion,
        SP.Kills,
        SP.Deaths,
        SP.Assists,
        SP.CS
    `;
    const where = `SG.Tournament LIKE "%LCK%${year}%${split}%"`;

    // We fetch everything. The result will be one row per player per game.
    // We will need to group them by MatchId in the script.
    return fetchCargo(tables, fields, where, joinOn, 'SG.DateTime_UTC DESC', 50);
}

export async function getTournamentPlayers(year: string, split: string = 'Spring') {
    const where = `Tournament LIKE "%LCK%${year}%${split}%"`;
    const fields = 'Player, Team, Role';
    return fetchCargo('TournamentPlayers', fields, where);
}
