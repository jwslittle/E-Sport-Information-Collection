
const BASE_URL = 'https://esports-api.lolesports.com/persisted/gw';
const API_KEY = process.env.LOL_ESPORTS_API_KEY ?? '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';

interface RiotTeam {
    id: string;
    slug: string;
    name: string;
    code: string;
    image: string;
    alternativeImage: string;
    backgroundImage: string;
    status: string;
    homeLeague: {
        name: string;
        region: string;
    };
    players: RiotPlayer[];
}

interface RiotPlayer {
    id: string;
    summonerName: string;
    firstName: string;
    lastName: string;
    image: string;
    role: string;
}

export async function fetchRiotApi(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.searchParams.append('hl', 'en-US');
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

    const response = await fetch(url.toString(), {
        headers: {
            'x-api-key': API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`Riot API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export async function getLeagues() {
    const data = await fetchRiotApi('getLeagues');
    return data.data.leagues;
}

export async function getTournaments(leagueId: string) {
    const data = await fetchRiotApi('getTournamentsForLeague', { leagueId });
    return data.data.leagues[0].tournaments;
}

export async function getStandings(tournamentId: string) {
    const data = await fetchRiotApi('getStandings', { tournamentId });
    return data.data.standings;
}

export async function getTeams(leagueId: string): Promise<RiotTeam[]> {
    // 1. Get Tournaments
    const tournaments = await getTournaments(leagueId);
    if (!tournaments || tournaments.length === 0) return [];

    // 2. Get Standings for the most recent tournament (usually first or last? API usually sorts, but let's check)
    // Actually, let's try to get teams from the most recent tournament that has standings
    const tournament = tournaments[0]; // Assuming first is most recent/relevant

    const standings = await getStandings(tournament.id);
    const teamsMap = new Map<string, RiotTeam>();

    for (const standing of standings) {
        for (const stage of standing.stages) {
            for (const section of stage.sections) {
                for (const ranking of section.rankings) {
                    for (const team of ranking.teams) {
                        if (!teamsMap.has(team.id)) {
                            teamsMap.set(team.id, team);
                        }
                    }
                }
            }
        }
    }

    const basicTeams = Array.from(teamsMap.values());
    const detailedTeams: RiotTeam[] = [];

    console.log(`Fetching details for ${basicTeams.length} teams...`);

    for (const team of basicTeams) {
        try {
            const detailData = await fetchRiotApi('getTeams', { id: team.id });
            if (detailData.data.teams && detailData.data.teams.length > 0) {
                detailedTeams.push(detailData.data.teams[0]);
            } else {
                detailedTeams.push(team); // Fallback to basic info if detail fetch fails
            }
            // Small delay to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
            console.warn(`Failed to fetch details for team ${team.name}`, e);
            detailedTeams.push(team);
        }
    }

    return detailedTeams;
}

export async function getSchedule(leagueId: string, pageToken?: string) {
    const params: Record<string, string> = { leagueId };
    if (pageToken) params.pageToken = pageToken;

    const data = await fetchRiotApi('getSchedule', params);
    return data.data.schedule.events;
}

export async function getEventDetails(eventId: string) {
    const data = await fetchRiotApi('getEventDetails', { id: eventId });
    return data.data.event;
}

export async function getGameDetails(gameId: string) {
    // Note: getGames is the endpoint for game details
    const data = await fetchRiotApi('getGames', { id: gameId });
    return data.data.games[0];
}
