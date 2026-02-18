"use client";

import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
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
};

const LOWER_LIMIT = 60;
const UPPER_LIMIT = 80;

const chartConfig = {
  temp: {
    label: "Temperature",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

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

function buildData() {
  return [makeSeries("Titik 1"), makeSeries("Titik 2"), makeSeries("Titik 3")];
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
    const ts = new Date(
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
        <CardTitle>{series.label}</CardTitle>
        <CardDescription>
          {start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          {" - "}
          {end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} | Batas atas {UPPER_LIMIT} C | Batas bawah {LOWER_LIMIT} C
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-48 w-full aspect-auto">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 8, left: 8, right: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
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
  const [modalMeta, setModalMeta] = useState<{
    point: string;
    timestamp: Date;
    value: number;
  } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const data = useMemo(() => buildData(), [seed]);
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
    const entries = series.values.map((value, index) => {
      const ts = new Date(
        baseTime -
          (series.values.length - 1 - index) * intervalMinutes * 60_000,
      );
      const cause =
        value > UPPER_LIMIT
          ? "Overheat"
          : value < LOWER_LIMIT
            ? "Underheat"
            : "Normal";
      const action =
        cause === "Normal"
          ? "Monitoring"
          : cause === "Overheat"
            ? "Check cooling system"
            : "Check heater";
      return {
        point: series.label,
        timestamp: ts,
        cause,
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

    return entries.filter((e) => inShift(e.timestamp)).reverse();
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
    meta: { point: string; timestamp: Date; value: number },
  ) => {
    setModalKey(key);
    setModalCause(cause);
    setModalAction(action);
    setModalMeta(meta);
    setModalOpen(true);
  };

  const saveModal = () => {
    if (!modalKey) return;
    setNotes((prev) => ({
      ...prev,
      [modalKey]: { cause: modalCause, action: modalAction },
    }));
    setModalOpen(false);
  };

  const downloadCsv = (filename: string, rows: Array<Record<string, any>>) => {
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
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border bg-white px-2 py-1.5">
        <div className="text-xs font-semibold text-gray-800">
          Temperature MDP
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="text-[11px] text-gray-500">Tanggal</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded border bg-white px-2 py-1 text-xs"
          />
          <label className="text-[11px] text-gray-500">Interval</label>
          <select
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
            className="rounded border bg-white px-2 py-1 text-xs"
          >
            <option value={1}>1 menit</option>
            <option value={5}>5 menit</option>
            <option value={15}>15 menit</option>
            <option value={60}>1 jam</option>
          </select>
          <label className="text-[11px] text-gray-500">Shift</label>
          <select
            value={shiftFilter}
            onChange={(e) =>
              setShiftFilter(e.target.value as "all" | "s1" | "s2" | "s3")
            }
            className="rounded border bg-white px-2 py-1 text-xs"
          >
            <option value="all">Semua</option>
            <option value="s1">Shift 1 (06-14)</option>
            <option value="s2">Shift 2 (14-22)</option>
            <option value="s3">Shift 3 (22-06)</option>
          </select>
          <button
            type="button"
            onClick={() => setSeed((v) => v + 1)}
            className="rounded border px-3 py-1 bg-gray-100 hover:bg-gray-200"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="mb-3 text-[11px] text-gray-600">
        Shift aktif: <span className="font-semibold">{currentShift}</span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {data.map((series, idx) => {
          const last = series.values[series.values.length - 1];
          const isActive = idx === activeIndex;
          return (
            <button
              key={series.label}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`rounded-xl border p-4 text-left shadow-sm transition ${
                isActive
                  ? "border-gray-800 bg-gray-100"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-xs text-gray-600">{series.label}</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {last} C
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                Range aman {LOWER_LIMIT} - {UPPER_LIMIT} C
              </div>
            </button>
          );
        })}
      </div>

      <TemperatureChart
        series={data[activeIndex]}
        baseTime={baseTime}
        intervalMinutes={intervalMinutes}
        shiftFilter={shiftFilter}
      />

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-gray-800">
            History {data[activeIndex]?.label}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
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
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[11px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold">Titik</th>
                <th className="px-2 py-1.5 text-left font-semibold">
                  Timestamp
                </th>
                <th className="px-2 py-1.5 text-left font-semibold">Value</th>
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
                return (
                  <tr
                    key={`${row.point}-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-2 py-1.5">{row.point}</td>
                    <td className="px-2 py-1.5">
                      {row.timestamp.toLocaleString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-2 py-1.5">{row.value} C</td>
                    <td
                      className="px-2 py-1.5 cursor-pointer underline decoration-dotted"
                      onClick={() =>
                        openModal(key, cause, action, {
                          point: row.point,
                          timestamp: row.timestamp,
                          value: row.value,
                        })
                      }
                    >
                      {cause}
                    </td>
                    <td
                      className="px-3 py-1.5 cursor-pointer underline decoration-dotted"
                      onClick={() =>
                        openModal(key, cause, action, {
                          point: row.point,
                          timestamp: row.timestamp,
                          value: row.value,
                        })
                      }
                    >
                      {action}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

        <div className="rounded-xl border bg-white p-3 shadow-sm">
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
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg border bg-white p-4 shadow-lg">
            <div className="mb-3 text-sm font-semibold">Edit Cause & Action</div>
            {modalMeta && (
              <div className="mb-3 rounded border bg-gray-50 px-3 py-2 text-[11px] text-gray-700">
                <div>
                  <span className="font-semibold">Titik:</span> {modalMeta.point}
                </div>
                <div>
                  <span className="font-semibold">Timestamp:</span>{" "}
                  {modalMeta.timestamp.toLocaleString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
                <div>
                  <span className="font-semibold">Value:</span> {modalMeta.value} C
                </div>
              </div>
            )}
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-600">Cause</label>
              <div className="flex gap-2">
                <select
                  className="rounded border px-2 py-1 text-xs"
                  value={modalCause}
                  onChange={(e) => setModalCause(e.target.value)}
                >
                  <option value="Normal">Normal</option>
                  <option value="Overheat">Overheat</option>
                  <option value="Underheat">Underheat</option>
                  <option value="Sensor Issue">Sensor Issue</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-600">
                Comment/Actions
              </label>
              <div className="flex gap-2">
                <select
                  className="rounded border px-2 py-1 text-xs"
                  value={modalAction}
                  onChange={(e) => setModalAction(e.target.value)}
                >
                  <option value="Monitoring">Monitoring</option>
                  <option value="Check cooling system">
                    Check cooling system
                  </option>
                  <option value="Check heater">Check heater</option>
                  <option value="Calibrate sensor">Calibrate sensor</option>
                  <option value="Scheduled maintenance">
                    Scheduled maintenance
                  </option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-600">
                Ketik Cause
              </label>
              <input
                className="w-full rounded border px-2 py-1 text-xs"
                value={modalCause}
                onChange={(e) => setModalCause(e.target.value)}
                placeholder="Ketik cause..."
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-600">
                Ketik Comment/Actions
              </label>
              <input
                className="w-full rounded border px-2 py-1 text-xs"
                value={modalAction}
                onChange={(e) => setModalAction(e.target.value)}
                placeholder="Ketik action..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded border px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveModal}
                className="rounded border px-3 py-1 text-xs bg-gray-800 text-white hover:bg-gray-700"
              >
                Add
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
              {data[activeIndex]?.label} | {selectedDate} |{" "}
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
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold">
                      Timestamp
                    </th>
                    <th className="px-2 py-1.5 text-left font-semibold">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.spikes.length === 0 ? (
                    <tr>
                      <td className="px-2 py-2 text-gray-500" colSpan={2}>
                        Tidak ada spike
                      </td>
                    </tr>
                  ) : (
                    dailySummary.spikes.map((s, i) => (
                      <tr
                        key={`${s.timestamp.toISOString()}-${i}`}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-2 py-1.5">
                          {s.timestamp.toLocaleString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-2 py-1.5">{s.value} C</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
