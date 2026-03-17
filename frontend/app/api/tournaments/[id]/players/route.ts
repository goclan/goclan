import { NextResponse } from "next/server";

const BASE_URL = "https://api.pandascore.co";
const API_KEY = process.env.PANDASCORE_API_KEY;

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournamentId = parseInt(id);

    // Buscar torneio com times inclusos
    const tRes = await fetch(
      `${BASE_URL}/csgo/tournaments/${tournamentId}`,
      { headers }
    );

    if (!tRes.ok) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });
    }

    const tournament = await tRes.json();
    const teams = tournament.teams || [];

    if (teams.length === 0) {
      return NextResponse.json({ players: [], teams: [] });
    }

    // Buscar jogadores de cada time em paralelo
    const teamsWithPlayers = await Promise.allSettled(
      teams.map(async (team: any) => {
        const pRes = await fetch(
          `${BASE_URL}/csgo/players?filter[team_id]=${team.id}&page[size]=10`,
          { headers }
        );
        const players = pRes.ok ? await pRes.json() : [];
        return {
          id: team.id,
          name: team.name,
          acronym: team.acronym,
          image_url: team.image_url,
          location: team.location,
          players,
        };
      })
    );

    const resolvedTeams = teamsWithPlayers
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    // Flatten players
    const prices = [120, 160, 200, 240, 280];
    const players = resolvedTeams.flatMap((team) =>
      (team.players || []).map((player: any) => ({
        id: player.id,
        name: player.name,
        first_name: player.first_name,
        last_name: player.last_name,
        image_url: player.image_url,
        nationality: player.nationality,
        role: player.role || "Rifler",
        team: {
          id: team.id,
          name: team.name,
          acronym: team.acronym,
          image_url: team.image_url,
          location: team.location,
        },
        stats: {
          rating: 1.0,
          kd_ratio: 1.0,
          adr: 70.0,
        },
        price: prices[Math.floor(Math.random() * prices.length)],
      }))
    );

    return NextResponse.json({
      players,
      teams: resolvedTeams.map((t) => ({
        id: t.id,
        name: t.name,
        acronym: t.acronym,
        image_url: t.image_url,
        location: t.location,
      })),
    });
  } catch (error) {
    console.error("Players error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar jogadores" },
      { status: 500 }
    );
  }
}