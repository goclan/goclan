"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HoloCard from "@/components/card/HoloCard";
import { createClient } from "@/lib/supabase/client";
import { MOCK_PLAYERS, MOCK_TEAMS, getFlagEmoji } from "@/lib/data/players";

const BUDGET = 1000;
const MAX_PER_TEAM = 2;
const MAX_PLAYERS = 5;

function getHoloTier(price: number): string {
  if (price >= 290) return "prisma";
  if (price >= 260) return "galaxy";
  if (price >= 220) return "aurora";
  if (price >= 180) return "chrome";
  if (price >= 150) return "matte";
  return "none";
}

export default function MontarTime() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tournamentId = searchParams.get("tournament") || "";
  const tournamentName = searchParams.get("name") || "Torneio";

  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [captain, setCaptain] = useState<number | null>(null);
  const [filterTeam, setFilterTeam] = useState("TODOS");
  const [filterTier, setFilterTier] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState(false);

  const spent = selectedPlayers.reduce((acc, id) => {
    const p = MOCK_PLAYERS.find((p) => p.id === id);
    return acc + (p?.price || 0);
  }, 0);
  const remaining = BUDGET - spent;

  const teamCount = (teamName: string) =>
    selectedPlayers.filter(
      (id) => MOCK_PLAYERS.find((p) => p.id === id)?.team.name === teamName
    ).length;

  const canSelect = (player: typeof MOCK_PLAYERS[0]) => {
    if (selectedPlayers.includes(player.id)) return true;
    if (selectedPlayers.length >= MAX_PLAYERS) return false;
    if (remaining < player.price) return false;
    if (teamCount(player.team.name) >= MAX_PER_TEAM) return false;
    return true;
  };

  const togglePlayer = (player: typeof MOCK_PLAYERS[0]) => {
    if (selectedPlayers.includes(player.id)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== player.id));
      if (captain === player.id) setCaptain(null);
    } else if (canSelect(player)) {
      setSelectedPlayers([...selectedPlayers, player.id]);
    }
  };

  const randomTeam = useCallback(() => {
    const shuffled = [...MOCK_PLAYERS].sort(() => Math.random() - 0.5);
    const picked: typeof MOCK_PLAYERS = [];
    const teamCounts: Record<string, number> = {};
    let budget = BUDGET;

    for (const player of shuffled) {
      if (picked.length >= MAX_PLAYERS) break;
      const team = player.team.name;
      if ((teamCounts[team] || 0) >= MAX_PER_TEAM) continue;
      if (player.price > budget) continue;
      picked.push(player);
      teamCounts[team] = (teamCounts[team] || 0) + 1;
      budget -= player.price;
    }

    if (picked.length === MAX_PLAYERS) {
      setSelectedPlayers(picked.map((p) => p.id));
      const cap = picked.reduce((a, b) => (a.stats.rating > b.stats.rating ? a : b));
      setCaptain(cap.id);
    }
  }, []);

  const handleConfirm = async () => {
    if (selectedPlayers.length !== MAX_PLAYERS || !captain) return;
    setConfirming(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const selectedData = selectedPlayers.map((id) =>
        MOCK_PLAYERS.find((p) => p.id === id)
      );

      const { data, error } = await supabase
        .from("lineups")
        .insert({
          user_id: user.id,
          tournament_id: parseInt(tournamentId) || 0,
          tournament_name: tournamentName,
          players: selectedData,
          captain_id: captain,
          status: "pending",
          phase: 1,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/torneio/${tournamentId}/resultado?lineup=${data.id}`);
    } catch (e) {
      console.error("Erro ao confirmar time:", e);
      alert("Erro ao confirmar time. Tente novamente.");
    } finally {
      setConfirming(false);
    }
  };

  const filtered = MOCK_PLAYERS.filter((p) => {
    if (filterTeam !== "TODOS" && p.team.name !== filterTeam) return false;
    if (filterTier !== "TODOS" && getHoloTier(p.price) !== filterTier) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const uniqueTeams = MOCK_TEAMS.map((t) => t.name);
  const isReady = selectedPlayers.length === MAX_PLAYERS && !!captain;

  const tierFilters = [
    { key: "TODOS", label: "Todos", color: "#94a3b8" },
    { key: "prisma", label: "⭐⭐⭐⭐⭐", color: "#FFD700" },
    { key: "galaxy", label: "⭐⭐⭐⭐", color: "#A855F7" },
    { key: "aurora", label: "⭐⭐⭐", color: "#10B981" },
    { key: "chrome", label: "⭐⭐", color: "#94a3b8" },
    { key: "matte", label: "⭐", color: "#64748b" },
    { key: "none", label: "★", color: "#374151" },
  ];

  return (
    <div className="min-h-screen bg-[#090b0f] text-white">
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
              <span className="font-black text-white">{tournamentName}</span>
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
              onClick={handleConfirm}
              disabled={!isReady || confirming}
              className="bg-[#39A900] hover:bg-[#45C500] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black px-6 py-2.5 rounded-xl transition-all text-sm"
            >
              {confirming ? "Salvando..." : `Confirmar Time (${selectedPlayers.length}/5)`}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black">Escolha seus jogadores</h2>
              <p className="text-zinc-500 text-sm mt-1">Orçamento: {BUDGET} GS$ • Máx. 2 do mesmo time</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-zinc-500">Disponíveis</p>
                <p className="font-black text-white">{filtered.length}</p>
              </div>
              <button
                onClick={randomTeam}
                className="flex items-center gap-2 bg-white/5 hover:bg-[#39A900]/20 border border-white/10 hover:border-[#39A900]/40 text-zinc-400 hover:text-[#39A900] font-bold px-3 py-2 rounded-xl transition-all text-xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Aleatório
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <div className="relative">
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

            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-zinc-600 uppercase tracking-wider">Tier:</span>
              {tierFilters.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilterTier(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    filterTier === t.key ? "text-black border-transparent" : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"
                  }`}
                  style={filterTier === t.key ? { backgroundColor: t.color, borderColor: t.color } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-zinc-600 uppercase tracking-wider">Time:</span>
              {["TODOS", ...uniqueTeams].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTeam(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterTeam === t ? "bg-[#39A900] text-black" : "bg-white/5 border border-white/10 text-zinc-500 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((player) => (
              <HoloCard
                key={player.id}
                player={{
                  ...player,
                  id: String(player.id),
                  country: getFlagEmoji(player.nationality),
                  rating: player.stats.rating,
                  kd: player.stats.kd_ratio,
                  adr: player.stats.adr,
                  color: player.team.color,
                  team: {
                    ...player.team,
                    id: String(player.team.id),
                  },
                  stats: {
                    headshot_percentage: player.stats.headshot_percentage,
                    kast: player.stats.kast,
                  },
                }}
                isSelected={selectedPlayers.includes(player.id)}
                isCaptain={captain === player.id}
                isDisabled={!canSelect(player)}
                onClick={() => togglePlayer(player)}
                onCaptainClick={(e) => {
                  e.stopPropagation();
                  if (selectedPlayers.includes(player.id)) {
                    setCaptain(captain === player.id ? null : player.id);
                  }
                }}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-xl font-black mb-4">Seu Time</h2>

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
              <div className="flex justify-between mt-2">
                <span className="text-xs text-zinc-600">Gasto</span>
                <span className={`text-xs font-bold ${remaining < 100 ? "text-red-400" : "text-[#39A900]"}`}>
                  {remaining} GS$ restantes
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
                const playerId = selectedPlayers[i];
                const player = playerId ? MOCK_PLAYERS.find((p) => p.id === playerId) : null;
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
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm border shrink-0 cursor-pointer"
                          style={{
                            backgroundColor: isCap ? "#FFD70020" : `${player.team.color}15`,
                            borderColor: isCap ? "#FFD70060" : `${player.team.color}30`,
                            color: isCap ? "#FFD700" : player.team.color,
                          }}
                          onClick={() => setCaptain(captain === player.id ? null : player.id)}
                        >
                          {isCap ? "⭐" : player.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-sm text-white truncate">{player.name}</p>
                            {isCap && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 rounded-full">CAP</span>}
                          </div>
                          <p className="text-xs text-zinc-500">
                            {getFlagEmoji(player.nationality)} {player.team.name} • {player.price} GS$
                          </p>
                        </div>
                        <button
                          onClick={() => togglePlayer(player)}
                          className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 text-zinc-600">
                        <div className="w-10 h-10 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-lg shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-sm">Jogador {i + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedPlayers.length > 0 && !captain && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                <span className="text-yellow-400">⭐</span>
                <p className="text-xs text-yellow-400">Clique no avatar para definir o capitão!</p>
              </div>
            )}

            {selectedPlayers.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Times selecionados</p>
                {Object.entries(
                  selectedPlayers.reduce((acc, id) => {
                    const team = MOCK_PLAYERS.find((p) => p.id === id)?.team.name || "";
                    acc[team] = (acc[team] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([team, count]) => (
                  <div key={team} className="flex justify-between text-xs text-zinc-400 py-0.5">
                    <span>{team}</span>
                    <span className={count >= MAX_PER_TEAM ? "text-orange-400" : ""}>{count}/2</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!isReady || confirming}
              className="w-full bg-[#39A900] hover:bg-[#45C500] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black py-3.5 rounded-xl transition-all text-sm"
            >
              {confirming ? "Salvando time..." :
                selectedPlayers.length !== MAX_PLAYERS ? `Selecione mais ${MAX_PLAYERS - selectedPlayers.length} jogador(es)` :
                !captain ? "⭐ Escolha um capitão" :
                "✓ Confirmar Time"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}