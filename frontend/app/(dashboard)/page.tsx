import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function getTournaments() {
  try {
    const supabase = await createClient();

    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("begin_at", { ascending: false });

    if (error) throw error;
    if (!tournaments) return [];

    // Busca todas as fases com número total de fases por torneio
    const { data: allPhases } = await supabase
      .from("phases")
      .select("id, tournament_id, status, name, phase_number")
      .order("phase_number");

    // Mapeia fase ativa e total de fases por torneio
    const phasesByTournament: Record<string, any[]> = {};
    (allPhases || []).forEach((p: any) => {
      if (!phasesByTournament[p.tournament_id]) phasesByTournament[p.tournament_id] = [];
      phasesByTournament[p.tournament_id].push(p);
    });

    // Busca contagem de lineups por fase ativa
    const activePhaseIds = (allPhases || [])
      .filter((p: any) => p.status === "active" || p.status === "pending")
      .map((p: any) => p.id);

    let lineupCountByPhase: Record<string, number> = {};
    if (activePhaseIds.length > 0) {
      const { data: lineups } = await supabase
        .from("lineups")
        .select("phase_id")
        .in("phase_id", activePhaseIds);

      (lineups || []).forEach((l: any) => {
        if (l.phase_id) {
          lineupCountByPhase[l.phase_id] = (lineupCountByPhase[l.phase_id] || 0) + 1;
        }
      });
    }

    return tournaments.map((t: any) => {
      const phases = phasesByTournament[t.id] || [];
      const totalPhases = phases.length;
      const activePhase = phases.find((p: any) => p.status === "active" || p.status === "pending");

      return {
        ...t,
        activePhase: activePhase || null,
        totalPhases,
        participants: activePhase ? (lineupCountByPhase[activePhase.id] || 0) : 0,
      };
    });
  } catch {
    return [];
  }
}

const statusConfig = {
  active: { label: "EM ANDAMENTO", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-400", pulse: true, color: "#FF6B00" },
  upcoming: { label: "ABERTO", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400", pulse: true, color: "#39A900" },
  finished: { label: "FINALIZADO", bg: "bg-zinc-500/10", border: "border-zinc-500/30", text: "text-zinc-500", dot: "bg-zinc-500", pulse: false, color: "#666666" },
};

function formatDate(dateStr: string) {
  if (!dateStr) return "A definir";
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function Dashboard() {
  const tournaments = await getTournaments();
  const active = tournaments.filter((t: any) => t.status === "active");

  return (
    <div className="min-h-screen bg-[#090b0f] text-white">
      <header className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-50 bg-[#090b0f]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/">
            <img src="/images/Logo.png" alt="GoClan" className="h-9 w-auto" />
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {["Torneios", "Ranking", "Como Funciona", "Planos"].map((item) => (
              <a key={item} href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">Entrar</Link>
            <Link href="/cadastro" className="text-sm bg-[#39A900] hover:bg-[#45C500] text-black font-black px-4 py-2 rounded-xl transition-colors">Criar conta</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[#39A900] text-sm font-semibold tracking-widest uppercase mb-2">Fantasy CS2</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Torneios<br /><span className="text-zinc-500">Disponíveis</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-right">
            <div>
              <p className="text-2xl font-black text-[#39A900]">{active.length}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Ao vivo agora</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-black">{tournaments.length}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Total de torneios</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        {tournaments.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg mb-2">Nenhum torneio disponível no momento.</p>
            <p className="text-sm">Cadastre torneios no <a href="/admin/torneios" className="text-[#39A900] hover:underline">painel admin</a>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map((tournament: any) => {
              const status = statusConfig[tournament.status as keyof typeof statusConfig] || statusConfig.finished;
              const encodedName = encodeURIComponent(tournament.name);
              const hasActivePhase = !!tournament.activePhase;
              const currentPhaseNumber = tournament.activePhase?.phase_number || 0;
              const totalPhases = tournament.totalPhases || 0;

              return (
                <div key={tournament.id} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-3xl" style={{ backgroundColor: status.color }} />

                  {/* Header do card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {tournament.image_url ? (
                        <img src={tournament.image_url} alt={tournament.name} className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-zinc-400">
                          {tournament.name?.[0] || "?"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{tournament.name}</h3>
                        <p className="text-zinc-500 text-sm">{tournament.full_name || "CS2 • Tier S"}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${status.bg} ${status.border} ${status.text}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
                      {status.label}
                    </div>
                  </div>

                  {/* Fase ativa com rodada e participantes */}
                  {hasActivePhase && (
                    <div className="mb-4 flex items-center justify-between bg-[#39A900]/10 border border-[#39A900]/20 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#39A900] animate-pulse" />
                        <p className="text-xs text-[#39A900] font-bold">{tournament.activePhase.name}</p>
                        {totalPhases > 0 && (
                          <span className="text-xs text-[#39A900]/60 font-bold">
                            • Rodada {currentPhaseNumber}/{totalPhases}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#39A900]/80">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-bold">{tournament.participants}</span>
                        <span className="text-[#39A900]/50">participantes</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Premiação</p>
                      <p className="font-black text-white text-sm">{tournament.prizepool || "A definir"}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Início</p>
                      <p className="font-black text-white text-sm">{formatDate(tournament.begin_at)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Jogo</p>
                      <p className="font-black text-[#39A900]">CS2</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(tournament.begin_at)} → {formatDate(tournament.end_at)}
                    </div>

                    {hasActivePhase && tournament.status !== "finished" && (
                      <Link
                        href={`/torneio?tournament=${tournament.id}&name=${encodedName}`}
                        className="flex items-center gap-2 bg-[#39A900] hover:bg-[#45C500] text-black text-sm font-black px-4 py-2 rounded-xl transition-colors"
                      >
                        Montar Time
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    )}

                    {tournament.status === "finished" && (
                      <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-500 text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                        Ver Resultado
                      </button>
                    )}

                    {!hasActivePhase && tournament.status !== "finished" && (
                      <span className="text-xs text-zinc-600 border border-white/5 px-3 py-2 rounded-xl">
                        Inscrições em breve
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}