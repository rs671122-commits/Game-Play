import {
  PLAYER_ORDER,
  SAFE_TRACK_INDICES,
  START_TRACK_INDEX,
} from './boardGeometry';
import { MoveOption, PlayerColor, PlayerConfig, Token } from './types';

export function createInitialTokens(activeColors: PlayerColor[]): Token[] {
  const tokens: Token[] = [];
  for (const color of PLAYER_ORDER) {
    if (!activeColors.includes(color)) continue;
    for (let index = 0; index < 4; index++) {
      tokens.push({
        id: `${color}-${index}`,
        color,
        index,
        progress: -1,
      });
    }
  }
  return tokens;
}

export function getGlobalTrackIndex(color: PlayerColor, progress: number): number | null {
  if (progress < 0 || progress > 50) return null;
  return (START_TRACK_INDEX[color] + progress) % 52;
}

export function isSafeProgress(color: PlayerColor, progress: number): boolean {
  if (progress < 0 || progress >= 51) return true;
  const globalIdx = getGlobalTrackIndex(color, progress);
  return globalIdx !== null && SAFE_TRACK_INDICES.has(globalIdx);
}

export function getLegalMoves(
  tokens: Token[],
  activeColor: PlayerColor,
  diceValue: number
): MoveOption[] {
  const playerTokens = tokens.filter((t) => t.color === activeColor);
  const moves: MoveOption[] = [];

  for (const token of playerTokens) {
    if (token.progress === 56) continue;

    // Leaving yard requires a 6
    if (token.progress === -1) {
      if (diceValue !== 6) continue;
      moves.push({
        tokenId: token.id,
        fromProgress: -1,
        toProgress: 0,
        isCapture: false,
        capturedTokens: [],
        reachesHome: false,
        landsOnSafe: true,
      });
      continue;
    }

    const target = token.progress + diceValue;
    if (target > 56) continue;

    const reachesHome = target === 56;
    const landsOnSafe = isSafeProgress(activeColor, target);
    const targetGlobalIdx = getGlobalTrackIndex(activeColor, target);

    let capturedTokens: Token[] = [];
    if (targetGlobalIdx !== null && !SAFE_TRACK_INDICES.has(targetGlobalIdx)) {
      capturedTokens = tokens.filter((other) => {
        if (other.color === activeColor) return false;
        const otherGlobal = getGlobalTrackIndex(other.color, other.progress);
        return otherGlobal === targetGlobalIdx;
      });
    }

    moves.push({
      tokenId: token.id,
      fromProgress: token.progress,
      toProgress: target,
      isCapture: capturedTokens.length > 0,
      capturedTokens,
      reachesHome,
      landsOnSafe,
    });
  }

  return moves;
}

export function hasPlayerWon(tokens: Token[], color: PlayerColor): boolean {
  const owned = tokens.filter((t) => t.color === color);
  return owned.length === 4 && owned.every((t) => t.progress === 56);
}

export function computePlayerProgressPercent(tokens: Token[], color: PlayerColor): number {
  const owned = tokens.filter((t) => t.color === color);
  if (owned.length === 0) return 0;
  const total = owned.reduce((acc, t) => acc + Math.max(0, t.progress), 0);
  return Math.round((total / (56 * 4)) * 100);
}

export function getActiveColors(players: PlayerConfig[]): PlayerColor[] {
  return players.filter((p) => p.control !== 'off').map((p) => p.color);
}

/**
 * Heuristic tactical AI for Ludo Bot moves
 */
export function chooseBotMove(
  tokens: Token[],
  botColor: PlayerColor,
  diceValue: number
): MoveOption | null {
  const legal = getLegalMoves(tokens, botColor, diceValue);
  if (legal.length === 0) return null;
  if (legal.length === 1) return legal[0];

  const opponents = tokens.filter(
    (t) => t.color !== botColor && t.progress >= 0 && t.progress <= 50
  );

  const countThreatsBehind = (globalIdx: number | null): number => {
    if (globalIdx === null || SAFE_TRACK_INDICES.has(globalIdx)) return 0;
    let threats = 0;
    for (const opp of opponents) {
      const oppIdx = getGlobalTrackIndex(opp.color, opp.progress);
      if (oppIdx === null) continue;
      const dist = (globalIdx - oppIdx + 52) % 52;
      if (dist >= 1 && dist <= 6) {
        threats += 1;
      }
    }
    return threats;
  };

  let bestMove = legal[0];
  let bestScore = -Infinity;

  for (const move of legal) {
    let score = 0;

    // 1. Highest priority: capturing an opponent or reaching Home
    if (move.reachesHome) score += 120;
    if (move.isCapture) score += 105 + move.capturedTokens.length * 20;

    // 2. Bringing a token out of Yard
    if (move.fromProgress === -1) score += 72;

    // 3. Entering safe Home Stretch
    if (move.fromProgress <= 50 && move.toProgress >= 51) score += 68;

    // 4. Landing on a Star/Start safe square
    if (move.landsOnSafe && move.toProgress <= 50) score += 45;

    // 5. Threat assessment (escaping danger vs walking into danger)
    const fromGlobal = getGlobalTrackIndex(botColor, move.fromProgress);
    const toGlobal = getGlobalTrackIndex(botColor, move.toProgress);
    const threatsBefore = countThreatsBehind(fromGlobal);
    const threatsAfter = countThreatsBehind(toGlobal);

    if (threatsBefore > 0 && threatsAfter === 0) {
      score += 42 * threatsBefore;
    } else if (threatsAfter > 0) {
      score -= 28 * threatsAfter;
    }

    // 6. Prefer advancing lead tokens slightly over lagging ones when safe
    score += move.toProgress * 0.45;

    // Tiny deterministic-feeling tiebreaker jitter so bots don't look robotic
    score += Math.random() * 2;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
