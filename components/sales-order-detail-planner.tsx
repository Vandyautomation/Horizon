"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";

const ALL_WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

const getCurrentWeek = () => {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
};

interface WeekData {
  capacity: number;
  loading: number;
}

interface Item {
  id: number;
  fg: string; // MaterialID / item number
  description: string;
  openOrder: number;
  std: number;
  dspt: number;
  process: string;
  uap: string;
  group: string;
  pro: string; // PRO_name from backend, used in level 3
  weeks: Record<number, WeekData>;
}

interface DragMeta {
  itemId: number;
  fromWeek: number | null;
  field: string;
  value: number;
}

interface EditModalState {
  open: boolean;
  itemId: number | null;
  week: number | null;
  last: number;
}

interface SalesOrderDetailPlannerProps {
  so: string;
  customer: string;
  itemNo: string;
  description: string;
}

export default function SalesOrderDetailPlanner({
  so,
  customer,
  itemNo,
  description,
}: SalesOrderDetailPlannerProps) {
  const currentWeek = getCurrentWeek();
  const visibleCount = 8;

  const [fromWeek, setFromWeek] = useState(Math.max(1, currentWeek - 3));
  const [toWeek, setToWeek] = useState(Math.min(52, fromWeek + visibleCount - 1));

  const visibleWeeks = useMemo(() => ALL_WEEKS.slice(fromWeek - 1, toWeek), [fromWeek, toWeek]);

  const buildDefaultItems = (): Item[] => [
    {
      id: 1,
      fg: itemNo || "FG-01",
      description: description || "Product Description",
      openOrder: 12000,
      std: 800,
      dspt: 43,
      process: "FG",
      uap: "2.1",
      group: "FG",
      pro: "1001",
      weeks: ALL_WEEKS.reduce((acc, w) => {
        acc[w] = { capacity: 2160, loading: 0 };
        return acc;
      }, {} as Record<number, WeekData>),
    },
  ];

  const [items, setItems] = useState<Item[]>(buildDefaultItems());
  const [dragMeta, setDragMeta] = useState<DragMeta | null>(null);

  // Level 2: detail FG
  const [detailExpanded, setDetailExpanded] = useState<Record<number, boolean>>({});
  // Level 3: extend proses
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    itemId: null,
    week: null,
    last: 0,
  });

  const leftTableRef = useRef<HTMLDivElement>(null);
  const rightTableRef = useRef<HTMLDivElement>(null);

  // Sinkron scroll kiri-kanan
  useEffect(() => {
    const left = leftTableRef.current;
    const right = rightTableRef.current;
    if (!left || !right) return;

    let syncing = false;

    const syncFromLeft = (e: Event) => {
      if (syncing) return;
      syncing = true;
      right.scrollTop = (e.target as HTMLDivElement).scrollTop;
      requestAnimationFrame(() => {
        syncing = false;
      });
    };

    const syncFromRight = (e: Event) => {
      if (syncing) return;
      syncing = true;
      left.scrollTop = (e.target as HTMLDivElement).scrollTop;
      requestAnimationFrame(() => {
        syncing = false;
      });
    };

    left.addEventListener("scroll", syncFromLeft);
    right.addEventListener("scroll", syncFromRight);

    return () => {
      left.removeEventListener("scroll", syncFromLeft);
      right.removeEventListener("scroll", syncFromRight);
    };
  }, []);

  const toggleDetail = (itemId: number) =>
    setDetailExpanded((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  const toggleExpand = (itemId: number) =>
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  const getAvailable = (it: Item, week: number) =>
    Number(it.weeks[week].capacity) - Number(it.weeks[week].loading || 0);

  const totals = useMemo(() => {
    const t: Record<number, number> = {};
    visibleWeeks.forEach((w) => {
      t[w] = items.reduce((sum, it) => sum + Number(it.weeks[w].loading || 0), 0);
    });
    return t;
  }, [items, visibleWeeks]);

  const anyDetailOpen = useMemo(
    () => items.some((it) => detailExpanded[it.id]),
    [items, detailExpanded]
  );

  // Drag & Drop
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    itemId: number,
    fromWeek: number | null,
    field: string,
    value: number
  ) => {
    e.dataTransfer?.setData("text/plain", JSON.stringify({ itemId, fromWeek, field, value }));
    setDragMeta({ itemId, fromWeek, field, value });
  };

  const handleDrop = (toItemId: number, toWeek: number) => {
    if (!dragMeta) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== dragMeta.itemId) return it;
        const nw = { ...it.weeks };
        const val = Number(dragMeta.value);

        if (dragMeta.fromWeek) {
          nw[dragMeta.fromWeek] = {
            ...nw[dragMeta.fromWeek],
            loading: Math.max(0, (nw[dragMeta.fromWeek].loading || 0) - val),
          };
        }

        nw[toWeek] = { ...nw[toWeek], loading: (nw[toWeek].loading || 0) + val };

        return { ...it, weeks: nw };
      })
    );
    setDragMeta(null);
  };

  // Edit modal
  const openEditModal = (itemId: number, week: number) => {
    const last = items.find((it) => it.id === itemId)?.weeks[week].loading || 0;
    setEditModal({ open: true, itemId, week, last });
  };

  const applyEditModal = (value: string) => {
    const num = Number(value) || 0;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== editModal.itemId) return it;
        const nw = { ...it.weeks };
        if (editModal.week !== null) {
          nw[editModal.week] = { ...nw[editModal.week], loading: num };
        }
        return { ...it, weeks: nw };
      })
    );
    setEditModal({ open: false, itemId: null, week: null, last: 0 });
  };

  // Fetch planner data dari backend
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999").replace(/\/$/, "");
      const params = new URLSearchParams();
      if (so) params.append("so", so);
      // jangan filter per itemNo di sini supaya semua MaterialID dalam SO yang sama ikut muncul
      const url = `${base}/api/hrz/planner?${params.toString()}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Planner fetch failed: ${res.status}`);
        const data = await res.json();
        const mapped: Item[] = (Array.isArray(data) ? data : []).map((row: any, idx: number) => ({
          id: idx + 1,
          fg: row.itemNo || itemNo || "FG-01",
          description: row.description || description || "Product Description",
          openOrder: Number(row.openOrder) || 0,
          std: Number(row.std) || 0,
          dspt: Number(row.dspt) || 0,
          process: row.process || "FG",
          uap: row.uap || "0",
          group: row.group || "FG",
          pro: row.pro || row.PRO_name || "",
          weeks: ALL_WEEKS.reduce((acc, w) => {
            acc[w] = { capacity: 2160, loading: 0 };
            return acc;
          }, {} as Record<number, WeekData>),
        }));

        if (!cancelled) {
          setItems(mapped.length ? mapped : buildDefaultItems());
        }
      } catch (err) {
        console.error("Failed to load planner data", err);
        if (!cancelled) setItems(buildDefaultItems());
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [so, itemNo, description]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Header info */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-500">From</label>
            <input
              type="number"
              min={1}
              max={52}
              value={fromWeek}
              onChange={(e) => setFromWeek(Math.min(Number(e.target.value), toWeek))}
              className="border rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1 items-start">
            <label className="text-[11px] uppercase tracking-wide text-gray-500">Today</label>
            <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 text-yellow-800 font-semibold px-3 py-1 text-sm">
              W{currentWeek}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-500">To</label>
            <input
              type="number"
              min={fromWeek}
              max={52}
              value={toWeek}
              onChange={(e) => setToWeek(Math.max(Number(e.target.value), fromWeek))}
              className="border rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-gray-800">
          <div className="px-3 py-2 border rounded bg-gray-50">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Customer</div>
            <div className="font-semibold">{customer || "-"}</div>
          </div>
          <div className="px-3 py-2 border rounded bg-gray-50">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">SO</div>
            <div className="font-semibold">{so || "-"}</div>
          </div>
        </div>
      </div>

      <div className="flex border rounded-lg shadow-sm bg-white overflow-hidden">
        {/* Left Fixed Table */}
        <div ref={leftTableRef} className="overflow-y-auto max-h-[400px]">
          <table className="table-fixed border-r min-w-[600px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-6"></th>
                <th className="w-20">Process</th>
                <th className="w-20">Item No</th>
                <th className="w-60">Description</th>
                <th className="w-16">Order</th>
                <th className="w-16">STD/H</th>
                <th className="w-16">DSPT</th>
                <th className="w-16">UAP</th>
                <th className="w-16">Group</th>
                <th className="w-16">Legend</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const isDetailOpen = !!detailExpanded[it.id];
                const isProcessOpen = !!expandedItems[it.id];

                return (
                  <React.Fragment key={it.id}>
                    {/* LEVEL 1 – ringkasan: hanya Process, Item No, Description */}
                    <tr className="hover:bg-gray-50 h-14">
                      <td className="cursor-pointer text-center" onClick={() => toggleDetail(it.id)}>
                        {isDetailOpen ? "−" : "+"}
                      </td>
                      <td className="text-center">{it.process}</td>
                      <td className="text-center">{it.fg}</td>
                      <td className="text-center">{it.description}</td>
                      <td className="text-center"></td>
                      <td className="text-center rounded"></td>
                      <td className="text-center"></td>
                      <td className="text-center"></td>
                      <td className="text-center"></td>
                      <td className="text-center text-[10px]"></td>
                    </tr>

                    {/* LEVEL 2 – detail FG: isi lengkap */}
                    {isDetailOpen && (
                      <>
                        <tr className="hover:bg-gray-50 h-14">
                          <td className="cursor-pointer text-center" onClick={() => toggleExpand(it.id)}>
                            {isProcessOpen ? "−" : "+"}
                          </td>
                          <td className="text-center">{it.process}</td>
                          <td className="text-center">{it.fg}</td>
                          <td className="text-center">{it.description}</td>
                          <td className="text-center">{it.openOrder}</td>
                          <td className="text-center rounded">{it.std}</td>
                          <td
                            draggable
                            onDragStart={(e) => handleDragStart(e, it.id, null, "dspt", it.dspt)}
                            className="cursor-grab bg-blue-50 text-center rounded"
                          >
                            {it.dspt}
                          </td>
                          <td className="text-center">{it.uap}</td>
                          <td className="text-center">{it.group}</td>
                          <td className="flex flex-col gap-0.5 text-[10px] text-center">
                            <div className="p-0.5 bg-yellow-100 rounded">Available</div>
                            <div className="p-0.5 bg-blue-100 rounded">Loading</div>
                            <div className="p-0.5 bg-red-100 rounded">Capacity</div>
                          </td>
                        </tr>

                        {/* LEVEL 3 – extend proses: Process, Item No, Open Order, STD/H, DSPT */}
                        {isProcessOpen && (
                          <tr className="bg-gray-100">
                            <td></td>
                            <td className="text-center">{it.process}</td>
                            <td className="text-center">{it.pro}</td>
                            <td></td>
                            <td className="text-center">{it.openOrder}</td>
                            <td className="text-center rounded">{it.std}</td>
                            <td
                              draggable
                              onDragStart={(e) => handleDragStart(e, it.id, null, "dspt", it.dspt)}
                              className="cursor-grab bg-blue-50 text-center rounded"
                            >
                              {it.dspt}
                            </td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Dynamic Table */}
        <div ref={rightTableRef} className="overflow-x-auto overflow-y-auto max-h-[400px] flex-1">
          <table className="table-fixed min-w-max">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {visibleWeeks.map((w) => (
                  <th
                    key={w}
                    className={`w-24 px-1 border-l text-center text-xs font-semibold ${
                      w === currentWeek ? "bg-yellow-200" : ""
                    }`}
                  >
                    W{w}
                  </th>
                ))}
                <th className="w-16 px-1 border-l text-center text-xs font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const isDetailOpen = !!detailExpanded[it.id];
                const isProcessOpen = !!expandedItems[it.id];

                return (
                  <React.Fragment key={it.id}>
                    {/* LEVEL 1 – ringkasan FG: kanan kosong */}
                    <tr className="hover:bg-gray-50 h-14">
                      {visibleWeeks.map((w) => (
                        <td key={w} className="px-1 border-l text-center text-xs bg-white" />
                      ))}
                      <td className="text-center font-semibold" />
                    </tr>

                    {/* LEVEL 2 – detail FG: Available / Loading / Capacity */}
                    {isDetailOpen && (
                      <tr className="hover:bg-gray-50 h-14">
                        {visibleWeeks.map((w) => {
                          const slot = it.weeks[w];
                          const avail = getAvailable(it, w);
                          return (
                            <td
                              key={w}
                              className="px-1 border-l text-center text-xs group"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleDrop(it.id, w)}
                            >
                              <div className="flex flex-col gap-0.5 text-[10px] w-full">
                                <div className="p-0.5 bg-yellow-100 rounded text-[11px]">{avail}</div>
                                <div
                                  draggable
                                  className="p-0.5 bg-blue-100 rounded text-[11px] cursor-grab"
                                  onDragStart={(e) => handleDragStart(e, it.id, w, "loading", slot.loading)}
                                  onClick={() => openEditModal(it.id, w)}
                                >
                                  {slot.loading}
                                </div>
                                <div className="p-0.5 bg-red-100 rounded text-[11px]">{slot.capacity}</div>
                              </div>
                            </td>
                          );
                        })}
                        <td className="text-center font-semibold">
                          {visibleWeeks.reduce((s, w) => s + Number(it.weeks[w].loading || 0), 0)}
                        </td>
                      </tr>
                    )}

                    {/* LEVEL 3 – extend proses: hanya Loading, linked ke data yang sama */}
                    {isDetailOpen && isProcessOpen && (
                      <tr className="bg-gray-100">
                        {visibleWeeks.map((w) => {
                          const slot = it.weeks[w];
                          return (
                            <td
                              key={w}
                              className="px-1 border-l text-center bg-white cursor-pointer hover:bg-blue-50"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleDrop(it.id, w)}
                            >
                              <div className="flex flex-col gap-0.5 text-[10px] w-full">
                                <div
                                  draggable
                                  className="p-0.5 bg-blue-100 rounded text-[11px] cursor-grab"
                                  onDragStart={(e) => handleDragStart(e, it.id, w, "loading", slot.loading)}
                                  onClick={() => openEditModal(it.id, w)}
                                >
                                  {slot.loading}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                        <td></td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Total per minggu – hanya muncul kalau minimal Level 2 terbuka */}
              {anyDetailOpen && (
                <tr className="bg-gray-50 font-medium">
                  {visibleWeeks.map((w) => (
                    <td key={w} className="px-1 border-l text-center">
                      {totals[w]}
                    </td>
                  ))}
                  <td className="text-center">
                    {visibleWeeks.reduce((s, w) => s + (totals[w] || 0), 0)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow p-4 w-80">
            <h3 className="font-bold mb-2">Edit Loading (W{editModal.week})</h3>
            <div className="text-sm mb-2">Last: {editModal.last}</div>
            <input
              type="number"
              className="border p-2 w-full mb-3 rounded"
              defaultValue={editModal.last}
              id="manualInput"
            />
            <div className="flex gap-2">
              <button
                className="flex-1 bg-gray-200 px-3 py-1 rounded"
                onClick={() => setEditModal({ open: false, itemId: null, week: null, last: 0 })}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => {
                  const input = document.getElementById("manualInput") as HTMLInputElement;
                  if (input) applyEditModal(input.value);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
