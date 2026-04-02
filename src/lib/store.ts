/**
 * In-memory game store using a module-level Map.
 *
 * NOTE: This approach is suitable for demos on a single server instance.
 * On Vercel's serverless platform, multiple function instances may not share
 * this Map. For production multi-player use, replace with Vercel KV / Upstash Redis.
 */

import type { GameState } from "@/types/game";

declare global {
  // eslint-disable-next-line no-var
  var __gameStore: Map<string, GameState> | undefined;
}

// Reuse the Map across hot reloads in dev
if (!global.__gameStore) {
  global.__gameStore = new Map<string, GameState>();
}

const store = global.__gameStore;

export function createRoom(roomId: string): GameState {
  const state: GameState = {
    roomId,
    status: "waiting_for_p2",
    maxNumber: null,
    choices: { player1: null, player2: null },
    outcome: null,
    createdAt: Date.now(),
  };
  store.set(roomId, state);
  return state;
}

export function getRoom(roomId: string): GameState | undefined {
  return store.get(roomId);
}

export function updateRoom(roomId: string, patch: Partial<GameState>): GameState | null {
  const existing = store.get(roomId);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  store.set(roomId, updated);
  return updated;
}
