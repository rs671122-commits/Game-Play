import React from 'react';
import { BookOpen, Bot, Pause, User, Volume2, VolumeX } from 'lucide-react';
import { COLOR_PALETTE } from '../game/boardGeometry';
import { computePlayerProgressPercent } from '../game/ludoEngine';
import { PlayerColor, PlayerConfig, PlayerStats, Token, TurnPhase } from '../game/types';
import { Dice3D } from './Dice3D';

interface GameHUDProps {
  players: PlayerConfig[];
  tokens: Token[];
  activeColor: PlayerColor;
  turnPhase: TurnPhase;
  diceValue: number;
  rolling: boolean;
  consecutiveSixes: number;
  turnCount: number;
  statusMessage: string;
  stats: Record<PlayerColor, PlayerStats>;
  muted: boolean;
  onRoll: () => void;
  onToggleMute: () => void;
  onOpenRules: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  players,
  tokens,
  activeColor,
  turnPhase,
  diceValue,
  rolling,
  consecutiveSixes,
  turnCount,
  statusMessage,
  stats,
  muted,
  onRoll,
  onToggleMute,
  onOpenRules,
  onPause,
}) => {
  const activePlayers = players.filter((p) => p.control !== 'off');
  const activePlayer = players.find((p) => p.color === activeColor);
  const activePalette = COLOR_PALETTE[activeColor];
  const isHumanTurn = activePlayer?.control === 'human';
  const canHumanRoll = isHumanTurn && turnPhase === 'ROLL' && !rolling;

  return (
    <aside className="w-full max-w-[600px] lg:w-[330px] shrink-0 flex flex-col gap-3.5">
      {/* Utility Row: Title, Turn Counter, Sound, Rules, Pause */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <span className="font-display text-xl font-bold text-[#FAF5EA] truncate">
            Ludo Royal
          </span>
          <span className="font-mono tabular-nums text-xs text-[#A89682] whitespace-nowrap">
            Turn {turnCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            className="h-10 w-10 rounded-xl border border-[#4E3728] bg-[#281A11] hover:bg-[#362317] text-[#E9DCC8] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenRules}
            aria-label="View rules"
            className="h-10 px-3 rounded-xl border border-[#4E3728] bg-[#281A11] hover:bg-[#362317] text-[#E9DCC8] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
          <button
            type="button"
            onClick={onPause}
            aria-label="Pause game"
            className="h-10 w-10 rounded-xl border border-[#4E3728] bg-[#281A11] hover:bg-[#362317] text-[#E9DCC8] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Turn & Tactile Dice Tray */}
      <div
        className="rounded-2xl bg-[#271911]/95 border p-4 flex items-center justify-between gap-4 shadow-[0_12px_28px_rgba(0,0,0,0.42)]"
        style={{ borderColor: `${activePalette.primary}88` }}
      >
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="w-3 h-3 rounded-full shrink-0 border border-white/70"
              style={{ backgroundColor: activePalette.primary }}
            />
            <span className="text-sm font-semibold text-[#FAF5EA] truncate">
              {activePlayer?.name || activePalette.label}
            </span>
            <span className="text-xs text-[#B9A894] whitespace-nowrap">
              · {isHumanTurn ? 'Your Turn' : 'Bot Turn'}
            </span>
          </div>

          <p className="text-xs text-[#DFD2C0] leading-snug min-h-[2.25em]">
            {statusMessage}
          </p>

          <div className="flex items-center gap-3 pt-0.5">
            {canHumanRoll ? (
              <button
                type="button"
                onClick={onRoll}
                className="h-10 px-4 rounded-xl text-xs font-semibold tracking-wide transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                style={{
                  backgroundColor: activePalette.primary,
                  color: activePalette.textOnPrimary,
                }}
              >
                Roll Dice (Space)
              </button>
            ) : (
              <span className="text-xs font-mono tabular-nums text-[#A89682]">
                {turnPhase === 'SELECT_TOKEN'
                  ? 'Pick a highlighted token (1–4)'
                  : consecutiveSixes > 0
                  ? `Streak: ${consecutiveSixes}×6`
                  : `Last roll: ${diceValue}`}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <Dice3D
            value={diceValue}
            rolling={rolling}
            canRoll={canHumanRoll}
            activeColor={activeColor}
            onRoll={onRoll}
            size="lg"
          />
        </div>
      </div>

      {/* Player Roster & Home Progress */}
      <div className="rounded-2xl bg-[#22150E]/90 border border-[#453022] divide-y divide-[#36251A]">
        {activePlayers.map((player) => {
          const palette = COLOR_PALETTE[player.color];
          const isTurn = player.color === activeColor;
          const owned = tokens.filter((t) => t.color === player.color);
          const homeCount = owned.filter((t) => t.progress === 56).length;
          const pct = computePlayerProgressPercent(tokens, player.color);
          const playerStats = stats[player.color];

          return (
            <div
              key={player.color}
              className={`px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                isTurn ? 'bg-[#322116]' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  aria-hidden="true"
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/60"
                  style={{ backgroundColor: palette.primary }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[#FAF5EA] truncate">
                      {player.name || palette.label}
                    </span>
                    <span className="text-[#9E8C79] shrink-0" aria-label={player.control === 'bot' ? 'Bot' : 'Human'}>
                      {player.control === 'bot' ? (
                        <Bot className="w-3.5 h-3.5" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-[#150D08] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(4, pct)}%`,
                        backgroundColor: palette.primary,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-right font-mono tabular-nums text-xs">
                <div>
                  <div className="text-[#FAF5EA] font-semibold">{homeCount}/4</div>
                  <div className="text-[11px] text-[#9E8C79]">Home</div>
                </div>
                <div>
                  <div className="text-[#DFD2C0]">{playerStats.captures}</div>
                  <div className="text-[11px] text-[#9E8C79]">Capt</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Keyboard Hint */}
      <p className="hidden lg:block text-[11px] text-[#9B8976] px-1">
        Space Roll · 1–4 Select Token · Esc Pause
      </p>
    </aside>
  );
};
