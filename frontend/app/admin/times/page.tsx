"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Team {
  id: string;
  name: string;
  acronym: string;
  color: string;
  location: string;
  image_url: string | null;
}

export default function TimesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    acronym: "",
    color: "#39A900",
    location: "",
  });

  const supabase = createClient();

  async function fetchTeams() {
    const { data } = await supabase.from("teams").select("*").order("name");
    setTeams(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchTeams(); }, []);

  async function handleSave() {
    if (!form.name || !form.acronym) return;
    setSaving(true);
    const { error } = await supabase.from("teams").insert({
      name: form.name,
      acronym: form.acronym.toUpperCase(),
      color: form.color,
      location: form.location,
    });
    if (!error) {
      setForm({ name: "", acronym: "", color: "#39A900", location: "" });
      fetchTeams();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este time?")) return;
    await supabase.from("teams").delete().eq("id", id);
    fetchTeams();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black">Times</h2>
        <p className="text-zinc-500 text-sm mt-1">Cadastre os times participantes</p>
      </div>

      {/* Formulário */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8">
        <h3 className="font-black mb-4">Novo Time</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Nome do time *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: FURIA Esports"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Sigla *</label>
            <input
              type="text"
              value={form.acronym}
              onChange={(e) => setForm({ ...form, acronym: e.target.value })}
              placeholder="Ex: FUR"
              maxLength={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">País / Região</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ex: Brasil"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Cor do time</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-12 h-10 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !form.name || !form.acronym}
          className="bg-[#39A900] hover:bg-[#45C500] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black px-6 py-2.5 rounded-xl transition-all text-sm"
        >
          {saving ? "Salvando..." : "+ Cadastrar Time"}
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-black">Times cadastrados</h3>
          <span className="text-xs text-zinc-500">{teams.length} times</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Carregando...</div>
        ) : teams.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">Nenhum time cadastrado ainda.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center gap-4 p-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                  style={{ backgroundColor: `${team.color}20`, color: team.color, border: `1px solid ${team.color}40` }}
                >
                  {team.acronym}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{team.name}</p>
                  <p className="text-xs text-zinc-500">{team.location || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: team.color }} />
                  <span className="text-xs text-zinc-500">{team.color}</span>
                </div>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-sm px-3 py-1 rounded-lg hover:bg-red-400/10"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}