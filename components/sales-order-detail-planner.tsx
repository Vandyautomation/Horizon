"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";

const ALL_WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

const getCurrentWeek = () => {
  // ISO week calculation
  const now = new Date();
  // Copy date so don't modify original
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday (0) -> 7
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  // Get first day of year
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
};

interface WeekData {
  capacity: number;
  loading: number;
}

interface Item {
  id: number;
  fg: string;
  description: string;
  openOrder: number;
  std: number;
  dspt: number;
  process: string;
  uap: string;
  group: string;
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

export default function SalesOrderDetailPlanner({ so, customer, itemNo, description }: SalesOrderDetailPlannerProps) {
  const currentWeek = getCurrentWeek();
  const visibleCount = 8;

  const [fromWeek, setFromWeek] = useState(Math.max(1, currentWeek - 3));
  const [toWeek, setToWeek] = useState(Math.min(52, fromWeek + visibleCount - 1));

  const visibleWeeks = useMemo(() => ALL_WEEKS.slice(fromWeek - 1, toWeek), [fromWeek, toWeek]);

  const [items, setItems] = useState<Item[]>([
    {
      id: 1,
      fg: itemNo || "FG-01",
      description: description || "Product Description",
      openOrder: 12000,
      std: 800,
      dspt: 43,
      process: "Casting",
      uap: "2.1",
      group: "FG",
      weeks: ALL_WEEKS.reduce((acc, w) => {
        acc[w] = { capacity: 2160, loading: 0 };
        return acc;
      }, {} as Record<number, WeekData>),
    },
  ]);

  const [dragMeta, setDragMeta] = useState<DragMeta | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [editModal, setEditModal] = useState<EditModalState>({ open: false, itemId: null, week: null, last: 0 });

  const leftTableRef = useRef<HTMLDivElement>(null);
  const rightTableRef = useRef<HTMLDivElement>(null);

  // Scroll sync
  useEffect(() => {
    const left = leftTableRef.current;
    const right = rightTableRef.current;
    if (!left || !right) return;
    const syncScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      left.scrollTop = target.scrollTop;
    };
    right.addEventListener("scroll", syncScroll);
    return () => right.removeEventListener("scroll", syncScroll);
  }, []);

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

  // Edit Modal
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

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="mb-4 text-lg font-bold text-gray-700">
        Customer: {customer} | SO: {so}
      </div>

      <div className="mb-3 flex items-center gap-4">
        <div>
          <label className="text-sm font-medium">From:</label>
          <input
            type="number"
            min="1"
            max="52"
            value={fromWeek}
            onChange={(e) => setFromWeek(Math.min(Number(e.target.value), toWeek))}
            className="border p-1 w-16 ml-1 rounded"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Today:</label>
          <span className="font-bold ml-1">W{currentWeek}</span>
        </div>
        <div>
          <label className="text-sm font-medium">To:</label>
          <input
            type="number"
            min={fromWeek}
            max="52"
            value={toWeek}
            onChange={(e) => setToWeek(Math.max(Number(e.target.value), fromWeek))}
            className="border p-1 w-16 ml-1 rounded"
          />
        </div>
      </div>

      <div className="flex border rounded-lg shadow-sm bg-white overflow-hidden">
        {/* Left Fixed Table */}
        <div ref={leftTableRef} className="overflow-y-auto max-h-[400px]">
          <table className="table-fixed border-r min-w-[600px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-6"></th>
                <th className="w-20">Item No</th>
                <th className="w-60">Description</th>
                <th className="w-16">Order</th>
                <th className="w-16">STD/H</th>
                <th className="w-16">DSPT</th>
                <th className="w-20">Process</th>
                <th className="w-16">UAP</th>
                <th className="w-16">Group</th>
                <th className="w-16">Legend</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <React.Fragment key={it.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="cursor-pointer text-center" onClick={() => toggleExpand(it.id)}>
                      {expandedItems[it.id] ? "▼" : "►"}
                    </td>
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
                    <td className="text-center">{it.process}</td>
                    <td className="text-center">{it.uap}</td>
                    <td className="text-center">{it.group}</td>
                    <td className="flex flex-col gap-0.5 text-[10px] text-center">
                      <div className="p-0.5 bg-yellow-100 rounded">Available</div>
                      <div className="p-0.5 bg-blue-100 rounded">Loading</div>
                      <div className="p-0.5 bg-red-100 rounded">Capacity</div>
                    </td>
                  </tr>

                  {expandedItems[it.id] && (
                    <tr className="bg-gray-100">
                      <td></td>
                      <td>{it.fg}</td>
                      <td></td>
                      <td></td>
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
                      <td></td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
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
                    className={`w-24 px-1 border-l text-center text-xs font-semibold ${w === currentWeek ? "bg-yellow-200" : ""}`}
                  >
                    W{w}
                  </th>
                ))}
                <th className="w-16 px-1 border-l text-center text-xs font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <React.Fragment key={it.id}>
                  <tr className="hover:bg-gray-50">
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

                  {expandedItems[it.id] && (
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
              ))}

              {/* Total Row */}
              <tr className="bg-gray-50 font-medium">
                {visibleWeeks.map((w) => (
                  <td key={w} className="px-1 border-l text-center">
                    {totals[w]}
                  </td>
                ))}
                <td className="text-center">{visibleWeeks.reduce((s, w) => s + (totals[w] || 0), 0)}</td>
              </tr>
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
