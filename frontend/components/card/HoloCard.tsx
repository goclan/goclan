"use client";

import { useRef, useState } from "react";

interface HoloCardProps {
  player: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    team: string | { id: string; name: string; acronym: string; image_url: string | null; color: string };
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

// Tier holográfico por preço
function getHoloTier(price: number): "prisma" | "galaxy" | "aurora" | "chrome" | "matte" | "none" {
  if (price >= 290) return "prisma";
  if (price >= 260) return "galaxy";
  if (price >= 220) return "aurora";
  if (price >= 180) return "chrome";
  if (price >= 150) return "matte";
  return "none";
}

function getHoloBorder(tier: string, color: string): string {
  switch (tier) {
    case "prisma": return "linear-gradient(135deg, #FFD700, #FF6B6B, #A855F7, #3B82F6, #10B981, #FFD700)";
    case "galaxy": return "linear-gradient(135deg, #7C3AED, #2563EB, #7C3AED)";
    case "aurora": return "linear-gradient(135deg, #059669, #0891B2, #059669)";
    case "chrome": return "linear-gradient(135deg, #94a3b8, #e2e8f0, #94a3b8)";
    case "matte": return `linear-gradient(135deg, ${color}80, ${color}40)`;
    default: return "transparent";
  }
}

function getHoloEffect(tier: string, shine: number, opacity: number) {
  switch (tier) {
    case "prisma":
      return {
        background: `linear-gradient(${shine * 3.6}deg,
          rgba(255,215,0,0.15) 0%,
          rgba(255,107,107,0.15) 20%,
          rgba(168,85,247,0.15) 40%,
          rgba(59,130,246,0.15) 60%,
          rgba(16,185,129,0.15) 80%,
          rgba(255,215,0,0.15) 100%)`,
        opacity,
        mixBlendMode: "color-dodge" as const,
      };
    case "galaxy":
      return {
        background: `radial-gradient(ellipse at ${50 + shine * 0.5}% ${50 + shine * 0.3}%,
          rgba(168,85,247,0.25) 0%,
          rgba(37,99,235,0.2) 40%,
          rgba(0,0,0,0) 70%)`,
        opacity,
        mixBlendMode: "screen" as const,
      };
    case "aurora":
      return {
        background: `linear-gradient(${shine * 2}deg,
          rgba(5,150,105,0.2) 0%,
          rgba(8,145,178,0.2) 50%,
          rgba(5,150,105,0.1) 100%)`,
        opacity,
        mixBlendMode: "color-dodge" as const,
      };
    case "chrome":
      return {
        background: `linear-gradient(${shine * 3.6}deg,
          rgba(148,163,184,0.1) 0%,
          rgba(226,232,240,0.2) 50%,
          rgba(148,163,184,0.1) 100%)`,
        opacity: opacity * 0.7,
        mixBlendMode: "screen" as const,
      };
    case "matte":
      return {
        background: `radial-gradient(circle at ${50}% ${50}%, rgba(255,255,255,0.05) 0%, transparent 70%)`,
        opacity: opacity * 0.4,
        mixBlendMode: "screen" as const,
      };
    default:
      return { background: "none", opacity: 0, mixBlendMode: "normal" as const };
  }
}

function getTierLabel(tier: string) {
  switch (tier) {
    case "prisma": return { label: "PRISMA", color: "#FFD700" };
    case "galaxy": return { label: "GALAXY", color: "#A855F7" };
    case "aurora": return { label: "AURORA", color: "#10B981" };
    case "chrome": return { label: "CHROME", color: "#94a3b8" };
    case "matte": return { label: "MATTE", color: "#64748b" };
    default: return { label: "STANDARD", color: "#374151" };
  }
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
  const fullName = player.first_name && player.last_name
    ? `${player.first_name} ${player.last_name}`
    : player.name;
  const ratingColor = player.rating >= 1.25 ? "#FFD700" : player.rating >= 1.1 ? "#39A900" : "#94a3b8";

  const tier = getHoloTier(player.price);
  const tierInfo = getTierLabel(tier);
  const holoBorder = getHoloBorder(tier, teamColor);
  const holoEffect = getHoloEffect(tier, mouse.sh, mouse.op);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isDisabled || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMouse({
      rx: ((y - rect.height / 2) / rect.height) * -15,
      ry: ((x - rect.width / 2) / rect.width) * 15,
      gx: (x / rect.width) * 100,
      gy: (y / rect.height) * 100,
      op: tier === "none" ? 0 : tier === "matte" ? 0.3 : 0.7,
      sh: ((x + y) / (rect.width + rect.height)) * 100,
    });
  };

  const handleMouseLeave = () =>
    setMouse({ rx: 0, ry: 0, gx: 50, gy: 50, op: 0, sh: 0 });

  const handleAdd = (e: React.MouseEvent) => { e.stopPropagation(); onClick(); };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDisabled) {
      setMouse({ rx: 0, ry: 0, gx: 50, gy: 50, op: 0, sh: 0 });
      setIsFlipped(!isFlipped);
    }
  };

  // Intensidade da rotação 3D por tier
  const rotIntensity = tier === "prisma" ? 1.2 : tier === "galaxy" ? 1.1 : tier === "none" ? 0.5 : 1;

  return (
    <div
      className="relative select-none"
      style={{ perspective: "900px", width: "100%", aspectRatio: "3/4" }}
    >
      {/* Glow externo selecionado */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-50 transition-all duration-300"
          style={{
            boxShadow: `0 0 0 2px #39A900, 0 0 25px #39A90080, 0 0 50px #39A90040`,
            borderRadius: "16px",
          }}
        />
      )}

      {/* Aura do tier (prisma e galaxy têm aura externa) */}
      {(tier === "prisma" || tier === "galaxy") && !isSelected && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-0"
          style={{
            boxShadow: tier === "prisma"
              ? "0 0 20px rgba(255,215,0,0.15), 0 0 40px rgba(168,85,247,0.1)"
              : "0 0 20px rgba(124,58,237,0.2), 0 0 40px rgba(37,99,235,0.1)",
            borderRadius: "16px",
            transition: "box-shadow 0.3s",
          }}
        />
      )}

      {/* Flip 3D container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full h-full ${isDisabled ? "opacity-40" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${isFlipped ? 0 : mouse.rx * rotIntensity}deg) rotateY(${mouse.ry * rotIntensity + (isFlipped ? 180 : 0)}deg)`,
          transition: "transform 0.5s ease",
        }}
      >
        {/* ══════════ FRENTE ══════════ */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: tier === "prisma"
              ? "linear-gradient(135deg, #0d1117 0%, #1a0a2e 50%, #0d1117 100%)"
              : tier === "galaxy"
              ? "linear-gradient(135deg, #0d1117 0%, #0a0a1e 50%, #0d1117 100%)"
              : "#0d1117",
            border: tier !== "none"
              ? `1px solid transparent`
              : `1px solid rgba(255,255,255,0.06)`,
            backgroundClip: "padding-box",
          }}
        >
          {/* Borda gradiente tier */}
          {tier !== "none" && (
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none z-0"
              style={{
                padding: "1px",
                background: holoBorder,
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                borderRadius: "16px",
              }}
            />
          )}

          {/* Efeito holográfico do tier */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-20"
            style={{
              ...holoEffect,
              transition: "opacity 0.2s",
            }}
          />

          {/* Glare */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-20"
            style={{
              background: `radial-gradient(circle at ${mouse.gx}% ${mouse.gy}%, rgba(255,255,255,${tier === "prisma" ? 0.18 : tier === "galaxy" ? 0.12 : 0.08}) 0%, transparent 60%)`,
              opacity: mouse.op,
            }}
          />

          {/* Partículas para prisma (estrelas estáticas) */}
          {tier === "prisma" && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: i % 2 === 0 ? "2px" : "1px",
                    height: i % 2 === 0 ? "2px" : "1px",
                    backgroundColor: ["#FFD700", "#A855F7", "#3B82F6", "#10B981", "#FF6B6B", "#FFD700"][i],
                    left: `${[15, 75, 45, 85, 25, 60][i]}%`,
                    top: `${[20, 15, 50, 70, 80, 35][i]}%`,
                    opacity: 0.6,
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Card body */}
          <div className="w-full h-full flex flex-col relative z-10">

            {/* Header */}
            <div
              className="flex items-center gap-2 px-3 py-2 shrink-0"
              style={{
                backgroundColor: tier === "prisma" ? "rgba(255,215,0,0.05)" : tier === "galaxy" ? "rgba(124,58,237,0.05)" : "#161b22",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px 16px 0 0",
              }}
            >
              <img src="/images/profile.png" alt="GoClan" className="w-5 h-5 object-contain shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-xs leading-tight truncate">{player.name}</p>
                <p className="text-zinc-500 text-[9px] leading-tight truncate">{teamName}</p>
              </div>
              {isCaptain && <span className="text-yellow-400 text-xs shrink-0">⭐</span>}
              <div
                className="text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  color: tierInfo.color,
                  backgroundColor: `${tierInfo.color}15`,
                  border: `1px solid ${tierInfo.color}30`,
                }}
              >
                {tierInfo.label}
              </div>
            </div>

            {/* Área da foto — clica para flipar */}
            <div
              className="relative flex-1 mx-2 my-1.5 rounded-xl overflow-hidden cursor-pointer"
              onClick={handleFlip}
              style={{
                border: `1px solid ${
                  tier === "prisma" ? "rgba(255,215,0,0.15)" :
                  tier === "galaxy" ? "rgba(124,58,237,0.2)" :
                  tier === "aurora" ? "rgba(5,150,105,0.15)" :
                  "rgba(255,255,255,0.05)"
                }`,
              }}
            >
              {/* Fundo */}
              <div
                className="absolute inset-0"
                style={{
                  background: tier === "prisma"
                    ? "linear-gradient(135deg, #0d1117, #1a0a2e)"
                    : tier === "galaxy"
                    ? "linear-gradient(135deg, #0d1117, #0f0a2e)"
                    : tier === "aurora"
                    ? "linear-gradient(135deg, #0d1117, #021a12)"
                    : "linear-gradient(135deg, #0d1117, #161b22)",
                }}
              />

              {/* Escudo do time */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black select-none z-0"
                style={{
                  fontSize: "70px",
                  color: `${teamColor}15`,
                  textShadow: `0 0 40px ${teamColor}${tier === "prisma" ? "60" : "30"}`,
                }}
              >
                {teamName[0]}
              </div>

              {/* Iniciais */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div
                  className="flex items-center justify-center font-black rounded-2xl border-2"
                  style={{
                    width: "clamp(44px, 11vw, 72px)",
                    height: "clamp(44px, 11vw, 72px)",
                    fontSize: "clamp(14px, 4vw, 24px)",
                    backgroundColor: `${teamColor}20`,
                    borderColor: `${teamColor}50`,
                    color: teamColor,
                    boxShadow: `0 0 ${tier === "prisma" ? 30 : 15}px ${teamColor}${tier === "prisma" ? 50 : 30}`,
                  }}
                >
                  {initials}
                </div>
              </div>

              {/* Hint flip */}
              <div className="absolute bottom-1.5 right-1.5 z-20">
                <span
                  className="rounded-full"
                  style={{
                    fontSize: "8px",
                    color: tierInfo.color,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    padding: "2px 5px",
                    opacity: 0.8,
                  }}
                >
                  ver stats →
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-2 pb-2 shrink-0 flex items-center justify-between gap-1.5">
              <div>
                <p
                  className="font-black text-xs leading-tight"
                  style={{ color: tierInfo.color !== "#374151" ? tierInfo.color : teamColor }}
                >
                  {player.price} GS$
                </p>
                <span className="text-zinc-500 text-[9px]">{player.role}</span>
              </div>
              <button
                onClick={handleAdd}
                className={`rounded-lg font-black transition-all text-[9px] px-2 py-1 ${
                  isSelected
                    ? "bg-[#39A900] text-black"
                    : "bg-white/10 hover:bg-[#39A900] hover:text-black text-white border border-white/20"
                }`}
              >
                {isSelected ? "✓ No Time" : "+ Adicionar"}
              </button>
            </div>
          </div>
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
          }}
        >
          {/* Header verso */}
          <div
            className="flex items-center gap-2 px-3 py-2 shrink-0"
            style={{
              backgroundColor: "#161b22",
              borderBottom: `1px solid ${teamColor}30`,
              borderRadius: "16px 16px 0 0",
            }}
          >
            <div
              className="rounded-lg flex items-center justify-center font-black shrink-0"
              style={{ width: 24, height: 24, backgroundColor: `${teamColor}20`, color: teamColor, fontSize: 10 }}
            >
              {initials[0]}
            </div>
            <p className="font-black text-white text-xs truncate">{player.name}</p>
            <span
              className="text-[8px] font-black ml-auto shrink-0 px-1.5 py-0.5 rounded-full"
              style={{ color: tierInfo.color, backgroundColor: `${tierInfo.color}15`, border: `1px solid ${tierInfo.color}30` }}
            >
              {tierInfo.label}
            </span>
          </div>

          {/* Stats */}
          <div className="px-3 py-2 flex flex-col gap-1.5" style={{ height: "calc(100% - 88px)" }}>
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
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Math.max(stat.bar, 0), 100)}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer verso */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-2"
            style={{ borderTop: `1px solid ${teamColor}20` }}
          >
            <button
              onClick={handleFlip}
              className="flex-1 py-1 rounded-lg text-[9px] font-bold text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
            >
              ← Voltar
            </button>
            <button
              onClick={handleAdd}
              className={`flex-1 py-1 rounded-lg text-[9px] font-black transition-all ${
                isSelected ? "bg-[#39A900] text-black" : "bg-white/10 hover:bg-[#39A900] hover:text-black text-white border border-white/20"
              }`}
            >
              {isSelected ? "✓ No Time" : "+ Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}