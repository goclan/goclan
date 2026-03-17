import { NextResponse } from "next/server";
import { getPlayersFromTeams } from "@/lib/api/pandascore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournamentId = parseInt(id);

    // Buscar torneio direto da API de torneios que já funciona
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "http://localhost:3000" : "http://localhost:3000"}/api/tournaments`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();

    // Encontrar o torneio pelo ID
    const tournament = data.tournaments?.find((t: any) => t.id === tournamentId);

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });
    }

    // Usar os times que já vieram no torneio
    const teams = tournament.teams || [];

    if (teams.length === 0) {
      return NextResponse.json({ players: [], teams: [] });
    }

    // Buscar jogadores de cada time via filter
    const teamsWithPlayers = await getPlayersFromTeams(
      teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        acronym: t.acronym,
        image_url: t.image_url,
        location: t.location,
      }))
    );

    // Flatten players
    const players = teamsWithPlayers.flatMap((team: any) =>
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
        price: [120, 160, 200, 240, 280][Math.floor(Math.random() * 5)],
      }))
    );

    return NextResponse.json({ players, teams });
  } catch (error) {
    console.error("Players error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar jogadores" },
      { status: 500 }
    );
  }
}