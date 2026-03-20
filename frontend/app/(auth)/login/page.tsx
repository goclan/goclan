"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import HoloCard from "@/components/card/HoloCard";

interface Player {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  nationality: string;
  role: string;
  price: number;
  image_url: string | null;
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

const FLAGS: Record<string, string> = {
  BR: "🇧🇷", UA: "🇺🇦", FR: "🇫🇷", RU: "🇷🇺", DK: "🇩🇰",
  DE: "🇩🇪", PT: "🇵🇹", KZ: "🇰🇿", PL: "🇵🇱", FI: "🇫🇮",
  MN: "🇲🇳", CS: "🇷🇸", HR: "🇭🇷", EE: "🇪🇪", SE: "🇸🇪",
  LV: "🇱🇻", RO: "🇷🇴", XK: "🏳️", IL: "🇮🇱", ES: "🇪🇸",
  GB: "🇬🇧", CA: "🇨🇦", CZ: "🇨🇿", US: "🇺🇸",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [randomPlayers, setRandomPlayers] = useState<Player[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchRandomPlayers() {
      const { data } = await supabase
        .from("players")
        .select("*, teams(id, name, acronym, color), player_stats(rating, kd_ratio, adr, headshot_percentage, kast)")
        .eq("is_active", true);

      if (data && data.length >= 3) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setRandomPlayers(shuffled.slice(0, 3) as any);
      }
    }
    fetchRandomPlayers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-white flex">
      {/* Lado esquerdo — cards reais */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#39A900]/10 via-transparent to-transparent" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, #39A90015 0%, transparent 60%), radial-gradient(circle at 70% 20%, #00D4FF10 0%, transparent 50%)`,
          }}
        />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: `60px 60px`,
          }}
        />
        <div className="relative z-10 text-center px-12 w-full">
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-[#39A900] flex items-center justify-center">
              <span className="text-black font-black text-xl">G</span>
            </div>
            <span className="font-black text-3xl tracking-tight">
              GO<span className="text-[#39A900]">CLAN</span>
            </span>
          </div>
          <h2 className="text-4xl font-black mb-4 leading-tight">
            Monte seu time.<br />
            <span className="text-[#39A900]">Compete de verdade.</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-sm mx-auto mb-12">
            O único fantasy CS2 do Brasil com cards holográficos e token PULSR.
          </p>

          {/* Cards reais */}
          <div className="flex justify-center gap-6 px-8">
            {randomPlayers.length === 3 ? randomPlayers.map((player, i) => {
              const stats = player.player_stats?.[0];
              return (
                <div
                  key={player.id}
                  className="w-36 transition-all duration-500"
                  style={{
                    transform: i === 1 ? "translateY(-16px)" : "translateY(0px)",
                    opacity: 0.95,
                  }}
                >
                  <HoloCard
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
                      rating: stats?.rating || 1.0,
                      kd: stats?.kd_ratio || 1.0,
                      adr: stats?.adr || 70,
                      color: player.teams?.color || "#39A900",
                      team: {
                        id: player.teams?.id || "",
                        name: player.teams?.name || "",
                        acronym: player.teams?.acronym || "",
                        image_url: null,
                        color: player.teams?.color || "#39A900",
                      },
                      stats: {
                        headshot_percentage: stats?.headshot_percentage || 45,
                        kast: stats?.kast || 70,
                      },
                    }}
                    isSelected={false}
                    isCaptain={false}
                    isDisabled={false}
                    readOnly={true}
                    onClick={() => {}}
                    onCaptainClick={() => {}}
                  />
                </div>
              );
            }) : (
              // Placeholder enquanto carrega
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-36 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
                  style={{
                    aspectRatio: "3/4",
                    transform: i === 1 ? "translateY(-16px)" : "translateY(0px)",
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#39A900] flex items-center justify-center">
              <span className="text-black font-black text-sm">G</span>
            </div>
            <span className="font-black text-xl tracking-tight">
              GO<span className="text-[#39A900]">CLAN</span>
            </span>
          </div>

          <h1 className="text-3xl font-black mb-2">Entrar</h1>
          <p className="text-zinc-500 mb-8">Bem-vindo de volta, gamer.</p>

          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={handleGoogle}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>
            <button className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-[#1b2838]/50 bg-[#1b2838]/50 hover:bg-[#1b2838] transition-all text-sm font-semibold">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#c7d5e0">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continuar com Steam
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-zinc-600 text-xs uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50 focus:bg-white/[0.07] transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#39A900]/50 focus:bg-white/[0.07] transition-all"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="w-4 h-4 rounded border border-white/20 bg-white/5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-[#39A900]" />
                </div>
                <span className="text-xs text-zinc-500">Lembrar acesso</span>
              </label>
              <a href="#" className="text-xs text-[#39A900] hover:text-[#45C500] transition-colors">
                Esqueci a senha
              </a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#39A900] hover:bg-[#45C500] disabled:bg-[#39A900]/50 text-black font-black py-3 rounded-xl transition-all mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : "Entrar"}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-sm mt-6">
            Não tem conta?{" "}
            <a href="/cadastro" className="text-[#39A900] hover:text-[#45C500] font-semibold transition-colors">
              Cadastrar grátis
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}