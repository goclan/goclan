import Link from "next/link";

async function getTournaments() {
  try {
    const res = await fetch("http://localhost:3000/api/tournaments", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { tournaments: [] };
    return res.json();
  } catch {
    return { tournaments: [] };
  }
}

const statusConfig = {
  "ABERTO": {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    pulse: true,
    color: "#39A900",
  },
  "EM ANDAMENTO": {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    dot: "bg-orange-400",
    pulse: true,
    color: "#FF6B00",
  },
  "FINALIZADO": {
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    text: "text-zinc-500",
    dot: "bg-zinc-500",
    pulse: false,
    color: "#666666",
  },
};

function formatDate(dateStr: string) {
  if (!dateStr) return "A definir";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function Dashboard() {
  const { tournaments } = await getTournaments();

  return (
    <div className="min-h-screen bg-[#090b0f] text-white">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-50 bg-[#090b0f]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#39A900] flex items-center justify-center">
              <span className="text-black font-black text-sm">G</span>
            </div>
            <span className="font-black text-xl tracking-tight">
              GO<span className="text-[#39A900]">CLAN</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Torneios", "Ranking", "Como Funciona", "Planos"].map((item) => (
              <a key={item} href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="text-sm bg-[#39A900] hover:bg-[#45C500] text-black font-black px-4 py-2 rounded-xl transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[#39A900] text-sm font-semibold tracking-widest uppercase mb-2">
              Fantasy CS2
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Torneios
              <br />
              <span className="text-zinc-500">Disponíveis</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-right">
            <div>
              <p className="text-2xl font-black text-[#39A900]">{tournaments.filter((t: any) => t.status === "EM ANDAMENTO").length}</p>
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

      {/* Tournament cards */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {tournaments.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">Nenhum torneio disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {tournaments.map((tournament: any) => {
              const status = statusConfig[tournament.status as keyof typeof statusConfig] || statusConfig["FINALIZADO"];
              return (
                <div
                  key={tournament.id}
                  className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
                >
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-3xl"
                    style={{ backgroundColor: status.color }}
                  />

                  {/* Top row */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {tournament.league?.image_url ? (
                        <img
                          src={tournament.league.image_url}
                          alt={tournament.league.name}
                          className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-zinc-400">
                          {tournament.name?.[0] || "?"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{tournament.name}</h3>
                        <p className="text-zinc-500 text-sm">{tournament.league?.name || "CS2"}</p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${status.bg} ${status.border} ${status.text}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
                      {tournament.status}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Premiação</p>
                      <p className="font-black text-white text-sm">
                        {tournament.prizepool || "A definir"}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Times</p>
                      <p className="font-black text-white">{tournament.teams?.length || "?"}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Jogo</p>
                      <p className="font-black text-[#39A900]">CS2</p>
                    </div>
                  </div>

                  {/* Date + CTA */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(tournament.begin_at)} → {formatDate(tournament.end_at)}
                    </div>

                    {tournament.status === "ABERTO" && (
                      <Link
                        href={`/torneio/${tournament.id}`}
                        className="flex items-center gap-2 bg-[#39A900] hover:bg-[#45C500] text-black text-sm font-black px-4 py-2 rounded-xl transition-colors"
                      >
                        Montar Time
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    )}
                    {tournament.status === "EM ANDAMENTO" && (
                      <Link
                        href={`/torneio/${tournament.id}`}
                        className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-black px-4 py-2 rounded-xl transition-colors"
                      >
                        Ver Ao Vivo
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    )}
                    {tournament.status === "FINALIZADO" && (
                      <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-500 text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                        Ver Resultado
                      </button>
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