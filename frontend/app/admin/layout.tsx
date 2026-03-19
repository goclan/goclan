import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090b0f] text-white flex">
      <aside className="w-64 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">GoClan</p>
          <h1 className="font-black text-lg">Painel Admin</h1>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {[
            { href: "/admin", label: "Dashboard", icon: "📊" },
            { href: "/admin/times", label: "Times", icon: "🛡️" },
            { href: "/admin/jogadores", label: "Jogadores", icon: "👤" },
            { href: "/admin/torneios", label: "Torneios", icon: "🏆" },
            { href: "/admin/stats", label: "Inserir Stats", icon: "📝" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Voltar ao site
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}