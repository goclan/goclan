import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: teamsCount },
    { count: playersCount },
    { count: tournamentsCount },
    { count: matchesCount },
  ] = await Promise.all([
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black">Dashboard</h2>
        <p className="text-zinc-500 text-sm mt-1">Visão geral do GoClan</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Times cadastrados", value: teamsCount || 0, icon: "🛡️", href: "/admin/times" },
          { label: "Jogadores cadastrados", value: playersCount || 0, icon: "👤", href: "/admin/jogadores" },
          { label: "Torneios cadastrados", value: tournamentsCount || 0, icon: "🏆", href: "/admin/torneios" },
          { label: "Partidas inseridas", value: matchesCount || 0, icon: "📝", href: "/admin/stats" },
        ].map((card) => (
          <a key={card.label} href={card.href} className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">{card.icon}</p>
            <p className="text-3xl font-black text-white">{card.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
          </a>
        ))}
      </div>
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <h3 className="font-black mb-4">Próximos passos</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: "Cadastrar times (FURIA, NAVI, FaZe, Vitality, G2)", href: "/admin/times", done: (teamsCount || 0) > 0 },
            { label: "Cadastrar jogadores com foto e stats", href: "/admin/jogadores", done: (playersCount || 0) > 0 },
            { label: "Cadastrar torneio ativo", href: "/admin/torneios", done: (tournamentsCount || 0) > 0 },
            { label: "Inserir stats pós-partida", href: "/admin/stats", done: (matchesCount || 0) > 0 },
          ].map((step) => (
            <a key={step.label} href={step.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
              <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 " + (step.done ? "bg-[#39A900] border-[#39A900]" : "border-zinc-600")}>
                {step.done && <span className="text-black text-xs font-black">✓</span>}
              </div>
              <span className={"text-sm " + (step.done ? "text-zinc-500 line-through" : "text-zinc-300")}>
                {step.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
