/**
 * LoL Esports API Service
 *
 * 데이터 출처: esports-api.lolesports.com
 * 비상업적 팬 프로젝트용으로만 사용합니다.
 *
 * LCK League ID: 98767991310872058
 */

const BASE_URL = 'https://esports-api.lolesports.com/persisted/gw'
// LOL_ESPORTS_API_KEY를 Vercel Dashboard → Settings → Environment Variables에 반드시 설정하세요.
// 미설정 시 동기화 API 호출이 401/403으로 실패합니다.
const API_KEY: string = process.env.LOL_ESPORTS_API_KEY ?? ''
if (!API_KEY) {
    console.error('[LoLEsports] LOL_ESPORTS_API_KEY 환경변수가 설정되지 않았습니다. 동기화가 실패합니다.')
}

// LCK league IDs
export const LEAGUE_IDS = {
    LCK: '98767991310872058',
    LCK_CHALLENGERS: '98767991335774713',
    LPL: '98767991314006698',
    LEC: '98767991302996019',
    LCS: '98767991299243165',
}

// 2026 LCK tournament IDs
export const LCK_2026_TOURNAMENTS = {
    SPLIT1: { id: '115548106590082745', slug: 'lck_split_1_2026', start: '2026-01-13', end: '2026-03-01', season: '2026-SPLIT1' },
    SPLIT2: { id: '115548128960088078', slug: 'lck_split_2_2026', start: '2026-03-31', end: '2026-06-14', season: '2026-SPLIT2' },
}

export interface LoLEsportsTeam {
    name: string
    code: string
    image: string
    result: { outcome: 'win' | 'loss' | null; gameWins: number } | null
    record: { wins: number; losses: number }
}

export interface LoLEsportsEvent {
    startTime: string
    state: 'completed' | 'unstarted' | 'inProgress'
    type: string
    blockName: string
    league: { name: string; slug: string }
    match: {
        id: string
        flags: string[]
        teams: [LoLEsportsTeam, LoLEsportsTeam]
        strategy: { type: string; count: number }
    }
}

interface ScheduleResponse {
    data: {
        schedule: {
            pages: { older: string | null; newer: string | null }
            events: LoLEsportsEvent[]
        }
    }
}

async function fetchSchedulePage(
    leagueId: string,
    pageToken?: string
): Promise<{ events: LoLEsportsEvent[]; olderToken: string | null; newerToken: string | null }> {
    const params = new URLSearchParams({ hl: 'ko-KR', leagueId })
    if (pageToken) params.set('pageToken', pageToken)

    const url = `${BASE_URL}/getSchedule?${params}`
    const res = await fetch(url, {
        headers: { 'x-api-key': API_KEY },
        next: { revalidate: 0 },
        // ✅ 타임아웃: Vercel Hobby 10초 제한 대비 8초로 설정
        signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`LoL Esports API error: HTTP ${res.status}`)

    const json: ScheduleResponse = await res.json()
    const schedule = json.data?.schedule

    if (!schedule) throw new Error('Invalid response from LoL Esports API')

    return {
        events: schedule.events ?? [],
        olderToken: schedule.pages?.older ?? null,
        newerToken: schedule.pages?.newer ?? null,
    }
}

/**
 * LCK 현재 시즌 경기 일정 가져오기
 *
 * @param maxPages 가져올 페이지 수 (older + newer 각각 적용)
 *   - 기본(2): 크론잡 4초 예산 내 안전 범위 (~50경기)
 *   - 관리자 수동 동기화(4): 전 시즌 누락 없이 커버 (~100경기)
 *
 * 기본 페이지(현재 시점 기준)를 시작점으로 older(과거) + newer(미래) 양방향 조회
 * → 중복 제거 → 날짜 정렬 반환
 */
export async function fetchLckCurrentSeason(maxPages = 2): Promise<LoLEsportsEvent[]> {
    const allEvents: LoLEsportsEvent[] = []

    // ── 기본 페이지 조회 (현재 시점 중심) ──────────────────────────────────
    const firstPage = await fetchSchedulePage(LEAGUE_IDS.LCK)
    allEvents.push(...firstPage.events.filter(e => e.league?.slug === 'lck'))

    // ── older 방향 (과거 경기 — 완료 결과 갱신) ────────────────────────────
    let olderToken = firstPage.olderToken
    for (let i = 1; i < maxPages && olderToken; i++) {
        const page = await fetchSchedulePage(LEAGUE_IDS.LCK, olderToken)
        allEvents.push(...page.events.filter(e => e.league?.slug === 'lck'))
        olderToken = page.olderToken ?? null
    }

    // ── newer 방향 (미래 경기 — 예정 일정 수집) ────────────────────────────
    let newerToken = firstPage.newerToken
    for (let i = 1; i < maxPages && newerToken; i++) {
        const page = await fetchSchedulePage(LEAGUE_IDS.LCK, newerToken)
        allEvents.push(...page.events.filter(e => e.league?.slug === 'lck'))
        newerToken = page.newerToken ?? null
    }

    // 중복 제거 + 날짜 오름차순 정렬
    const seen = new Set<string>()
    const unique = allEvents.filter(e => {
        if (seen.has(e.match.id)) return false
        seen.add(e.match.id)
        return true
    })

    return unique.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

/**
 * 특정 연도의 LCK 경기 (최대 N 페이지 페이지네이션)
 */
export async function fetchLckSeason(year: number, maxPages = 3): Promise<LoLEsportsEvent[]> {
    const allEvents: LoLEsportsEvent[] = []
    const yearStart = new Date(`${year}-01-01T00:00:00Z`)
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`)

    let pageToken: string | null = null
    let pagesLoaded = 0

    while (pagesLoaded < maxPages) {
        const page = await fetchSchedulePage(LEAGUE_IDS.LCK, pageToken ?? undefined)
        pagesLoaded++

        const lckEvents = page.events.filter(e => e.league?.slug === 'lck')
        let hitPastYear = false

        for (const event of lckEvents) {
            const startTime = new Date(event.startTime)
            if (startTime >= yearStart && startTime < yearEnd) {
                allEvents.push(event)
            } else if (startTime < yearStart) {
                hitPastYear = true
            }
        }

        // 이전 연도 데이터 도달하거나 더 이상 페이지 없으면 중단
        if (hitPastYear || !page.olderToken) break
        pageToken = page.olderToken
    }

    // 중복 제거 + 날짜 정렬
    const seen = new Set<string>()
    const unique = allEvents.filter(e => {
        if (seen.has(e.match.id)) return false
        seen.add(e.match.id)
        return true
    })

    return unique.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

/**
 * startTime 기준으로 시즌 키 결정
 * ⚠️ 경계값 주의: LCK 2026 SPLIT2 시작일은 2026-03-31 (월=3이지만 SPLIT2)
 */
export function getSeasonKeyFromDate(startTime: string): string {
    const date = new Date(startTime)
    const year = date.getUTCFullYear()

    // LCK 2026 기준 — 토너먼트 날짜 범위로 정확히 분류
    if (year === 2026) {
        const split1End   = new Date('2026-03-31T00:00:00Z') // SPLIT1: ~ 3/30
        const split2End   = new Date('2026-06-15T00:00:00Z') // SPLIT2: 3/31 ~ 6/14
        if (date < split1End)  return '2026-SPLIT1'
        if (date < split2End)  return '2026-SPLIT2'
        return '2026-SPLIT3'
    }

    // 이전 연도는 spring/summer
    const month = date.getUTCMonth() + 1 // 1-12
    if (month <= 6) return `${year}-SPRING`
    return `${year}-SUMMER`
}

/**
 * 현재 진행 중인 LCK 경기 조회 (실시간 세트 스코어 포함)
 *
 * getLive 엔드포인트는 라이브 이벤트가 없으면 404를 반환할 수 있음 → 빈 배열 반환
 */
export async function fetchLiveLckMatches(): Promise<LoLEsportsEvent[]> {
    if (!API_KEY) return []

    let res: Response
    try {
        res = await fetch(`${BASE_URL}/getLive?hl=ko-KR`, {
            headers: { 'x-api-key': API_KEY },
            next: { revalidate: 0 },
            signal: AbortSignal.timeout(6000),
        })
    } catch {
        // 타임아웃 또는 네트워크 오류 → 라이브 섹션 비표시
        return []
    }

    // 라이브 경기 없으면 404 반환하는 API 스펙
    if (res.status === 404 || res.status === 204) return []
    if (!res.ok) return []

    const json = await res.json()
    const events: LoLEsportsEvent[] = json?.data?.schedule?.events ?? []

    // LCK 리그 & inProgress 상태만 필터
    return events.filter(e => e.league?.slug === 'lck' && e.state === 'inProgress')
}

/**
 * LoL Esports 이벤트를 DB 저장용 포맷으로 변환
 */
export function transformEventToMatch(event: LoLEsportsEvent) {
    const team1 = event.match.teams[0]
    const team2 = event.match.teams[1]

    const team1Score = team1.result?.gameWins ?? 0
    const team2Score = team2.result?.gameWins ?? 0

    let winner: string | null = null
    if (event.state === 'completed') {
        if (team1.result?.outcome === 'win') winner = team1.code
        else if (team2.result?.outcome === 'win') winner = team2.code
    }

    return {
        externalId: event.match.id,
        tournament: `LCK/${new Date(event.startTime).getUTCFullYear()} Season`,
        displayName: `LCK ${new Date(event.startTime).getUTCFullYear()} - ${event.blockName}`,
        season: getSeasonKeyFromDate(event.startTime),
        team1: team1.code,
        team2: team2.code,
        team1Score,
        team2Score,
        winner,
        bestOf: event.match.strategy.count,
        scheduledAt: new Date(event.startTime),
        // ✅ completedAt: API가 완료시각을 별도 제공하지 않으므로 동기화 시점(현재시각) 사용
        // (이전: startTime을 잘못 사용 → scheduledAt과 동일한 값이 저장되는 버그)
        completedAt: event.state === 'completed' ? new Date() : null,
        status: event.state === 'completed' ? 'COMPLETED'
            : event.state === 'inProgress' ? 'LIVE'
                : 'SCHEDULED',
        // 팀 메타정보 (UI 표시용)
        team1Name: team1.name,
        team2Name: team2.name,
        team1Logo: team1.image,
        team2Logo: team2.image,
        team1Record: team1.record ? `${team1.record.wins}W ${team1.record.losses}L` : null,
        team2Record: team2.record ? `${team2.record.wins}W ${team2.record.losses}L` : null,
    }
}
