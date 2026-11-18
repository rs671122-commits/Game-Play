import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { LudoBoard } from './components/LudoBoard';
import { MatchHistoryPanel } from './components/MatchHistoryPanel';
import { PauseModal, RulesModal, VictoryModal } from './components/Overlays';
import { TitleScreen } from './components/TitleScreen';
import { COLOR_PALETTE, PLAYER_ORDER, getCoordForProgress } from './game/boardGeometry';
import {
  chooseBotMove,
  createInitialTokens,
  getActiveColors,
  getLegalMoves,
  hasPlayerWon,
} from './game/ludoEngine';
import { soundEngine } from './game/sound';
import {
  BurstEffect,
  GameState,
  MatchRecord,
  MoveOption,
  PlayerColor,
  PlayerConfig,
  PlayerStats,
  Token,
  TurnPhase,
} from './game/types';

const HISTORY_STORAGE_KEY = 'ludo_royal_match_history';

function loadMatchHistory(): MatchRecord[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveMatchHistory(records: MatchRecord[]) {
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records.slice(0, 5)));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

const DEFAULT_PLAYERS: PlayerConfig[] = [
  { color: 'red', name: 'Player 1', control: 'human' },
  { color: 'green', name: 'Emerald Bot', control: 'bot' },
  { color: 'yellow', name: 'Saffron Bot', control: 'bot' },
  { color: 'blue', name: 'Cobalt Bot', control: 'bot' },
];

function createEmptyStats(): Record<PlayerColor, PlayerStats> {
  return {
    red: { rolls: 0, sixes: 0, captures: 0, losses: 0 },
    green: { rolls: 0, sixes: 0, captures: 0, losses: 0 },
    yellow: { rolls: 0, sixes: 0, captures: 0, losses: 0 },
    blue: { rolls: 0, sixes: 0, captures: 0, losses: 0 },
  };
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [players, setPlayers] = useState<PlayerConfig[]>(DEFAULT_PLAYERS);
  const [tokens, setTokens] = useState<Token[]>(() => createInitialTokens(PLAYER_ORDER));
  const [activeColor, setActiveColor] = useState<PlayerColor>('red');
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('ROLL');
  const [diceValue, setDiceValue] = useState<number>(6);
  const [rolling, setRolling] = useState<boolean>(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Roll the dice to begin.');
  const [stats, setStats] = useState<Record<PlayerColor, PlayerStats>>(createEmptyStats);
  const [winnerColor, setWinnerColor] = useState<PlayerColor | null>(null);
  const [hoppingTokenId, setHoppingTokenId] = useState<string | null>(null);
  const [bursts, setBursts] = useState<BurstEffect[]>([]);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>(loadMatchHistory);

  const timersRef = useRef<number[]>([]);
  const sessionRef = useRef<number>(0);
  const tokensRef = useRef<Token[]>(tokens);
  tokensRef.current = tokens;
  const turnCountRef = useRef<number>(turnCount);
  turnCountRef.current = turnCount;

  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const activeColors = useMemo(() => getActiveColors(players), [players]);
  const inactiveColors = useMemo(
    () => PLAYER_ORDER.filter((c) => !activeColors.includes(c)),
    [activeColors]
  );

  const activePlayer = useMemo(
    () => players.find((p) => p.color === activeColor),
    [players, activeColor]
  );

  const legalMoves = useMemo(() => {
    if (turnPhase !== 'SELECT_TOKEN') return [];
    return getLegalMoves(tokens, activeColor, diceValue);
  }, [turnPhase, tokens, activeColor, diceValue]);

  const spawnBurst = useCallback(
    (row: number, col: number, color: PlayerColor, kind: BurstEffect['kind']) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setBursts((prev) => [...prev, { id, row, col, color, kind }]);
      scheduleTimer(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 520);
    },
    [scheduleTimer]
  );

  const advanceTurn = useCallback(
    (fromColor: PlayerColor, reason?: string) => {
      const idx = activeColors.indexOf(fromColor);
      const nextColor = activeColors[(idx + 1) % activeColors.length];
      const nextPlayer = players.find((p) => p.color === nextColor);
      setActiveColor(nextColor);
      setTurnPhase('ROLL');
      setConsecutiveSixes(0);
      setTurnCount((prev) => prev + 1);
      setStatusMessage(
        reason ?? `${nextPlayer?.name || COLOR_PALETTE[nextColor].label}'s turn to roll.`
      );
    },
    [activeColors, players]
  );

  const executeMove = useCallback(
    (move: MoveOption, rolledValue: number) => {
      const sessionAtStart = sessionRef.current;
      setTurnPhase('ANIMATING');

      const movingToken = tokensRef.current.find((t) => t.id === move.tokenId);
      if (!movingToken) return;

      const ownerName =
        players.find((p) => p.color === movingToken.color)?.name ||
        COLOR_PALETTE[movingToken.color].label;

      // Build step-by-step progress sequence
      const steps: number[] = [];
      if (move.fromProgress === -1) {
        steps.push(0);
      } else {
        for (let p = move.fromProgress + 1; p <= move.toProgress; p++) {
          steps.push(p);
        }
      }

      const stepDelay = 105;

      steps.forEach((stepProgress, idx) => {
        scheduleTimer(() => {
          if (sessionRef.current !== sessionAtStart) return;
          setHoppingTokenId(movingToken.id);
          soundEngine.playStepHop(idx);
          setTokens((prev) =>
            prev.map((t) => (t.id === movingToken.id ? { ...t, progress: stepProgress } : t))
          );

          scheduleTimer(() => {
            if (sessionRef.current !== sessionAtStart) return;
            setHoppingTokenId((curr) => (curr === movingToken.id ? null : curr));
          }, 85);
        }, idx * stepDelay);
      });

      const finishTime = steps.length * stepDelay + 60;

      scheduleTimer(() => {
        if (sessionRef.current !== sessionAtStart) return;

        // Apply captures if any
        const capturedIds = new Set(move.capturedTokens.map((c) => c.id));
        const destCoord = getCoordForProgress(
          movingToken.color,
          move.toProgress,
          movingToken.index
        );

        const nextTokens = tokensRef.current.map((t) => {
          if (t.id === movingToken.id) return { ...t, progress: move.toProgress };
          if (capturedIds.has(t.id)) return { ...t, progress: -1 };
          return t;
        });
        setTokens(nextTokens);

        if (move.isCapture) {
          soundEngine.playCapture();
          spawnBurst(destCoord.row, destCoord.col, movingToken.color, 'capture');
          setStats((prev) => {
            const next = { ...prev };
            next[movingToken.color] = {
              ...next[movingToken.color],
              captures: next[movingToken.color].captures + move.capturedTokens.length,
            };
            for (const cap of move.capturedTokens) {
              next[cap.color] = {
                ...next[cap.color],
                losses: next[cap.color].losses + 1,
              };
            }
            return next;
          });
        } else if (move.reachesHome) {
          soundEngine.playHomeReach();
          spawnBurst(destCoord.row, destCoord.col, movingToken.color, 'home');
        } else if (move.fromProgress === -1) {
          spawnBurst(destCoord.row, destCoord.col, movingToken.color, 'exit');
        }

        // Check win condition deterministically
        scheduleTimer(() => {
          if (sessionRef.current !== sessionAtStart) return;

          if (hasPlayerWon(nextTokens, movingToken.color)) {
            soundEngine.playVictory();
            const record: MatchRecord = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              winnerColor: movingToken.color,
              winnerName: ownerName,
              totalTurns: turnCountRef.current,
              playerCount: activeColors.length,
              completedAt: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
            setMatchHistory((prev) => {
              const updated = [record, ...prev].slice(0, 5);
              saveMatchHistory(updated);
              return updated;
            });
            setWinnerColor(movingToken.color);
            setGameState('GAME_OVER');
            setStatusMessage(`${ownerName} brought all 4 tokens Home!`);
            return;
          }

          // Check bonus roll conditions: rolled 6, captured opponent, or reached Home
          const earnedBonus =
            rolledValue === 6 || move.isCapture || move.reachesHome;

          if (earnedBonus) {
            setTurnPhase('ROLL');
            if (move.isCapture) {
              setStatusMessage(`${ownerName} captured a rival · Bonus roll!`);
            } else if (move.reachesHome) {
              setStatusMessage(`${ownerName} reached Home · Bonus roll!`);
            } else {
              setStatusMessage(`${ownerName} rolled 6 · Roll again!`);
            }
          } else {
            setTurnPhase('TURN_TRANSITION');
            scheduleTimer(() => {
              if (sessionRef.current !== sessionAtStart) return;
              advanceTurn(movingToken.color);
            }, 180);
          }
        }, 40);
      }, finishTime);
    },
    [activeColors.length, advanceTurn, players, scheduleTimer, spawnBurst]
  );

  const handleRollDice = useCallback(() => {
    if (gameState !== 'PLAYING' || turnPhase !== 'ROLL' || rolling) return;

    const sessionAtStart = sessionRef.current;
    setRolling(true);
    soundEngine.playDiceRoll();

    // Quick visual dice face cycle during tumble
    const rollTicks = [1, 2, 3, 4];
    rollTicks.forEach((step) => {
      scheduleTimer(() => {
        if (sessionRef.current !== sessionAtStart) return;
        setDiceValue(Math.floor(Math.random() * 6) + 1);
      }, step * 65);
    });

    scheduleTimer(() => {
      if (sessionRef.current !== sessionAtStart) return;

      const finalRoll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(finalRoll);
      setRolling(false);

      const currentName =
        players.find((p) => p.color === activeColor)?.name ||
        COLOR_PALETTE[activeColor].label;

      setStats((prev) => ({
        ...prev,
        [activeColor]: {
          ...prev[activeColor],
          rolls: prev[activeColor].rolls + 1,
          sixes: prev[activeColor].sixes + (finalRoll === 6 ? 1 : 0),
        },
      }));

      const nextSixStreak = finalRoll === 6 ? consecutiveSixes + 1 : 0;
      setConsecutiveSixes(nextSixStreak);

      // Classic Three-Sixes Penalty
      if (nextSixStreak >= 3) {
        setStatusMessage(`${currentName} rolled three 6s in a row · Turn forfeited.`);
        setTurnPhase('TURN_TRANSITION');
        scheduleTimer(() => {
          if (sessionRef.current !== sessionAtStart) return;
          advanceTurn(activeColor);
        }, 900);
        return;
      }

      if (finalRoll === 6) {
        soundEngine.playSixBonus();
      }

      const moves = getLegalMoves(tokens, activeColor, finalRoll);
      if (moves.length === 0) {
        setStatusMessage(`${currentName} rolled ${finalRoll} · No legal moves.`);
        setTurnPhase('TURN_TRANSITION');
        scheduleTimer(() => {
          if (sessionRef.current !== sessionAtStart) return;
          advanceTurn(activeColor);
        }, 720);
        return;
      }

      setTurnPhase('SELECT_TOKEN');
      setStatusMessage(
        `${currentName} rolled ${finalRoll} · ${
          activePlayer?.control === 'bot' ? 'Choosing move…' : 'Select a token to move.'
        }`
      );
    }, 340);
  }, [
    activeColor,
    activePlayer?.control,
    advanceTurn,
    consecutiveSixes,
    gameState,
    players,
    rolling,
    scheduleTimer,
    tokens,
    turnPhase,
  ]);

  const handleSelectToken = useCallback(
    (tokenId: string) => {
      if (gameState !== 'PLAYING' || turnPhase !== 'SELECT_TOKEN') return;
      if (activePlayer?.control !== 'human') return;
      const move = legalMoves.find((m) => m.tokenId === tokenId);
      if (!move) return;
      executeMove(move, diceValue);
    },
    [activePlayer?.control, diceValue, executeMove, gameState, legalMoves, turnPhase]
  );

  // Automated AI Bot Turn Loop
  useEffect(() => {
    if (gameState !== 'PLAYING' || showRules) return;
    if (activePlayer?.control !== 'bot') return;

    if (turnPhase === 'ROLL' && !rolling) {
      const id = window.setTimeout(() => {
        handleRollDice();
      }, 520);
      return () => window.clearTimeout(id);
    }

    if (turnPhase === 'SELECT_TOKEN') {
      const id = window.setTimeout(() => {
        const chosen = chooseBotMove(tokens, activeColor, diceValue);
        if (chosen) {
          executeMove(chosen, diceValue);
        } else {
          advanceTurn(activeColor);
        }
      }, 580);
      return () => window.clearTimeout(id);
    }
  }, [
    activeColor,
    activePlayer?.control,
    advanceTurn,
    diceValue,
    executeMove,
    gameState,
    handleRollDice,
    rolling,
    showRules,
    tokens,
    turnPhase,
  ]);

  // Global Keyboard Shortcuts during Active Play / Pause
  useEffect(() => {
    if (gameState === 'TITLE_MENU') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showRules) {
          setShowRules(false);
          return;
        }
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
        return;
      }

      if (gameState !== 'PLAYING' || showRules) return;
      if (activePlayer?.control !== 'human') return;

      if (e.key === ' ') {
        e.preventDefault();
        if (turnPhase === 'ROLL' && !rolling) {
          handleRollDice();
        } else if (turnPhase === 'SELECT_TOKEN' && legalMoves.length === 1) {
          executeMove(legalMoves[0], diceValue);
        }
      } else if (
        turnPhase === 'SELECT_TOKEN' &&
        ['1', '2', '3', '4'].includes(e.key)
      ) {
        const slotIndex = Number(e.key) - 1;
        const targetId = `${activeColor}-${slotIndex}`;
        const move = legalMoves.find((m) => m.tokenId === targetId);
        if (move) {
          e.preventDefault();
          executeMove(move, diceValue);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeColor,
    activePlayer?.control,
    diceValue,
    executeMove,
    gameState,
    handleRollDice,
    legalMoves,
    rolling,
    showRules,
    turnPhase,
  ]);

  const startFreshMatch = useCallback(
    (customPlayers?: PlayerConfig[]) => {
      clearAllTimers();
      sessionRef.current += 1;

      const roster = customPlayers ?? players;
      const active = getActiveColors(roster);
      if (active.length < 2) return;

      const firstColor = active[0];
      const firstName =
        roster.find((p) => p.color === firstColor)?.name ||
        COLOR_PALETTE[firstColor].label;

      soundEngine.playButtonClick();
      setTokens(createInitialTokens(active));
      setActiveColor(firstColor);
      setTurnPhase('ROLL');
      setDiceValue(6);
      setRolling(false);
      setConsecutiveSixes(0);
      setStats(createEmptyStats());
      setWinnerColor(null);
      setHoppingTokenId(null);
      setBursts([]);
      setShowRules(false);
      setTurnCount(1);
      setStatusMessage(`${firstName}'s turn · Roll the dice!`);
      setGameState('PLAYING');
    },
    [clearAllTimers, players]
  );

  const handleUpdatePlayer = useCallback(
    (color: PlayerColor, patch: Partial<PlayerConfig>) => {
      setPlayers((prev) =>
        prev.map((p) => (p.color === color ? { ...p, ...patch } : p))
      );
    },
    []
  );

  const handleApplyPreset = useCallback((preset: 'solo' | 'duel' | 'pass4') => {
    soundEngine.playButtonClick();
    if (preset === 'solo') {
      setPlayers([
        { color: 'red', name: 'Player 1', control: 'human' },
        { color: 'green', name: 'Emerald Bot', control: 'bot' },
        { color: 'yellow', name: 'Saffron Bot', control: 'bot' },
        { color: 'blue', name: 'Cobalt Bot', control: 'bot' },
      ]);
    } else if (preset === 'duel') {
      setPlayers([
        { color: 'red', name: 'Player 1', control: 'human' },
        { color: 'green', name: 'Emerald', control: 'off' },
        { color: 'yellow', name: 'Saffron Bot', control: 'bot' },
        { color: 'blue', name: 'Cobalt', control: 'off' },
      ]);
    } else {
      setPlayers([
        { color: 'red', name: 'Crimson', control: 'human' },
        { color: 'green', name: 'Emerald', control: 'human' },
        { color: 'yellow', name: 'Saffron', control: 'human' },
        { color: 'blue', name: 'Cobalt', control: 'human' },
      ]);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleExitToTitle = useCallback(() => {
    clearAllTimers();
    sessionRef.current += 1;
    setRolling(false);
    setHoppingTokenId(null);
    setBursts([]);
    setShowRules(false);
    setGameState('TITLE_MENU');
  }, [clearAllTimers]);

  if (gameState === 'TITLE_MENU') {
    return (
      <TitleScreen
        players={players}
        muted={muted}
        onUpdatePlayer={handleUpdatePlayer}
        onApplyPreset={handleApplyPreset}
        onToggleMute={handleToggleMute}
        onStartMatch={() => startFreshMatch()}
      />
    );
  }

  const canHumanSelectToken =
    gameState === 'PLAYING' &&
    turnPhase === 'SELECT_TOKEN' &&
    activePlayer?.control === 'human';

  const handleClearHistory = useCallback(() => {
    soundEngine.playButtonClick();
    setMatchHistory([]);
    saveMatchHistory([]);
  }, []);

  return (
    <main className="walnut-tabletop min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-5 overflow-x-hidden">
      <div className="w-full max-w-[1360px] flex flex-col xl:flex-row items-center justify-center gap-5 xl:gap-7">
        {/* Left Side Panel: Match History (Last 5 Games) */}
        <div className="order-3 xl:order-1 w-full xl:w-auto flex justify-center">
          <MatchHistoryPanel
            history={matchHistory}
            onClearHistory={handleClearHistory}
          />
        </div>

        {/* Primary Playfield: Responsive Square Ludo Board */}
        <div className="order-1 xl:order-2 w-[min(94vw,calc(100vh-260px))] lg:w-[min(calc(100vh-52px),calc(100vw-400px))] xl:w-[min(calc(100vh-52px),calc(100vw-720px))] aspect-square shrink-0">
          <LudoBoard
            tokens={tokens}
            activeColor={activeColor}
            legalMoves={legalMoves}
            canSelectToken={canHumanSelectToken}
            hoppingTokenId={hoppingTokenId}
            bursts={bursts}
            onSelectToken={handleSelectToken}
            inactiveColors={inactiveColors}
          />
        </div>

        {/* Right Side Panel: Unobtrusive Turn & Dice HUD Console */}
        <div className="order-2 xl:order-3 w-full lg:w-auto flex justify-center">
          <GameHUD
            players={players}
            tokens={tokens}
            activeColor={activeColor}
            turnPhase={turnPhase}
            diceValue={diceValue}
            rolling={rolling}
            consecutiveSixes={consecutiveSixes}
            turnCount={turnCount}
            statusMessage={statusMessage}
            stats={stats}
            muted={muted}
            onRoll={handleRollDice}
            onToggleMute={handleToggleMute}
            onOpenRules={() => setShowRules(true)}
            onPause={() => setGameState('PAUSED')}
          />
        </div>
      </div>

      {/* Modals */}
      {gameState === 'PAUSED' && !showRules && (
        <PauseModal
          onResume={() => setGameState('PLAYING')}
          onRestart={() => startFreshMatch()}
          onExitToTitle={handleExitToTitle}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {gameState === 'GAME_OVER' && winnerColor && (
        <VictoryModal
          winnerColor={winnerColor}
          totalTurns={turnCount}
          players={players}
          tokens={tokens}
          stats={stats}
          onPlayAgain={() => startFreshMatch()}
          onExitToTitle={handleExitToTitle}
        />
      )}
    </main>
  );
}
