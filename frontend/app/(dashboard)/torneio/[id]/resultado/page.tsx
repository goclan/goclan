"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HoloCard from "@/components/card/HoloCard";

const FLAGS: Record<string, string> = {
  BR: "🇧🇷", UA: "🇺🇦", FR: "🇫🇷", RU: "🇷🇺", DK: "🇩🇰",
  DE: "🇩🇪", PT: "🇵🇹", KZ: "🇰🇿", PL: "🇵🇱", FI: "🇫🇮",
  MN: "🇲🇳", CS: "🇷🇸", HR: "🇭🇷", EE: "🇪🇪", SE: "🇸🇪",
  LV: "🇱🇻", RO: "🇷🇴", XK: "🏳️", IL: "🇮🇱", ES: "🇪🇸",
  GB: "🇬🇧", CA: "🇨🇦", CZ: "🇨🇿", US: "🇺🇸",
};

interface PlayerInLineup {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  nationality: string;
  role: string;
  price: number;
  image_url?: string | null;
  team: { id?: string; name: string; acronym?: string; color: string };
  stats: { rating: number; kd_ratio: number; adr: number; headshot_percentage: number; kast: number };
}

interface PlayerFull {
  id: string;
  name: string;
  nationality: string;
  image_url: string | null;
  teams: { name: string; color: string };
}

interface BracketPick {
  winner: string;
  score: string;
}

interface Lineup {
  id: string;
  tournament_id: string;
  tournament_name: string;
  players: PlayerInLineup[];
  captain_id: string;
  mvp_pick_id: string | null;
  cone_pick_id: string | null;
  bracket_picks: Record<string, BracketPick> | null;
  total_score: number | null;
  status: "pending" | "active" | "finished";
  phase: number;
  phase_id: string | null;
  user_id: string;
}

interface Match {
  id: string;
  team_a_id: string;
  team_b_id: string;
  status: string;
  team_a: { id: string; name: string; acronym: string; color: string };
  team_b: { id: string; name: string; acronym: string; color: string };
}

const statusConfig = {
  pending: { label: "Aguardando início", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", dot: "bg-zinc-400", pulse: false },
  active: { label: "Em andamento", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "bg-orange-400", pulse: true },
  finished: { label: "Finalizado", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400", pulse: false },
};

export default function ResultadoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lineupId = searchParams.get("lineup");

  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerFull[]>([]);
  const [position, setPosition] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!lineupId) { setError("Lineup não encontrado."); setLoading(false); return; }

      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("lineups").select("*").eq("id", lineupId).single();
        if (error) throw error;
        setLineup(data);

        // Busca todos os jogadores para resolver MVP/Cone
        const { data: playersData } = await supabase
          .from("players")
          .select("id, name, nationality, image_url, teams(name, color)");
        if (playersData) setAllPlayers(playersData as any);

        // Busca partidas da fase
        if (data.phase_id) {
          const { data: matchesData } = await supabase
            .from("matches")
            .select("*, team_a:team_a_id(id, name, acronym, color), team_b:team_b_id(id, name, acronym, color)")
            .eq("phase_id", data.phase_id);
          if (matchesData) setMatches(matchesData as any);

          // Busca todos os lineups da mesma fase para calcular posição
          if (data.status !== "pending") {
            const { data: phaseLineups } = await supabase
              .from("lineups")
              .select("id, user_id, total_score")
              .eq("phase_id", data.phase_id)
              .order("total_score", { ascending: false });

            if (phaseLineups) {
              setTotalParticipants(phaseLineups.length);
              const pos = phaseLineups.findIndex((l: any) => l.id === lineupId);
              if (pos !== -1) setPosition(pos + 1);
            }
          }
        }
      } catch (e) {
        setError("Erro ao carregar seu time.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [lineupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#39A900]/30 border-t-[#39A900] rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Carregando seu time...</p>
        </div>
      </div>
    );
  }

  if (error || !lineup) {
    return (
      <div className="min-h-screen bg-[#090b0f] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">{error || "Lineup não encontrado."}</p>
          <button onClick={() => router.push("/")} className="bg-[#39A900] text-black font-black px-6 py-3 rounded-xl">Voltar ao início</button>
        </div>
      </div>
    );
  }

  const status = statusConfig[lineup.status];

  const resolvePlayer = (id: string | null): PlayerFull | null => {
    if (!id) return null;
    return allPlayers.find(p => p.id === id) || null;
  };

  const mvpPlayer = resolvePlayer(lineup.mvp_pick_id);
  const conePlayer = resolvePlayer(lineup.cone_pick_id);

  function getPositionLabel(pos: number): string {
    if (pos === 1) return "🥇 1º";
    if (pos === 2) return "🥈 2º";
    if (pos === 3) return "🥉 3º";
    return `#${pos}`;
  }

  function getPositionColor(pos: number): string {
    if (pos === 1) return "text-yellow-400";
    if (pos === 2) return "text-zinc-300";
    if (pos === 3) return "text-orange-500";
    return "text-white";
  }

  return (
    <div className="min-h-screen bg-[#090b0f] text-white">
      <header className="border-b border-white/5 bg-[#090b0f]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-zinc-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <p className="font-black text-white">{lineup.tournament_name}</p>
              <p className="text-xs text-zinc-500">Fase {lineup.phase}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${status.bg} ${status.border} ${status.color}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
            {status.label}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Score hero */}
        <div className="text-center mb-10">
          {lineup.status === "pending" ? (
            <>
              <p className="text-zinc-500 text-sm uppercase tracking-widest mb-3">Time confirmado!</p>
              <h1 className="text-5xl font-black text-white mb-3">Aguardando início</h1>
              <p className="text-zinc-500">O torneio ainda não começou. Boa sorte! 🍀</p>
            </>
          ) : (
            <>
              <p className="text-zinc-500 text-sm uppercase tracking-widest mb-3">Pontuação total</p>
              <h1 className="text-8xl font-black text-[#39A900] mb-3">{lineup.total_score ?? "—"}</h1>
              <p className="text-zinc-500">pontos acumulados • Fase {lineup.phase}</p>
            </>
          )}
        </div>

        {/* Ranking card */}
        {lineup.status !== "pending" && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#39A900]/10 border border-[#39A900]/20 flex items-center justify-center font-black text-2xl">🏆</div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Sua posição</p>
                <p className={`font-black text-3xl ${position ? getPositionColor(position) : "text-white"}`}>
                  {position ? getPositionLabel(position) : "—"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Participantes</p>
              <p className="font-black text-white text-xl">{totalParticipants || "—"}</p>
            </div>
            <button
              onClick={() => router.push("/ranking")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
            >
              Ver ranking
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}

        {/* Cards do time */}
        <h2 className="text-xl font-black mb-4">Seu Time</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {lineup.players.map((player) => {
            const isCaptain = player.id === lineup.captain_id;
            return (
              <div key={player.id} className="relative">
                {isCaptain && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                    ⭐ CAPITÃO
                  </div>
                )}
                <HoloCard
                  player={{
                    id: player.id,
                    name: player.name,
                    first_name: player.first_name,
                    last_name: player.last_name,
                    nationality: player.nationality,
                    role: player.role,
                    price: player.price,
                    image_url: player.image_url,
                    country: FLAGS[player.nationality] || "🏳️",
                    rating: player.stats.rating,
                    kd: player.stats.kd_ratio,
                    adr: player.stats.adr,
                    color: player.team.color,
                    team: {
                      id: player.team.id || "",
                      name: player.team.name,
                      acronym: player.team.acronym || player.team.name.slice(0, 3).toUpperCase(),
                      image_url: null,
                      color: player.team.color,
                    },
                    stats: {
                      headshot_percentage: player.stats.headshot_percentage,
                      kast: player.stats.kast,
                    },
                  }}
                  isSelected={false}
                  isCaptain={isCaptain}
                  isDisabled={false}
                  readOnly={true}
                  onClick={() => {}}
                  onCaptainClick={() => {}}
                />
              </div>
            );
          })}
        </div>

        {/* MVP e Cone */}
        {(lineup.mvp_pick_id || lineup.cone_pick_id) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {lineup.mvp_pick_id && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⭐</span>
                  <h3 className="font-black text-yellow-400">MVP da rodada</h3>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold ml-auto">PRO</span>
                </div>
                {mvpPlayer ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-yellow-500/30 shrink-0">
                      {mvpPlayer.image_url
                        ? <img src={mvpPlayer.image_url} alt={mvpPlayer.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm font-black text-zinc-400">{mvpPlayer.name.slice(0, 2).toUpperCase()}</div>
                      }
                    </div>
                    <div>
                      <p className="font-black text-white">{mvpPlayer.name}</p>
                      <p className="text-xs text-zinc-500">{FLAGS[mvpPlayer.nationality] || "🏳️"} {(mvpPlayer.teams as any)?.name}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">Não escolhido</p>
                )}
              </div>
            )}

            {lineup.cone_pick_id && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🐔</span>
                  <h3 className="font-black text-red-400">Cone da rodada</h3>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold ml-auto">PRO</span>
                </div>
                {conePlayer ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-red-500/30 shrink-0">
                      {conePlayer.image_url
                        ? <img src={conePlayer.image_url} alt={conePlayer.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm font-black text-zinc-400">{conePlayer.name.slice(0, 2).toUpperCase()}</div>
                      }
                    </div>
                    <div>
                      <p className="font-black text-white">{conePlayer.name}</p>
                      <p className="text-xs text-zinc-500">{FLAGS[conePlayer.nationality] || "🏳️"} {(conePlayer.teams as any)?.name}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">Não escolhido</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chaveamento */}
        {lineup.bracket_picks && matches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-black">Chaveamento</h2>
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">PRO</span>
            </div>
            <div className="flex flex-col gap-3">
              {matches.map((match) => {
                const pick = lineup.bracket_picks?.[match.id];
                if (!pick) return null;
                const winnerTeam = pick.winner === match.team_a_id ? match.team_a : match.team_b;
                const loserTeam = pick.winner === match.team_a_id ? match.team_b : match.team_a;
                return (
                  <div key={match.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: winnerTeam?.color }} />
                      <span className="font-black text-white text-sm">{winnerTeam?.acronym}</span>
                      <span className="text-xs font-black text-[#39A900] bg-[#39A900]/10 border border-[#39A900]/20 px-2 py-0.5 rounded-full">{pick.score}</span>
                      <span className="text-zinc-600 text-xs">vs</span>
                      <div className="w-3 h-3 rounded-full shrink-0 opacity-40" style={{ backgroundColor: loserTeam?.color }} />
                      <span className="text-zinc-500 text-sm">{loserTeam?.acronym}</span>
                    </div>
                    {match.status === "finished" && (
                      <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">Finalizada</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          {lineup.status === "finished" && (
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-[#39A900] hover:bg-[#45C500] text-black font-black py-4 rounded-2xl transition-all text-lg flex items-center justify-center gap-2"
            >
              Montar time para próxima fase
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
          {lineup.status === "pending" && (
            <button
              onClick={() => router.back()}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl transition-all text-sm"
            >
              ← Editar time
            </button>
          )}
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white font-bold py-4 rounded-2xl transition-all text-sm"
          >
            Ver outros torneios
          </button>
        </div>
      </div>
    </div>
  );
}