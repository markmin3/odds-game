import { NextResponse } from "next/server";
import { createRoom } from "@/lib/store";
import type { CreateRoomResponse } from "@/types/game";

function generateRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function POST(): Promise<NextResponse<CreateRoomResponse>> {
  const roomId = generateRoomId();
  createRoom(roomId);
  return NextResponse.json({ roomId });
}
