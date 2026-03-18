"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MOCK_PLAYERS, getFlagEmoji, getRatingColor } from "@/lib/data/players";

interface SavedPlayer {
  id: number;
  name: string;
  nationality: string;
  role: string;
  price: number;
  rating: number;
  kd: number;
  adr: number;
  color: string;
  team: { name: string; color: string };
  stats: { headshot_percentage: number; kast: number };
  score?: number;
}

interface Lineup {
  players: SavedPlayer[];
  captain_id: number;
  tournament_name: string;
  status: "pending" | "active" | "finished";
}

const MOCK_STATUS: "pending" | "active" | "finished" = "active";

function calcScore(player: SavedPlayer, isCaptain: boolean): number {
  const kills = player.rating * 24;
  const deaths = (2 - player.kd) * 12;
  const adrBonus = (player.adr / 100) * 10;
  const base = kills * 10 - deaths * 4 + adrBonus;
  return Math.round(isCaptain ? base * 2 : base);
}

export default function ResultadoPage() {
  const params = useParams();
  const router = useRouter();
  const [lineup, setLineup] = useState<Lineup | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`lineup_${params.id}`);
    if (saved) {
      setLineup(JSON.parse(saved));
    }
  }, [params.id]);

  if (!lineup) {
    return (
      <div className="min-h-screen bg-[#090b0f] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Nenhum time encontrado para este torneio.</p>
          <button
            onClick={() => router.push(`/torneio`)}
            className="bg-[#39A900] text-black font-black px-6 py-3 rounded-xl"
          >
            Montar Time
          </button>
        </div>
      </div>
    );
  }

  const totalScore = lineup.players.reduce((acc, p) => {
    return acc + calcScore(p, p.id === lineup.captain_id);
  }, 0);

  const statusConfig = {
    pending: { label: "Aguardando início", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30" },
    active: { label: "Em andamento", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    finished: { label: "Finalizado", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  };

  const status = statusConfig[MOCK_STATUS];

  return (
    <div className="min-h-screen bg-[#090b0f] text-white">
      {/* Header */}
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
              <p className="text-xs text-zinc-500">Fase 1</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${status.bg} ${status.border} ${status.color}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${MOCK_STATUS === "active" ? "animate-pulse bg-orange-400" : MOCK_STATUS === "finished" ? "bg-emerald-400" : "bg-zinc-400"}`} />
            {status.label}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Score hero */}
        <div className="text-center mb-10">
          {MOCK_STATUS === "pending" ? (
            <>
              <p className="text-zinc-500 text-sm uppercase tracking-widest mb-2">Seu time está confirmado!</p>
              <h1 className="text-5xl font-black text-white mb-2">Aguardando</h1>
              <p className="text-zinc-500">O torneio ainda não começou. Boa sorte! 🍀</p>
            </>
          ) : (
            <>
              <p className="text-zinc-500 text-sm uppercase tracking-widest mb-2">Pontuação total</p>
              <h1 className="text-7xl font-black text-[#39A900] mb-2">{totalScore}</h1>
              <p className="text-zinc-500">pontos acumulados</p>
            </>
          )}
        </div>

        {/* Ranking mock */}
        {MOCK_STATUS !== "pending" && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#39A900]/10 border border-[#39A900]/20 flex items-center justify-center font-black text-2xl text-[#39A900]">
                #
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Sua posição</p>
                <p className="font-black text-white text-2xl">12º lugar</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Participantes</p>
              <p className="font-black text-white">1.247</p>
            </div>
            <button
              onClick={() => router.push("/ranking")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
            >
              Ver ranking completo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}

        {/* Players */}
        <h2 className="text-xl font-black mb-4">Seu Time</h2>
        <div className="grid grid-cols-1 gap-3 mb-8">
          {lineup.players.map((player) => {
            const isCaptain = player.id === lineup.captain_id;
            const score = calcScore(player, isCaptain);
            const ratingColor = getRatingColor(player.rating);

            return (
              <div
                key={player.id}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-all"
                style={{
                  background: `linear-gradient(135deg, ${player.color}10 0%, #0d1117 100%)`,
                  borderColor: `${player.color}30`,
                }}
              >
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl border-2 shrink-0"
                  style={{ backgroundColor: `${player.color}20`, borderColor: `${player.color}40`, color: player.color }}
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
                    { label: "RAT", value: player.rating.toFixed(2), color: ratingColor },
                    { label: "K/D", value: player.kd.toFixed(2), color: "white" },
                    { label: "ADR", value: player.adr.toFixed(1), color: "white" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                      <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Score */}
                {MOCK_STATUS !== "pending" && (
                  <div className="text-right shrink-0">
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
          {MOCK_STATUS === "finished" && (
            <button
              onClick={() => router.push(`/torneio`)}
              className="flex-1 bg-[#39A900] hover:bg-[#45C500] text-black font-black py-4 rounded-2xl transition-all text-lg flex items-center justify-center gap-2"
            >
              Montar time para próxima fase
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
          {MOCK_STATUS === "pending" && (
            <button
              onClick={() => router.push(`/torneio`)}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl transition-all text-sm flex items-center justify-center gap-2"
            >
              Editar time
            </button>
          )}
          <button
            onClick={() => router.push("/ranking")}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white font-bold py-4 rounded-2xl transition-all text-sm"
          >
            Ver Ranking
          </button>
        </div>
      </div>
    </div>
  );
}