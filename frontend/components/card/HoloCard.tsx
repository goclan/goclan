"use client";

import { useRef, useState } from "react";

interface HoloCardProps {
  player: {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    team: string | { id: number; name: string; acronym: string; image_url: string | null; location: string; color: string };
    country: string;
    role: string;
    price: number;
    rating: number;
    kd: number;
    adr: number;
    color: string;
    stats?: {
      headshot_percentage?: number;
      kast?: number;
    };
  };
  isSelected: boolean;
  isCaptain: boolean;
  isDisabled: boolean;
  onClick: () => void;
  onCaptainClick: (e: React.MouseEvent) => void;
}

export default function HoloCard({
  player,
  isSelected,
  isCaptain,
  isDisabled,
  onClick,
  onCaptainClick,
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mouse, setMouse] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, op: 0, sh: 0 });

  const teamName = typeof player.team === "string" ? player.team : player.team.name;
  const teamColor = player.color;
  const initials = player.name.slice(0, 2).toUpperCase();
  const fullName = player.first_name && player.last_name ? `${player.first_name} ${player.last_name}` : player.name;
  const ratingColor = player.rating >= 1.25 ? "#FFD700" : player.rating >= 1.1 ? "#39A900" : "#94a3b8";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isDisabled || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMouse({
      rx: ((y - rect.height / 2) / rect.height) * -12,
      ry: ((x - rect.width / 2) / rect.width) * 12,
      gx: (x / rect.width) * 100,
      gy: (y / rect.height) * 100,
      op: 0.5,
      sh: ((x + y) / (rect.width + rect.height)) * 100,
    });
  };

  const handleMouseLeave = () => setMouse({ rx: 0, ry: 0, gx: 50, gy: 50, op: 0, sh: 0 });
  const handleAdd = (e: React.MouseEvent) => { e.stopPropagation(); onClick(); };
  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDisabled) {
      setMouse({ rx: 0, ry: 0, gx: 50, gy: 50, op: 0, sh: 0 });
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div
      className="relative select-none"
      style={{ perspective: "900px", width: "100%", aspectRatio: "1115/1874" }}
    >
      {/* Glow verde quando selecionado */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none z-50"
          style={{ boxShadow: "0 0 0 3px #39A900, 0 0 30px #39A90080, 0 0 60px #39A90040", borderRadius: "8px" }} />
      )}

      {/* Container flip 3D */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full h-full ${isDisabled ? "opacity-40" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${isFlipped ? 0 : mouse.rx}deg) rotateY(${mouse.ry + (isFlipped ? 180 : 0)}deg)`,
          transition: "transform 0.5s ease",
        }}
      >

        {/* ══════════ FRENTE ══════════ */}
        <div className="absolute inset-0"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>

          {/* Frame PNG */}
          <img
            src="/images/carta-grande.png"
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "fill" }}
            draggable={false}
          />

          {/* Efeito holográfico */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(${mouse.sh * 3.6}deg,
                transparent 0%, rgba(255,0,128,0.08) 15%, rgba(255,165,0,0.08) 30%,
                rgba(255,255,0,0.08) 45%, rgba(0,255,128,0.08) 60%,
                rgba(0,128,255,0.08) 75%, rgba(128,0,255,0.08) 90%, transparent 100%)`,
              opacity: mouse.op,
              mixBlendMode: "color-dodge",
              zIndex: 10,
            }}
          />

          {/* Glare */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mouse.gx}% ${mouse.gy}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              opacity: mouse.op,
              zIndex: 10,
            }}
          />

          {/* Bandeira + Nome — no header: left 26%, top 3.5%, height 13.5% */}
          <div className="absolute flex items-center gap-1"
            style={{ left: "26%", top: "3.5%", height: "13.5%", width: "68%", zIndex: 20 }}>
            <span style={{ fontSize: "clamp(14px, 3vw, 26px)", lineHeight: 1 }}>{player.country}</span>
            <div className="flex flex-col justify-center min-w-0">
              <p className="font-black text-white truncate leading-tight" style={{ fontSize: "clamp(10px, 2vw, 17px)" }}>
                {player.name}
              </p>
              <p className="text-zinc-400 truncate leading-tight" style={{ fontSize: "clamp(7px, 1.3vw, 11px)" }}>
                {fullName}
              </p>
            </div>
            {isCaptain && <span className="text-yellow-400 ml-auto shrink-0" style={{ fontSize: "clamp(10px, 1.8vw, 16px)" }}>⭐</span>}
          </div>

          {/* Área da foto — top 27%, bottom 14%, left 13%, right 13% */}
          <div
            className="absolute cursor-pointer overflow-hidden"
            onClick={handleFlip}
            style={{ top: "27%", left: "13%", right: "13%", bottom: "14%", zIndex: 15 }}
          >
            {/* Escudo holográfico do time */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black select-none"
              style={{ fontSize: "clamp(50px, 13vw, 110px)", color: `${teamColor}20`, textShadow: `0 0 50px ${teamColor}50`, zIndex: 1 }}>
              {teamName[0]}
            </div>

            {/* Iniciais do jogador */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
              <div
                className="flex items-center justify-center font-black rounded-2xl border-2"
                style={{
                  width: "clamp(48px, 12vw, 90px)",
                  height: "clamp(48px, 12vw, 90px)",
                  fontSize: "clamp(16px, 4.5vw, 32px)",
                  backgroundColor: `${teamColor}20`,
                  borderColor: `${teamColor}50`,
                  color: teamColor,
                  boxShadow: `0 0 25px ${teamColor}40`,
                }}
              >
                {initials}
              </div>
            </div>

            {/* Hint flip */}
            <div className="absolute bottom-2 right-2" style={{ zIndex: 3 }}>
              <span className="text-zinc-500 bg-black/60 rounded-full"
                style={{ fontSize: "clamp(6px, 1.1vw, 9px)", padding: "2px 5px" }}>
                ver stats →
              </span>
            </div>
          </div>

          {/* Footer — preço + botão: bottom 2.5%, height 10% */}
          <div className="absolute flex items-center justify-between px-2"
            style={{ left: "6%", right: "6%", bottom: "2.5%", height: "10%", zIndex: 20 }}>
            <div className="flex flex-col justify-center">
              <p className="font-black leading-tight" style={{ color: teamColor, fontSize: "clamp(8px, 1.8vw, 14px)" }}>
                {player.price} GS$
              </p>
              <span className="text-zinc-400 leading-tight" style={{ fontSize: "clamp(6px, 1.2vw, 10px)" }}>
                {player.role}
              </span>
            </div>
            <button
              onClick={handleAdd}
              className={`font-black rounded-xl transition-all ${isSelected ? "bg-[#39A900] text-black" : "bg-white/15 hover:bg-[#39A900] hover:text-black text-white"}`}
              style={{ fontSize: "clamp(7px, 1.4vw, 11px)", padding: "clamp(3px,0.5vw,5px) clamp(5px,1vw,10px)" }}
            >
              {isSelected ? "✓ No Time" : "+ Adicionar"}
            </button>
          </div>
        </div>

        {/* ══════════ VERSO ══════════ */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "#0d1117",
            border: `1px solid ${teamColor}40`,
          }}
        >
          {/* Header verso */}
          <div className="flex items-center gap-2 px-3 py-2"
            style={{ backgroundColor: "#161b22", borderBottom: `1px solid ${teamColor}30` }}>
            <div className="rounded-lg flex items-center justify-center font-black shrink-0"
              style={{ width: 28, height: 28, backgroundColor: `${teamColor}20`, color: teamColor, fontSize: 12 }}>
              {initials[0]}
            </div>
            <p className="font-black text-white text-sm truncate">{player.name}</p>
            <span className="text-zinc-500 text-xs ml-auto shrink-0">{teamName}</span>
          </div>

          {/* Stats */}
          <div className="px-3 py-3 flex flex-col gap-2" style={{ height: "calc(100% - 96px)" }}>
            {[
              { label: "Rating", value: player.rating.toFixed(2), color: ratingColor, bar: ((player.rating - 0.8) / 0.8) * 100 },
              { label: "K/D", value: player.kd.toFixed(2), color: "#94a3b8", bar: ((player.kd - 0.8) / 0.8) * 100 },
              { label: "ADR", value: player.adr.toFixed(1), color: "#94a3b8", bar: (player.adr / 120) * 100 },
              { label: "HS%", value: `${player.stats?.headshot_percentage?.toFixed(0) || "—"}%`, color: "#94a3b8", bar: player.stats?.headshot_percentage || 0 },
              { label: "KAST", value: `${player.stats?.kast?.toFixed(0) || "—"}%`, color: "#94a3b8", bar: player.stats?.kast || 0 },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                  <span className="text-xs font-black" style={{ color: stat.color }}>{stat.value}</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(stat.bar, 0), 100)}%`, backgroundColor: stat.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer verso */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-3"
            style={{ borderTop: `1px solid ${teamColor}20` }}>
            <button onClick={handleFlip}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10">
              ← Voltar
            </button>
            <button onClick={handleAdd}
              className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${isSelected ? "bg-[#39A900] text-black" : "bg-white/10 hover:bg-[#39A900] hover:text-black text-white border border-white/20"}`}>
              {isSelected ? "✓ No Time" : "+ Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}