import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/lib/store";
import type { PlayerRole, RoomView } from "@/types/game";

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
): Promise<NextResponse<RoomView | { error: string }>> {
  const role = request.nextUrl.searchParams.get("role") as PlayerRole | null;

  if (role !== "player1" && role !== "player2") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const state = getRoom(params.roomId);
  if (!state) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const myChoice = state.choices[role];
  const opponentRole: PlayerRole = role === "player1" ? "player2" : "player1";
  const opponentChose = state.choices[opponentRole] !== null;

  const view: RoomView = {
    roomId: state.roomId,
    status: state.status,
    maxNumber: state.maxNumber,
    myChoice,
    opponentChose,
    outcome: state.outcome,
    outcomeNumbers:
      state.status === "reveal" &&
      state.choices.player1 !== null &&
      state.choices.player2 !== null
        ? {
            player1: state.choices.player1,
            player2: state.choices.player2,
          }
        : null,
  };

  return NextResponse.json(view);
}
