import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { COLOR_PALETTE } from '../game/boardGeometry';
import { MatchRecord } from '../game/types';

interface MatchHistoryPanelProps {
  history: MatchRecord[];
  onClearHistory: () => void;
}

export const MatchHistoryPanel: React.FC<MatchHistoryPanelProps> = ({
  history,
  onClearHistory,
}) => {
  return (
    <aside
      aria-label="Match History"
      className="w-full max-w-[600px] xl:w-[272px] shrink-0 rounded-2xl bg-[#22150E]/92 border border-[#453022] shadow-[0_12px_28px_rgba(0,0,0,0.38)] flex flex-col"
    >
      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-[#36251A] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <History className="w-4 h-4 text-[#D99B16] shrink-0" aria-hidden="true" />
          <h2 className="font-display text-base font-bold text-[#FAF5EA] truncate">
            Match History
          </h2>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            aria-label="Clear match history"
            className="h-8 px-2.5 rounded-lg text-xs font-medium text-[#B9A894] hover:text-[#FAF5EA] hover:bg-[#322116] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Match Results List (Last 5 Games) */}
      {history.length === 0 ? (
        <div className="px-4 py-6 text-xs text-[#9E8C79] leading-relaxed">
          No completed matches yet. Finish a game to log the winner and total turns taken.
        </div>
      ) : (
        <ul className="divide-y divide-[#36251A]">
          {history.slice(0, 5).map((match, idx) => {
            const palette = COLOR_PALETTE[match.winnerColor];
            return (
              <li
                key={match.id}
                className="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono tabular-nums text-[11px] text-[#8F7D6A] w-4 shrink-0">
                    {idx + 1}.
                  </span>
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded-full shrink-0 border border-white/60"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#FAF5EA] truncate">
                      {match.winnerName}
                    </div>
                    <div className="text-[11px] text-[#9E8C79] flex items-center gap-1.5">
                      <span>{match.playerCount}P</span>
                      <span aria-hidden="true">·</span>
                      <span>{match.completedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono tabular-nums text-xs font-semibold text-[#EADBC5]">
                    {match.totalTurns}
                  </div>
                  <div className="text-[11px] text-[#9E8C79]">
                    {match.totalTurns === 1 ? 'turn' : 'turns'}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};
