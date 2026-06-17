import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { getActiveOrgId } from "./api";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL;

if (!WS_BASE) {
  throw new Error("Missing VITE_WS_BASE_URL. See .env.example.");
}

export interface VideoProgressEvent {
  video_id: number;
  status: string; // started | splitting | transcribing | generating | saving | generating_pdf | completed | failed
  progress: number; // 0–100
  message: string;
}

export interface UseVideoProgressResult {
  /** Latest event received from the worker, or null until the first arrives. */
  event: VideoProgressEvent | null;
  /** True when the WS is open. */
  connected: boolean;
  /** True after the worker reports a terminal status (completed | failed). */
  terminal: boolean;
  /** Any client-side error (auth missing, connection refused, etc.). */
  error: string | null;
}

/**
 * Subscribe to the per-video progress WebSocket.
 *
 * Auth model (matches backend routes/websocket.py):
 *   token   — current Supabase session JWT
 *   org_id  — currently-active org from localStorage
 *
 * The connection closes itself when the worker reports completed | failed
 * (the backend breaks the loop on the same condition). The hook will also
 * close the socket if `videoId` changes or the component unmounts.
 */
export function useVideoProgress(
  videoId: number | string | undefined,
  enabled: boolean = true
): UseVideoProgressResult {
  const [event, setEvent] = useState<VideoProgressEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled || videoId === undefined || videoId === "sample") return;

    let cancelled = false;

    const connect = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const orgId = getActiveOrgId();

        if (!token) {
          setError("Not signed in.");
          return;
        }
        if (!orgId) {
          setError("No active organization.");
          return;
        }

        const url =
          `${WS_BASE}/ws/${videoId}` +
          `?token=${encodeURIComponent(token)}` +
          `&org_id=${encodeURIComponent(orgId)}`;

        if (cancelled) return;

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setConnected(true);
          setError(null);
        };

        ws.onmessage = (e) => {
          if (cancelled) return;
          try {
            const parsed = JSON.parse(e.data) as VideoProgressEvent;
            setEvent(parsed);
            if (parsed.status === "completed" || parsed.status === "failed") {
              setTerminal(true);
            }
          } catch {
            // Ignore non-JSON frames.
          }
        };

        ws.onerror = () => {
          if (cancelled) return;
          setError("Connection error.");
        };

        ws.onclose = () => {
          if (cancelled) return;
          setConnected(false);
        };
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not connect.");
      }
    };

    connect();

    return () => {
      cancelled = true;
      const ws = wsRef.current;
      if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
      wsRef.current = null;
    };
  }, [videoId, enabled]);

  return { event, connected, terminal, error };
}
