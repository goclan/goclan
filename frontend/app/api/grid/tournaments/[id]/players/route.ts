import { NextRequest, NextResponse } from "next/server";
import { getTournamentTeamsAndPlayers, getPlayerStats, mapPlayerFromGrid } from "@/lib/api/grid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const teams = await getTournamentTeamsAndPlayers(id);

    console.log("Route - Teams:", teams.length);
    console.log("Route - Players per team:", teams.map((t: any) => t.name + ": " + t.players?.length));

    const allPlayers = teams.flatMap((team: any) =>
      (team.players || []).map((p: any) => ({ ...p, team }))
    );

    console.log("Route - Total players:", allPlayers.length);

    const playersWithStats = await Promise.allSettled(
      allPlayers.map(async (player: any) => {
        const stats = await getPlayerStats(player.id);
        return mapPlayerFromGrid({ ...player, stats });
      })
    );

    const players = playersWithStats
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return NextResponse.json({
      players,
      teams: teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        acronym: t.nameShortened,
        color: t.colorPrimary,
        logo: t.logoUrl,
        players_count: t.players?.length,
      })),
    });
  } catch (error) {
    console.error("GRID route error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar jogadores", details: String(error) },
      { status: 500 }
    );
  }
}