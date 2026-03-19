"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Team {
  id: string;
  name: string;
  acronym: string;
  color: string;
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
  is_active: boolean;
  team_id: string;
  teams: Team;
}

interface PlayerStats {
  id: string;
  player_id: string;
  rating: number;
  kd_ratio: number;
  adr: number;
  headshot_percentage: number;
  kast: number;
}

const ROLES = ["Rifler", "AWPer", "IGL", "Support", "Entry Fragger"];
const FLAGS: Record<string, string> = {
  BR: "🇧🇷", UA: "🇺🇦", FR: "🇫🇷", RU: "🇷🇺", DK: "🇩🇰",
  DE: "🇩🇪", PT: "🇵🇹", KZ: "🇰🇿", PL: "🇵🇱", FI: "🇫🇮",
  MN: "🇲🇳", CS: "🇷🇸", HR: "🇭🇷", EE: "🇪🇪", SE: "🇸🇪",
};

function suggestPrice(rating: number): number {
  if (rating >= 1.20) return 310;
  if (rating >= 1.15) return 270;
  if (rating >= 1.10) return 240;
  if (rating >= 1.05) return 200;
  if (rating >= 1.00) return 170;
  return 130;
}

function getPriceTier(price: number): { label: string; color: string } {
  if (price >= 290) return { label: "⭐⭐⭐⭐⭐ Prisma", color: "#FFD700" };
  if (price >= 260) return { label: "⭐⭐⭐⭐ Galaxy", color: "#A855F7" };
  if (price >= 220) return { label: "⭐⭐⭐ Aurora", color: "#10B981" };
  if (price >= 180) return { label: "⭐⭐ Chrome", color: "#94a3b8" };
  if (price >= 150) return { label: "⭐ Matte", color: "#64748b" };
  return { label: "★ Base", color: "#374151" };
}

const emptyForm = {
  name: "", first_name: "", last_name: "",
  nationality: "BR", role: "Rifler",
  price: 150, team_id: "", image_url: "",
};

const emptyStats = {
  rating: 1.00, kd_ratio: 1.00,
  adr: 70.0, headshot_percentage: 45.0, kast: 70.0,
};

export default function JogadoresPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterTeam, setFilterTeam] = useState("TODOS");
  const [priceSuggested, setPriceSuggested] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingStats, setEditingStats] = useState<PlayerStats | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [stats, setStats] = useState(emptyStats);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const supabase = createClient();

  async function fetchData() {
    const [{ data: playersData }, { data: teamsData }] = await Promise.all([
      supabase.from("players").select("*, teams(id, name, acronym, color)").order("name"),
      supabase.from("teams").select("*").order("name"),
    ]);
    setPlayers((playersData as any) || []);
    setTeams(teamsData || []);
    if (teamsData && teamsData.length > 0 && !form.team_id) {
      setForm(f => ({ ...f, team_id: teamsData[0].id }));
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleEdit(player: Player) {
    setEditingPlayer(player);
    setForm({
      name: player.name,
      first_name: player.first_name || "",
      last_name: player.last_name || "",
      nationality: player.nationality || "BR",
      role: player.role || "Rifler",
      price: player.price,
      team_id: player.team_id,
      image_url: player.image_url || "",
    });
    setImagePreview(player.image_url || "");
    setImageFile(null);

    const { data: statsData } = await supabase
      .from("player_stats")
      .select("*")
      .eq("player_id", player.id)
      .single();

    if (statsData) {
      setEditingStats(statsData);
      setStats({
        rating: statsData.rating,
        kd_ratio: statsData.kd_ratio,
        adr: statsData.adr,
        headshot_percentage: statsData.headshot_percentage,
        kast: statsData.kast,
      });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingPlayer(null);
    setEditingStats(null);
    setForm({ ...emptyForm, team_id: teams[0]?.id || "" });
    setStats(emptyStats);
    setImageFile(null);
    setImagePreview("");
    setPriceSuggested(false);
  }

  function handleRatingChange(value: number) {
    const suggested = suggestPrice(value);
    setStats(s => ({ ...s, rating: value }));
    setForm(f => ({ ...f, price: suggested }));
    setPriceSuggested(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("players").upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from("players").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!form.name || !form.team_id) return;
    setSaving(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      setUploading(true);
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
      setUploading(false);
    }

    if (editingPlayer) {
      // ATUALIZAR jogador existente
      const { error } = await supabase
        .from("players")
        .update({
          name: form.name,
          first_name: form.first_name,
          last_name: form.last_name,
          nationality: form.nationality,
          role: form.role,
          price: form.price,
          team_id: form.team_id,
          image_url: imageUrl || null,
        })
        .eq("id", editingPlayer.id);

      if (!error) {
        if (editingStats) {
          await supabase.from("player_stats").update({
            rating: stats.rating,
            kd_ratio: stats.kd_ratio,
            adr: stats.adr,
            headshot_percentage: stats.headshot_percentage,
            kast: stats.kast,
            updated_at: new Date().toISOString(),
          }).eq("player_id", editingPlayer.id);
        } else {
          await supabase.from("player_stats").insert({
            player_id: editingPlayer.id,
            ...stats,
          });
        }
        handleCancelEdit();
        fetchData();
      }
    } else {
      // CRIAR novo jogador
      const { data: playerData, error } = await supabase
        .from("players")
        .insert({
          name: form.name,
          first_name: form.first_name,
          last_name: form.last_name,
          nationality: form.nationality,
          role: form.role,
          price: form.price,
          team_id: form.team_id,
          image_url: imageUrl || null,
          is_active: true,
        })
        .select()
        .single();

      if (!error && playerData) {
        await supabase.from("player_stats").insert({
          player_id: playerData.id,
          ...stats,
        });
        setForm({ ...emptyForm, team_id: teams[0]?.id || "" });
        setStats(emptyStats);
        setImageFile(null);
        setImagePreview("");
        setPriceSuggested(false);
        fetchData();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este jogador?")) return;
    await supabase.from("players").delete().eq("id", id);
    fetchData();
  }

  async function handleToggleActive(player: Player) {
    await supabase.from("players").update({ is_active: !player.is_active }).eq("id", player.id);
    fetchData();
  }

  const filtered = players.filter(p =>
    filterTeam === "TODOS" ? true : p.team_id === filterTeam
  );

  const priceTier = getPriceTier(form.price);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black">Jogadores</h2>
        <p className="text-zinc-500 text-sm mt-1">Cadastre e atualize jogadores com foto, stats e preço base</p>
      </div>

      {teams.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-yellow-400">⚠️</span>
          <p className="text-sm text-yellow-400">Cadastre os times primeiro antes de adicionar jogadores.</p>
          <a href="/admin/times" className="ml-auto text-xs bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-xl font-bold">
            Ir para Times →
          </a>
        </div>
      )}

      {/* Formulário */}
      <div className={`border rounded-2xl p-6 mb-8 transition-all ${editingPlayer ? "bg-blue-500/5 border-blue-500/20" : "bg-white/[0.02] border-white/5"}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black">
            {editingPlayer ? `✏️ Editando: ${editingPlayer.name}` : "Novo Jogador"}
          </h3>
          {editingPlayer && (
            <button
              onClick={handleCancelEdit}
              className="text-xs text-zinc-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-xl transition-all"
            >
              ✕ Cancelar edição
            </button>
          )}
        </div>

        {editingPlayer && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6 flex items-center gap-2">
            <span className="text-blue-400 text-sm">💡</span>
            <p className="text-xs text-blue-400">
              Você está editando <strong>{editingPlayer.name}</strong>. Atualize o rating com os dados mais recentes do HLTV e o preço será sugerido automaticamente.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Foto */}
          <div className="col-span-1">
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Foto do jogador</label>
            <div
              className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-white/5 cursor-pointer hover:border-[#39A900]/40 transition-all"
              onClick={() => document.getElementById("photo-input")?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <p className="text-4xl mb-2">📷</p>
                  <p className="text-xs text-zinc-500">Clique para selecionar</p>
                  <p className="text-xs text-zinc-600 mt-1">JPG, PNG ou WEBP • Max 2MB</p>
                </div>
              )}
            </div>
            <input id="photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            {!imageFile && (
              <div className="mt-2">
                <label className="text-xs text-zinc-600 mb-1 block">Ou cole uma URL</label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
                />
              </div>
            )}
          </div>

          {/* Dados */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Nick *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: KSCERATO"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Time *</label>
              <select
                value={form.team_id}
                onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#090b0f]">{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Primeiro nome</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Ex: Kaike"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Sobrenome</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Ex: Bez"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Nacionalidade</label>
              <select
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
              >
                {Object.entries(FLAGS).map(([code, flag]) => (
                  <option key={code} value={code} className="bg-[#090b0f]">{flag} {code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Função</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
              >
                {ROLES.map(r => (
                  <option key={r} value={r} className="bg-[#090b0f]">{r}</option>
                ))}
              </select>
            </div>

            {/* Preço */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Preço base (GS$)</label>
                {priceSuggested && (
                  <span className="text-xs text-[#39A900]">✓ Sugerido pelo rating</span>
                )}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="range"
                  min={100}
                  max={350}
                  step={5}
                  value={form.price}
                  onChange={(e) => { setForm({ ...form, price: parseInt(e.target.value) }); setPriceSuggested(false); }}
                  className="flex-1"
                />
                <span className="text-lg font-black w-16 text-right" style={{ color: priceTier.color }}>
                  {form.price}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold" style={{ color: priceTier.color }}>{priceTier.label}</span>
                <span className="text-xs text-zinc-600">— tier do card holográfico</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { label: "★ Base", range: "100-149", color: "#374151" },
                  { label: "⭐ Matte", range: "150-179", color: "#64748b" },
                  { label: "⭐⭐ Chrome", range: "180-219", color: "#94a3b8" },
                  { label: "⭐⭐⭐ Aurora", range: "220-259", color: "#10B981" },
                  { label: "⭐⭐⭐⭐+ Galaxy/Prisma", range: "260+", color: "#FFD700" },
                ].map(t => (
                  <div key={t.label} className="bg-white/5 rounded-lg p-1.5">
                    <p className="text-[9px] font-bold" style={{ color: t.color }}>{t.label}</p>
                    <p className="text-[9px] text-zinc-600">{t.range} GS$</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 border-t border-white/5 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-zinc-400">
              Stats base (do HLTV)
              {editingPlayer && <span className="ml-2 text-blue-400 font-normal">— atualize com dados recentes</span>}
            </h4>
            <p className="text-xs text-zinc-600">💡 Altere o Rating para sugerir o preço automaticamente</p>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { key: "rating", label: "Rating", min: 0.5, max: 2.0, step: 0.01 },
              { key: "kd_ratio", label: "K/D", min: 0.5, max: 2.0, step: 0.01 },
              { key: "adr", label: "ADR", min: 40, max: 120, step: 0.1 },
              { key: "headshot_percentage", label: "HS%", min: 20, max: 80, step: 0.1 },
              { key: "kast", label: "KAST%", min: 40, max: 90, step: 0.1 },
            ].map((s) => (
              <div key={s.key}>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">{s.label}</label>
                <input
                  type="number"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={stats[s.key as keyof typeof stats]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (s.key === "rating") {
                      handleRatingChange(val);
                    } else {
                      setStats({ ...stats, [s.key]: val });
                    }
                  }}
                  className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50 ${s.key === "rating" ? "border-[#39A900]/30" : "border-white/10"}`}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.name || !form.team_id}
          className={`mt-6 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black px-6 py-2.5 rounded-xl transition-all text-sm ${editingPlayer ? "bg-blue-500 hover:bg-blue-400" : "bg-[#39A900] hover:bg-[#45C500]"}`}
        >
          {uploading ? "Fazendo upload..." : saving ? "Salvando..." : editingPlayer ? "✓ Salvar alterações" : "+ Cadastrar Jogador"}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setFilterTeam("TODOS")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTeam === "TODOS" ? "bg-[#39A900] text-black" : "bg-white/5 border border-white/10 text-zinc-500 hover:text-white"}`}
        >
          Todos ({players.length})
        </button>
        {teams.map(t => (
          <button
            key={t.id}
            onClick={() => setFilterTeam(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTeam === t.id ? "text-black" : "bg-white/5 border border-white/10 text-zinc-500 hover:text-white"}`}
            style={filterTeam === t.id ? { backgroundColor: t.color } : {}}
          >
            {t.acronym} ({players.filter(p => p.team_id === t.id).length})
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-black">{filtered.length} jogadores</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">Nenhum jogador cadastrado ainda.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((player) => {
              const tier = getPriceTier(player.price);
              const isEditing = editingPlayer?.id === player.id;
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 transition-all ${isEditing ? "bg-blue-500/5 border-l-2 border-blue-500" : ""}`}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10">
                    {player.image_url ? (
                      <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-black text-zinc-400">
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{player.name}</p>
                      <span className="text-xs text-zinc-500">{FLAGS[player.nationality] || "🏳️"}</span>
                      {!player.is_active && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 rounded-full">Inativo</span>}
                      {isEditing && <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 rounded-full">Editando</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{player.teams?.name || "—"} • {player.role}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black" style={{ color: tier.color }}>{player.price} GS$</p>
                    <p className="text-xs text-zinc-600">{tier.label}</p>
                  </div>
                  <button
                    onClick={() => handleEdit(player)}
                    className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1 rounded-lg hover:bg-blue-400/10 transition-all shrink-0"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(player)}
                    className={`text-xs px-3 py-1 rounded-lg transition-all shrink-0 ${player.is_active ? "text-zinc-500 hover:text-orange-400 hover:bg-orange-400/10" : "text-emerald-400 hover:bg-emerald-400/10"}`}
                  >
                    {player.is_active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
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