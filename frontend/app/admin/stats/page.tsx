"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface Phase {
  id: string;
  name: string;
  phase_type: string;
  phase_number: number;
  status: string;
  tournament_id: string;
}

interface Team {
  id: string;
  name: string;
  acronym: string;
  color: string;
}

interface Player {
  id: string;
  name: string;
  nationality: string;
  team_id: string;
  teams: Team;
}

interface PlayerStatRow {
  player_id: string;
  player_name: string;
  team_name: string;
  team_color: string;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  rating: number;
  multi_kills: number;
  kast: number;
  team_won: boolean;
}

const FLAGS: Record<string, string> = {
  BR: "🇧🇷", UA: "🇺🇦", FR: "🇫🇷", RU: "🇷🇺", DK: "🇩🇰",
  DE: "🇩🇪", PT: "🇵🇹", KZ: "🇰🇿", PL: "🇵🇱", FI: "🇫🇮",
  MN: "🇲🇳", CS: "🇷🇸", HR: "🇭🇷", EE: "🇪🇪", SE: "🇸🇪",
  LV: "🇱🇻", RO: "🇷🇴", XK: "🏳️",
};

export default function StatsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [winnerTeam, setWinnerTeam] = useState("");
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 16));
  const [swissRound, setSwissRound] = useState(1);
  const [playerStats, setPlayerStats] = useState<PlayerStatRow[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchInitial() {
      const [{ data: t }, { data: tm }] = await Promise.all([
        supabase.from("tournaments").select("*").in("status", ["active", "upcoming"]).order("begin_at"),
        supabase.from("teams").select("*").order("name"),
      ]);
      setTournaments(t || []);
      setTeams(tm || []);
    }
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;
    async function fetchPhases() {
      const { data } = await supabase
        .from("phases")
        .select("*")
        .eq("tournament_id", selectedTournament)
        .order("phase_number");
      setPhases(data || []);
    }
    fetchPhases();
  }, [selectedTournament]);

  useEffect(() => {
    if (!teamA && !teamB) return;
    async function fetchPlayers() {
      const teamIds = [teamA, teamB].filter(Boolean);
      const { data } = await supabase
        .from("players")
        .select("*, teams(id, name, acronym, color)")
        .in("team_id", teamIds)
        .eq("is_active", true)
        .order("name");

      const playersData = (data as any) || [];
      setPlayers(playersData);

      const rows: PlayerStatRow[] = playersData.map((p: Player) => ({
        player_id: p.id,
        player_name: p.name,
        team_name: p.teams?.name || "",
        team_color: p.teams?.color || "#39A900",
        kills: 0,
        deaths: 0,
        assists: 0,
        adr: 0,
        rating: 0,
        multi_kills: 0,
        kast: 0,
        team_won: false,
      }));
      setPlayerStats(rows);
    }
    fetchPlayers();
  }, [teamA, teamB]);

  function updateStat(playerId: string, field: keyof PlayerStatRow, value: any) {
    setPlayerStats(rows =>
      rows.map(r => r.player_id === playerId ? { ...r, [field]: value } : r)
    );
  }

  function setTeamWon(teamId: string) {
    setWinnerTeam(teamId);
    setPlayerStats(rows =>
      rows.map(r => {
        const player = players.find(p => p.id === r.player_id);
        return { ...r, team_won: player?.team_id === teamId };
      })
    );
  }

  async function handleSave() {
    if (!selectedTournament || !selectedPhase || !teamA || !teamB || !winnerTeam) {
      alert("Preencha torneio, fase, times e vencedor!");
      return;
    }
    if (playerStats.length === 0) {
      alert("Nenhum jogador encontrado para os times selecionados!");
      return;
    }
    setSaving(true);

    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .insert({
        tournament_id: selectedTournament,
        phase_id: selectedPhase,
        team_a_id: teamA,
        team_b_id: teamB,
        winner_team_id: winnerTeam,
        match_date: new Date(matchDate).toISOString(),
        swiss_round: swissRound,
        status: "finished",
      })
      .select()
      .single();

    if (matchError || !matchData) {
      alert("Erro ao salvar partida!");
      setSaving(false);
      return;
    }

    const statsToInsert = playerStats.map(row => ({
      match_id: matchData.id,
      player_id: row.player_id,
      team_id: players.find(p => p.id === row.player_id)?.team_id,
      kills: row.kills,
      deaths: row.deaths,
      assists: row.assists,
      adr: row.adr,
      rating: row.rating,
      multi_kills: row.multi_kills,
      kast: row.kast,
      team_won: row.team_won,
    }));

    const { error: statsError } = await supabase.from("match_stats").insert(statsToInsert);

    if (statsError) {
      alert("Partida salva mas erro ao salvar stats!");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setTeamA("");
      setTeamB("");
      setWinnerTeam("");
      setPlayerStats([]);
      setSwissRound(r => r + 1);
    }

    setSaving(false);
  }

  const teamAData = teams.find(t => t.id === teamA);
  const teamBData = teams.find(t => t.id === teamB);
  const teamAPlayers = playerStats.filter(r => players.find(p => p.id === r.player_id)?.team_id === teamA);
  const teamBPlayers = playerStats.filter(r => players.find(p => p.id === r.player_id)?.team_id === teamB);

  function renderPlayerRow(row: PlayerStatRow) {
    const player = players.find(p => p.id === row.player_id);
    const kd = row.deaths > 0 ? (row.kills / row.deaths).toFixed(2) : row.kills > 0 ? "∞" : "0.00";

    return (
      <tr key={row.player_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
        <td className="p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs">{FLAGS[player?.nationality || ""] || "🏳️"}</span>
            <span className="font-bold text-sm text-white">{row.player_name}</span>
          </div>
        </td>
        {/* Kills */}
        <td className="p-2">
          <input
            type="number" min={0} max={60} step={1}
            value={row.kills}
            onChange={(e) => updateStat(row.player_id, "kills", parseInt(e.target.value) || 0)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#39A900]/50"
          />
        </td>
        {/* Deaths */}
        <td className="p-2">
          <input
            type="number" min={0} max={60} step={1}
            value={row.deaths}
            onChange={(e) => updateStat(row.player_id, "deaths", parseInt(e.target.value) || 0)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#39A900]/50"
          />
        </td>
        {/* K/D calculado automaticamente */}
        <td className="p-2 text-center">
          <span className={`text-sm font-black ${parseFloat(kd) >= 1 ? "text-emerald-400" : "text-red-400"}`}>
            {kd}
          </span>
        </td>
        {/* Assists */}
        <td className="p-2">
          <input
            type="number" min={0} max={40} step={1}
            value={row.assists}
            onChange={(e) => updateStat(row.player_id, "assists", parseInt(e.target.value) || 0)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#39A900]/50"
          />
        </td>
        {/* Multi-kills */}
        <td className="p-2">
          <input
            type="number" min={0} max={20} step={1}
            value={row.multi_kills}
            onChange={(e) => updateStat(row.player_id, "multi_kills", parseInt(e.target.value) || 0)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#39A900]/50"
          />
        </td>
        {/* ADR */}
        <td className="p-2">
          <input
            type="number" min={0} max={200} step={0.1}
            value={row.adr}
            onChange={(e) => updateStat(row.player_id, "adr", parseFloat(e.target.value) || 0)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#39A900]/50"
          />
        </td>
        {/* Rating */}
        <td className="p-2">
          <input
            type="number" min={0} max={3} step={0.01}
            value={row.rating}
            onChange={(e) => updateStat(row.player_id, "rating", parseFloat(e.target.value) || 0)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#39A900]/50"
          />
        </td>
        {/* KAST% */}
        <td className="p-2">
          <input
            type="number" min={0} max={100} step={0.1}
            value={row.kast}
            onChange={(e) => updateStat(row.player_id, "kast", parseFloat(e.target.value) || 0)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#39A900]/50"
          />
        </td>
        {/* Resultado */}
        <td className="p-3 text-center">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${row.team_won ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {row.team_won ? "✓ Vitória" : "✗ Derrota"}
          </span>
        </td>
      </tr>
    );
  }

  function renderTeamTable(teamPlayers: PlayerStatRow[], teamData: Team | undefined, isWinner: boolean) {
    if (teamPlayers.length === 0) return null;
    return (
      <>
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ backgroundColor: `${teamData?.color}15`, borderBottom: `1px solid ${teamData?.color}20` }}
        >
          <span className="font-black text-sm" style={{ color: teamData?.color }}>{teamData?.name}</span>
          {isWinner && <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">🏆 Vencedor</span>}
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="p-3 text-left text-xs text-zinc-500 uppercase tracking-wider">Jogador</th>
              <th className="p-2 text-center text-xs text-zinc-500 uppercase tracking-wider">Kills</th>
              <th className="p-2 text-center text-xs text-zinc-500 uppercase tracking-wider">Deaths</th>
              <th className="p-2 text-center text-xs text-zinc-500 uppercase tracking-wider">K/D</th>
              <th className="p-2 text-center text-xs text-zinc-500 uppercase tracking-wider">Assists</th>
              <th className="p-2 text-center text-xs text-zinc-500 uppercase tracking-wider">MKs</th>
              <th className="p-2 text-center text-xs text-zinc-500 uppercase tracking-wider">ADR</th>
              <th className="p-2 text-center text-xs text-zinc-500 uppercase tracking-wider">Rating</th>
              <th className="p-2 text-center text-xs text-zinc-500 uppercase tracking-wider">KAST%</th>
              <th className="p-3 text-center text-xs text-zinc-500 uppercase tracking-wider">Resultado</th>
            </tr>
          </thead>
          <tbody>{teamPlayers.map(renderPlayerRow)}</tbody>
        </table>
      </>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black">Inserir Stats Pós-Partida</h2>
        <p className="text-zinc-500 text-sm mt-1">Insira os stats do HLTV após cada partida para calcular a pontuação dos lineups</p>
      </div>

      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-emerald-400">✓</span>
          <p className="text-sm text-emerald-400 font-bold">Partida e stats salvos com sucesso!</p>
        </div>
      )}

      {/* Torneio e Fase */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
        <h3 className="font-black mb-4">1. Torneio e Fase</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Torneio *</label>
            <select
              value={selectedTournament}
              onChange={(e) => { setSelectedTournament(e.target.value); setSelectedPhase(""); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
            >
              <option value="" className="bg-[#090b0f]">Selecione o torneio</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id} className="bg-[#090b0f]">{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Fase *</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              disabled={!selectedTournament}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50 disabled:opacity-50"
            >
              <option value="" className="bg-[#090b0f]">Selecione a fase</option>
              {phases.map(p => (
                <option key={p.id} value={p.id} className="bg-[#090b0f]">{p.name}</option>
              ))}
            </select>
            {selectedTournament && phases.length === 0 && (
              <p className="text-xs text-orange-400 mt-1">⚠️ Nenhuma fase cadastrada para este torneio.</p>
            )}
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Data da partida</label>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
            />
          </div>
        </div>
      </div>

      {/* Times e Vencedor */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
        <h3 className="font-black mb-4">2. Times e Vencedor</h3>
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Time A *</label>
            <select
              value={teamA}
              onChange={(e) => { setTeamA(e.target.value); setWinnerTeam(""); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
            >
              <option value="" className="bg-[#090b0f]">Selecione o time</option>
              {teams.filter(t => t.id !== teamB).map(t => (
                <option key={t.id} value={t.id} className="bg-[#090b0f]">{t.name}</option>
              ))}
            </select>
          </div>
          <div className="text-center">
            <p className="text-zinc-500 text-sm font-bold mb-2">VS</p>
            {teamA && teamB && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Vencedor *</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setTeamWon(teamA)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-black transition-all ${winnerTeam === teamA ? "bg-emerald-500 text-white" : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"}`}
                  >
                    {teamAData?.acronym}
                  </button>
                  <button
                    onClick={() => setTeamWon(teamB)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-black transition-all ${winnerTeam === teamB ? "bg-emerald-500 text-white" : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"}`}
                  >
                    {teamBData?.acronym}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Time B *</label>
            <select
              value={teamB}
              onChange={(e) => { setTeamB(e.target.value); setWinnerTeam(""); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#39A900]/50"
            >
              <option value="" className="bg-[#090b0f]">Selecione o time</option>
              {teams.filter(t => t.id !== teamA).map(t => (
                <option key={t.id} value={t.id} className="bg-[#090b0f]">{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedPhase && phases.find(p => p.id === selectedPhase)?.phase_type === "swiss" && (
          <div className="mt-4">
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Rodada do Swiss</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setSwissRound(r)}
                  className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${swissRound === r ? "bg-[#39A900] text-black" : "bg-white/5 border border-white/10 text-zinc-500 hover:text-white"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabela de stats */}
      {playerStats.length > 0 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden mb-6">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-black">3. Stats dos Jogadores</h3>
            <p className="text-xs text-zinc-500 mt-1">K/D é calculado automaticamente conforme você digita kills e deaths</p>
          </div>
          {renderTeamTable(teamAPlayers, teamAData, winnerTeam === teamA)}
          {renderTeamTable(teamBPlayers, teamBData, winnerTeam === teamB)}
        </div>
      )}

      {playerStats.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving || !selectedTournament || !selectedPhase || !teamA || !teamB || !winnerTeam}
          className="w-full bg-[#39A900] hover:bg-[#45C500] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black py-4 rounded-2xl transition-all text-lg"
        >
          {saving ? "Salvando..." : "✓ Salvar Partida e Stats"}
        </button>
      )}

      {playerStats.length === 0 && teamA && teamB && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 text-center">
          <p className="text-orange-400 font-bold">Nenhum jogador ativo encontrado para estes times.</p>
          <p className="text-zinc-500 text-sm mt-1">Cadastre os jogadores primeiro em <a href="/admin/jogadores" className="text-[#39A900] hover:underline">Admin → Jogadores</a></p>
        </div>
      )}
    </div>
  );
}