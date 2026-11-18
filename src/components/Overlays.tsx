import React from 'react';
import { Crown, RotateCcw, Play, Home, X } from 'lucide-react';
import { COLOR_PALETTE } from '../game/boardGeometry';
import { computePlayerProgressPercent } from '../game/ludoEngine';
import { PlayerColor, PlayerConfig, PlayerStats, Token } from '../game/types';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitToTitle,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#261810] border border-[#5A402E] p-6 shadow-2xl">
        <h2 id="pause-title" className="font-display text-2xl font-bold text-[#FAF5EA]">
          Match Paused
        </h2>
        <p className="mt-1.5 text-sm text-[#C7B6A2]">
          Your board positions and scores are held safely.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="h-11 w-full rounded-xl bg-[#D99B16] hover:bg-[#E5A926] text-[#1C1207] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Match</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="h-11 w-full rounded-xl bg-[#362419] hover:bg-[#442D20] text-[#FAF5EA] font-medium text-sm flex items-center justify-center gap-2 border border-[#5A402E] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Match</span>
          </button>
          <button
            type="button"
            onClick={onExitToTitle}
            className="h-11 w-full rounded-xl bg-transparent hover:bg-[#332116] text-[#D6C7B2] font-medium text-sm flex items-center justify-center gap-2 border border-[#453022] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  const rules = [
    {
      title: '1. Exiting the Home Yard',
      detail: 'Roll a 6 to move a token from your corner Yard onto your colored Start arrow square.',
    },
    {
      title: '2. Bonus Rolls & Three-Sixes Rule',
      detail:
        'Rolling a 6, capturing an opponent, or reaching the center Home grants a bonus roll. Rolling three 6s in a row forfeits the turn.',
    },
    {
      title: '3. Safe Stars & Captures',
      detail:
        'Colored Start squares and Star squares are safe zones. Landing on an opponent on any other square sends them back to their Yard.',
    },
    {
      title: '4. Exact Roll to Win',
      detail:
        'Travel clockwise into your colored Home Stretch. You need an exact dice roll to land a token inside the center Sanctuary. First player to get all 4 tokens Home wins.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#261810] border border-[#5A402E] p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 id="rules-title" className="font-display text-2xl font-bold text-[#FAF5EA]">
            Ludo Rules
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="h-10 w-10 rounded-xl bg-[#362419] hover:bg-[#442D20] text-[#E9DCC8] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          {rules.map((r) => (
            <div key={r.title} className="border-b border-[#3B281B] pb-3 last:border-b-0 last:pb-0">
              <h3 className="text-sm font-semibold text-[#FAF5EA]">{r.title}</h3>
              <p className="mt-1 text-xs text-[#CBBAA6] leading-relaxed">{r.detail}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 h-11 w-full rounded-xl bg-[#D99B16] hover:bg-[#E5A926] text-[#1C1207] font-semibold text-sm cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        >
          Back to Board
        </button>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  winnerColor: PlayerColor;
  totalTurns: number;
  players: PlayerConfig[];
  tokens: Token[];
  stats: Record<PlayerColor, PlayerStats>;
  onPlayAgain: () => void;
  onExitToTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winnerColor,
  totalTurns,
  players,
  tokens,
  stats,
  onPlayAgain,
  onExitToTitle,
}) => {
  const activePlayers = players.filter((p) => p.control !== 'off');
  const winner = players.find((p) => p.color === winnerColor);
  const winnerPalette = COLOR_PALETTE[winnerColor];

  const ranked = [...activePlayers].sort((a, b) => {
    if (a.color === winnerColor) return -1;
    if (b.color === winnerColor) return 1;
    return (
      computePlayerProgressPercent(tokens, b.color) -
      computePlayerProgressPercent(tokens, a.color)
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#261810] border border-[#6E4D35] p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/40"
            style={{ backgroundColor: winnerPalette.primary, color: winnerPalette.textOnPrimary }}
          >
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#CBBAA6] font-mono tabular-nums">
              Match Complete · {totalTurns} {totalTurns === 1 ? 'turn' : 'turns'}
            </p>
            <h2 id="victory-title" className="font-display text-2xl sm:text-3xl font-bold text-[#FAF5EA]">
              {winner?.name || winnerPalette.label} Wins!
            </h2>
          </div>
        </div>

        {/* Standings Table */}
        <div className="mt-5 rounded-xl bg-[#1A100A] border border-[#3E2A1D] divide-y divide-[#2F1F15]">
          {ranked.map((player, idx) => {
            const palette = COLOR_PALETTE[player.color];
            const homeCount = tokens.filter(
              (t) => t.color === player.color && t.progress === 56
            ).length;
            const pStats = stats[player.color];

            return (
              <div
                key={player.color}
                className="px-4 py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono tabular-nums text-xs text-[#9E8C79] w-4">
                    #{idx + 1}
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/60"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <span className="font-medium text-[#FAF5EA] truncate">
                    {player.name || palette.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 font-mono tabular-nums text-xs text-[#D6C7B2] shrink-0">
                  <span>{homeCount}/4 Home</span>
                  <span>{pStats.captures} Capt</span>
                  <span>{pStats.sixes}×6</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="h-11 flex-1 rounded-xl bg-[#D99B16] hover:bg-[#E5A926] text-[#1C1207] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
          <button
            type="button"
            onClick={onExitToTitle}
            className="h-11 px-4 rounded-xl bg-[#362419] hover:bg-[#442D20] text-[#FAF5EA] font-medium text-sm flex items-center justify-center gap-2 border border-[#5A402E] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
