import React from 'react';
import { COLOR_PALETTE } from '../game/boardGeometry';
import { PlayerColor } from '../game/types';

interface Dice3DProps {
  value: number;
  rolling: boolean;
  canRoll: boolean;
  activeColor: PlayerColor;
  onRoll: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  rolling,
  canRoll,
  activeColor,
  onRoll,
  size = 'lg',
}) => {
  const palette = COLOR_PALETTE[activeColor];
  const pips = PIP_LAYOUTS[value] ?? PIP_LAYOUTS[1];

  const sizeClass =
    size === 'sm' ? 'w-11 h-11 rounded-xl' : size === 'md' ? 'w-14 h-14 rounded-2xl' : 'w-16 h-16 rounded-2xl';

  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={!canRoll || rolling}
      aria-label={canRoll ? `Roll dice for ${palette.label}` : `Dice showing ${value}`}
      className={`group relative ${sizeClass} select-none transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
        canRoll && !rolling
          ? 'cursor-pointer hover:scale-105 active:scale-95'
          : 'cursor-default'
      }`}
    >
      {/* Active turn halo */}
      {canRoll && !rolling && (
        <span
          aria-hidden="true"
          className="absolute -inset-1.5 rounded-[20px] opacity-55 transition-opacity group-hover:opacity-85"
          style={{
            border: `2px solid ${palette.light}`,
            boxShadow: `0 0 18px ${palette.primary}66`,
          }}
        />
      )}

      {/* Ivory die body */}
      <div
        className={`relative w-full h-full ${sizeClass} bg-gradient-to-br from-[#FFFDF7] via-[#F7EFE0] to-[#E3D5BC] border border-[#D4C3A3] shadow-[0_6px_14px_rgba(0,0,0,0.45),inset_0_2px_3px_rgba(255,255,255,0.9),inset_0_-3px_5px_rgba(130,104,68,0.28)] ${
          rolling ? 'animate-dice-tumble' : ''
        }`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          <rect
            x="8"
            y="8"
            width="84"
            height="84"
            rx="16"
            fill="none"
            stroke="rgba(165, 140, 100, 0.22)"
            strokeWidth="2"
          />
          {pips.map(([cx, cy], idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={value === 1 ? 11.5 : 8.5}
              fill={value === 1 ? '#B91C1C' : '#231A13'}
            />
          ))}
        </svg>
      </div>
    </button>
  );
};
