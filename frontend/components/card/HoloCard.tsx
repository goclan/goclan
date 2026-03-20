"use client";

import { useRef, useState } from "react";

interface HoloCardProps {
  player: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    nationality?: string;
    image_url?: string | null;
    team: string | { id: string; name: string; acronym: string; image_url: string | null; color: string };
    country: string;
    role: string;
    price: number;
    rating: number;
    kd: number;
    adr: number;
    color: string;
    stats?: { headshot_percentage?: number; kast?: number };
  };
  isSelected: boolean;
  isCaptain: boolean;
  isDisabled: boolean;
  readOnly?: boolean;
  onClick: () => void;
  onCaptainClick: (e: React.MouseEvent) => void;
}

function getHoloTier(price: number) {
  if (price >= 290) return "prisma";
  if (price >= 260) return "galaxy";
  if (price >= 220) return "aurora";
  if (price >= 180) return "chrome";
  if (price >= 150) return "matte";
  return "none";
}

function getTierInfo(tier: string) {
  switch (tier) {
    case "prisma": return { label: "PRISMA", color: "#FFD700", stars: "⭐⭐⭐⭐⭐" };
    case "galaxy": return { label: "GALAXY", color: "#A855F7", stars: "⭐⭐⭐⭐" };
    case "aurora": return { label: "AURORA", color: "#10B981", stars: "⭐⭐⭐" };
    case "chrome": return { label: "CHROME", color: "#94a3b8", stars: "⭐⭐" };
    case "matte": return { label: "MATTE", color: "#64748b", stars: "⭐" };
    default: return { label: "STANDARD", color: "#374151", stars: "★" };
  }
}

function clamp(v: number, min = 0, max = 100) {
  return Math.min(Math.max(v, min), max);
}

function getFallbackImage(playerId: string): string {
  const seed = parseInt(playerId.replace(/\D/g, "").slice(-4) || "1") % 100;
  return `https://picsum.photos/seed/${seed}/300/400`;
}

function getFoilTexture(tier: string): string {
  switch (tier) {
    case "prisma": return "/images/textures/rainbow.jpg";
    case "galaxy": return "/images/textures/galaxy.jpg";
    case "aurora": return "/images/textures/cosmos.png";
    case "chrome": return "/images/textures/grain.webp";
    default: return "";
  }
}

export default function HoloCard({
  player, isSelected, isCaptain, isDisabled, readOnly = false, onClick, onCaptainClick,
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mouse, setMouse] = useState({
    x: 50, y: 50,
    rx: 0, ry: 0,
    bgx: 50, bgy: 50,
    fromLeft: 0.5, fromTop: 0.5,
    fromCenter: 0,
    opacity: 0,
  });

  const teamName = typeof player.team === "string" ? player.team : player.team.name;
  const teamColor = player.color;
  const initials = player.name.slice(0, 2).toUpperCase();
  const ratingColor = player.rating >= 1.25 ? "#FFD700" : player.rating >= 1.1 ? "#39A900" : "#94a3b8";
  const tier = getHoloTier(player.price);
  const tierInfo = getTierInfo(tier);
  const foilTexture = getFoilTexture(tier);
  const playerImage = player.image_url || getFallbackImage(String(player.id));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100);
    const cx = x - 50;
    const cy = y - 50;
    setMouse({
      x, y,
      rx: -(cy / 3.5),
      ry: cx / 3.5,
      bgx: 37 + (x / 100) * 26,
      bgy: 33 + (y / 100) * 34,
      fromLeft: x / 100,
      fromTop: y / 100,
      fromCenter: clamp(Math.sqrt(cx * cx + cy * cy) / 50, 0, 1),
      opacity: 1,
    });
  };

  const handleMouseLeave = () => setMouse({
    x: 50, y: 50, rx: 0, ry: 0,
    bgx: 50, bgy: 50, fromLeft: 0.5, fromTop: 0.5,
    fromCenter: 0, opacity: 0,
  });

  const handleCardClick = () => {
    if (!isDisabled && !readOnly) onClick();
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readOnly) onClick();
  };

  const o = mouse.opacity;

  return (
    <div
      className="relative select-none"
      style={{ perspective: "900px", width: "100%", aspectRatio: "3/4" }}
    >
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none z-50"
          style={{ boxShadow: "0 0 0 2px #39A900, 0 0 25px #39A90080, 0 0 50px #39A90040", borderRadius: "16px" }} />
      )}

      {(tier === "prisma" || tier === "galaxy") && !isSelected && (
        <div className="absolute pointer-events-none"
          style={{
            inset: "-4px", borderRadius: "20px", zIndex: 0,
            background: tier === "prisma"
              ? "linear-gradient(135deg, #FFD70040,#FF6B6B30,#A855F730,#3B82F630,#10B98130)"
              : "linear-gradient(135deg, #7C3AED40, #2563EB30)",
            filter: "blur(8px)",
          }}
        />
      )}

      {/* Botão stats → FORA do flip container, sempre acessível */}
      {!isFlipped && (
        <div
          className="absolute right-2 z-30 cursor-pointer"
          style={{ bottom: readOnly ? "10px" : "50px" }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleMouseLeave();
            setIsFlipped(true);
          }}
        >
          <span className="text-[8px] rounded-full px-2 py-0.5"
            style={{ color: tierInfo.color, backgroundColor: "rgba(0,0,0,0.55)", border: `1px solid ${tierInfo.color}30` }}>
            stats →
          </span>
        </div>
      )}

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full h-full ${isDisabled ? "opacity-40" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${mouse.rx}deg) rotateY(${mouse.ry + (isFlipped ? 180 : 0)}deg)`,
          transition: o > 0 ? "transform 0.05s ease-out" : "transform 0.5s ease",
        }}
      >

        {/* ══════════ FRENTE ══════════ */}
        <div
          className={`absolute inset-0 rounded-2xl overflow-hidden ${!readOnly ? "cursor-pointer" : ""}`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            pointerEvents: isFlipped ? "none" : "auto",
          }}
          onClick={handleCardClick}
        >
          <img
            src={playerImage}
            alt={player.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center top" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getFallbackImage(String(player.id));
            }}
          />

          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.97) 100%)" }}
          />

          {tier !== "none" && (
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                backgroundImage: `url(/images/textures/grain.webp), url(/images/textures/glitter.png)`,
                backgroundSize: `cover, 25%`,
                backgroundPosition: `${mouse.bgx}% ${mouse.bgy}%, ${mouse.bgx * 0.8}% ${mouse.bgy * 0.8}%`,
                backgroundBlendMode: "normal",
                mixBlendMode: "color-dodge",
                opacity: o * (tier === "prisma" ? 0.35 : tier === "galaxy" ? 0.28 : tier === "aurora" ? 0.22 : tier === "chrome" ? 0.15 : 0.08),
                filter: `brightness(0.9) contrast(1.4) saturate(${tier === "prisma" ? 1.8 : tier === "galaxy" ? 1.5 : 1.2})`,
              }}
            />
          )}

          {foilTexture && (
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                backgroundImage: `url(${foilTexture})`,
                backgroundSize: tier === "prisma" ? "200% 200%" : tier === "galaxy" ? "250% 250%" : "180% 180%",
                backgroundPosition: `${mouse.fromLeft * -30 + 50}% ${mouse.fromTop * -30 + 50}%`,
                mixBlendMode: tier === "galaxy" ? "screen" : "color-dodge",
                opacity: o * (tier === "prisma" ? 0.55 : tier === "galaxy" ? 0.45 : tier === "aurora" ? 0.35 : 0.2),
                filter: `brightness(0.85) contrast(1.3) saturate(2.0) hue-rotate(${mouse.fromLeft * 60}deg)`,
              }}
            />
          )}

          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: `radial-gradient(farthest-corner circle at ${mouse.x}% ${mouse.y}%, rgba(255,255,255,${tier === "prisma" ? 0.18 : tier === "chrome" ? 0.08 : 0.13}) 0%, rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.25) 100%)`,
              mixBlendMode: "overlay",
              opacity: o * 0.7,
            }}
          />

          {(tier === "prisma" || tier === "galaxy") && (
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                backgroundImage: tier === "prisma"
                  ? `repeating-linear-gradient(${mouse.fromLeft * 180}deg, rgba(255,0,0,0.12) 0%, rgba(255,140,0,0.12) 12%, rgba(255,255,0,0.12) 24%, rgba(0,255,0,0.12) 36%, rgba(0,200,255,0.12) 48%, rgba(128,0,255,0.12) 60%, rgba(255,0,200,0.12) 72%, rgba(255,0,0,0.12) 84%)`
                  : `radial-gradient(ellipse at ${mouse.x}% ${mouse.y}%, rgba(180,100,255,0.22) 0%, rgba(60,120,255,0.18) 35%, transparent 65%)`,
                mixBlendMode: "color-dodge",
                opacity: o * (tier === "prisma" ? 0.7 : 0.55),
              }}
            />
          )}

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 px-3 py-2"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)" }}>
            <img src="/images/profile.png" alt="GoClan" className="w-4 h-4 object-contain opacity-80 shrink-0" />
            <p className="font-black text-white text-xs truncate flex-1">{player.name}</p>
            {isCaptain && <span className="text-yellow-400 text-xs shrink-0">⭐</span>}
            <div className="text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0"
              style={{ color: tierInfo.color, backgroundColor: "rgba(0,0,0,0.6)", border: `1px solid ${tierInfo.color}60` }}>
              {tierInfo.label}
            </div>
          </div>

          {/* Footer normal */}
          {!readOnly && (
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)" }}>
              <div>
                <p className="font-black text-xs" style={{ color: tierInfo.color }}>{player.price} GS$</p>
                <p className="text-zinc-400 text-[9px]">{player.role} • {teamName}</p>
              </div>
              <button
                onClick={handleAdd}
                className={`rounded-lg font-black text-[9px] px-2.5 py-1.5 transition-all backdrop-blur-sm ${
                  isSelected ? "bg-[#39A900] text-black" : "bg-white/20 hover:bg-[#39A900] hover:text-black text-white"
                }`}
              >
                {isSelected ? "✓ No Time" : "+ Adicionar"}
              </button>
            </div>
          )}

          {/* Footer readOnly */}
          {readOnly && (
            <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-2 pt-4"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 80%, transparent 100%)" }}>
              <p className="font-black text-xs" style={{ color: tierInfo.color }}>{player.price} GS$</p>
              <p className="text-zinc-400 text-[9px]">{player.role} • {teamName}</p>
            </div>
          )}
        </div>

        {/* ══════════ VERSO ══════════ */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "#0d1117",
            border: `1px solid ${teamColor}30`,
            pointerEvents: isFlipped ? "auto" : "none",
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <img src={playerImage} alt="" className="w-full h-full object-cover"
              style={{ objectPosition: "center top", opacity: 0.15, filter: "blur(8px) saturate(0.3)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 0%, #0d1117 75%)" }} />
          </div>

          <div className="relative z-10 flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: `1px solid ${teamColor}30` }}>
            <div className="rounded-lg flex items-center justify-center font-black shrink-0 overflow-hidden"
              style={{ width: 26, height: 26, backgroundColor: `${teamColor}20`, color: teamColor, fontSize: 10 }}>
              {player.image_url
                ? <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
                : initials[0]
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-xs truncate">{player.name}</p>
              <p className="text-zinc-500 text-[9px]">{teamName}</p>
            </div>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
              style={{ color: tierInfo.color, backgroundColor: `${tierInfo.color}15`, border: `1px solid ${tierInfo.color}30` }}>
              {tierInfo.stars}
            </span>
          </div>

          <div className="relative z-10 px-3 py-2 flex flex-col gap-1.5" style={{ height: "calc(100% - 88px)" }}>
            {[
              { label: "Rating", value: player.rating.toFixed(2), color: ratingColor, bar: ((player.rating - 0.8) / 0.8) * 100 },
              { label: "K/D", value: player.kd.toFixed(2), color: "#94a3b8", bar: ((player.kd - 0.8) / 0.8) * 100 },
              { label: "ADR", value: player.adr > 0 ? player.adr.toFixed(1) : "—", color: "#94a3b8", bar: (player.adr / 120) * 100 },
              { label: "HS%", value: player.stats?.headshot_percentage ? `${player.stats.headshot_percentage.toFixed(0)}%` : "—", color: "#94a3b8", bar: player.stats?.headshot_percentage || 0 },
              { label: "KAST", value: player.stats?.kast ? `${player.stats.kast.toFixed(0)}%` : "—", color: "#94a3b8", bar: player.stats?.kast || 0 },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                  <span className="text-[10px] font-black" style={{ color: stat.color }}>{stat.value}</span>
                </div>
                <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(stat.bar, 0), 100)}%`, backgroundColor: stat.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-2 z-10"
            style={{ borderTop: `1px solid ${teamColor}20` }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleMouseLeave(); setIsFlipped(false); }}
              className="flex-1 py-1 rounded-lg text-[9px] font-bold text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
            >
              ← Voltar
            </button>
            {!readOnly && (
              <button
                onClick={handleAdd}
                className={`flex-1 py-1 rounded-lg text-[9px] font-black transition-all ${
                  isSelected ? "bg-[#39A900] text-black" : "bg-white/10 hover:bg-[#39A900] hover:text-black text-white border border-white/20"
                }`}
              >
                {isSelected ? "✓ No Time" : "+ Adicionar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}