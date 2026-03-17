const BASE_URL = "https://api.pandascore.co";
const API_KEY = process.env.PANDASCORE_API_KEY;

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// Buscar torneios de CS2 em andamento e futuros
export async function getTournaments() {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/running?sort=begin_at&page[size]=10`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar torneios");
  return res.json();
}

// Buscar torneios futuros
export async function getUpcomingTournaments() {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/upcoming?sort=begin_at&page[size]=10`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar torneios futuros");
  return res.json();
}

// Buscar torneios finalizados
export async function getPastTournaments() {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/past?sort=-begin_at&page[size]=5`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar torneios passados");
  return res.json();
}

// Buscar partidas de um torneio
export async function getTournamentMatches(tournamentId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/${tournamentId}/matches?sort=begin_at&page[size]=20`,
    { headers, next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar partidas");
  return res.json();
}

// Buscar jogadores de um torneio
export async function getTournamentPlayers(tournamentId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/${tournamentId}/players?page[size]=50`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar jogadores");
  return res.json();
}

// Buscar times de um torneio
export async function getTournamentTeams(tournamentId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/tournaments/${tournamentId}/teams?page[size]=30`,
    { headers, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar times");
  return res.json();
}

// Buscar stats de um jogador
export async function getPlayerStats(playerId: number) {
  const res = await fetch(
    `${BASE_URL}/csgo/players/${playerId}/stats`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("Erro ao buscar stats do jogador");
  return res.json();
}

// Tipos TypeScript
export interface Tournament {
  id: number;
  name: string;
  full_name: string;
  begin_at: string;
  end_at: string;
  league: {
    id: number;
    name: string;
    image_url: string;
  };
  serie: {
    full_name: string;
  };
  prizepool: string;
  teams: Team[];
}

export interface Team {
  id: number;
  name: string;
  acronym: string;
  image_url: string;
  location: string;
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