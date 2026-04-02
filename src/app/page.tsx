"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreateRoomResponse } from "@/types/game";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/room", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create room");
      const { roomId } = (await res.json()) as CreateRoomResponse;
      sessionStorage.setItem(`role-${roomId}`, "player1");
      router.push(`/room/${roomId}`);
    } catch {
      setError("Could not create a game. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-3">Odds Game</h1>
        <p className="text-gray-500 mb-10 text-lg leading-relaxed">
          "Yo mark odds you let me name ur child"
        </p>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-2xl bg-gray-900 text-white py-4 text-lg font-semibold
                     hover:bg-gray-700 active:scale-95 transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating…" : "Create New Game"}
        </button>

        {error && (
          <p className="mt-4 text-red-500 text-sm">{error}</p>
        )}

        <p className="mt-8 text-sm text-gray-400">
          Share the link with a friend to play together.
        </p>
      </div>
    </main>
  );
}
