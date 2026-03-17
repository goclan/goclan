"use client";

import { useRef, useState } from "react";

interface HoloCardProps {
  player: {
    id: number;
    name: string;
    team: string;
    country: string;
    role: string;
    price: number;
    rating: number;
    kd: number;
    adr: number;
    color: string;
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
  const [style, setStyle] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
    shine: 0,
  });
  const [isFlipped, setIsFlipped] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isDisabled) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    const shine = ((x + y) / (rect.width + rect.height)) * 100;
    setStyle({ rotateX, rotateY, glareX, glareY, glareOpacity: 0.6, shine });
  };

  const handleMouseLeave = () => {
    setStyle({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, glareOpacity: 0, shine: 0 });
  };

  const handleClick = () => {
    if (isDisabled) return;
    setIsFlipped(true);
    setTimeout(() => {
      setIsFlipped(false);
      onClick();
    }, 300);
  };

  const ratingColor =
    player.rating >= 1.25 ? "#FFD700" : player.rating >= 1.1 ? "#39A900" : "#94a3b8";

  return (
    <div
      className="relative"
      style={{ perspective: "800px" }}
    >
      <div
        ref={cardRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 select-none ${
          isDisabled ? "opacity-40 cursor-not-allowed" : ""
        }`}
        style={{
          transform: `rotateX(${style.rotateX}deg) rotateY(${isFlipped ? 180 : style.rotateY}deg) scale(${isSelected ? 1.03 : 1})`,
          transformStyle: "preserve-3d",
          transition: isFlipped ? "transform 0.3s ease" : "transform 0.1s ease",
          background: isSelected
            ? `linear-gradient(135deg, ${player.color}25 0%, #0d1117 60%, ${player.color}10 100%)`
            : "linear-gradient(135deg, #ffffff08 0%, #090b0f 100%)",
          border: isSelected
            ? `1px solid ${player.color}60`
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: isSelected
            ? `0 0 30px ${player.color}30, 0 8px 32px rgba(0,0,0,0.5)`
            : "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {/* Holographic rainbow layer */}
        {!isDisabled && (
          <div
            className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
            style={{
              background: `
                linear-gradient(
                  ${style.shine * 3.6}deg,
                  transparent 0%,
                  rgba(255,0,128,0.08) 15%,
                  rgba(255,165,0,0.08) 30%,
                  rgba(255,255,0,0.08) 45%,
                  rgba(0,255,128,0.08) 60%,
                  rgba(0,128,255,0.08) 75%,
                  rgba(128,0,255,0.08) 90%,
                  transparent 100%
                )
              `,
              opacity: style.glareOpacity,
              mixBlendMode: "color-dodge",
            }}
          />
        )}

        {/* Glare effect */}
        {!isDisabled && (
          <div
            className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
            style={{
              background: `radial-gradient(circle at ${style.glareX}% ${style.glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              opacity: style.glareOpacity,
            }}
          />
        )}

        {/* Card content */}
        <div className="p-4 relative z-20">
          {/* Team color bar */}
          <div
            className="w-full h-1 rounded-full mb-3"
            style={{
              background: `linear-gradient(90deg, ${player.color}, ${player.color}40)`,
              boxShadow: isSelected ? `0 0 8px ${player.color}80` : "none",
            }}
          />

          {/* Player avatar */}
          <div
            className="w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-black border-2 transition-all"
            style={{
              backgroundColor: `${player.color}15`,
              borderColor: isSelected ? `${player.color}60` : `${player.color}25`,
              color: player.color,
              boxShadow: isSelected ? `0 0 16px ${player.color}40` : "none",
            }}
          >
            {player.name[0]}
          </div>

          {/* Player info */}
          <div className="text-center mb-3">
            <p className="font-black text-white text-sm tracking-wide">{player.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{player.country} {player.team}</p>
            <span className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-zinc-400 mt-1 inline-block">
              {player.role}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1 mb-3">
            {[
              { label: "RAT", value: player.rating, highlight: true },
              { label: "K/D", value: player.kd, highlight: false },
              { label: "ADR", value: player.adr, highlight: false },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg p-1.5 text-center"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              >
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                <p
                  className="text-xs font-black"
                  style={{ color: stat.highlight ? ratingColor : "white" }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Price + captain */}
          <div className="flex items-center justify-between">
            <span className="font-black text-sm" style={{ color: player.color }}>
              {player.price} GS$
            </span>
            {isSelected && (
              <button
                onClick={onCaptainClick}
                className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all ${
                  isCaptain
                    ? "bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 shadow-lg shadow-yellow-500/20"
                    : "bg-white/5 border border-white/10 text-zinc-500 hover:text-white"
                }`}
              >
                {isCaptain ? "⭐ CAP" : "CAP?"}
              </button>
            )}
          </div>
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <div
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-30"
            style={{ backgroundColor: "#39A900", boxShadow: "0 0 8px #39A90080" }}
          >
            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Captain crown */}
        {isCaptain && (
          <div className="absolute top-2 left-2 z-30">
            <span className="text-lg" style={{ filter: "drop-shadow(0 0 4px #FFD700)" }}>⭐</span>
          </div>
        )}
      </div>
    </div>
  );
}