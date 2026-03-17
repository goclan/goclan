const BASE_URL = "https://api.pandascore.co";
const API_KEY = process.env.PANDASCORE_API_KEY;

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// ─── TORNEIOS ───────────────────────────────────────────

export async function getTournaments() {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/running?sort=begin_at&page[size]=10`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar torneios em andamento");
  return res.json();
}

export async function getUpcomingTournaments() {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/upcoming?sort=begin_at&page[size]=10`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar torneios futuros");
  return res.json();
}

export async function getPastTournaments() {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/past?sort=-begin_at&page[size]=5`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar torneios passados");
  return res.json();
}

export async function getTournamentById(tournamentId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/${tournamentId}`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar torneio");
  return res.json();
}

// ─── PARTIDAS ───────────────────────────────────────────

export async function getTournamentMatches(tournamentId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/${tournamentId}/matches?sort=begin_at&page[size]=50`,
    { headers, next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar partidas");
  return res.json();
}

export async function getRunningMatches() {
  const res = await fetch(
    `${BASE_URL}/csgo/matches/running?sort=begin_at&page[size]=10`,
    { headers, next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar partidas em andamento");
  return res.json();
}

// ─── TIMES ──────────────────────────────────────────────

export async function getTournamentTeams(tournamentId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/${tournamentId}/teams?page[size]=30`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar times");
  return res.json();
}

export async function getTeamById(teamId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/teams/${teamId}`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar time");
  return res.json();
}

// ─── JOGADORES ──────────────────────────────────────────

export async function getTournamentPlayers(tournamentId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/${tournamentId}/players?page[size]=100`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar jogadores do torneio");
  return res.json();
}

export async function getPlayerById(playerId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/players/${playerId}`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar jogador");
  return res.json();
}

export async function getPlayerStats(playerId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/players/${playerId}/stats`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar stats do jogador");
  return res.json();
}

// Buscar jogadores via times do torneio (fallback quando endpoint direto falha)
export async function getPlayersFromTeams(
  teams: Array<{ id: number; name: string; acronym: string; image_url: string; location: string }>
) {
  const teamsWithPlayers = await Promise.allSettled(
    teams.map(async (team) => {
      const teamData = await getTeamById(team.id);
      return {
        ...team,
        players: (teamData.players || []).map((p: any) => ({
          ...p,
          current_team: team,
        })),
      };
    })
  );

  return teamsWithPlayers
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<any>).value);
}

// ─── HELPERS ────────────────────────────────────────────

export function calculatePlayerPrice(stats: any): number {
  if (!stats) return 100;
  const rating = stats.rating || stats.average_kills_per_game || 1.0;
  if (rating >= 1.30) return 280;
  if (rating >= 1.20) return 240;
  if (rating >= 1.10) return 200;
  if (rating >= 1.00) return 160;
  return 120;
}

export function mapPlayerData(player: any, team?: any) {
  const currentTeam = team || player.current_team;
  return {
    id: player.id,
    name: player.name,
    first_name: player.first_name,
    last_name: player.last_name,
    image_url: player.image_url,
    nationality: player.nationality,
    role: player.role || "Rifler",
    team: currentTeam
      ? {
          id: currentTeam.id,
          name: currentTeam.name,
          acronym: currentTeam.acronym,
          image_url: currentTeam.image_url,
          location: currentTeam.location,
        }
      : null,
    stats: {
      rating: player.stats?.rating || 1.0,
      kd_ratio: player.stats?.kills_deaths_ratio || 1.0,
      adr: player.stats?.average_damage_per_round || 70.0,
      headshot_percentage: player.stats?.headshot_percentage || 40.0,
      kast: player.stats?.kast || 70.0,
    },
    price: calculatePlayerPrice(player.stats),
  };
}

// ─── TIPOS ──────────────────────────────────────────────

export interface Tournament {
  id: number;
  name: string;
  full_name: string;
  begin_at: string;
  end_at: string;
  prizepool: string;
  league: {
    id: number;
    name: string;
    image_url: string;
  };
  serie: {
    full_name: string;
  };
  teams: Team[];
}

export interface Team {
  id: number;
  name: string;
  acronym: string;
  image_url: string;
  location: string;
  players?: Player[];
}

export interface Player {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  image_url: string;
  nationality: string;
  role: string;
  current_team: Team;
  stats: {
    rating: number;
    kd_ratio: number;
    adr: number;
    headshot_percentage: number;
    kast: number;
  };
  price: number;
}

export interface Match {
  id: number;
  name: string;
  begin_at: string;
  status: string;
  opponents: Array<{ opponent: Team }>;
  winner: Team | null;
  results: Array<{ score: number; team_id: number }>;
}