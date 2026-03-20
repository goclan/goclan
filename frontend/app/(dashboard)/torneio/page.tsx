"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HoloCard from "@/components/card/HoloCard";
import { createClient } from "@/lib/supabase/client";

const BUDGET = 1000;
const MAX_PER_TEAM = 2;
const MAX_PLAYERS = 5;

const FLAGS: Record<string, string> = {
  BR: "🇧🇷", UA: "🇺🇦", FR: "🇫🇷", RU: "🇷🇺", DK: "🇩🇰",
  DE: "🇩🇪", PT: "🇵🇹", KZ: "🇰🇿", PL: "🇵🇱", FI: "🇫🇮",
  MN: "🇲🇳", CS: "🇷🇸", HR: "🇭🇷", EE: "🇪🇪", SE: "🇸🇪",
  LV: "🇱🇻", RO: "🇷🇴", XK: "🏳️", IL: "🇮🇱", ES: "🇪🇸",
  GB: "🇬🇧", CA: "🇨🇦", CZ: "🇨🇿", US: "🇺🇸",
};

function getHoloTier(price: number): string {
  if (price >= 290) return "prisma";
  if (price >= 260) return "galaxy";
  if (price >= 220) return "aurora";
  if (price >= 180) return "chrome";
  if (price >= 150) return "matte";
  return "none";
}

interface Player {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  nationality: string;
  role: string;
  price: number;
  image_url: string | null;
  team_id: string;
  teams: {
    id: string;
    name: string;
    acronym: string;
    color: string;
  };
  player_stats: {
    rating: number;
    kd_ratio: number;
    adr: number;
    headshot_percentage: number;
    kast: number;
  }[];
}

interface Match {
  id: string;
  team_a_id: string;
  team_b_id: string;
  status: string;
  team_a: { id: string; name: string; acronym: string; color: string };
  team_b: { id: string; name: string; acronym: string; color: string };
}

function MontarTimeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tournamentId = searchParams.get("tournament") || "";
  const tournamentName = searchParams.get("name") || "Torneio";

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [captain, setCaptain] = useState<string | null>(null);
  const [filterTeam, setFilterTeam] = useState("TODOS");
  const [filterTier, setFilterTier] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [mvpPick, setMvpPick] = useState<string | null>(null);
  const [conePick, setConePick] = useState<string | null>(null);
  const [bracket, setBracket] = useState<Record<string, { winner: string; score: string }>>({});

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: playersData } = await supabase
        .from("players")
        .select("*, teams(id, name, acronym, color), player_stats(rating, kd_ratio, adr, headshot_percentage, kast)")
        .eq("is_active", true)
        .order("name");

      if (playersData) {
        setPlayers(playersData as any);
        const uniqueTeams = [...new Set(playersData.map((p: any) => p.teams?.name).filter(Boolean))];
        setTeams(uniqueTeams as string[]);
      }

      if (tournamentId) {
        const { data: phaseData } = await supabase
          .from("phases")
          .select("id, status")
          .eq("tournament_id", tournamentId)
          .in("status", ["active", "pending"])
          .order("phase_number")
          .limit(1)
          .single();

        if (phaseData) {
          setActivePhaseId(phaseData.id);
          const { data: matchesData } = await supabase
            .from("matches")
            .select("*, team_a:team_a_id(id, name, acronym, color), team_b:team_b_id(id, name, acronym, color)")
            .eq("phase_id", phaseData.id)
            .order("status");
          if (matchesData) setMatches(matchesData as any);
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [tournamentId]);

  const getPlayerStats = (player: Player) => {
    const stats = player.player_stats?.[0];
    return {
      rating: stats?.rating || 1.00,
      kd_ratio: stats?.kd_ratio || 1.00,
      adr: stats?.adr || 70,
      headshot_percentage: stats?.headshot_percentage || 45,
      kast: stats?.kast || 70,
    };
  };

  const spent = selectedPlayers.reduce((acc, id) => {
    const p = players.find((p) => p.id === id);
    return acc + (p?.price || 0);
  }, 0);
  const remaining = BUDGET - spent;

  const teamCount = (teamName: string) =>
    selectedPlayers.filter(
      (id) => players.find((p) => p.id === id)?.teams?.name === teamName
    ).length;

  const canSelect = (player: Player) => {
    if (selectedPlayers.includes(player.id)) return true;
    if (selectedPlayers.length >= MAX_PLAYERS) return false;
    if (remaining < player.price) return false;
    if (teamCount(player.teams?.name) >= MAX_PER_TEAM) return false;
    return true;
  };

  const togglePlayer = (player: Player) => {
    if (selectedPlayers.includes(player.id)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== player.id));
      if (captain === player.id) setCaptain(null);
    } else if (canSelect(player)) {
      setSelectedPlayers([...selectedPlayers, player.id]);
    }
  };

  const randomTeam = () => {
    let attempts = 0;
    const maxAttempts = 50;
    while (attempts < maxAttempts) {
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      const picked: Player[] = [];
      const teamCounts: Record<string, number> = {};
      let budget = BUDGET;
      for (const player of shuffled) {
        if (picked.length >= MAX_PLAYERS) break;
        const team = player.teams?.name;
        if ((teamCounts[team] || 0) >= MAX_PER_TEAM) continue;
        if (player.price > budget) continue;
        picked.push(player);
        teamCounts[team] = (teamCounts[team] || 0) + 1;
        budget -= player.price;
      }
      if (picked.length === MAX_PLAYERS) {
        setSelectedPlayers(picked.map((p) => p.id));
        const cap = picked.reduce((a, b) =>
          getPlayerStats(a).rating > getPlayerStats(b).rating ? a : b
        );
        setCaptain(cap.id);
        return;
      }
      attempts++;
    }
  };

  const handleConfirm = async () => {
    if (selectedPlayers.length !== MAX_PLAYERS || !captain) return;
    setShowModal(true);
    setModalStep(1);
  };

  const handleSaveLineup = async () => {
    setConfirming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/torneio?tournament=${tournamentId}&name=${encodeURIComponent(tournamentName)}`);
        return;
      }

      const selectedData = selectedPlayers.map((id) => {
        const p = players.find((p) => p.id === id);
        const stats = getPlayerStats(p!);
        return {
          id: p?.id,
          name: p?.name,
          nationality: p?.nationality,
          role: p?.role,
          price: p?.price,
          image_url: p?.image_url || null,
          team: p?.teams,
          stats,
        };
      });

      const { data, error } = await supabase
        .from("lineups")
        .insert({
          user_id: user.id,
          tournament_id: tournamentId,
          phase_id: activePhaseId,
          tournament_name: tournamentName,
          players: selectedData,
          captain_id: captain,
          mvp_pick_id: mvpPick,
          cone_pick_id: conePick,
          bracket_picks: Object.keys(bracket).length > 0 ? bracket : null,
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

  const filtered = players.filter((p) => {
    if (filterTeam !== "TODOS" && p.teams?.name !== filterTeam) return false;
    if (filterTier !== "TODOS" && getHoloTier(p.price) !== filterTier) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#39A900]/30 border-t-[#39A900] rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Carregando jogadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0f] text-white">

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                {[
                  { step: 1, label: "MVP", icon: "⭐" },
                  { step: 2, label: "Cone", icon: "🐔" },
                  { step: 3, label: "Chaveamento", icon: "🏆" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      modalStep === s.step ? "bg-[#39A900] text-black" :
                      modalStep > s.step ? "bg-[#39A900]/20 text-[#39A900]" :
                      "bg-white/5 text-zinc-500"
                    }`}>
                      {modalStep > s.step ? "✓" : s.icon}
                    </div>
                    <span className={`text-xs font-bold hidden sm:block ${modalStep === s.step ? "text-white" : "text-zinc-500"}`}>
                      {s.label}
                    </span>
                    {s.step < 3 && <div className="w-6 h-px bg-white/10 mx-1" />}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors text-lg">✕</button>
            </div>

            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              {modalStep === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-lg">Escolha o MVP da rodada</h3>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">PRO</span>
                  </div>
                  <p className="text-zinc-500 text-sm mb-5">Quem você acha que vai ser o melhor jogador dessa fase?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {players.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setMvpPick(mvpPick === player.id ? null : player.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                          mvpPick === player.id ? "bg-yellow-500/10 border-yellow-500/40 text-white" : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/5">
                          {player.image_url
                            ? <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xs font-black text-zinc-400">{player.name.slice(0, 2).toUpperCase()}</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">{player.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{player.teams?.acronym}</p>
                        </div>
                        {mvpPick === player.id && <span className="ml-auto text-yellow-400 shrink-0">⭐</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modalStep === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-lg">Escolha o Cone da rodada</h3>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">PRO</span>
                  </div>
                  <p className="text-zinc-500 text-sm mb-5">Quem você acha que vai ser o pior jogador dessa fase? 🐔</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {players.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setConePick(conePick === player.id ? null : player.id)}
                        disabled={player.id === mvpPick}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                          player.id === mvpPick ? "opacity-30 cursor-not-allowed bg-white/5 border-white/5" :
                          conePick === player.id ? "bg-red-500/10 border-red-500/40 text-white" :
                          "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/5">
                          {player.image_url
                            ? <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xs font-black text-zinc-400">{player.name.slice(0, 2).toUpperCase()}</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">{player.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{player.teams?.acronym}</p>
                        </div>
                        {conePick === player.id && <span className="ml-auto text-red-400 shrink-0">🐔</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modalStep === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-lg">Chaveamento da fase</h3>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">PRO</span>
                  </div>
                  <p className="text-zinc-500 text-sm mb-5">Quem vai vencer cada confronto? Escolha o vencedor e o placar.</p>
                  <div className="flex flex-col gap-4">
                    {matches.map((match) => {
                      const pick = bracket[match.id];
                      return (
                        <div key={match.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          {match.status === "finished" && (
                            <p className="text-xs text-zinc-500 mb-3 text-center">Partida já finalizada</p>
                          )}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setBracket({ ...bracket, [match.id]: { winner: match.team_a_id, score: pick?.winner === match.team_a_id ? (pick.score || "2-0") : "2-0" } })}
                              className={`flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all ${pick?.winner === match.team_a_id ? "bg-[#39A900]/10 border-[#39A900]/40" : "bg-white/5 border-white/10 hover:border-white/20"}`}
                            >
                              <div className="w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: `${match.team_a?.color}30`, border: `1px solid ${match.team_a?.color}40` }} />
                              <span className="text-sm font-black truncate">{match.team_a?.acronym}</span>
                              {pick?.winner === match.team_a_id && <span className="ml-auto text-[#39A900] text-xs">✓</span>}
                            </button>
                            <span className="text-zinc-600 text-xs font-bold shrink-0">VS</span>
                            <button
                              onClick={() => setBracket({ ...bracket, [match.id]: { winner: match.team_b_id, score: pick?.winner === match.team_b_id ? (pick.score || "2-0") : "2-0" } })}
                              className={`flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all ${pick?.winner === match.team_b_id ? "bg-[#39A900]/10 border-[#39A900]/40" : "bg-white/5 border-white/10 hover:border-white/20"}`}
                            >
                              <div className="w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: `${match.team_b?.color}30`, border: `1px solid ${match.team_b?.color}40` }} />
                              <span className="text-sm font-black truncate">{match.team_b?.acronym}</span>
                              {pick?.winner === match.team_b_id && <span className="ml-auto text-[#39A900] text-xs">✓</span>}
                            </button>
                          </div>
                          {pick?.winner && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-xs text-zinc-500">Placar:</span>
                              {["2-0", "2-1"].map((score) => (
                                <button
                                  key={score}
                                  onClick={() => setBracket({ ...bracket, [match.id]: { ...pick, score } })}
                                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${pick.score === score ? "bg-[#39A900] text-black" : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"}`}
                                >
                                  {score}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={() => modalStep > 1 ? setModalStep(modalStep - 1) : setShowModal(false)}
                className="text-zinc-500 hover:text-white text-sm font-bold transition-colors"
              >
                ← {modalStep > 1 ? "Voltar" : "Cancelar"}
              </button>
              <div className="flex items-center gap-3">
                {modalStep < 3 && (
                  <button onClick={() => setModalStep(modalStep + 1)} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                    Pular →
                  </button>
                )}
                <button
                  onClick={() => { if (modalStep < 3) { setModalStep(modalStep + 1); } else { handleSaveLineup(); } }}
                  disabled={confirming}
                  className="bg-[#39A900] hover:bg-[#45C500] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black px-6 py-2.5 rounded-xl transition-all text-sm"
                >
                  {confirming ? "Salvando..." : modalStep < 3 ? "Próximo →" : "✓ Confirmar Time"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <p className={`font-black text-lg ${remaining < 100 ? "text-red-400" : "text-[#39A900]"}`}>{remaining} GS$</p>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterTier === t.key ? "text-black border-transparent" : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"}`}
                  style={filterTier === t.key ? { backgroundColor: t.color, borderColor: t.color } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-zinc-600 uppercase tracking-wider">Time:</span>
              {["TODOS", ...teams].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTeam(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTeam === t ? "bg-[#39A900] text-black" : "bg-white/5 border border-white/10 text-zinc-500 hover:text-white"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((player) => {
              const stats = getPlayerStats(player);
              return (
                <HoloCard
                  key={player.id}
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
                    rating: stats.rating,
                    kd: stats.kd_ratio,
                    adr: stats.adr,
                    color: player.teams?.color || "#39A900",
                    team: {
                      id: player.teams?.id || "",
                      name: player.teams?.name || "",
                      acronym: player.teams?.acronym || "",
                      image_url: null,
                      color: player.teams?.color || "#39A900",
                    },
                    stats: {
                      headshot_percentage: stats.headshot_percentage,
                      kast: stats.kast,
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
              );
            })}
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
                  style={{ width: `${(spent / BUDGET) * 100}%`, backgroundColor: remaining < 100 ? "#ef4444" : "#39A900" }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-zinc-600">Gasto</span>
                <span className={`text-xs font-bold ${remaining < 100 ? "text-red-400" : "text-[#39A900]"}`}>{remaining} GS$ restantes</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
                const playerId = selectedPlayers[i];
                const player = playerId ? players.find((p) => p.id === playerId) : null;
                const isCap = captain === playerId;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${player ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 border-dashed"}`}
                  >
                    {player ? (
                      <>
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm border shrink-0 cursor-pointer overflow-hidden"
                          style={{
                            backgroundColor: isCap ? "#FFD70020" : `${player.teams?.color}15`,
                            borderColor: isCap ? "#FFD70060" : `${player.teams?.color}30`,
                            color: isCap ? "#FFD700" : player.teams?.color,
                          }}
                          onClick={() => setCaptain(captain === player.id ? null : player.id)}
                        >
                          {player.image_url
                            ? <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
                            : isCap ? "⭐" : player.name.slice(0, 2).toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-sm text-white truncate">{player.name}</p>
                            {isCap && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 rounded-full">CAP</span>}
                          </div>
                          <p className="text-xs text-zinc-500">{FLAGS[player.nationality] || "🏳️"} {player.teams?.name} • {player.price} GS$</p>
                        </div>
                        <button onClick={() => togglePlayer(player)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 text-zinc-600">
                        <div className="w-10 h-10 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-lg shrink-0">{i + 1}</div>
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
                    const team = players.find((p) => p.id === id)?.teams?.name || "";
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

export default function MontarTime() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090b0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#39A900]/30 border-t-[#39A900] rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Carregando...</p>
        </div>
      </div>
    }>
      <MontarTimeInner />
    </Suspense>
  );
}