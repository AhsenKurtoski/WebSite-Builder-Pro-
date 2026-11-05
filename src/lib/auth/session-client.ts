"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "./session";

/**
 * Sessione lato client.
 *
 * L'interfaccia deve sapere chi sta lavorando (per mostrare nome e progetti
 * giusti); i permessi veri restano nelle pagine server. Una sola chiamata,
 * riusata da tutte le schermate che si aprono.
 */

export type SessionState = {
  user: AuthUser | null;
  /** true quando la firma usa la chiave di ripiego: sessione valida solo in locale. */
  localSecret: boolean;
  loading: boolean;
};

const CACHE_TTL_MS = 30_000;
let cached: { user: AuthUser | null; localSecret: boolean; at: number } | null = null;

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    user: cached?.user ?? null,
    localSecret: cached?.localSecret ?? false,
    loading: cached === null,
  });

  useEffect(() => {
    let cancelled = false;
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return;
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = (await response.json()) as { user: AuthUser | null; localSecret?: boolean };
        cached = { user: payload.user ?? null, localSecret: payload.localSecret ?? false, at: Date.now() };
        if (!cancelled) setState({ user: cached.user, localSecret: cached.localSecret, loading: false });
      } catch {
        cached = { user: null, localSecret: false, at: Date.now() };
        if (!cancelled) setState({ user: null, localSecret: false, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Identificativo con cui separare i progetti locali: coincide con quello del server. */
export function localDeviceId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)atelier_device=([a-f0-9]{16,64})(?:;|$)/i);
  return match?.[1] ?? null;
}

export function ownerOf(user: AuthUser | null): string {
  if (!user) return "local:ospite";
  if (user.provider !== "local") return `${user.provider}:${user.id}`;
  const device = localDeviceId();
  return device ? `local:${device}` : "local:ospite";
}

export function useSignOut(): () => Promise<void> {
  return useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    cached = null;
    window.location.href = "/";
  }, []);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0 || !parts[0]) return "?";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}
