"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  YAxis,
  XAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Series = {
  label: string;
  values: number[];
  timestamps?: string[];
  rowIds?: number[];
  states?: string[];
  causes?: string[];
  comments?: string[];
};

type MdpHistoryRow = {
  id?: number;
  timestamp?: string;
  json_value?: string | Record<string, unknown>;
};

type MdpProblemMaster = {
  id: number;
  name: string;
};

type MdpActionMaster = {
  id: number;
  name: string;
  problem_id?: number | null;
};

const DEFAULT_MDP_PROBLEMS = [
  "Normal",
  "Overheat",
  "Underheat",
  "Sensor Issue",
  "Maintenance",
];

const DEFAULT_MDP_ACTIONS = [
  "Monitoring",
  "Check cooling system",
  "Check heater",
  "Calibrate sensor",
  "Scheduled maintenance",
];

const LOWER_LIMIT = 60;
const UPPER_LIMIT = 80;

const chartConfig: ChartConfig = {
  temp: {
    label: "Temperature",
    color: "var(--chart-1)",
  },
};

function makeSeries(label: string, count = 30): Series {
  const values = Array.from({ length: count }, () => {
    const base = 70 + (Math.random() * 6 - 3);
    return Math.max(55, Math.min(85, Number(base.toFixed(1))));
  });
  if (values.length >= 10) {
    values[values.length - 3] = 82;
    values[values.length - 8] = 83.5;
  } else if (values.length >= 3) {
    values[values.length - 2] = 82;
  }
  return { label, values };
}

function buildData(positions: Array<{ id: number }>) {
  return positions.map((p) => makeSeries(String(p.id)));
}

function parseJsonValue(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value !== "string") return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseSqlTimestamp(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const text = String(value).trim();
  if (!text) return new Date();

  // SQL format from API: "YYYY-MM-DD HH:mm:ss"
  const normalized = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(text)
    ? text.replace(" ", "T")
    : text;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toStateLabel(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === "HIGH") return "High";
  if (normalized === "LOW") return "Low";
  return "Normal";
}

function inferCauseFromValue(value: number) {
  if (value > UPPER_LIMIT) return "Overheat";
  if (value < LOWER_LIMIT) return "Underheat";
  return "Normal";
}

function inferActionFromCause(cause: string) {
  if (cause === "Overheat") return "Check cooling system";
  if (cause === "Underheat") return "Check heater";
  return "Monitoring";
}

function buildMdpApiCandidates(path: string) {
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  const envBaseRaw = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
  const envBase = envBaseRaw.endsWith("/api")
    ? envBaseRaw.slice(0, -4)
    : envBaseRaw;
  const origin =
    typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "";

  const unique = new Set<string>();
  if (envBase) unique.add(`${envBase}${cleanedPath}`);
  if (origin) unique.add(`${origin}/be${cleanedPath}`);
  if (origin) unique.add(`${origin}${cleanedPath}`);
  unique.add(`http://localhost:9999${cleanedPath}`);
  unique.add(`http://127.0.0.1:9999${cleanedPath}`);

  return Array.from(unique);
}

async function fetchFirstOkJson(
  candidates: string[],
  init?: RequestInit
): Promise<unknown> {
  let lastError: Error | null = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string; message?: string }));
        const message = body?.error || body?.message || `HTTP ${res.status}`;
        throw new Error(message);
      }
      return await res.json();
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") throw error;
      lastError = error as Error;
    }
  }
  throw lastError || new Error("No reachable MDP API endpoint");
}

function TemperatureChart({
  series,
  baseTime,
  intervalMinutes,
  shiftFilter,
}: {
  series: Series;
  baseTime: number;
  intervalMinutes: number;
  shiftFilter: "all" | "s1" | "s2" | "s3";
}) {
  const rawData = series.values.map((value, index) => {
    const ts = series.timestamps?.[index]
      ? parseSqlTimestamp(series.timestamps[index])
      : new Date(
          baseTime -
            (series.values.length - 1 - index) * intervalMinutes * 60_000,
        );
    return {
      ts: ts.toISOString(),
      temp: value,
    };
  });
  const inShift = (iso: string) => {
    if (shiftFilter === "all") return true;
    const hour = new Date(iso).getHours();
    if (shiftFilter === "s1") return hour >= 6 && hour < 14;
    if (shiftFilter === "s2") return hour >= 14 && hour < 22;
    return hour >= 22 || hour < 6;
  };
  const chartData = rawData.filter((d) => inShift(d.ts));
  const fallback = new Date(baseTime);
  const start = new Date(chartData[0]?.ts ?? fallback);
  const end = new Date(chartData[chartData.length - 1]?.ts ?? fallback);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">{series.label}</CardTitle>
        <CardDescription className="text-[11px] leading-relaxed sm:text-xs">
          {start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          {" - "}
          {end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} | Batas atas {UPPER_LIMIT} C | Batas bawah {LOWER_LIMIT} C
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-56 w-full aspect-auto sm:h-64">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 8, left: 8, right: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              domain={[50, 90]}
              tickFormatter={(value) => `${value}`}
            />
            <XAxis
              dataKey="ts"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <ReferenceLine
              y={UPPER_LIMIT}
              stroke="#ef4444"
              strokeDasharray="6 4"
              label={{
                value: `Max ${UPPER_LIMIT} C`,
                position: "right",
                fill: "#ef4444",
                fontSize: 12,
              }}
            />
            <ReferenceLine
              y={LOWER_LIMIT}
              stroke="#3b82f6"
              strokeDasharray="6 4"
              label={{
                value: `Min ${LOWER_LIMIT} C`,
                position: "right",
                fill: "#3b82f6",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="temp"
              fill="var(--color-temp)"
              radius={6}
              maxBarSize={28}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default function TemperatureMdpPage() {
  const [positions, setPositions] = useState([
    { id: 1, label: "Capacitor Bank" },
    { id: 2, label: "MCB 1" },
    { id: 3, label: "MCB 2" },
  ]);
  const [mdpId, setMdpId] = useState(2);
  const [seed, setSeed] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [shiftFilter, setShiftFilter] = useState<"all" | "s1" | "s2" | "s3">(
    "all",
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState<
    Record<string, { cause: string; action: string }>
  >({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState<string | null>(null);
  const [modalCause, setModalCause] = useState("");
  const [modalAction, setModalAction] = useState("");
  const [problemOptions, setProblemOptions] = useState<MdpProblemMaster[]>([]);
  const [actionOptions, setActionOptions] = useState<MdpActionMaster[]>([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [addingProblem, setAddingProblem] = useState(false);
  const [addingAction, setAddingAction] = useState(false);
  const [requiredActionProblemId, setRequiredActionProblemId] = useState<
    number | null
  >(null);
  const [modalMeta, setModalMeta] = useState<{
    point: string;
    positionLabel?: string;
    timestamp: Date;
    value: number;
    rowId?: number;
    historyId?: number;
  } | null>(null);
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyView, setHistoryView] = useState<"auto" | "card" | "table">(
    "auto",
  );
  const [mdpHistoryRows, setMdpHistoryRows] = useState<MdpHistoryRow[]>([]);
  const [mdpLoading, setMdpLoading] = useState(false);
  const [mdpError, setMdpError] = useState<string | null>(null);

  const normalizedModalCause = modalCause.trim().toLowerCase();
  const selectedProblem = useMemo(
    () =>
      problemOptions.find(
        (item) => item.name.trim().toLowerCase() === normalizedModalCause,
      ),
    [problemOptions, normalizedModalCause],
  );

  const availableActionOptions = useMemo(() => {
    if (!selectedProblem) return actionOptions;
    return actionOptions.filter(
      (item) => item.problem_id == null || item.problem_id === selectedProblem.id,
    );
  }, [actionOptions, selectedProblem]);

  const actionSelectValueExists = availableActionOptions.some(
    (item) => item.name === modalAction,
  );
  const causeSelectValueExists = problemOptions.some(
    (item) => item.name === modalCause,
  );
  const selectedSpecificAction = availableActionOptions.find(
    (item) => item.name === modalAction && item.problem_id === selectedProblem?.id,
  );
  const requiresSpecificAction =
    requiredActionProblemId !== null && selectedProblem?.id === requiredActionProblemId;
  const canSaveModal =
    modalCause.trim().length > 0 &&
    modalAction.trim().length > 0 &&
    (!requiresSpecificAction || Boolean(selectedSpecificAction));

  const loadMasterOptions = async () => {
    setMasterLoading(true);
    try {
      const [problemsJson, actionsJson] = await Promise.all([
        fetchFirstOkJson(buildMdpApiCandidates("/api/mdp/master/problems")),
        fetchFirstOkJson(buildMdpApiCandidates("/api/mdp/master/actions")),
      ]);

      const problems = Array.isArray((problemsJson as { data?: unknown[] })?.data)
        ? ((problemsJson as { data: unknown[] }).data as MdpProblemMaster[])
        : [];
      const actions = Array.isArray((actionsJson as { data?: unknown[] })?.data)
        ? ((actionsJson as { data: unknown[] }).data as MdpActionMaster[])
        : [];

      setProblemOptions(problems);
      setActionOptions(actions);
    } catch {
      setProblemOptions(
        DEFAULT_MDP_PROBLEMS.map((name, index) => ({ id: index + 1, name })),
      );
      setActionOptions(
        DEFAULT_MDP_ACTIONS.map((name, index) => ({
          id: index + 1,
          name,
          problem_id: null,
        })),
      );
    } finally {
      setMasterLoading(false);
    }
  };

  useEffect(() => {
    if (!modalOpen) return;
    setRequiredActionProblemId(null);
    loadMasterOptions();
  }, [modalOpen]);

  const addProblemOption = async () => {
    const name = modalCause.trim();
    if (!name) return;
    setAddingProblem(true);
    try {
      const response = await fetchFirstOkJson(
        buildMdpApiCandidates("/api/mdp/master/problems"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const created = (response as { data?: MdpProblemMaster })?.data;
      if (created?.name) {
        setModalCause(created.name);
        setModalAction("");
        if (typeof created.id === "number") setRequiredActionProblemId(created.id);
      }
      await loadMasterOptions();
    } catch (error) {
      setMdpError((error as Error).message || "Failed to add problem option");
    } finally {
      setAddingProblem(false);
    }
  };

  const addActionOption = async () => {
    const name = modalAction.trim();
    if (!name) return;
    setAddingAction(true);
    try {
      const response = await fetchFirstOkJson(
        buildMdpApiCandidates("/api/mdp/master/actions"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            problemId: selectedProblem?.id,
          }),
        },
      );
      const created = (response as { data?: MdpActionMaster })?.data;
      if (created?.name) {
        setModalAction(created.name);
        if (
          requiredActionProblemId !== null &&
          typeof created.problem_id === "number" &&
          created.problem_id === requiredActionProblemId
        ) {
          setRequiredActionProblemId(null);
        }
      }
      await loadMasterOptions();
    } catch (error) {
      setMdpError((error as Error).message || "Failed to add action option");
    } finally {
      setAddingAction(false);
    }
  };

  useEffect(() => {
    if (mdpId !== 2) {
      setMdpHistoryRows([]);
      setMdpError(null);
      setMdpLoading(false);
      return;
    }
    const controller = new AbortController();
    const shiftParam = shiftFilter === "all" ? "" : `&shift=${shiftFilter.toUpperCase()}`;
    const query = `?mdpId=2&date=${selectedDate}&intervalMinutes=${intervalMinutes}${shiftParam}`;
    const candidates = buildMdpApiCandidates(`/api/mdp/history${query}`);

    setMdpLoading(true);
    setMdpError(null);

    fetchFirstOkJson(candidates, { cache: "no-store", signal: controller.signal })
      .then((json) => {
        const rows = Array.isArray(json?.data) ? (json.data as MdpHistoryRow[]) : [];
        setMdpHistoryRows(rows);
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name === "AbortError") return;
        setMdpHistoryRows([]);
        setMdpError((error as Error).message || "Failed to load MDP history");
      })
      .finally(() => {
        if (!controller.signal.aborted) setMdpLoading(false);
      });

    return () => controller.abort();
  }, [mdpId, selectedDate, intervalMinutes, shiftFilter, seed]);

  const mdp2Derived = useMemo(() => {
    if (mdpId !== 2) return null;
    const sorted = [...mdpHistoryRows].sort(
      (a, b) =>
        parseSqlTimestamp(a.timestamp).getTime() -
        parseSqlTimestamp(b.timestamp).getTime(),
    );

    const seriesBuckets: Record<number, Series> = {
      1: { label: "1", values: [], timestamps: [], rowIds: [], states: [], causes: [], comments: [] },
      2: { label: "2", values: [], timestamps: [], rowIds: [], states: [], causes: [], comments: [] },
      3: { label: "3", values: [], timestamps: [], rowIds: [], states: [], causes: [], comments: [] },
    };
    const latestLocationByPoint: Record<number, string> = {
      1: "Capacitor Bank",
      2: "MCB 1",
      3: "MCB 2",
    };

    sorted.forEach((row) => {
      const payload = parseJsonValue(row.json_value);
      const ts = String(row.timestamp || "");
      [1, 2, 3].forEach((point) => {
        const value = Number(payload[`ID${point}`]);
        if (!Number.isFinite(value)) return;
        const rawState = String(payload[`StateID${point}`] ?? "");
        const state = toStateLabel(rawState);
        const rawCause = String(payload[`CauseID${point}`] ?? "").trim();
        const rawComment = String(payload[`CommentID${point}`] ?? "").trim();
        const fallbackCause = inferCauseFromValue(value);
        const cause = rawCause || fallbackCause;
        const comment = rawComment || inferActionFromCause(cause);

        seriesBuckets[point].values.push(Number(value));
        seriesBuckets[point].timestamps?.push(ts);
        seriesBuckets[point].rowIds?.push(Number(row.id) || 0);
        seriesBuckets[point].states?.push(state);
        seriesBuckets[point].causes?.push(cause);
        seriesBuckets[point].comments?.push(comment);

        const location = String(payload[`LocationID${point}`] ?? "").trim();
        if (location) latestLocationByPoint[point] = location.replace(/_/g, " ");
      });
    });

    return {
      positions: [1, 2, 3].map((id) => ({ id, label: latestLocationByPoint[id] })),
      data: [seriesBuckets[1], seriesBuckets[2], seriesBuckets[3]],
    };
  }, [mdpId, mdpHistoryRows]);

  const effectivePositions = mdp2Derived?.positions ?? positions;

  const data = useMemo(() => {
    if (mdpId === 2 && mdp2Derived) return mdp2Derived.data;
    void seed;
    return buildData(positions);
  }, [seed, positions, mdpId, mdp2Derived]);
  useEffect(() => {
    if (activeIndex >= data.length) setActiveIndex(0);
  }, [activeIndex, data.length]);
  useEffect(() => {
    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(t);
  }, [activeIndex, intervalMinutes, shiftFilter, selectedDate, seed]);

  useEffect(() => {
    if (!manageOpen) return;
    setPendingSave(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setPendingSave(false);
      setLastSavedAt(new Date());
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [positions, manageOpen]);
  const baseTime = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const target = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 0, 0);
    const now = new Date();
    if (
      now.getFullYear() === target.getFullYear() &&
      now.getMonth() === target.getMonth() &&
      now.getDate() === target.getDate()
    ) {
      return now.getTime();
    }
    return target.getTime();
  }, [selectedDate]);

  const currentShift = useMemo(() => {
    const date = new Date(baseTime);
    const hour = date.getHours();
    if (hour >= 6 && hour < 14) {
      return "Shift 1 (06:00 - 14:00)";
    }
    if (hour >= 14 && hour < 22) {
      return "Shift 2 (14:00 - 22:00)";
    }
    return "Shift 3 (22:00 - 06:00)";
  }, [baseTime]);

  const history = useMemo(() => {
    const series = data[activeIndex];
    if (!series) return [];
    const entries = series.values.map((value, index) => {
      const ts = series.timestamps?.[index]
        ? parseSqlTimestamp(series.timestamps[index])
        : new Date(
            baseTime -
              (series.values.length - 1 - index) * intervalMinutes * 60_000,
          );
      const fallbackCause = inferCauseFromValue(value);
      const cause = (series.causes?.[index] || fallbackCause).trim();
      const state =
        series.states?.[index] ||
        (value > UPPER_LIMIT ? "High" : value < LOWER_LIMIT ? "Low" : "Normal");
      const action = (series.comments?.[index] || inferActionFromCause(cause)).trim();
      return {
        point: series.label,
        timestamp: ts,
        rowId: series.rowIds?.[index] || null,
        historyId: Number(series.label),
        cause,
        state,
        action,
        value,
      };
    });

    const inShift = (date: Date) => {
      if (shiftFilter === "all") return true;
      const hour = date.getHours();
      if (shiftFilter === "s1") return hour >= 6 && hour < 14;
      if (shiftFilter === "s2") return hour >= 14 && hour < 22;
      return hour >= 22 || hour < 6;
    };

    return entries
      .filter((e) => inShift(e.timestamp))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [data, activeIndex, intervalMinutes, baseTime, shiftFilter]);

  const dailySummary = useMemo(() => {
    const spikes = history.filter((h) => h.value > UPPER_LIMIT);
    const times = spikes
      .slice(0, 6)
      .map((h) =>
        h.timestamp.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    return {
      count: spikes.length,
      times,
      spikes,
    };
  }, [history]);

  const monthlySummary = useMemo(() => {
    const base = dailySummary.count;
    return {
      count: Math.max(0, Math.round(base * 20 + (seed % 3))),
    };
  }, [dailySummary.count, seed]);

  const yearlySummary = useMemo(() => {
    const base = monthlySummary.count;
    return {
      count: Math.max(0, Math.round(base * 12)),
    };
  }, [monthlySummary.count]);

  const openModal = (
    key: string,
    cause: string,
    action: string,
    meta: {
      point: string;
      timestamp: Date;
      value: number;
      positionLabel?: string;
      rowId?: number;
      historyId?: number;
    },
  ) => {
    setModalKey(key);
    setModalCause(cause);
    setModalAction(action);
    setModalMeta(meta);
    setModalOpen(true);
  };

  const saveModal = async () => {
    if (!modalKey) return;
    if (!canSaveModal) return;
    if (mdpId === 2 && modalMeta?.rowId && modalMeta?.historyId) {
      try {
        setIsSavingModal(true);
        const candidates = buildMdpApiCandidates("/api/mdp/history/cause-comment");
        await fetchFirstOkJson(candidates, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rowId: modalMeta.rowId,
            mdpId,
            historyId: modalMeta.historyId,
            cause: modalCause,
            comment: modalAction,
          }),
        });
        setSeed((v) => v + 1);
      } catch (error) {
        setMdpError((error as Error).message || "Failed to update cause/comment");
        setIsSavingModal(false);
        return;
      } finally {
        setIsSavingModal(false);
      }
    }
    setNotes((prev) => ({
      ...prev,
      [modalKey]: { cause: modalCause, action: modalAction },
    }));
    setRequiredActionProblemId(null);
    setModalOpen(false);
  };

  const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const v = row[h] ?? "";
            const s = String(v).replace(/"/g, '""');
            return `"${s}"`;
          })
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportHistorical = () => {
    const rows = history.map((row) => ({
      titik: row.point,
      timestamp: row.timestamp.toLocaleString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      value_c: row.value,
      cause: row.cause,
      action: row.action,
    }));
    downloadCsv(`historical_${selectedDate}.csv`, rows);
  };

  const exportSummary = () => {
    const rows = [
      {
        scope: "daily",
        date: selectedDate,
        spike_count: dailySummary.count,
        spike_times: dailySummary.times.join(" | "),
      },
      {
        scope: "monthly",
        date: selectedDate.slice(0, 7),
        spike_count: monthlySummary.count,
        spike_times: "",
      },
      {
        scope: "yearly",
        date: selectedDate.slice(0, 4),
        spike_count: yearlySummary.count,
        spike_times: "",
      },
    ];
    downloadCsv(`summary_${selectedDate}.csv`, rows);
  };

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-3 rounded-md border bg-white p-2 sm:px-2 sm:py-1.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
          <span>Temperature MDP</span>
          <select
            value={mdpId}
            onChange={(e) => {
              setMdpId(Number(e.target.value));
              setSeed((v) => v + 1);
            }}
            className="h-9 min-w-[88px] rounded border bg-white px-2 py-1 text-xs font-normal text-gray-700"
          >
            <option value={1}>MDP 1</option>
            <option value={2}>MDP 2</option>
            <option value={3}>MDP 3</option>
            <option value={4}>MDP 4</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center">
          <label className="text-[11px] text-gray-500 sm:mr-[-4px]">Tanggal</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 rounded border bg-white px-2 py-1 text-xs"
          />
          <label className="text-[11px] text-gray-500 sm:ml-1 sm:mr-[-4px]">Interval</label>
          <select
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
            className="h-9 rounded border bg-white px-2 py-1 text-xs"
          >
            <option value={1}>1 menit</option>
            <option value={5}>5 menit</option>
            <option value={15}>15 menit</option>
            <option value={60}>1 jam</option>
          </select>
          <label className="text-[11px] text-gray-500 sm:ml-1 sm:mr-[-4px]">Shift</label>
          <select
            value={shiftFilter}
            onChange={(e) =>
              setShiftFilter(e.target.value as "all" | "s1" | "s2" | "s3")
            }
            className="h-9 rounded border bg-white px-2 py-1 text-xs"
          >
            <option value="all">Semua</option>
            <option value="s1">Shift 1 (06-14)</option>
            <option value="s2">Shift 2 (14-22)</option>
            <option value="s3">Shift 3 (22-06)</option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (isRefreshing) return;
              setIsRefreshing(true);
              setTimeout(() => {
                setSeed((v) => v + 1);
                setIsRefreshing(false);
              }, 500);
            }}
            className="h-9 rounded border px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                Loading...
              </span>
            ) : (
              "Refresh Data"
            )}
          </button>
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="h-9 rounded border px-3 py-1 bg-white hover:bg-gray-50"
          >
            Manage Positions
          </button>
        </div>
        </div>
      </div>

      <div className="mb-3 text-[11px] text-gray-600">
        Shift aktif: <span className="font-semibold">{currentShift}</span>
      </div>
      {mdpId === 2 && (
        <div className="mb-3 text-[11px]">
          {mdpLoading ? (
            <span className="text-gray-500">Loading data MDP 2 dari history table...</span>
          ) : mdpError ? (
            <span className="text-red-600">Gagal ambil data MDP 2: {mdpError}</span>
          ) : (
            <span className="text-green-700">
              Data source MDP 2: `IoT.dbo.mdp_temperature_history`
            </span>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((series, idx) => {
          const last = series.values[series.values.length - 1];
          const isActive = idx === activeIndex;
          const positionLabel = effectivePositions[idx]?.label || "-";
          return (
            <button
              key={series.label}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`rounded-xl border p-4 text-left shadow-sm transition ${
                isActive
                  ? "border-gray-800 bg-gray-100"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              } ${isAnimating ? "ring-1 ring-gray-300" : ""}`}
            >
              <div className="text-xs text-gray-600">ID {series.label}</div>
              <div className="text-[11px] text-gray-500">{positionLabel}</div>
              <div className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">
                {last} C
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                Range aman {LOWER_LIMIT} - {UPPER_LIMIT} C
              </div>
            </button>
          );
        })}
      </div>

      <div className={`transition-opacity ${isAnimating ? "opacity-70" : "opacity-100"}`}>
        {isRefreshing ? (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 h-3 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mb-4 h-2 w-72 animate-pulse rounded bg-gray-200" />
            <div className="h-48 animate-pulse rounded bg-gray-100" />
          </div>
        ) : data[activeIndex] ? (
          <TemperatureChart
            series={data[activeIndex]}
            baseTime={baseTime}
            intervalMinutes={intervalMinutes}
            shiftFilter={shiftFilter}
          />
        ) : (
          <div className="rounded-xl border bg-white p-4 text-xs text-gray-500">
            No data. Add a position first.
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_320px]">
        <div className={`rounded-xl border bg-white p-3 shadow-sm transition-opacity ${isAnimating ? "opacity-80" : "opacity-100"}`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-gray-800">
            History ID {data[activeIndex]?.label} - {effectivePositions[activeIndex]?.label || "-"}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            <span>Tanggal: {selectedDate}</span>
            <span>
              Per {intervalMinutes === 60 ? "1 jam" : `${intervalMinutes} menit`}
            </span>
            <span className="rounded border bg-gray-50 px-2 py-0.5 text-[10px] text-gray-700">
              Filter:{" "}
              {shiftFilter === "all"
                ? "Semua"
                : shiftFilter === "s1"
                  ? "Shift 1 (06-14)"
                  : shiftFilter === "s2"
                    ? "Shift 2 (14-22)"
                    : "Shift 3 (22-06)"}
            </span>
            <button
              type="button"
              onClick={exportHistorical}
              className="rounded border bg-white px-2 py-0.5 text-[10px] text-gray-700 hover:bg-gray-50"
            >
              Export Historical
            </button>
            <div className="inline-flex items-center rounded border bg-white p-0.5">
              <button
                type="button"
                onClick={() => setHistoryView("auto")}
                className={`rounded px-2 py-1 text-[10px] ${
                  historyView === "auto"
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setHistoryView("card")}
                className={`rounded px-2 py-1 text-[10px] ${
                  historyView === "card"
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setHistoryView("table")}
                className={`rounded px-2 py-1 text-[10px] ${
                  historyView === "table"
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
        <div className={`transition-opacity ${isAnimating ? "opacity-80" : "opacity-100"}`}>
          {isRefreshing ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : (
            <>
            <div
              className={
                historyView === "table"
                  ? "hidden"
                  : historyView === "card"
                    ? "space-y-2"
                    : "space-y-2 sm:hidden"
              }
            >
              {history.map((row, idx) => {
                const key = `${row.point}-${row.timestamp.toISOString()}`;
                const override = notes[key];
                const cause = override?.cause ?? row.cause;
                const action = override?.action ?? row.action;
                const state = row.state;
                const isSpike = row.value > UPPER_LIMIT;
                const isLow = row.value < LOWER_LIMIT;
                const displayId = idx + 1;
                return (
                  <div
                    key={`${row.point}-${idx}`}
                    className={[
                      "rounded-lg border bg-white p-2.5",
                      isSpike
                        ? "border-red-300"
                        : isLow
                          ? "border-blue-300"
                          : "border-gray-200",
                    ].join(" ")}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-gray-700">ID {displayId}</span>
                      <span className="text-gray-500">
                        {row.timestamp.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">{row.value} C</span>
                      <span
                        className={
                          state === "High"
                            ? "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700"
                            : state === "Low"
                              ? "inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                              : "inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700"
                        }
                      >
                        {state === "High" ? "^" : state === "Low" ? "v" : "o"} {state}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openModal(key, cause, action, {
                            point: String(displayId),
                            positionLabel: effectivePositions[activeIndex]?.label,
                            timestamp: row.timestamp,
                            value: row.value,
                            rowId: row.rowId ?? undefined,
                            historyId: row.historyId ?? undefined,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-700 hover:bg-gray-50"
                      >
                        {cause}
                        <span className="text-[9px] text-gray-400">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openModal(key, cause, action, {
                            point: String(displayId),
                            positionLabel: effectivePositions[activeIndex]?.label,
                            timestamp: row.timestamp,
                            value: row.value,
                            rowId: row.rowId ?? undefined,
                            historyId: row.historyId ?? undefined,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-700 hover:bg-gray-50"
                      >
                        {action}
                        <span className="text-[9px] text-gray-400">edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className={
                historyView === "card"
                  ? "hidden"
                  : historyView === "table"
                    ? "overflow-x-auto"
                    : "hidden overflow-x-auto sm:block"
              }
            >
            <table className="w-full table-fixed text-[11px]">
            <colgroup>
              <col className="w-10" />
              <col className="w-16" />
              <col className="w-16" />
              <col className="w-20" />
              <col />
            </colgroup>
            <thead className="bg-gray-100/80 text-gray-700 sticky top-0 shadow-sm backdrop-blur">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold">ID</th>
                <th className="px-2 py-1.5 text-left font-semibold">Time</th>
                <th className="px-2 py-1.5 text-right font-semibold">Value</th>
                <th className="px-2 py-1.5 text-left font-semibold">State</th>
                <th className="px-2 py-1.5 text-left font-semibold">Cause</th>
                <th className="px-3 py-2 text-left font-semibold">
                  Comment/Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, idx) => {
                const key = `${row.point}-${row.timestamp.toISOString()}`;
                const override = notes[key];
                const cause = override?.cause ?? row.cause;
                const action = override?.action ?? row.action;
                const state = row.state;
                const isSpike = row.value > UPPER_LIMIT;
                const isLow = row.value < LOWER_LIMIT;
                const displayId = idx + 1;
                return (
                  <tr
                    key={`${row.point}-${idx}`}
                    className={[
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/60",
                      "hover:bg-gray-100/70 transition-colors",
                      isSpike
                        ? "border-l-4 border-red-400"
                        : isLow
                          ? "border-l-4 border-blue-400"
                          : "border-l-4 border-transparent",
                    ].join(" ")}
                  >
                    <td className="px-2 py-1.5">{displayId}</td>
                    <td className="px-2 py-1.5">
                      {row.timestamp.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                      {row.value} C
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={
                          state === "High"
                            ? "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700"
                            : state === "Low"
                              ? "inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                              : "inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700"
                        }
                      >
                        {state === "High" ? "^" : state === "Low" ? "v" : "o"} {state}
                      </span>
                    </td>
                    <td
                      className="px-2 py-1.5 whitespace-normal"
                      onClick={() =>
                        openModal(key, cause, action, {
                          point: String(displayId),
                          positionLabel: effectivePositions[activeIndex]?.label,
                          timestamp: row.timestamp,
                          value: row.value,
                          rowId: row.rowId ?? undefined,
                          historyId: row.historyId ?? undefined,
                        })
                      }
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-700 hover:bg-gray-50"
                      >
                        {cause}
                        <span className="text-[9px] text-gray-400">edit</span>
                      </button>
                    </td>
                    <td
                      className="px-3 py-1.5 whitespace-normal"
                      onClick={() =>
                        openModal(key, cause, action, {
                          point: String(displayId),
                          positionLabel: effectivePositions[activeIndex]?.label,
                          timestamp: row.timestamp,
                          value: row.value,
                          rowId: row.rowId ?? undefined,
                          historyId: row.historyId ?? undefined,
                        })
                      }
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-700 hover:bg-gray-50"
                      >
                        {action}
                        <span className="text-[9px] text-gray-400">edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          </>
          )}
        </div>
      </div>

        <div className={`rounded-xl border bg-white p-3 shadow-sm transition-opacity ${isAnimating ? "opacity-80" : "opacity-100"}`}>
          {isRefreshing ? (
            <div className="space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-2 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-2 w-64 animate-pulse rounded bg-gray-100" />
              <div className="h-2 w-56 animate-pulse rounded bg-gray-100" />
            </div>
          ) : (
            <div>
              <div className="mb-2 text-xs font-semibold text-gray-800">
                Daily Summary
              </div>
              <div className="mb-3 text-[11px] text-gray-600">
                Hari {selectedDate}
              </div>
              <div className="mb-3 text-[11px]">
                Spike di atas {UPPER_LIMIT} C:{" "}
                <span className="font-semibold">{dailySummary.count} kali</span>
              </div>
              <div className="mb-4 text-[11px] text-gray-600">
                Jam spike:{" "}
                {dailySummary.times.length
                  ? dailySummary.times.join(", ")
                  : "Tidak ada"}
              </div>
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSummaryOpen(true)}
                  className="rounded border bg-white px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-50"
                >
                  Lihat Detail
                </button>
                <button
                  type="button"
                  onClick={exportSummary}
                  className="rounded border bg-white px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-50"
                >
                  Export Summary
                </button>
              </div>

              <div className="border-t pt-3">
                <div className="mb-2 text-xs font-semibold text-gray-800">
                  Monthly Summary
                </div>
                <div className="text-[11px] text-gray-600">
                  Total spike bulan ini:{" "}
                  <span className="font-semibold">{monthlySummary.count} kali</span>
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="mb-2 text-xs font-semibold text-gray-800">
                  Yearly Summary
                </div>
                <div className="text-[11px] text-gray-600">
                  Total spike tahun ini:{" "}
                  <span className="font-semibold">{yearlySummary.count} kali</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl border bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-semibold tracking-tight">Edit Cause & Action</div>
              <button
                type="button"
                onClick={() => {
                  setRequiredActionProblemId(null);
                  setModalOpen(false);
                }}
                className="rounded-full border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                x
              </button>
            </div>
            {modalMeta && (
              <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border bg-gray-50 px-3 py-1 text-gray-700">
                  ID: <span className="font-semibold">{modalMeta.point}</span>
                </span>
                {modalMeta.positionLabel && (
                  <span className="rounded-full border bg-gray-50 px-3 py-1 text-gray-700">
                    Posisi:{" "}
                    <span className="font-semibold">
                      {modalMeta.positionLabel}
                    </span>
                  </span>
                )}
                <span className="rounded-full border bg-gray-50 px-3 py-1 text-gray-700">
                  Time:{" "}
                  <span className="font-semibold">
                    {modalMeta.timestamp.toLocaleString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </span>
                <span className="rounded-full border bg-gray-50 px-3 py-1 text-gray-700">
                  Value:{" "}
                  <span className="font-semibold">{modalMeta.value} C</span>
                </span>
              </div>
            )}

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">Cause</label>
                <button
                  type="button"
                  onClick={addProblemOption}
                  disabled={addingProblem || !modalCause.trim()}
                  className="rounded border px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addingProblem ? "Adding..." : "Add+ Master Cause"}
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-[220px_1fr]">
                <select
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                  value={causeSelectValueExists ? modalCause : ""}
                  onChange={(e) => setModalCause(e.target.value)}
                >
                  <option value="">
                    {masterLoading ? "Loading cause..." : "Pilih master cause..."}
                  </option>
                  {problemOptions.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <textarea
                  className="min-h-[96px] w-full resize-y rounded-md border px-3 py-2 text-sm leading-relaxed"
                  value={modalCause}
                  onChange={(e) => setModalCause(e.target.value)}
                  placeholder="Ketik cause..."
                  rows={4}
                />
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">Comment/Actions</label>
                <button
                  type="button"
                  onClick={addActionOption}
                  disabled={addingAction || !modalAction.trim()}
                  className="rounded border px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addingAction ? "Adding..." : "Add+ Master Action"}
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-[220px_1fr]">
                <select
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                  value={actionSelectValueExists ? modalAction : ""}
                  onChange={(e) => setModalAction(e.target.value)}
                >
                  <option value="">
                    {masterLoading ? "Loading action..." : "Pilih master action..."}
                  </option>
                  {availableActionOptions.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <textarea
                  className="min-h-[110px] w-full resize-y rounded-md border px-3 py-2 text-sm leading-relaxed"
                  value={modalAction}
                  onChange={(e) => setModalAction(e.target.value)}
                  placeholder="Ketik action..."
                  rows={5}
                />
              </div>
              {requiresSpecificAction && !selectedSpecificAction && (
                <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                  Cause baru sudah ditambahkan. Sekarang tambahkan Action khusus cause ini lewat tombol
                  {" "}
                  <span className="font-semibold">Add+ Master Action</span>
                  {" "}
                  sebelum menyimpan.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRequiredActionProblemId(null);
                  setModalOpen(false);
                }}
                className="rounded-md border px-4 py-2 text-sm bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveModal}
                disabled={isSavingModal || !canSaveModal}
                className="rounded-md border px-4 py-2 text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingModal ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Detail Spike</div>
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="rounded border px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
            <div className="text-[11px] text-gray-600 mb-2">
              ID {data[activeIndex]?.label} - {effectivePositions[activeIndex]?.label || "-"} | {selectedDate} |{" "}
              {shiftFilter === "all"
                ? "Semua Shift"
                : shiftFilter === "s1"
                  ? "Shift 1"
                  : shiftFilter === "s2"
                    ? "Shift 2"
                    : "Shift 3"}
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="min-w-full text-[11px]">
                <thead className="bg-gray-100/80 text-gray-700 sticky top-0 shadow-sm backdrop-blur">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold">
                      Date
                    </th>
                    <th className="px-2 py-1.5 text-left font-semibold">
                      Time
                    </th>
                    <th className="px-2 py-1.5 text-left font-semibold">
                      Value
                    </th>
                    <th className="px-2 py-1.5 text-left font-semibold">
                      State
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.spikes.length === 0 ? (
                    <tr>
                      <td className="px-2 py-2 text-gray-500" colSpan={4}>
                        Tidak ada spike
                      </td>
                    </tr>
                  ) : (
                    dailySummary.spikes.map((s, i) => (
                      <tr
                        key={`${s.timestamp.toISOString()}-${i}`}
                        className={[
                          i % 2 === 0 ? "bg-white" : "bg-gray-50/60",
                          "hover:bg-gray-100/70 transition-colors",
                          "border-l-4 border-red-400",
                        ].join(" ")}
                      >
                        <td className="px-2 py-1.5">
                          {s.timestamp.toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-2 py-1.5">
                          {s.timestamp.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-2 py-1.5 font-mono tabular-nums">
                          {s.value} C
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                            ^ High
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {manageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Manage Positions</div>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded-full border px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                x
              </button>
            </div>
            <div className="mb-3 text-[11px] text-gray-600">
              Atur nama posisi untuk setiap ID.
            </div>
            <div className="mb-3 text-[11px] text-gray-500">
              {pendingSave ? "Auto-save in progress..." : "Auto-save ready"}
              {lastSavedAt && !pendingSave ? (
                <span> (last saved {lastSavedAt.toLocaleTimeString("id-ID")})</span>
              ) : null}
            </div>
            <div className="space-y-2">
              {positions.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="w-10 text-xs font-semibold text-gray-700">
                    ID {p.id}
                  </div>
                  <input
                    className="flex-1 rounded border px-2 py-1 text-xs"
                    value={p.label}
                    onChange={(e) =>
                      setPositions((prev) =>
                        prev.map((item) =>
                          item.id === p.id
                            ? { ...item, label: e.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Nama posisi..."
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPositions((prev) =>
                        prev.filter((item) => item.id !== p.id),
                      )
                    }
                    className="rounded border px-2 py-1 text-[10px] text-gray-600 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() =>
                  setPositions((prev) => {
                    const nextId =
                      prev.length === 0 ? 1 : Math.max(...prev.map((p) => p.id)) + 1;
                    return [...prev, { id: nextId, label: `Posisi ${nextId}` }];
                  })
                }
                className="rounded border px-3 py-1 text-xs bg-white hover:bg-gray-50"
              >
                Add Position
              </button>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded border px-3 py-1 text-xs bg-gray-900 text-white hover:bg-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
