import React, { useEffect } from 'react';
import { Bot, Play, User, UserX, Volume2, VolumeX } from 'lucide-react';
import { COLOR_PALETTE, PLAYER_ORDER } from '../game/boardGeometry';
import { createInitialTokens, getActiveColors } from '../game/ludoEngine';
import { PlayerColor, PlayerConfig, PlayerControl } from '../game/types';
import { LudoBoard } from './LudoBoard';

interface TitleScreenProps {
  players: PlayerConfig[];
  muted: boolean;
  onUpdatePlayer: (color: PlayerColor, patch: Partial<PlayerConfig>) => void;
  onApplyPreset: (preset: 'solo' | 'duel' | 'pass4') => void;
  onToggleMute: () => void;
  onStartMatch: () => void;
}

const PREVIEW_TOKENS = createInitialTokens(PLAYER_ORDER);

export const TitleScreen: React.FC<TitleScreenProps> = ({
  players,
  muted,
  onUpdatePlayer,
  onApplyPreset,
  onToggleMute,
  onStartMatch,
}) => {
  const activeColors = getActiveColors(players);
  const canStart = activeColors.length >= 2;
  const inactiveColors = PLAYER_ORDER.filter((c) => !activeColors.includes(c));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'Enter' || e.key === ' ') && canStart) {
        e.preventDefault();
        onStartMatch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canStart, onStartMatch]);

  return (
    <div className="walnut-tabletop relative min-h-screen w-full flex flex-col justify-between px-4 py-4 sm:px-8 sm:py-6 overflow-x-hidden">
      {/* Main Split Stage: Live Board Showcase + Calm Setup Panel */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 max-w-[1280px] w-full mx-auto">
        {/* Live Ludo Board Centerpiece */}
        <div className="w-[min(86vw,440px)] lg:w-[min(calc(100vh-120px),580px)] aspect-square shrink-0">
          <LudoBoard
            tokens={PREVIEW_TOKENS}
            activeColor="red"
            legalMoves={[]}
            canSelectToken={false}
            hoppingTokenId={null}
            bursts={[]}
            onSelectToken={() => {}}
            interactive={false}
            inactiveColors={inactiveColors}
          />
        </div>

        {/* Dedicated Title & Match Setup Panel */}
        <div className="w-full max-w-[440px] flex flex-col gap-5">
          {/* Bespoke SVG Title Lockup + Sound Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <svg
                  viewBox="0 0 44 44"
                  className="w-10 h-10 shrink-0"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="3"
                    width="38"
                    height="38"
                    rx="9"
                    fill="#F7EFE0"
                    stroke="#C59B49"
                    strokeWidth="2.5"
                  />
                  <circle cx="14" cy="14" r="3.4" fill="#C82829" />
                  <circle cx="30" cy="14" r="3.4" fill="#1D8348" />
                  <circle cx="22" cy="22" r="3.4" fill="#231A13" />
                  <circle cx="14" cy="30" r="3.4" fill="#1E60A8" />
                  <circle cx="30" cy="30" r="3.4" fill="#D99B16" />
                </svg>
                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#FAF5EA] leading-none">
                  Ludo Royal
                </h1>
              </div>
              <p className="mt-2.5 text-sm text-[#D6C7B2] leading-relaxed">
                Classic cross-and-circle board race · 2 to 4 players · Pass &amp; play or AI opponents
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
              className="h-11 w-11 shrink-0 rounded-xl border border-[#5A402E] bg-[#2D1D13]/90 hover:bg-[#3A261A] text-[#E9DCC8] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Quick Mode Presets (Interactive segmented controls) */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#160E09]/80 border border-[#4A3425]">
            <button
              type="button"
              onClick={() => onApplyPreset('solo')}
              className="flex-1 h-10 px-3 rounded-lg text-xs sm:text-sm font-medium text-[#EFE5D6] hover:bg-[#3A261A] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              1 vs 3 Bots
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('duel')}
              className="flex-1 h-10 px-3 rounded-lg text-xs sm:text-sm font-medium text-[#EFE5D6] hover:bg-[#3A261A] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              1 vs 1 Duel
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('pass4')}
              className="flex-1 h-10 px-3 rounded-lg text-xs sm:text-sm font-medium text-[#EFE5D6] hover:bg-[#3A261A] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              4P Pass &amp; Play
            </button>
          </div>

          {/* 4 Seat Configuration Rows */}
          <div className="rounded-2xl bg-[#271911]/90 border border-[#4B3424] divide-y divide-[#3D2A1D]">
            {players.map((player) => {
              const palette = COLOR_PALETTE[player.color];
              const isOff = player.control === 'off';

              const controls: { id: PlayerControl; label: string; icon: React.ReactNode }[] = [
                { id: 'human', label: 'Human', icon: <User className="w-3.5 h-3.5" /> },
                { id: 'bot', label: 'Bot', icon: <Bot className="w-3.5 h-3.5" /> },
                { id: 'off', label: 'Off', icon: <UserX className="w-3.5 h-3.5" /> },
              ];

              return (
                <div
                  key={player.color}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      aria-hidden="true"
                      className="w-4 h-4 rounded-full shrink-0 border border-white/60 shadow-sm"
                      style={{
                        backgroundColor: palette.primary,
                        opacity: isOff ? 0.35 : 1,
                      }}
                    />
                    <input
                      type="text"
                      maxLength={14}
                      value={player.name}
                      disabled={isOff}
                      aria-label={`${palette.label} player name`}
                      onChange={(e) => onUpdatePlayer(player.color, { name: e.target.value })}
                      className={`w-full min-w-0 bg-transparent text-sm font-medium focus:outline-none focus:border-b focus:border-amber-400/70 truncate ${
                        isOff ? 'text-[#8C7A68]' : 'text-[#FAF5EA]'
                      }`}
                    />
                  </div>

                  {/* Seat Control Segmented Switch */}
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[#18100B] border border-[#3E2B1E] shrink-0">
                    {controls.map((opt) => {
                      const selected = player.control === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onUpdatePlayer(player.color, { control: opt.id })}
                          aria-pressed={selected}
                          className={`h-8 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                            selected
                              ? 'bg-[#EAE0CE] text-[#1D130D] shadow-sm'
                              : 'text-[#B9A894] hover:text-[#FAF5EA]'
                          }`}
                        >
                          {opt.icon}
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Start CTA */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={!canStart}
              onClick={onStartMatch}
              className="h-12 w-full rounded-xl bg-[#D99B16] hover:bg-[#E5A926] active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none text-[#1C1207] font-semibold text-base flex items-center justify-center gap-2.5 shadow-[0_8px_24px_rgba(217,155,22,0.28)] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Match</span>
            </button>
            {!canStart && (
              <p className="text-xs text-amber-300 text-center">
                Select at least 2 active players to start.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Single Flat Control Hint Line */}
      <p className="mt-4 text-center text-xs text-[#A89682] tracking-wide">
        Enter or Space Start Match · Space Roll Dice · 1–4 Select Token · Esc Pause
      </p>
    </div>
  );
};
