import React, { useMemo, useState } from 'react';
import {
  COLOR_PALETTE,
  HOME_STRETCH_COORDS,
  MAIN_TRACK_COORDS,
  PLAYER_ORDER,
  STAR_TRACK_INDICES,
  START_TRACK_INDEX,
  YARD_BASE_OFFSET,
  getCoordForProgress,
  getTokenCoord,
  getYardSlotCoord,
} from '../game/boardGeometry';
import { BurstEffect, MoveOption, PlayerColor, Token } from '../game/types';

interface LudoBoardProps {
  tokens: Token[];
  activeColor: PlayerColor;
  legalMoves: MoveOption[];
  canSelectToken: boolean;
  hoppingTokenId: string | null;
  bursts: BurstEffect[];
  onSelectToken: (tokenId: string) => void;
  interactive?: boolean;
  inactiveColors?: PlayerColor[];
}

const TRACK_CELL_ARROWS: Record<number, { color: PlayerColor; rotation: number }> = {
  0: { color: 'red', rotation: 0 },
  13: { color: 'green', rotation: 90 },
  26: { color: 'yellow', rotation: 180 },
  39: { color: 'blue', rotation: 270 },
};

const STACK_OFFSETS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-0.17, -0.06],
    [0.17, 0.06],
  ],
  3: [
    [0, -0.17],
    [-0.17, 0.14],
    [0.17, 0.14],
  ],
  4: [
    [-0.17, -0.17],
    [0.17, -0.17],
    [-0.17, 0.17],
    [0.17, 0.17],
  ],
};

function StarEmblem({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.4l2.75 5.58 6.16.89-4.45 4.34 1.05 6.13L12 16.45l-5.51 2.89 1.05-6.13L3.09 8.87l6.16-.89L12 2.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  tokens,
  activeColor,
  legalMoves,
  canSelectToken,
  hoppingTokenId,
  bursts,
  onSelectToken,
  interactive = true,
  inactiveColors = [],
}) => {
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

  const legalMoveMap = useMemo(() => {
    const map = new Map<string, MoveOption>();
    for (const m of legalMoves) {
      map.set(m.tokenId, m);
    }
    return map;
  }, [legalMoves]);

  // Group tokens occupying the exact same board coordinate so stacked pawns stay visible
  const groupedTokens = useMemo(() => {
    const cellGroups = new Map<string, Token[]>();
    for (const token of tokens) {
      const coord = getTokenCoord(token);
      const key = `${coord.row.toFixed(2)},${coord.col.toFixed(2)}`;
      const arr = cellGroups.get(key);
      if (arr) {
        arr.push(token);
      } else {
        cellGroups.set(key, [token]);
      }
    }
    return cellGroups;
  }, [tokens]);

  const hoveredMove =
    canSelectToken && hoveredTokenId ? legalMoveMap.get(hoveredTokenId) ?? null : null;

  const previewCoord = useMemo(() => {
    if (!hoveredMove) return null;
    const tok = tokens.find((t) => t.id === hoveredMove.tokenId);
    if (!tok) return null;
    return getCoordForProgress(tok.color, hoveredMove.toProgress, tok.index);
  }, [hoveredMove, tokens]);

  const cellSizePct = 100 / 15;

  return (
    <div className="relative w-full h-full select-none">
      {/* Outer beveled walnut & brass board frame */}
      <div className="w-full h-full rounded-[22px] p-2 sm:p-2.5 bg-gradient-to-br from-[#523522] via-[#3A2416] to-[#26160D] shadow-[0_24px_56px_rgba(0,0,0,0.68),inset_0_1px_1px_rgba(255,228,185,0.22)] border border-[#6E4930]">
        <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-[#FAF5EA] border-2 border-[#CBBFA8] shadow-[inset_0_0_0_1px_rgba(62,40,24,0.12)]">
          {/* 1. 4 Corner Home Yards */}
          {PLAYER_ORDER.map((color) => {
            const base = YARD_BASE_OFFSET[color];
            const palette = COLOR_PALETTE[color];
            const isActiveTurn = interactive && activeColor === color;
            const isInactive = inactiveColors.includes(color);

            return (
              <div
                key={`yard-${color}`}
                className="absolute transition-opacity duration-200"
                style={{
                  left: `${base.col * cellSizePct}%`,
                  top: `${base.row * cellSizePct}%`,
                  width: `${6 * cellSizePct}%`,
                  height: `${6 * cellSizePct}%`,
                  backgroundColor: palette.primary,
                  opacity: isInactive ? 0.42 : 1,
                  boxShadow: isActiveTurn
                    ? `inset 0 0 0 3px rgba(255,255,255,0.75)`
                    : `inset 0 0 0 1px rgba(0,0,0,0.16)`,
                }}
              >
                {/* Inner ivory plinth */}
                <div
                  className="absolute rounded-[18%] bg-[#FAF5EA] shadow-[inset_0_2px_6px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.18)] border border-black/10"
                  style={{
                    left: '16.5%',
                    top: '16.5%',
                    width: '67%',
                    height: '67%',
                  }}
                />

                {/* Turn indicator pulse inside active yard */}
                {isActiveTurn && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-[13%] rounded-[20%] pointer-events-none border-2 border-white/75 animate-pulse"
                  />
                )}
              </div>
            );
          })}

          {/* 2. Yard Token Wells (positioned symmetrically using getYardSlotCoord) */}
          {PLAYER_ORDER.map((color) => {
            const palette = COLOR_PALETTE[color];
            const isInactive = inactiveColors.includes(color);
            return [0, 1, 2, 3].map((idx) => {
              const coord = getYardSlotCoord(color, idx);
              return (
                <div
                  key={`well-${color}-${idx}`}
                  aria-hidden="true"
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: `${(coord.col + 0.08) * cellSizePct}%`,
                    top: `${(coord.row + 0.08) * cellSizePct}%`,
                    width: `${0.84 * cellSizePct}%`,
                    height: `${0.84 * cellSizePct}%`,
                    backgroundColor: palette.tint,
                    border: `2px solid ${palette.primary}66`,
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.14)',
                    opacity: isInactive ? 0.35 : 1,
                  }}
                />
              );
            });
          })}

          {/* 3. 52 Outer Track Squares */}
          {MAIN_TRACK_COORDS.map((coord, idx) => {
            const startArrow = TRACK_CELL_ARROWS[idx];
            const isStar = STAR_TRACK_INDICES.has(idx);
            const bgColor = startArrow ? COLOR_PALETTE[startArrow.color].primary : '#FAF5EA';

            return (
              <div
                key={`track-${idx}`}
                className="absolute flex items-center justify-center border-[0.5px] border-[#C9BEA8]"
                style={{
                  left: `${coord.col * cellSizePct}%`,
                  top: `${coord.row * cellSizePct}%`,
                  width: `${cellSizePct}%`,
                  height: `${cellSizePct}%`,
                  backgroundColor: bgColor,
                }}
              >
                {startArrow && (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[56%] h-[56%] text-white/90"
                    style={{ transform: `rotate(${startArrow.rotation}deg)` }}
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h13m0 0l-5-5m5 5l-5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isStar && (
                  <StarEmblem className="w-[62%] h-[62%] text-[#8B7A62]" />
                )}
              </div>
            );
          })}

          {/* 4. Colored Home Stretch Lanes (5 cells per color) */}
          {PLAYER_ORDER.map((color) => {
            const palette = COLOR_PALETTE[color];
            const coords = HOME_STRETCH_COORDS[color];
            const isInactive = inactiveColors.includes(color);
            return coords.map((coord, stepIdx) => (
              <div
                key={`home-${color}-${stepIdx}`}
                className="absolute border-[0.5px] border-black/15"
                style={{
                  left: `${coord.col * cellSizePct}%`,
                  top: `${coord.row * cellSizePct}%`,
                  width: `${cellSizePct}%`,
                  height: `${cellSizePct}%`,
                  backgroundColor: palette.primary,
                  opacity: isInactive ? 0.45 : 0.92,
                }}
              />
            ));
          })}

          {/* 5. Center 3x3 Home Sanctuary (4-triangle geometric SVG) */}
          <div
            className="absolute border-[0.5px] border-[#B8AC96]"
            style={{
              left: `${6 * cellSizePct}%`,
              top: `${6 * cellSizePct}%`,
              width: `${3 * cellSizePct}%`,
              height: `${3 * cellSizePct}%`,
            }}
          >
            <svg viewBox="0 0 300 300" className="w-full h-full block" aria-hidden="true">
              {/* Left = Red */}
              <polygon points="0,0 150,150 0,300" fill={COLOR_PALETTE.red.primary} />
              {/* Top = Green */}
              <polygon points="0,0 300,0 150,150" fill={COLOR_PALETTE.green.primary} />
              {/* Right = Yellow */}
              <polygon points="300,0 300,300 150,150" fill={COLOR_PALETTE.yellow.primary} />
              {/* Bottom = Blue */}
              <polygon points="0,300 300,300 150,150" fill={COLOR_PALETTE.blue.primary} />
              {/* Crisp diagonal divider lines */}
              <line x1="0" y1="0" x2="300" y2="300" stroke="#FAF5EA" strokeWidth="4" />
              <line x1="300" y1="0" x2="0" y2="300" stroke="#FAF5EA" strokeWidth="4" />
              {/* Center brass medallion */}
              <circle cx="150" cy="150" r="24" fill="#FAF5EA" stroke="#8A6A32" strokeWidth="4" />
              <path
                d="M140 155l2-11 8 5 8-5 2 11h-20zm10-16a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                fill="#A67C2E"
              />
            </svg>
          </div>

          {/* 6. Destination Preview Ring on Token Hover */}
          {previewCoord && (
            <div
              aria-hidden="true"
              className="absolute pointer-events-none z-20 flex items-center justify-center"
              style={{
                width: `${cellSizePct}%`,
                height: `${cellSizePct}%`,
                transform: `translate3d(${previewCoord.col * 100}%, ${previewCoord.row * 100}%, 0)`,
                transition: 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className="w-[74%] h-[74%] rounded-full border-[2.5px] border-dashed animate-pulse"
                style={{
                  borderColor: COLOR_PALETTE[activeColor].dark,
                  backgroundColor: `${COLOR_PALETTE[activeColor].primary}33`,
                }}
              />
            </div>
          )}

          {/* 7. Capture / Home Arrival Burst Rings */}
          {bursts.map((burst) => (
            <div
              key={burst.id}
              aria-hidden="true"
              className="absolute pointer-events-none z-30 flex items-center justify-center"
              style={{
                width: `${cellSizePct}%`,
                height: `${cellSizePct}%`,
                transform: `translate3d(${burst.col * 100}%, ${burst.row * 100}%, 0)`,
              }}
            >
              <div
                className="w-[78%] h-[78%] rounded-full border-[3px] animate-burst-ring"
                style={{
                  borderColor:
                    burst.kind === 'home' ? '#F59E0B' : COLOR_PALETTE[burst.color].primary,
                }}
              />
            </div>
          ))}

          {/* 8. Game Tokens Layer (GPU-composited translate3d positioning) */}
          {tokens.map((token) => {
            const coord = getTokenCoord(token);
            const key = `${coord.row.toFixed(2)},${coord.col.toFixed(2)}`;
            const siblings = groupedTokens.get(key) ?? [token];
            const stackIdx = siblings.findIndex((s) => s.id === token.id);
            const count = Math.min(siblings.length, 4);
            const [offsetX, offsetY] = STACK_OFFSETS[count][stackIdx % count];
            const stackScale = count > 1 ? 0.76 : 1;

            const isLegal = interactive && canSelectToken && legalMoveMap.has(token.id);
            const isHopping = hoppingTokenId === token.id;
            const palette = COLOR_PALETTE[token.color];
            const isFinished = token.progress === 56;
            const zIndex = isLegal ? 30 : isHopping ? 35 : token.color === activeColor ? 20 : 12;

            // Compute legal token display number (1..4) for keyboard selection
            const legalSlotNum = isLegal ? token.index + 1 : null;

            return (
              <div
                key={token.id}
                className="absolute top-0 left-0 flex items-center justify-center"
                style={{
                  width: `${cellSizePct}%`,
                  height: `${cellSizePct}%`,
                  zIndex,
                  transform: `translate3d(${(coord.col + offsetX) * 100}%, ${(coord.row + offsetY) * 100}%, 0)`,
                  transition: 'transform 95ms cubic-bezier(0.22, 1, 0.36, 1)',
                  pointerEvents: isLegal ? 'auto' : 'none',
                }}
              >
                <button
                  type="button"
                  disabled={!isLegal}
                  onClick={() => isLegal && onSelectToken(token.id)}
                  onMouseEnter={() => isLegal && setHoveredTokenId(token.id)}
                  onMouseLeave={() => setHoveredTokenId((prev) => (prev === token.id ? null : prev))}
                  onFocus={() => isLegal && setHoveredTokenId(token.id)}
                  onBlur={() => setHoveredTokenId((prev) => (prev === token.id ? null : prev))}
                  aria-label={`${palette.label} token ${token.index + 1}${
                    isLegal ? ' (movable)' : ''
                  }`}
                  className={`relative flex items-center justify-center w-[80%] h-[80%] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    isLegal ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  style={{
                    transform: `scale(${
                      (isFinished ? 0.72 : stackScale) * (isLegal ? 1.08 : 1)
                    })`,
                    transition: 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Movable pulsing halo */}
                  {isLegal && (
                    <span
                      aria-hidden="true"
                      className="absolute -inset-[18%] rounded-full border-2 border-[#1F1711] bg-white/30 animate-token-halo"
                    />
                  )}

                  {/* Sculpted wooden/enamel token disc */}
                  <span
                    className={`relative w-full h-full rounded-full flex items-center justify-center ${
                      isHopping ? 'animate-token-hop' : ''
                    }`}
                    style={{
                      background: `radial-gradient(circle at 35% 28%, ${palette.light}, ${palette.primary} 62%, ${palette.dark} 100%)`,
                      border: `2px solid #FFFDF8`,
                      boxShadow: isLegal
                        ? `0 5px 10px rgba(0,0,0,0.48), 0 0 0 2px ${palette.dark}`
                        : `0 3px 6px rgba(0,0,0,0.42)`,
                    }}
                  >
                    {/* Inner recessed pawn ring */}
                    <span
                      className="w-[62%] h-[62%] rounded-full flex items-center justify-center border border-white/50"
                      style={{
                        background: `radial-gradient(circle at 40% 35%, ${palette.light}99, ${palette.dark}cc)`,
                      }}
                    >
                      {legalSlotNum !== null && (
                        <span
                          className="text-[10px] sm:text-[11px] font-mono font-semibold leading-none"
                          style={{ color: palette.textOnPrimary }}
                        >
                          {legalSlotNum}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
