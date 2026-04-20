"use client";

import { useEffect, useMemo, useState } from "react";

type CounterShootPayload = {
  id: string;
  loc: string;
  number: string;
  shoot: number | null;
  status: string;
};

type CounterShootLog = {
  seq: number;
  topic: string;
  payload: CounterShootPayload;
  received_at: string;
};

type CounterShootStatus = {
  connected: boolean;
  brokerUrl: string | null;
  topic: string;
  lastMessageAt: string | null;
  lastError: string | null;
  latestPayload: CounterShootPayload | null;
  bufferedLogs: number;
};

const LIMIT = 200;

function getBackendBaseUrl() {
  const fromEnv = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return "http://localhost:9999";
}

export default function MqttCounterShootPage() {
  const [status, setStatus] = useState<CounterShootStatus | null>(null);
  const [logs, setLogs] = useState<CounterShootLog[]>([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    const backendBase = getBackendBaseUrl();
    const snapshotUrl = `${backendBase}/api/mqtt-counter-shoot?limit=${LIMIT}`;
    const streamUrl = `${backendBase}/api/mqtt-counter-shoot/stream?limit=${LIMIT}`;

    let isMounted = true;
    let es: EventSource | null = null;

    const loadSnapshot = async () => {
      try {
        const res = await fetch(snapshotUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!isMounted) return;
        setStatus((json?.status || null) as CounterShootStatus | null);
        setLogs(Array.isArray(json?.logs) ? json.logs : []);
      } catch (error) {
        if (!isMounted) return;
        setStreamError(`Snapshot error: ${String((error as Error)?.message || error)}`);
      }
    };

    loadSnapshot();

    es = new EventSource(streamUrl);
    es.onopen = () => {
      if (!isMounted) return;
      setStreamConnected(true);
      setStreamError(null);
    };
    es.onerror = () => {
      if (!isMounted) return;
      setStreamConnected(false);
      setStreamError("Stream disconnected or blocked.");
    };
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data || "{}") as
          | { type: "connected" }
          | { type: "snapshot"; status: CounterShootStatus; logs: CounterShootLog[] }
          | { type: "log"; entry: CounterShootLog };

        if (!isMounted) return;
        if (data.type === "snapshot") {
          setStatus(data.status);
          setLogs(Array.isArray(data.logs) ? data.logs : []);
          return;
        }
        if (data.type === "log") {
          setLogs((prev) => {
            const next = [data.entry, ...prev];
            if (next.length > LIMIT) next.length = LIMIT;
            return next;
          });
          setStatus((prev) =>
            prev
              ? {
                  ...prev,
                  lastMessageAt: data.entry.received_at,
                  latestPayload: data.entry.payload,
                  bufferedLogs: Math.min((prev.bufferedLogs || 0) + 1, LIMIT),
                }
              : prev
          );
        }
      } catch {
        // ignore malformed event payload
      }
    };

    return () => {
      isMounted = false;
      if (es) es.close();
    };
  }, []);

  const latest = useMemo(() => logs[0] ?? null, [logs]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">MQTT Counter Shoot (API + SSE)</h1>
      <div className="rounded border p-3 text-sm">
        <div>Topic: {status?.topic || "counter/shoot"}</div>
        <div>MQTT status: {status?.connected ? "connected" : "disconnected"}</div>
        <div>SSE stream: {streamConnected ? "connected" : "disconnected"}</div>
        <div>Broker URL: {status?.brokerUrl || "-"}</div>
        <div>Total buffered: {logs.length}</div>
        <div>Last MQTT message: {status?.lastMessageAt || "-"}</div>
        <div>MQTT error: {status?.lastError || "-"}</div>
        <div>Stream error: {streamError || "-"}</div>
      </div>

      <div className="rounded border p-3 text-sm">
        <div className="font-medium mb-2">Latest payload</div>
        <pre className="overflow-auto text-xs">{JSON.stringify(latest, null, 2)}</pre>
      </div>

      <div className="rounded border p-3 text-sm">
        <div className="font-medium mb-2">Logs (latest {LIMIT})</div>
        <pre className="max-h-[420px] overflow-auto text-xs">{JSON.stringify(logs, null, 2)}</pre>
      </div>
    </div>
  );
}

