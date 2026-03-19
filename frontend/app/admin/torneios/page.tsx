"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Tournament {
  id: string;
  name: string;
  full_name: string;
  status: string;
  begin_at: string;
  end_at: string;
  prizepool: string;
  image_url: string;
}

export default function TorneiosPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    full_name: "",
    begin_at: "",
    end_at: "",
    prizepool: "",
    image_url: "",
  });

  const supabase = createClient();

  async function fetchTournaments() {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("begin_at", { ascending: false });
    setTournaments(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchTournaments(); }, []);

  function getAutoStatus(begin_at: string, end_at: string): string {
    const now = new Date();
    const begin = new Date(begin_at);
    const end = new Date(end_at);
    if (now < begin) return "upcoming";
    if (now > end) return "finished";
    return "active";
  }

  async function handleSave() {
    if (!form.name || !form.begin_at || !form.end_at) return;
    setSaving(true);

    const status = getAutoStatus(form.begin_at, form.end_at);

    const { error } = await supabase.from("tournaments").insert({
      name: form.name,
      full_name: form.full_name || form.name,
      begin_at: form.begin_at,
      end_at: form.end_at,
      prizepool: form.prizepool,
      image_url: form.image_url,
      status,
    });

    if (!error) {
      setForm({ name: "", full_name: "", begin_at: "", end_at: "", prizepool: "", image_url: "" });
      fetchTournaments();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este torneio?")) return;
    await supabase.from("tournaments").delete().eq("id", id);
    fetchTournaments();
  }

  async function handleRefreshStatus(tournament: Tournament) {
    const status = getAutoStatus(tournament.begin_at, tournament.end_at);
    await supabase.from("tournaments").update({ status }).eq("id", tournament.id);
    fetchTournaments();
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    upcoming: { label: "Em breve", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30" },
    active: { label: "Em andamento", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    finished: { label: "Finalizado", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  };

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black">Torneios</h2>
        <p className="text-zinc-500 text-sm mt-1">Cadastre os torneios Tier S. O status é calculado automaticamente pelas datas.</p>
      </div>

      {/* Formulário */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8">
        <h3 className="font-black mb-4">Novo Torneio</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Nome curto *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: BLAST Open Rotterdam"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Nome completo</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Ex: BLAST Open Rotterdam 2026"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Data de início *</label>
            <input
              type="datetime-local"
              value={form.begin_at}
              onChange={(e) => setForm({ ...form, begin_at: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Data de fim *</label>
            <input
              type="datetime-local"
              value={form.end_at}
              onChange={(e) => setForm({ ...form, end_at: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Premiação</label>
            <input
              type="text"
              value={form.prizepool}
              onChange={(e) => setForm({ ...form, prizepool: e.target.value })}
              placeholder="Ex: $500,000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">URL do logo</label>
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
        </div>

        {form.begin_at && form.end_at && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-zinc-500">Status calculado automaticamente:</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusConfig[getAutoStatus(form.begin_at, form.end_at)].bg} ${statusConfig[getAutoStatus(form.begin_at, form.end_at)].border} ${statusConfig[getAutoStatus(form.begin_at, form.end_at)].color}`}>
              {statusConfig[getAutoStatus(form.begin_at, form.end_at)].label}
            </span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !form.name || !form.begin_at || !form.end_at}
          className="bg-[#39A900] hover:bg-[#45C500] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black px-6 py-2.5 rounded-xl transition-all text-sm"
        >
          {saving ? "Salvando..." : "+ Cadastrar Torneio"}
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-black">Torneios cadastrados</h3>
          <span className="text-xs text-zinc-500">{tournaments.length} torneios</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Carregando...</div>
        ) : tournaments.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">Nenhum torneio cadastrado ainda.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {tournaments.map((tournament) => {
              const s = statusConfig[tournament.status] || statusConfig.upcoming;
              return (
                <div key={tournament.id} className="flex items-center gap-4 p-4">
                  {tournament.image_url ? (
                    <img src={tournament.image_url} alt={tournament.name} className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-zinc-400 shrink-0">
                      {tournament.name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{tournament.name}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(tournament.begin_at)} → {formatDate(tournament.end_at)}
                      {tournament.prizepool && ` • ${tournament.prizepool}`}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${s.bg} ${s.border} ${s.color}`}>
                    {s.label}
                  </span>
                  <button
                    onClick={() => handleRefreshStatus(tournament)}
                    className="text-zinc-600 hover:text-zinc-300 transition-colors text-xs px-3 py-1 rounded-lg hover:bg-white/5 shrink-0"
                    title="Atualizar status baseado nas datas"
                  >
                    ↻ Status
                  </button>
                  <button
                    onClick={() => handleDelete(tournament.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors text-sm px-3 py-1 rounded-lg hover:bg-red-400/10 shrink-0"
                  >
                    Excluir
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}