"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import type { PlayerRole, RoomView, ActionRequest } from "@/types/game";

// ─── Sub-screens ─────────────────────────────────────────────────────────────

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}

function WaitingForPlayer2({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : `/room/${roomId}`;

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <Spinner label="Waiting for Player 2 to join…" />
      <div className="w-full">
        <p className="text-sm text-gray-500 mb-2 text-center">Share this link:</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-700 truncate"
          />
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-medium
                       hover:bg-gray-700 active:scale-95 transition-all duration-150"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

const MAX_INT64 = 9223372036854775807n;

function parseBigIntInput(raw: string): { value: bigint } | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { error: "Please enter a number." };
  if (!/^-?\d+$/.test(trimmed)) return { error: "Must be a whole number (no decimals or symbols)." };
  try {
    return { value: BigInt(trimmed) };
  } catch {
    return { error: "Invalid number." };
  }
}

function SetMax({
  onSubmit,
}: {
  onSubmit: (max: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = parseBigIntInput(value);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (result.value < 2n || result.value > MAX_INT64) {
      setError("Enter a number between 2 and 9,223,372,036,854,775,807.");
      return;
    }
    setError(null);
    setLoading(true);
    await onSubmit(result.value.toString());
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Set the Range</h2>
        <p className="text-gray-500 text-sm">
          Player 2 has joined! Choose the maximum number both players will pick from (up to 9,223,372,036,854,775,807).
        </p>
      </div>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="e.g. 10"
          className={`w-full rounded-xl border-2 px-4 py-3 text-center text-xl
                      focus:outline-none focus:ring-2 focus:ring-gray-900
                      ${error ? "border-red-400 focus:ring-red-400" : "border-gray-200"}`}
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || value.trim() === ""}
          className="w-full rounded-xl bg-gray-900 text-white py-3 font-semibold
                     hover:bg-gray-700 active:scale-95 transition-all duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Setting…" : "Set Maximum"}
        </button>
      </form>
    </div>
  );
}

function ChooseNumber({
  max,
  onSubmit,
}: {
  max: string;
  onSubmit: (n: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = parseBigIntInput(value);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (result.value < 1n || result.value > BigInt(max)) {
      setError(`Must be between 1 and ${max}.`);
      return;
    }

    setError(null);
    setLoading(true);
    await onSubmit(result.value.toString());
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Choose Your Number</h2>
        <p className="text-gray-500 text-sm">
          Enter a number from 1 to {max}. Your choice is hidden until both players submit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder={`1 – ${max}`}
          className={`w-full rounded-xl border-2 px-4 py-3 text-center text-xl
                      focus:outline-none focus:ring-2 focus:ring-gray-900
                      ${error ? "border-red-400 focus:ring-red-400" : "border-gray-200"}`}
          autoFocus
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gray-900 text-white py-3 font-semibold
                     hover:bg-gray-700 active:scale-95 transition-all duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Locking in…" : "Submit"}
        </button>
      </form>
    </div>
  );
}

function Result({
  view,
  onRestart,
}: {
  view: RoomView;
  onRestart: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const success = view.outcome === "success";

  async function handleRestart() {
    setLoading(true);
    await onRestart();
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl
          ${success ? "bg-green-100" : "bg-red-100"}`}
      >
        {success ? "🎉" : "❌"}
      </div>

      <div className="text-center">
        <h2 className={`text-3xl font-bold mb-1 ${success ? "text-green-600" : "text-red-500"}`}>
          {success ? "Success!" : "Failed!"}
        </h2>
        <p className="text-gray-500 text-sm">
          {success
            ? "You both picked the same number!"
            : "You picked different numbers."}
        </p>
      </div>

      {view.outcomeNumbers && (
        <div className="flex gap-6 w-full justify-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Player 1</span>
            <span className="text-4xl font-bold">{view.outcomeNumbers.player1}</span>
          </div>
          <div className="flex items-center text-gray-300 text-2xl">vs</div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Player 2</span>
            <span className="text-4xl font-bold">{view.outcomeNumbers.player2}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleRestart}
        disabled={loading}
        className="w-full rounded-xl bg-gray-900 text-white py-3 font-semibold
                   hover:bg-gray-700 active:scale-95 transition-all duration-150
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Restarting…" : "Play Again"}
      </button>
    </div>
  );
}

// ─── Main Room Page ───────────────────────────────────────────────────────────

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const [role, setRole] = useState<PlayerRole | null>(null);
  const [view, setView] = useState<RoomView | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Keep a ref to role so the polling callback always sees the latest value
  const roleRef = useRef<PlayerRole | null>(null);

  // ── Determine role ────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem(`role-${roomId}`) as PlayerRole | null;
    if (stored === "player1" || stored === "player2") {
      roleRef.current = stored;
      setRole(stored);
      return;
    }

    // New visitor → attempt to join as player2
    (async () => {
      try {
        const res = await fetch(`/api/room/${roomId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "player2",
            action: { type: "join" },
          } satisfies ActionRequest),
        });

        if (!res.ok) {
          const data = await res.json();
          setInitError(data.error ?? "Could not join room.");
          return;
        }

        sessionStorage.setItem(`role-${roomId}`, "player2");
        roleRef.current = "player2";
        setRole("player2");
      } catch {
        setInitError("Could not connect to the room.");
      }
    })();
  }, [roomId]);

  // ── Poll state ────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    const r = roleRef.current;
    if (!r) return;
    try {
      const res = await fetch(`/api/room/${roomId}?role=${r}`);
      if (res.status === 404) {
        router.replace("/");
        return;
      }
      if (!res.ok) return;
      const data: RoomView = await res.json();
      setView(data);
    } catch {
      // network hiccup — try again next tick
    }
  }, [roomId, router]);

  useEffect(() => {
    if (!role) return;
    poll(); // immediate first fetch
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [role, poll]);

  // ── Action helpers ────────────────────────────────────────────────────────
  async function sendAction(action: ActionRequest["action"]) {
    if (!role) return;
    await fetch(`/api/room/${roomId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, action } satisfies ActionRequest),
    });
    await poll();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (initError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-500 mb-4">{initError}</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-gray-900 text-white px-6 py-3 font-semibold
                       hover:bg-gray-700 transition-all"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="w-full max-w-sm mb-10 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Odds Game</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-500">
            {role === "player1" ? "You are Player 1" : role === "player2" ? "You are Player 2" : "Connecting…"}
          </span>
          {view && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-400">
                {{
                  waiting_for_p2: "Waiting for player 2",
                  set_max: "Setting range",
                  choosing: "Choosing",
                  reveal: "Game over",
                }[view.status]}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {!role || !view ? (
        <Spinner label="Connecting…" />
      ) : view.status === "waiting_for_p2" ? (
        role === "player1" ? (
          <WaitingForPlayer2 roomId={roomId} />
        ) : (
          <Spinner label="Joining room…" />
        )
      ) : view.status === "set_max" ? (
        role === "player1" ? (
          <SetMax onSubmit={(max) => sendAction({ type: "set_max", max })} />
        ) : (
          <Spinner label="Waiting for Player 1 to set the range…" />
        )
      ) : view.status === "choosing" ? (
        view.myChoice !== null ? (
          <div className="flex flex-col items-center gap-4">
            <Spinner label="Waiting for the other player…" />
            <p className="text-sm text-gray-400">
              You chose <strong>{view.myChoice}</strong>
            </p>
          </div>
        ) : (
          <ChooseNumber
            max={view.maxNumber!}
            onSubmit={(number) => sendAction({ type: "choose", number })}
          />
        )
      ) : (
        <Result
          view={view}
          onRestart={() => sendAction({ type: "restart" })}
        />
      )}
    </main>
  );
}
