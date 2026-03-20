import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getRankingData() {
  try {
    const supabase = await createClient();

    const { data: tournaments } = await supabase
      .from("tournaments")
      .select("id, name, status")
      .in("status", ["active", "upcoming", "finished"])
      .order("begin_at", { ascending: false })
      .limit(5);

    if (!tournaments || tournaments.length === 0) return { tournaments: [], rankingByTournament: {} };

    const rankingByTournament: Record<string, any> = {};

    for (const tournament of tournaments) {
      const { data: phases } = await supabase
        .from("phases")
        .select("id, name, phase_number, status")
        .eq("tournament_id", tournament.id)
        .order("phase_number");

      const { data: lineups } = await supabase
        .from("lineups")
        .select("id, user_id, phase_id, players, captain_id, total_score, status, phase")
        .eq("tournament_id", tournament.id);

      if (!lineups || lineups.length === 0) {
        rankingByTournament[tournament.id] = { phases: phases || [], byPhase: {}, overall: [] };
        continue;
      }

      const userIds = [...new Set(lineups.map((l: any) => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

      const byPhase: Record<string, any[]> = {};
      (phases || []).forEach((phase: any) => {
        const phaseLineups = lineups
          .filter((l: any) => l.phase_id === phase.id)
          .map((l: any) => ({
            user: profileMap[l.user_id] || { username: null, full_name: null },
            lineup_id: l.id,
            captain: l.players?.find((p: any) => p.id === l.captain_id),
            total_score: l.total_score || 0,
            status: l.status,
            players: l.players || [],
          }))
          .sort((a: any, b: any) => b.total_score - a.total_score);

        byPhase[phase.id] = phaseLineups;
      });

      const overallMap: Record<string, any> = {};
      lineups.forEach((l: any) => {
        const uid = l.user_id;
        if (!overallMap[uid]) {
          overallMap[uid] = {
            user: profileMap[uid] || { username: null, full_name: null },
            total_score: 0,
            phases_played: 0,
          };
        }
        overallMap[uid].total_score += l.total_score || 0;
        overallMap[uid].phases_played += 1;
      });

      const overall = Object.values(overallMap).sort((a: any, b: any) => b.total_score - a.total_score);

      rankingByTournament[tournament.id] = { phases: phases || [], byPhase, overall };
    }

    return { tournaments, rankingByTournament };
  } catch (e) {
    console.error(e);
    return { tournaments: [], rankingByTournament: {} };
  }
}

function getDisplayName(user: any): string {
  if (user?.full_name && !user.full_name.includes("@")) return user.full_name;
  if (user?.username && !user.username.startsWith("user_")) return user.username;
  return "Jogador";
}

function getMedalColor(position: number) {
  if (position === 1) return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", medal: "🥇" };
  if (position === 2) return { bg: "bg-zinc-400/10", border: "border-zinc-400/30", text: "text-zinc-300", medal: "🥈" };
  if (position === 3) return { bg: "bg-orange-700/10", border: "border-orange-700/30", text: "text-orange-600", medal: "🥉" };
  return { bg: "bg-white/[0.02]", border: "border-white/5", text: "text-zinc-400", medal: "" };
}

export default async function RankingPage() {
  const { tournaments, rankingByTournament } = await getRankingData();

  const defaultTournament = tournaments[0];
  const defaultData = defaultTournament ? rankingByTournament[defaultTournament.id] : null;

  return (
    <div className="min-h-screen bg-[#090b0f] text-white">
      <header className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-50 bg-[#090b0f]/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <a href="/">
              <img src="/images/Logo.png" alt="GoClan" className="h-8 w-auto" />
            </a>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Torneios", "Ranking", "Como Funciona", "Planos"].map((item) => (
              <a key={item} href="#" className={`text-sm transition-colors ${item === "Ranking" ? "text-white font-bold" : "text-zinc-400 hover:text-white"}`}>{item}</a>
            ))}
          </nav>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">Entrar</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="mb-10">
          <p className="text-[#39A900] text-sm font-semibold tracking-widest uppercase mb-2">Classificação</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            Ranking<br /><span className="text-zinc-500">dos Torneios</span>
          </h1>
          {defaultTournament && (
            <p className="text-zinc-500 text-sm">{defaultTournament.name}</p>
          )}
        </div>

        {!defaultTournament || !defaultData ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg mb-2">Nenhum dado de ranking disponível.</p>
            <p className="text-sm">Os rankings aparecerão quando as partidas forem finalizadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Ranking Geral */}
            <div className="lg:col-span-1">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <h2 className="font-black">Ranking Geral</h2>
                  <span className="text-xs text-zinc-500 ml-auto">Somatória</span>
                </div>

                {defaultData.overall.length === 0 ? (
                  <div className="px-5 py-8 text-center text-zinc-500 text-sm">
                    Nenhuma pontuação ainda.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {defaultData.overall.map((entry: any, index: number) => {
                      const { bg, border, text, medal } = getMedalColor(index + 1);
                      const displayName = getDisplayName(entry.user);
                      return (
                        <div key={index} className={`flex items-center gap-3 px-5 py-3 ${index < 3 ? bg : ""} transition-all`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${bg} ${border} ${text}`}>
                            {medal || `#${index + 1}`}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black shrink-0 overflow-hidden">
                            {entry.user?.avatar_url
                              ? <img src={entry.user.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
                              : displayName.slice(0, 2).toUpperCase()
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{displayName}</p>
                            <p className="text-[10px] text-zinc-500">{entry.phases_played} fase{entry.phases_played !== 1 ? "s" : ""}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-black text-sm ${index === 0 ? "text-yellow-400" : "text-[#39A900]"}`}>
                              {entry.total_score}
                            </p>
                            <p className="text-[10px] text-zinc-500">pts</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Ranking por Fase */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {defaultData.phases.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-8 text-center text-zinc-500 text-sm">
                  Nenhuma fase cadastrada.
                </div>
              ) : (
                defaultData.phases.map((phase: any) => {
                  const phaseRanking = defaultData.byPhase[phase.id] || [];
                  const isActive = phase.status === "active";
                  const isPending = phase.status === "pending";
                  const hasParticipants = phaseRanking.length > 0;

                  return (
                    <div key={phase.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-orange-400 animate-pulse" : isPending && hasParticipants ? "bg-[#39A900] animate-pulse" : "bg-zinc-600"}`} />
                        <h3 className="font-black">{phase.name}</h3>
                        {isActive && (
                          <span className="text-xs bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                            Ao Vivo
                          </span>
                        )}
                        {isPending && hasParticipants && (
                          <span className="text-xs bg-[#39A900]/10 border border-[#39A900]/20 text-[#39A900] px-2 py-0.5 rounded-full font-bold">
                            Aberta
                          </span>
                        )}
                        {phase.status === "finished" && (
                          <span className="text-xs bg-zinc-500/10 border border-zinc-500/30 text-zinc-500 px-2 py-0.5 rounded-full font-bold">
                            Finalizada
                          </span>
                        )}
                        <span className="text-xs text-zinc-500 ml-auto">
                          {phaseRanking.length} participante{phaseRanking.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {phaseRanking.length === 0 ? (
                        <div className="px-5 py-6 text-center text-zinc-500 text-sm">
                          Nenhum time cadastrado nessa fase ainda.
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {phaseRanking.map((entry: any, index: number) => {
                            const { bg, border, text, medal } = getMedalColor(index + 1);
                            const displayName = getDisplayName(entry.user);
                            const captainName = entry.captain?.name || "—";

                            return (
                              <div key={entry.lineup_id} className={`flex items-center gap-3 px-5 py-3 ${index < 3 && entry.total_score > 0 ? bg : ""} transition-all`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${index < 3 && entry.total_score > 0 ? `${bg} ${border} ${text}` : "bg-white/5 border-white/10 text-zinc-500"}`}>
                                  {index < 3 && entry.total_score > 0 ? medal : `#${index + 1}`}
                                </div>

                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black shrink-0 overflow-hidden">
                                  {entry.user?.avatar_url
                                    ? <img src={entry.user.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
                                    : displayName.slice(0, 2).toUpperCase()
                                  }
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{displayName}</p>
                                  <p className="text-[10px] text-zinc-500 truncate">
                                    Cap: <span className="text-zinc-400">{captainName}</span>
                                    {" • "}{entry.players.length} jogadores
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  {entry.total_score > 0 ? (
                                    <>
                                      <p className={`font-black text-sm ${index === 0 ? "text-yellow-400" : "text-[#39A900]"}`}>
                                        {entry.total_score}
                                      </p>
                                      <p className="text-[10px] text-zinc-500">pts</p>
                                    </>
                                  ) : (
                                    <span className="text-xs text-zinc-600 bg-white/5 px-2 py-1 rounded-lg">
                                      Aguardando
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}