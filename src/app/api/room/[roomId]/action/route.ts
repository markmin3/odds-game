import { NextRequest, NextResponse } from "next/server";
import { getRoom, updateRoom } from "@/lib/store";
import type { ActionRequest, ActionResponse, GameState } from "@/types/game";

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
): Promise<NextResponse<ActionResponse>> {
  let body: ActionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { role, action } = body;

  if (role !== "player1" && role !== "player2") {
    return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
  }

  const state = getRoom(params.roomId);
  if (!state) {
    return NextResponse.json({ ok: false, error: "Room not found" }, { status: 404 });
  }

  switch (action.type) {
    case "join": {
      if (state.status !== "waiting_for_p2") {
        return NextResponse.json({ ok: false, error: "Room already has two players" }, { status: 400 });
      }
      if (role !== "player2") {
        return NextResponse.json({ ok: false, error: "Only player2 can join" }, { status: 400 });
      }
      updateRoom(params.roomId, { status: "set_max" });
      return NextResponse.json({ ok: true });
    }

    case "set_max": {
      if (state.status !== "set_max") {
        return NextResponse.json({ ok: false, error: "Not in set_max phase" }, { status: 400 });
      }
      if (role !== "player1") {
        return NextResponse.json({ ok: false, error: "Only player1 can set the max" }, { status: 400 });
      }
      let maxBig: bigint;
      try {
        maxBig = BigInt(action.max);
      } catch {
        return NextResponse.json({ ok: false, error: "Max must be a whole number" }, { status: 400 });
      }
      if (maxBig < 2n || maxBig > 9223372036854775807n) {
        return NextResponse.json(
          { ok: false, error: "Max must be between 2 and 9,223,372,036,854,775,807" },
          { status: 400 }
        );
      }
      updateRoom(params.roomId, { maxNumber: maxBig.toString(), status: "choosing" });
      return NextResponse.json({ ok: true });
    }

    case "choose": {
      if (state.status !== "choosing") {
        return NextResponse.json({ ok: false, error: "Not in choosing phase" }, { status: 400 });
      }
      if (state.choices[role] !== null) {
        return NextResponse.json({ ok: false, error: "Already chose" }, { status: 400 });
      }
      let numBig: bigint;
      try {
        numBig = BigInt(action.number);
      } catch {
        return NextResponse.json({ ok: false, error: "Choice must be a whole number" }, { status: 400 });
      }
      const maxBig = BigInt(state.maxNumber!);
      if (numBig < 1n || numBig > maxBig) {
        return NextResponse.json(
          { ok: false, error: `Number must be between 1 and ${state.maxNumber}` },
          { status: 400 }
        );
      }

      const newChoices = { ...state.choices, [role]: numBig.toString() };
      const bothChose = newChoices.player1 !== null && newChoices.player2 !== null;

      const patch: Partial<GameState> = { choices: newChoices };
      if (bothChose) {
        patch.outcome = BigInt(newChoices.player1!) === BigInt(newChoices.player2!) ? "success" : "failed";
        patch.status = "reveal";
      }

      updateRoom(params.roomId, patch);
      return NextResponse.json({ ok: true });
    }

    case "restart": {
      if (state.status !== "reveal") {
        return NextResponse.json({ ok: false, error: "Game not finished yet" }, { status: 400 });
      }
      updateRoom(params.roomId, {
        status: "set_max",
        maxNumber: null,
        choices: { player1: null, player2: null },
        outcome: null,
      });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }
}
