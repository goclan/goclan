"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getFlagEmoji, getRatingColor } from "@/lib/data/players";

interface Player {
  id: number;
  name: string;
  nationality: string;
  role: string;
  price: number;
  team: { name: string; color: string };
  stats: { rating: number; kd_ratio: number; adr: number; headshot_percentage: number; kast: number };
}

interface Lineup {
  id: string;
  tournament_name: string;
  players: Player[];
  captain_id: number;
  total_score: number;
  status: "pending" | "active" | "finished";
  phase: number;
}

function calcScore(player: Player, isCaptain: boolean): number {
  const kills = player.stats.rating * 24;
  const deaths = (2 - player.stats.kd_ratio) * 12;
  const adrBonus = (player.stats.adr / 100) * 10;
  const base = kills * 10 - deaths * 4 + adrBonus;
  return Math.round(isCaptain ? base * 2 : base);
}

const statusConfig = {
  pending: {
    label: "Aguardando início",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    dot: "bg-zinc-400",
    pulse: false,
  },
  active: {
    label: "Em andamento",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    dot: "bg-orange-400",
    pulse: true,
  },
  finished: {
    label: "Finalizado",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
    pulse: false,
  },
};

export default function ResultadoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lineupId = searchParams.get("lineup");

  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLineup() {
      if (!lineupId) {
        setError("Lineup não encontrado.");
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("lineups")
          .select("*")
          .eq("id", lineupId)
          .single();

        if (error) throw error;
        setLineup(data);
      } catch (e) {
        setError("Erro ao carregar seu time.");
      } finally {
        setLoading(false);
      }
    }

    fetchLineup();
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
          <button
            onClick={() => router.push("/")}
            className="bg-[#39A900] text-black font-black px-6 py-3 rounded-xl"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[lineup.status];
  const totalScore = lineup.players.reduce((acc, p) => {
    return acc + calcScore(p, p.id === lineup.captain_id);
  }, 0);

  return (
    <div className="min-h-screen bg-[#090b0f] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#090b0f]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-zinc-500 hover:text-white transition-colors"
            >
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

      <div className="max-w-5xl mx-auto px-6 py-8">

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
              <h1 className="text-8xl font-black text-[#39A900] mb-3">{totalScore}</h1>
              <p className="text-zinc-500">pontos acumulados • Fase {lineup.phase}</p>
            </>
          )}
        </div>

        {/* Ranking card */}
        {lineup.status !== "pending" && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#39A900]/10 border border-[#39A900]/20 flex items-center justify-center font-black text-2xl text-[#39A900]">
                🏆
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Sua posição</p>
                <p className="font-black text-white text-3xl">—</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Participantes</p>
              <p className="font-black text-white text-xl">—</p>
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

        {/* Players */}
        <h2 className="text-xl font-black mb-4">Seu Time</h2>
        <div className="flex flex-col gap-3 mb-8">
          {lineup.players.map((player) => {
            const isCaptain = player.id === lineup.captain_id;
            const score = calcScore(player, isCaptain);
            const ratingColor = getRatingColor(player.stats.rating);

            return (
              <div
                key={player.id}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-all"
                style={{
                  background: `linear-gradient(135deg, ${player.team.color}08 0%, #0d1117 100%)`,
                  borderColor: `${player.team.color}25`,
                }}
              >
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl border-2 shrink-0"
                  style={{
                    backgroundColor: `${player.team.color}20`,
                    borderColor: `${player.team.color}40`,
                    color: player.team.color,
                  }}
                >
                  {player.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-white">{player.name}</p>
                    {isCaptain && (
                      <span className="text-[10px] bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full font-bold">
                        ⭐ CAPITÃO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {getFlagEmoji(player.nationality)} {player.team.name} • {player.role}
                  </p>
                </div>

                {/* Stats mini */}
                <div className="hidden md:flex items-center gap-4">
                  {[
                    { label: "RAT", value: player.stats.rating.toFixed(2), color: ratingColor },
                    { label: "K/D", value: player.stats.kd_ratio.toFixed(2), color: "white" },
                    { label: "ADR", value: player.stats.adr.toFixed(1), color: "white" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                      <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Score */}
                {lineup.status !== "pending" && (
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Pontos</p>
                    <p className="text-2xl font-black text-[#39A900]">{score}</p>
                    {isCaptain && <p className="text-[9px] text-yellow-400">×2 capitão</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          {lineup.status === "finished" && (
            <button
              onClick={() => router.push(`/?montar=true`)}
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