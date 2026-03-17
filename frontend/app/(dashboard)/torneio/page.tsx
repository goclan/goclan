"use client";

import { useState } from "react";
import HoloCard from "@/components/card/HoloCard";

const players = [
  { id: 1, name: "KSCERATO", team: "FURIA", country: "🇧🇷", role: "Rifler", price: 280, rating: 1.21, kd: 1.35, adr: 78.4, color: "#FF6B00" },
  { id: 2, name: "FalleN", team: "FURIA", country: "🇧🇷", role: "AWPer", price: 260, rating: 1.15, kd: 1.22, adr: 74.1, color: "#FF6B00" },
  { id: 3, name: "chelo", team: "FURIA", country: "🇧🇷", role: "Rifler", price: 210, rating: 1.08, kd: 1.12, adr: 71.2, color: "#FF6B00" },
  { id: 4, name: "skullz", team: "FURIA", country: "🇧🇷", role: "Support", price: 190, rating: 1.04, kd: 1.08, adr: 68.5, color: "#FF6B00" },
  { id: 5, name: "yuurih", team: "FURIA", country: "🇧🇷", role: "Rifler", price: 240, rating: 1.18, kd: 1.28, adr: 76.3, color: "#FF6B00" },
  { id: 6, name: "s1mple", team: "NAVI", country: "🇺🇦", role: "AWPer", price: 300, rating: 1.38, kd: 1.52, adr: 89.1, color: "#FFD700" },
  { id: 7, name: "b1t", team: "NAVI", country: "🇺🇦", role: "Rifler", price: 220, rating: 1.12, kd: 1.18, adr: 72.8, color: "#FFD700" },
  { id: 8, name: "electronic", team: "NAVI", country: "🇷🇺", role: "Rifler", price: 235, rating: 1.16, kd: 1.24, adr: 75.1, color: "#FFD700" },
  { id: 9, name: "karrigan", team: "FaZe", country: "🇩🇰", role: "IGL", price: 195, rating: 1.02, kd: 1.05, adr: 65.4, color: "#00D4FF" },
  { id: 10, name: "ropz", team: "FaZe", country: "🇪🇪", role: "Rifler", price: 270, rating: 1.24, kd: 1.38, adr: 80.2, color: "#00D4FF" },
  { id: 11, name: "broky", team: "FaZe", country: "🇱🇻", role: "AWPer", price: 255, rating: 1.19, kd: 1.31, adr: 77.6, color: "#00D4FF" },
  { id: 12, name: "ZywOo", team: "Vitality", country: "🇫🇷", role: "AWPer", price: 295, rating: 1.35, kd: 1.48, adr: 87.3, color: "#8B5CF6" },
];

const BUDGET = 1000;
const MAX_PER_TEAM = 2;
const MAX_PLAYERS = 5;

export default function MontarTime() {
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [captain, setCaptain] = useState<number | null>(null);
  const [filter, setFilter] = useState("TODOS");
  const [search, setSearch] = useState("");

  const spent = selectedPlayers.reduce((acc, id) => {
    const p = players.find((p) => p.id === id);
    return acc + (p?.price || 0);
  }, 0);
  const remaining = BUDGET - spent;

  const teamCount = (team: string) =>
    selectedPlayers.filter((id) => players.find((p) => p.id === id)?.team === team).length;

  const canSelect = (player: typeof players[0]) => {
    if (selectedPlayers.includes(player.id)) return true;
    if (selectedPlayers.length >= MAX_PLAYERS) return false;
    if (remaining < player.price) return false;
    if (teamCount(player.team) >= MAX_PER_TEAM) return false;
    return true;
  };

  const togglePlayer = (player: typeof players[0]) => {
    if (selectedPlayers.includes(player.id)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== player.id));
      if (captain === player.id) setCaptain(null);
    } else if (canSelect(player)) {
      setSelectedPlayers([...selectedPlayers, player.id]);
    }
  };

  const teams = [...new Set(players.map((p) => p.team))];
  const filtered = players.filter((p) => {
    if (filter !== "TODOS" && p.team !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#090b0f] text-white">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-50 bg-[#090b0f]/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Torneios
            </a>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <span className="font-black text-white">ESL Pro League S23</span>
              <span className="ml-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">ABERTO</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Saldo restante</p>
              <p className={`font-black text-lg ${remaining < 100 ? "text-red-400" : "text-[#39A900]"}`}>
                {remaining} GS$
              </p>
            </div>
            <button
              disabled={selectedPlayers.length !== MAX_PLAYERS}
              className="bg-[#39A900] hover:bg-[#45C500] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black px-6 py-2.5 rounded-xl transition-all text-sm"
            >
              Confirmar Time ({selectedPlayers.length}/5)
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left — player selection */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">Escolha seus jogadores</h2>
            <p className="text-zinc-500 text-sm">Máx. 2 do mesmo time</p>
          </div>

          {/* Search and filters */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar jogador..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50 transition-all"
              />
            </div>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              {["TODOS", ...teams].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === t ? "bg-[#39A900] text-black" : "text-zinc-500 hover:text-white"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Player cards grid — usando HoloCard */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((player) => (
              <HoloCard
                key={player.id}
                player={player}
                isSelected={selectedPlayers.includes(player.id)}
                isCaptain={captain === player.id}
                isDisabled={!canSelect(player)}
                onClick={() => togglePlayer(player)}
                onCaptainClick={(e) => {
                  e.stopPropagation();
                  setCaptain(captain === player.id ? null : player.id);
                }}
              />
            ))}
          </div>
        </div>

        {/* Right — selected team */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-xl font-black mb-4">Seu Time</h2>

            {/* Budget bar */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Orçamento</span>
                <span className="text-xs font-bold text-zinc-400">{spent} / {BUDGET} GS$</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(spent / BUDGET) * 100}%`,
                    backgroundColor: remaining < 100 ? "#ef4444" : "#39A900",
                  }}
                />
              </div>
            </div>

            {/* Player slots */}
            <div className="flex flex-col gap-3 mb-6">
              {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
                const playerId = selectedPlayers[i];
                const player = playerId ? players.find((p) => p.id === playerId) : null;
                const isCap = captain === playerId;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      player ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 border-dashed"
                    }`}
                  >
                    {player ? (
                      <>
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm border"
                          style={{
                            backgroundColor: `${player.color}15`,
                            borderColor: `${player.color}30`,
                            color: player.color,
                          }}
                        >
                          {player.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-sm text-white truncate">{player.name}</p>
                            {isCap && <span className="text-yellow-400 text-xs">⭐</span>}
                          </div>
                          <p className="text-xs text-zinc-500">{player.team} • {player.price} GS$</p>
                        </div>
                        <button
                          onClick={() => togglePlayer(player)}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 text-zinc-600">
                        <div className="w-10 h-10 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-lg">
                          {i + 1}
                        </div>
                        <span className="text-sm">Jogador {i + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Captain reminder */}
            {selectedPlayers.length > 0 && !captain && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                <span className="text-yellow-400">⭐</span>
                <p className="text-xs text-yellow-400">Escolha um capitão! Ele pontua em dobro.</p>
              </div>
            )}

            <button
              disabled={selectedPlayers.length !== MAX_PLAYERS}
              className="w-full bg-[#39A900] hover:bg-[#45C500] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black py-3.5 rounded-xl transition-all text-sm"
            >
              {selectedPlayers.length === MAX_PLAYERS
                ? captain ? "✓ Confirmar Time" : "Escolha um capitão"
                : `Selecione mais ${MAX_PLAYERS - selectedPlayers.length} jogador(es)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}