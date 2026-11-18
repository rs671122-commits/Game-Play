export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type PlayerControl = 'human' | 'bot' | 'off';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type TurnPhase = 'ROLL' | 'SELECT_TOKEN' | 'ANIMATING' | 'TURN_TRANSITION';

export interface Token {
  id: string;
  color: PlayerColor;
  index: number; // 0..3
  /**
   * -1 = In Home Yard
   * 0..50 = On 52-cell main track (relative to player's start square)
   * 51..55 = On player's colored Home Stretch
   * 56 = Finished inside Center Home Sanctuary
   */
  progress: number;
}

export interface PlayerConfig {
  color: PlayerColor;
  name: string;
  control: PlayerControl;
}

export interface PlayerStats {
  rolls: number;
  sixes: number;
  captures: number;
  losses: number;
}

export interface MoveOption {
  tokenId: string;
  fromProgress: number;
  toProgress: number;
  isCapture: boolean;
  capturedTokens: Token[];
  reachesHome: boolean;
  landsOnSafe: boolean;
}

export interface BurstEffect {
  id: string;
  row: number;
  col: number;
  color: PlayerColor;
  kind: 'capture' | 'home' | 'exit';
}

export interface MatchRecord {
  id: string;
  winnerColor: PlayerColor;
  winnerName: string;
  totalTurns: number;
  playerCount: number;
  completedAt: string;
}
