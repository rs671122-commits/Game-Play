import { PlayerColor, Token } from './types';

export interface GridCoord {
  row: number;
  col: number;
}

export const PLAYER_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const COLOR_PALETTE: Record<
  PlayerColor,
  {
    label: string;
    primary: string;
    dark: string;
    light: string;
    tint: string;
    ring: string;
    textOnPrimary: string;
  }
> = {
  red: {
    label: 'Crimson',
    primary: '#C82829',
    dark: '#8C1819',
    light: '#E34E4F',
    tint: '#FBEAEA',
    ring: '#FCA5A5',
    textOnPrimary: '#FFFFFF',
  },
  green: {
    label: 'Emerald',
    primary: '#1D8348',
    dark: '#12582F',
    light: '#2EA861',
    tint: '#E8F7EE',
    ring: '#86EFAC',
    textOnPrimary: '#FFFFFF',
  },
  yellow: {
    label: 'Saffron',
    primary: '#D99B16',
    dark: '#966808',
    light: '#F2B830',
    tint: '#FEF7E5',
    ring: '#FDE047',
    textOnPrimary: '#241705',
  },
  blue: {
    label: 'Cobalt',
    primary: '#1E60A8',
    dark: '#133F70',
    light: '#3580D1',
    tint: '#E9F2FC',
    ring: '#93C5FD',
    textOnPrimary: '#FFFFFF',
  },
};

export const START_TRACK_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

/**
 * Global indices (0..51) that are safe from captures:
 * 4 colored Start squares (0, 13, 26, 39) + 4 Star squares (8, 21, 34, 47)
 */
export const SAFE_TRACK_INDICES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);
export const STAR_TRACK_INDICES = new Set<number>([8, 21, 34, 47]);

/**
 * 52-cell clockwise outer track on a 15x15 grid (0..14)
 */
export const MAIN_TRACK_COORDS: GridCoord[] = [
  // 0..4: Red arm top row moving right (0 is Red Start)
  { row: 6, col: 1 },
  { row: 6, col: 2 },
  { row: 6, col: 3 },
  { row: 6, col: 4 },
  { row: 6, col: 5 },
  // 5..10: Top arm left col moving up (8 is Star)
  { row: 5, col: 6 },
  { row: 4, col: 6 },
  { row: 3, col: 6 },
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  // 11..12: Top bridge
  { row: 0, col: 7 },
  { row: 0, col: 8 },
  // 13..17: Top arm right col moving down (13 is Green Start)
  { row: 1, col: 8 },
  { row: 2, col: 8 },
  { row: 3, col: 8 },
  { row: 4, col: 8 },
  { row: 5, col: 8 },
  // 18..23: Right arm top row moving right (21 is Star)
  { row: 6, col: 9 },
  { row: 6, col: 10 },
  { row: 6, col: 11 },
  { row: 6, col: 12 },
  { row: 6, col: 13 },
  { row: 6, col: 14 },
  // 24..25: Right bridge
  { row: 7, col: 14 },
  { row: 8, col: 14 },
  // 26..30: Right arm bottom row moving left (26 is Yellow Start)
  { row: 8, col: 13 },
  { row: 8, col: 12 },
  { row: 8, col: 11 },
  { row: 8, col: 10 },
  { row: 8, col: 9 },
  // 31..36: Bottom arm right col moving down (34 is Star)
  { row: 9, col: 8 },
  { row: 10, col: 8 },
  { row: 11, col: 8 },
  { row: 12, col: 8 },
  { row: 13, col: 8 },
  { row: 14, col: 8 },
  // 37..38: Bottom bridge
  { row: 14, col: 7 },
  { row: 14, col: 6 },
  // 39..43: Bottom arm left col moving up (39 is Blue Start)
  { row: 13, col: 6 },
  { row: 12, col: 6 },
  { row: 11, col: 6 },
  { row: 10, col: 6 },
  { row: 9, col: 6 },
  // 44..49: Left arm bottom row moving left (47 is Star)
  { row: 8, col: 5 },
  { row: 8, col: 4 },
  { row: 8, col: 3 },
  { row: 8, col: 2 },
  { row: 8, col: 1 },
  { row: 8, col: 0 },
  // 50..51: Left bridge
  { row: 7, col: 0 },
  { row: 6, col: 0 },
];

export const HOME_STRETCH_COORDS: Record<PlayerColor, GridCoord[]> = {
  red: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
};

export const YARD_BASE_OFFSET: Record<PlayerColor, GridCoord> = {
  red: { row: 0, col: 0 },
  green: { row: 0, col: 9 },
  yellow: { row: 9, col: 9 },
  blue: { row: 9, col: 0 },
};

const YARD_SLOT_OFFSETS: GridCoord[] = [
  { row: 1.45, col: 1.45 },
  { row: 1.45, col: 3.55 },
  { row: 3.55, col: 1.45 },
  { row: 3.55, col: 3.55 },
];

export function getYardSlotCoord(color: PlayerColor, index: number): GridCoord {
  const base = YARD_BASE_OFFSET[color];
  const slot = YARD_SLOT_OFFSETS[index % 4];
  return {
    row: base.row + slot.row,
    col: base.col + slot.col,
  };
}

/**
 * Center finish coordinates inside each color's home triangle (rows 6..8, cols 6..8)
 */
const FINISH_TRIANGLE_SLOTS: Record<PlayerColor, GridCoord[]> = {
  red: [
    { row: 6.55, col: 6.18 },
    { row: 7.45, col: 6.18 },
    { row: 7.0, col: 6.52 },
    { row: 7.0, col: 5.95 },
  ],
  green: [
    { row: 6.18, col: 6.55 },
    { row: 6.18, col: 7.45 },
    { row: 6.52, col: 7.0 },
    { row: 5.95, col: 7.0 },
  ],
  yellow: [
    { row: 6.55, col: 7.82 },
    { row: 7.45, col: 7.82 },
    { row: 7.0, col: 7.48 },
    { row: 7.0, col: 8.05 },
  ],
  blue: [
    { row: 7.82, col: 6.55 },
    { row: 7.82, col: 7.45 },
    { row: 7.48, col: 7.0 },
    { row: 8.05, col: 7.0 },
  ],
};

export function getCoordForProgress(color: PlayerColor, progress: number, tokenIndex = 0): GridCoord {
  if (progress < 0) {
    return getYardSlotCoord(color, tokenIndex);
  }
  if (progress <= 50) {
    const globalIdx = (START_TRACK_INDEX[color] + progress) % 52;
    return MAIN_TRACK_COORDS[globalIdx];
  }
  if (progress <= 55) {
    return HOME_STRETCH_COORDS[color][progress - 51];
  }
  return FINISH_TRIANGLE_SLOTS[color][tokenIndex % 4];
}

export function getTokenCoord(token: Token): GridCoord {
  return getCoordForProgress(token.color, token.progress, token.index);
}
