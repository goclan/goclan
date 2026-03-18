const CENTRAL_URL = "https://api-op.grid.gg/central-data/graphql";
const STATS_URL = "https://api-op.grid.gg/statistics-feed/graphql";
const API_KEY = process.env.GRID_API_KEY;

const headers = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY || "",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function centralQuery(query: string) {
  const res = await fetch(CENTRAL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GRID central error: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data;
}

async function statsQuery(query: string) {
  const res = await fetch(STATS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GRID stats error: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data;
}

export async function getActiveTournaments() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const data = await centralQuery(`{
    allSeries(
      filter: {
        titleId: "28"
        startTimeScheduled: { gte: "${thirtyDaysAgo}", lte: "${thirtyDaysAhead}" }
      }
      first: 50
    ) {
      edges {
        node {
          id
          startTimeScheduled
          tournament {
            id
            name
            startDate
            endDate
            prizePool { amount }
            logoUrl
          }
          teams {
            baseInfo { id name nameShortened colorPrimary logoUrl }
          }
        }
      }
    }
  }`);

  const series = data.data?.allSeries?.edges || [];
  const tournamentsMap = new Map<string, any>();

  for (const edge of series) {
    const t = edge.node.tournament;
    if (!t) continue;

    if (!tournamentsMap.has(t.id)) {
      tournamentsMap.set(t.id, {
        id: t.id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        prizePool: t.prizePool?.amount,
        logoUrl: t.logoUrl,
        teams: new Map(),
        seriesCount: 0,
      });
    }

    const tournament = tournamentsMap.get(t.id);
    tournament.seriesCount++;

    for (const team of edge.node.teams || []) {
      const b = team.baseInfo;
      if (b?.id && !tournament.teams.has(b.id)) {
        tournament.teams.set(b.id, b);
      }
    }
  }

  return Array.from(tournamentsMap.values()).map((t) => ({
    ...t,
    teams: Array.from(t.teams.values()),
  }));
}

export async function getTournamentTeamsAndPlayers(gridTournamentId: string) {
  const data = await centralQuery(`{
    allSeries(
      filter: { tournamentId: "${gridTournamentId}" }
      first: 50
    ) {
      edges {
        node {
          id
          teams {
            baseInfo { id name nameShortened colorPrimary logoUrl }
          }
        }
      }
    }
  }`);

  const series = data.data?.allSeries?.edges || [];
  const teamsMap = new Map<string, any>();

  for (const edge of series) {
    for (const team of (edge.node.teams || [])) {
      const b = team.baseInfo;
      if (b?.id && !teamsMap.has(b.id)) {
        teamsMap.set(b.id, b);
      }
    }
  }

  const teams = Array.from(teamsMap.values());

  const result = [];
  for (const team of teams) {
    try {
      await sleep(200);
      const players = await getPlayersByTeamId(team.id);
      console.log(`Team ${team.name}: ${players.length} players`);
      result.push({ ...team, players });
    } catch (e) {
      console.log(`Team ${team.name}: error - ${e}`);
      result.push({ ...team, players: [] });
    }
  }

  return result;
}

export async function getPlayersByTeamId(teamId: string) {
  const data = await centralQuery(`{
    players(
      filter: { teamIdFilter: { id: "${teamId}" } }
      first: 10
    ) {
      edges {
        node {
          id
          nickname
          roles { name }
        }
      }
    }
  }`);

  return data.data?.players?.edges?.map((e: any) => e.node) || [];
}

export async function getPlayerStats(gridPlayerId: string) {
  try {
    const data = await statsQuery(`{
      playerStatistics(playerId: "${gridPlayerId}", filter: { timeWindow: LAST_3_MONTHS }) {
        series {
          count
          kills { avg sum min max }
          deaths { avg sum }
          killAssistsGiven { avg sum }
          won { count percentage }
        }
      }
    }`);
    return data.data?.playerStatistics || null;
  } catch {
    return null;
  }
}

export function calculateKD(stats: any): number {
  if (!stats?.series) return 1.0;
  const kills = stats.series.kills?.avg || 0;
  const deaths = stats.series.deaths?.avg || 1;
  return Math.round((kills / deaths) * 100) / 100;
}

export function calculateRating(stats: any): number {
  const kd = calculateKD(stats);
  return Math.round((0.5 + kd * 0.5) * 100) / 100;
}

export function calculatePrice(stats: any): number {
  const rating = calculateRating(stats);
  if (rating >= 1.30) return 290;
  if (rating >= 1.20) return 260;
  if (rating >= 1.10) return 220;
  if (rating >= 1.00) return 180;
  if (rating >= 0.90) return 150;
  return 120;
}

export function calculateMatchScore(
  kills: number,
  deaths: number,
  assists: number,
  won: boolean,
  isCaptain: boolean
): number {
  const total = kills * 10 + assists * 6 + deaths * -4 + (won ? 2 : 0);
  return Math.round(isCaptain ? total * 2 : total);
}

export function mapPlayerFromGrid(player: any) {
  const stats = player.stats;
  return {
    id: player.id,
    name: player.nickname,
    first_name: "",
    last_name: "",
    nationality: "??",
    role: player.roles?.[0]?.name || "Rifler",
    team: {
      id: player.team?.id,
      name: player.team?.name || "",
      acronym: player.team?.nameShortened || player.team?.name?.substring(0, 3).toUpperCase() || "???",
      color: player.team?.colorPrimary || "#39A900",
      image_url: player.team?.logoUrl || null,
    },
    stats: {
      rating: calculateRating(stats),
      kd_ratio: calculateKD(stats),
      adr: 0,
      headshot_percentage: 0,
      kast: 0,
      kills_avg: stats?.series?.kills?.avg || 0,
      deaths_avg: stats?.series?.deaths?.avg || 0,
      assists_avg: stats?.series?.killAssistsGiven?.avg || 0,
      win_rate: stats?.series?.won?.[1]?.percentage || 0,
      series_count: stats?.series?.count || 0,
    },
    rating: calculateRating(stats),
    kd: calculateKD(stats),
    adr: 0,
    color: player.team?.colorPrimary || "#39A900",
    price: calculatePrice(stats),
  };
}