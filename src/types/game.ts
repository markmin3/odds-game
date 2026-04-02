export type PlayerRole = "player1" | "player2";

/**
 * waiting_for_p2 — room created, waiting for Player 2 to join
 * set_max        — both present, Player 1 sets the maximum number
 * choosing       — both players choose simultaneously
 * reveal         — both chose, outcome computed
 */
export type GameStatus = "waiting_for_p2" | "set_max" | "choosing" | "reveal";

/** Server-side canonical state (never sent raw to client) */
export interface GameState {
  roomId: string;
  status: GameStatus;
  /** String representation of a BigInt value */
  maxNumber: string | null;
  choices: {
    player1: string | null;
    player2: string | null;
  };
  outcome: "success" | "failed" | null;
  createdAt: number;
}

/** Client-facing projection — hides opponent's choice until reveal */
export interface RoomView {
  roomId: string;
  status: GameStatus;
  maxNumber: string | null;
  myChoice: string | null;
  opponentChose: boolean;
  outcome: "success" | "failed" | null;
  /** Only populated during "reveal" phase */
  outcomeNumbers: { player1: string; player2: string } | null;
}

// ─── Action Types ────────────────────────────────────────────────────────────

export interface JoinAction {
  type: "join";
}

export interface SetMaxAction {
  type: "set_max";
  max: string;
}

export interface ChooseAction {
  type: "choose";
  number: string;
}

export interface RestartAction {
  type: "restart";
}

export type GameAction = JoinAction | SetMaxAction | ChooseAction | RestartAction;

export interface ActionRequest {
  role: PlayerRole;
  action: GameAction;
}

export interface CreateRoomResponse {
  roomId: string;
}

export interface ActionResponse {
  ok: boolean;
  error?: string;
}
