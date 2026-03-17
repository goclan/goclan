import { NextRequest, NextResponse } from "next/server";
import {
  getTournaments,
  getUpcomingTournaments,
  getPastTournaments,
} from "@/lib/api/pandascore";

export async function GET(request: NextRequest) {
  try {
    const [running, upcoming, past] = await Promise.all([
      getTournaments(),
      getUpcomingTournaments(),
      getPastTournaments(),
    ]);

    const mapStatus = (tournament: any, status: string) => ({
      id: tournament.id,
      name: tournament.name,
      full_name: tournament.full_name || tournament.name,
      status,
      begin_at: tournament.begin_at,
      end_at: tournament.end_at,
      prizepool: tournament.prizepool,
      league: tournament.league,
      serie: tournament.serie,
      teams: tournament.teams || [],
    });

    const tournaments = [
      ...running.map((t: any) => mapStatus(t, "EM ANDAMENTO")),
      ...upcoming.map((t: any) => mapStatus(t, "ABERTO")),
      ...past.map((t: any) => mapStatus(t, "FINALIZADO")),
    ];

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error("PandaScore error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar torneios" },
      { status: 500 }
    );
  }
}
