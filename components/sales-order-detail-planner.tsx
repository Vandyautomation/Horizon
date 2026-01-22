"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";

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

const formatNumber = (value: number, digits: number = 2) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)) : value;

interface WeekData {
  capacity: number;
  loading: number;
  available?: number;
}

interface Item {
  id: number;
  fg: string; // MaterialID / item number
  fg: string; // MaterialID / item number
  description: string;
  openOrder: number;
  std: number;
  // remaining DSPT that will decrease as loading is scheduled
  dspt: number;
  // initial DSPT from backend, used as base for remaining calculation
  initialDspt: number;
  process: string;
  uap: string;
  group: string;
  pro: string; // PRO_name from backend, used in level 3
  weeks: Record<number, WeekData>;
}

interface Level3Detail {
  process: string;
  itemNo: string;
  openOrder: number;
  std: number;
  // remaining DSPT for this PRO
  dspt: number;
  // initial DSPT from backend, used as base for remaining calculation
  initialDspt: number;
  weeks: Record<number, WeekData>;
}

interface DragMeta {
  itemId: number;
  fromWeek: number | null;
  field: string;
  value: number;
  detailIndex?: number | null;
}

interface EditModalState {
  open: boolean;
  itemId: number | null;
  week: number | null;
  last: number;
  detailIndex: number | null;
}

interface SalesOrderDetailPlannerProps {
  so: string;
  customer: string;
  itemNo: string;
  description: string;
}

// Struktur baris terpusat untuk menyamakan urutan row kiri & kanan.
// Saat ini baru dipakai untuk membangun array rows, render masih memakai items.map.
type PlannerRow =
  | { kind: "L1"; itemId: number }
  | { kind: "L2"; itemId: number }
  | { kind: "L3"; itemId: number; detailIndex: number | null }
  | { kind: "TOTAL" };
// ---------------------------------------------------------------------------
// Catatan konsep (belum dipakai, hanya referensi)
// ---------------------------------------------------------------------------
// Ide ke depan supaya tabel kiri/kanan punya struktur baris yang 100% identik,
// terutama untuk Level 3 yang jumlah barisnya dinamis per item:
//
// 1) Definisikan struktur baris terpusat:
// type PlannerRow =
//   | { kind: "L1"; itemId: number }
//   | { kind: "L2"; itemId: number }
//   | { kind: "L3"; itemId: number; detailIndex: number | null }
//   | { kind: "TOTAL" };
//
// 2) Bangun array rows sekali, lalu render kiri & kanan dari array ini:
// const rows: PlannerRow[] = useMemo(() => {
//   const result: PlannerRow[] = [];
//   items.forEach((it) => {
//     const isDetailOpen = !!detailExpanded[it.id];
//     const isProcessOpen = !!expandedItems[it.id];
//
//     result.push({ kind: "L1", itemId: it.id });
//
//     if (isDetailOpen) {
//       result.push({ kind: "L2", itemId: it.id });
//
//       if (isProcessOpen) {
//         const details = level3Details[it.id];
//         if (details && details.length > 0) {
//           details.forEach((_, idx) => {
//             result.push({ kind: "L3", itemId: it.id, detailIndex: idx });
//           });
//         } else {
//           result.push({ kind: "L3", itemId: it.id, detailIndex: null });
//         }
//       }
//     }
//   });
//
//   if (items.some((it) => detailExpanded[it.id])) {
//     result.push({ kind: "TOTAL" });
//   }
//
//   return result;
// }, [items, detailExpanded, expandedItems, level3Details]);
//
// 3) Di tbody kiri & kanan, ganti items.map(...) menjadi rows.map(row => ...)
//    dan render <tr> berdasarkan row.kind (L1/L2/L3/TOTAL) dengan className
//    tinggi yang sama di kiri dan kanan. Dengan begitu alignment vertikal
//    akan selalu pas walaupun jumlah PRO per item berbeda-beda.

export default function SalesOrderDetailPlanner({
  so,
  customer,
  itemNo,
  description,
}: SalesOrderDetailPlannerProps) {
  const currentWeek = getCurrentWeek();
  const initialYear = new Date().getFullYear();
  const visibleCount = 12;

  const [year, setYear] = useState<number>(initialYear);
  const [fromWeek, setFromWeek] = useState(Math.max(1, currentWeek - 3));
  const [toWeek, setToWeek] = useState(Math.min(52, fromWeek + visibleCount - 1));
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const visibleWeeks = useMemo(() => ALL_WEEKS.slice(fromWeek - 1, toWeek), [fromWeek, toWeek]);


  // Default item sebelumnya berisi data dummy untuk tampilan awal.
  // Sekarang dikosongkan supaya planner hanya menampilkan data asli dari backend.
  const buildDefaultItems = (): Item[] => [
    // {
    //   id: 1,
    //   fg: itemNo || "FG-01",
    //   description: description || "Product Description",
    //   openOrder: 12000,
    //   std: 800,
    //   dspt: 43,
    //   initialDspt: 43,
    //   process: "FG",
    //   uap: "2.1",
    //   group: "FG",
    //   pro: "1001",
    //   weeks: ALL_WEEKS.reduce((acc, w) => {
    //     acc[w] = { capacity: 2160, loading: 0 };
    //     return acc;
    //   }, {} as Record<number, WeekData>),
    // },
  ];

  const [items, setItems] = useState<Item[]>(buildDefaultItems());
  const itemsRef = useRef<Item[]>([]);
  const detailPrefetchRef = useRef<Set<number>>(new Set());
  const level3PrefetchRef = useRef<Set<number>>(new Set());
  const fitWrapRef = useRef<HTMLDivElement>(null);
  const fitContentRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pagedItems = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize, totalPages]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [fromWeek, toWeek, year, so, itemNo, pageSize]);
  const [dragMeta, setDragMeta] = useState<DragMeta | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const pausePollingUntilRef = useRef(0);
  const isUnmountedRef = useRef(false);

  // Level 2: detail FG
  const [detailExpanded, setDetailExpanded] = useState<Record<number, boolean>>({});
  // Level 3: extend proses
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  // Track level 3 detail per item (list of unique PRO_name)
  const [level3Details, setLevel3Details] = useState<Record<number, Level3Detail[]>>({});

  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    itemId: null,
    week: null,
    last: 0,
    detailIndex: null,
  });

  const buildRowKey = (processValue?: string, fgValue?: string, descValue?: string) =>
    `${processValue || "FG"}||${fgValue || itemNo || "FG-01"}||${
      descValue || description || "Product Description"
    }`;


  const isAdmin = useMemo(() => {
    const roleName = String(userData?.role_name ?? userData?.role?.name ?? "").toLowerCase();
    return roleName.includes("admin");
  }, [userData]);

  const leftTableRef = useRef<HTMLDivElement>(null);
  const rightTableRef = useRef<HTMLDivElement>(null);
  const leftRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const rightRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Sinkron scroll kiri-kanan, tapi hanya scrollbar kanan yang aktif.
  useEffect(() => {
    const left = leftTableRef.current;
    const right = rightTableRef.current;
    if (!left || !right) return;

    let syncing = false;

    const syncFromRight = (e: Event) => {
      if (syncing) return;
      syncing = true;
      left.scrollTop = (e.target as HTMLDivElement).scrollTop;
      requestAnimationFrame(() => {
        syncing = false;
      });
    };

    right.addEventListener("scroll", syncFromRight);

    return () => {
      right.removeEventListener("scroll", syncFromRight);
    };
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const user = localStorage.getItem("user");
      if (!user) {
        setUserData(null);
        return;
      }

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/check`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          setUserData(null);
          return;
        }
        const json = await res.json();
        const payloadUser = json?.data?.payload?.user;
        const directUser = json?.data?.user;
        setUserData(payloadUser ?? directUser ?? null);
      } catch (err) {
        console.error("Failed to check user", err);
        setUserData(null);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateFitScale = useCallback(() => {
    const wrap = fitWrapRef.current;
    const content = fitContentRef.current;
    if (!wrap || !content) return;
    const wrapWidth = wrap.getBoundingClientRect().width;
    const contentWidth = content.scrollWidth;
    if (!wrapWidth || !contentWidth) return;
    const nextScale = Math.min(1, wrapWidth / contentWidth);
    setFitScale((prev) => (Math.abs(prev - nextScale) > 0.01 ? nextScale : prev));
  }, []);

  useLayoutEffect(() => {
    updateFitScale();
    const wrap = fitWrapRef.current;
    const content = fitContentRef.current;
    if (!wrap || !content) return;

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateFitScale);
      return () => {
        window.removeEventListener("resize", updateFitScale);
      };
    }

    const observer = new ResizeObserver(() => {
      updateFitScale();
    });
    observer.observe(wrap);
    observer.observe(content);
    return () => {
      observer.disconnect();
    };
  }, [updateFitScale]);

  useEffect(() => {
    detailPrefetchRef.current = new Set();
    level3PrefetchRef.current = new Set();
    pausePollingUntilRef.current = 0;
    setItems(buildDefaultItems());
    setDetailExpanded({});
    setExpandedItems({});
    setLevel3Details({});
  }, [so, itemNo, description]);

  const loadLevel3Detail = async (item: Item) => {
    try {
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999").replace(/\/$/, "");
      const params = new URLSearchParams();
      if (so) params.append("so", so);
      params.append("materialId", String(item.fg));
      params.append("year", String(year));
      params.append("fromWeek", String(fromWeek));
      params.append("toWeek", String(toWeek));
      const processUrl = `${base}/api/hrz/planner-process?${params.toString()}`;
      const slotsUrl = `${base}/api/hrz/planner-dispatch-slots?${params.toString()}`;

      // 1) Detail proses (STD/H, DSPT per PRO)
      const res = await fetch(processUrl);
      if (!res.ok) throw new Error(`Planner process fetch failed: ${res.status}`);
      const data = await res.json();

      // 2) Slot dispatch yang tersimpan di DB (per PRO per week)
      const slotsRes = await fetch(slotsUrl);
      if (!slotsRes.ok) throw new Error(`Planner dispatch slots fetch failed: ${slotsRes.status}`);
      const slotsData = await slotsRes.json();

      const dispatchByProAndWeek: Record<string, Record<number, number>> = {};
      if (Array.isArray(slotsData)) {
        slotsData.forEach((s: any) => {
          const proName = String(s.proName ?? s.itemNo ?? "");
          const week = Number(s.week) || 0;
          const dispatch = Number(s.dispatch) || 0;
          if (!proName || week <= 0) return;
          if (!dispatchByProAndWeek[proName]) dispatchByProAndWeek[proName] = {};
          dispatchByProAndWeek[proName][week] = dispatch;
        });
      }

      const rows: Level3Detail[] = Array.isArray(data)
        ? data.map((r: any) => {
            const proName = r.itemNo;
            const perWeek = dispatchByProAndWeek[proName] || {};
            const weeks = ALL_WEEKS.reduce((acc, w) => {
              acc[w] = {
                capacity: item.weeks[w]?.capacity ?? 0,
                loading: Number(perWeek[w] || 0),
                available: item.weeks[w]?.available,
              };
              return acc;
            }, {} as Record<number, WeekData>);

            return {
              process: r.process,
              itemNo: proName,
              openOrder: Number(r.openOrder) || 0,
              std: Number(r.std) || 0,
              dspt: Number(r.dspt) || 0,
              initialDspt: Number(r.std) || Number(r.dspt) || 0,
              weeks,
            };
          })
        : [];

      // Deduplicate by itemNo (PRO_name): ambil satu per PRO_name
      const uniqueMap = new Map<string, Level3Detail>();
      rows.forEach((row) => {
        if (!uniqueMap.has(row.itemNo)) {
          uniqueMap.set(row.itemNo, row);
        }
      });
      const unique = Array.from(uniqueMap.values());
      if (!unique.length) return;

      setLevel3Details((prev) => ({ ...prev, [item.id]: unique }));

      // Hitung total loading per minggu untuk Level 2 dari penjumlahan semua PRO
      const aggregatedWeeks: Record<number, WeekData> = ALL_WEEKS.reduce(
        (acc, w) => {
          const totalLoading = unique.reduce(
            (sum, d) => sum + Number(d.weeks[w]?.loading || 0),
            0
          );
          acc[w] = {
            capacity: item.weeks[w]?.capacity ?? 0,
            loading: totalLoading,
            available: item.weeks[w]?.available,
          };
          return acc;
        },
        {} as Record<number, WeekData>
      );

      // Sinkronkan Level 2: weeks (loading) + std/dspt dari detail PRO
      setItems((prevItems) =>
        prevItems.map((it) => {
          if (it.id !== item.id) return it;
          const mergedWeeks = ALL_WEEKS.reduce((acc, w) => {
            acc[w] = { ...aggregatedWeeks[w], available: it.weeks[w]?.available };
            return acc;
          }, {} as Record<number, WeekData>);
          const updated: Item = { ...it, weeks: mergedWeeks };
          return recomputeItemDspt(updated, unique);
        })
      );
    } catch (err) {
      console.error("Failed to load level 3 detail", err);
    }
  };

  // When a row is expanded to level 3, lazy-load its detailed data once
  useEffect(() => {
    items.forEach((it) => {
      if (expandedItems[it.id] && !level3Details[it.id]) {
        loadLevel3Detail(it);
      }
    });
  }, [expandedItems, items, level3Details]);

  const getAvailable = (it: Item, week: number) => {
    const available = it.weeks[week].available;
    if (typeof available === "number" && Number.isFinite(available)) {
      return available;
    }
    return Number(it.weeks[week].capacity) - Number(it.weeks[week].loading || 0);
  };

  const computeAvailableValue = (capacity: number, loading: number, fallback?: number) => {
    const capNum = Number(capacity);
    if (!Number.isFinite(capNum)) return fallback;
    return capNum - Number(loading || 0);
  };

  const computeTotalLoading = (weeks: Record<number, WeekData>) =>
    ALL_WEEKS.reduce((sum, w) => sum + Number(weeks[w]?.loading || 0), 0);

  // Recalculate Level 2 (FG) STD/H & DSPT.
  // - Jika sudah ada detail PRO (level 3), ambil hasil penjumlahan dari PRO.
  // - Jika belum ada detail, gunakan logika awal: DSPT = initialDspt - total loading.
  const recomputeItemDspt = (item: Item, details?: Level3Detail[]): Item => {
    if (details && details.length) {
      return item;
    }

    const totalLoading = computeTotalLoading(item.weeks);
    const base = Number(item.initialDspt ?? item.dspt ?? 0);
    const remaining = Math.max(0, base - totalLoading);
    return { ...item, dspt: remaining };
  };

  const recomputeDetailDspt = (detail: Level3Detail): Level3Detail => {
    const totalLoading = computeTotalLoading(detail.weeks);
    const base = Number(detail.initialDspt ?? detail.dspt ?? 0);
    const remaining = Math.max(0, base - totalLoading);
    return { ...detail, dspt: remaining };
  };

  const postDispatchUpdate = async (body: any) => {
    try {
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999").replace(
        /\/$/,
        ""
      );
      const res = await fetch(`${base}/api/hrz/planner-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Dispatch update failed", await res.text());
      }
    } catch (err) {
      console.error("Failed to update dispatch backend", err);
    }
  };

  const totals = useMemo(() => {
    const t: Record<number, number> = {};
    visibleWeeks.forEach((w) => {
      t[w] = pagedItems.reduce((sum, it) => sum + Number(it.weeks[w].loading || 0), 0);
    });
    return t;
  }, [pagedItems, visibleWeeks]);

  const visibleTotalsSum = useMemo(
    () => visibleWeeks.reduce((sum, w) => sum + Number(totals[w] || 0), 0),
    [totals, visibleWeeks]
  );

  const itemTotalsById = useMemo(() => {
    const map = new Map<number, number>();
    pagedItems.forEach((it) => {
      let sum = 0;
      visibleWeeks.forEach((w) => {
        sum += Number(it.weeks[w].loading || 0);
      });
      map.set(it.id, sum);
    });
    return map;
  }, [pagedItems, visibleWeeks]);

  const anyDetailOpen = useMemo(
    () => pagedItems.some((it) => detailExpanded[it.id]),
    [pagedItems, detailExpanded]
  );

  // Bangun array rows sekali, dipakai untuk render kiri & kanan.
  const rows: PlannerRow[] = useMemo(() => {
    const result: PlannerRow[] = [];

    pagedItems.forEach((it) => {
      const isDetailOpen = !!detailExpanded[it.id];
      const isProcessOpen = !!expandedItems[it.id];

      result.push({ kind: "L1", itemId: it.id });

      if (isDetailOpen) {
        result.push({ kind: "L2", itemId: it.id });

        if (isProcessOpen) {
          const details = level3Details[it.id];
          if (details && details.length > 0) {
            details.forEach((_, idx) => {
              result.push({ kind: "L3", itemId: it.id, detailIndex: idx });
            });
          } else {
            result.push({ kind: "L3", itemId: it.id, detailIndex: null });
          }
        }
      }
    });

    if (anyDetailOpen) {
      result.push({ kind: "TOTAL" });
    }

    return result;
  }, [pagedItems, detailExpanded, expandedItems, level3Details, anyDetailOpen]);

  const itemById = useMemo(() => {
    const map = new Map<number, Item>();
    items.forEach((it) => map.set(it.id, it));
    return map;
  }, [items]);

  useLayoutEffect(() => {
    const leftMap = leftRowRefs.current;
    const rightMap = rightRowRefs.current;

    const updateHeight = (key: string) => {
      const leftRow = leftMap[key];
      const rightRow = rightMap[key];
      if (!leftRow || !rightRow) return;
      leftRow.style.height = "auto";
      rightRow.style.height = "auto";
      const leftHeight = leftRow.getBoundingClientRect().height;
      const rightHeight = rightRow.getBoundingClientRect().height;
      const height = Math.max(leftHeight, rightHeight);
      leftRow.style.height = `${height}px`;
      rightRow.style.height = `${height}px`;
    };

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const key = (entry.target as HTMLElement).dataset.rowKey;
        if (key) updateHeight(key);
      });
    });

    Object.keys(leftMap).forEach((key) => {
      const row = leftMap[key];
      if (!row) return;
      observer.observe(row);
      updateHeight(key);
    });

    Object.keys(rightMap).forEach((key) => {
      const row = rightMap[key];
      if (!row) return;
      observer.observe(row);
      updateHeight(key);
    });

    return () => {
      observer.disconnect();
    };
  }, [rows, visibleWeeks]);

  // Drag & Drop
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    itemId: number,
    fromWeek: number | null,
    field: string,
    value: number,
    detailIndex: number | null = null
  ) => {
    if (!isAdmin) return;
    e.dataTransfer?.setData(
      "text/plain",
      JSON.stringify({ itemId, fromWeek, field, value, detailIndex })
    );
    setDragMeta({ itemId, fromWeek, field, value, detailIndex });
  };

  const handleDrop = (toItemId: number, toWeek: number, detailIndex: number | null = null) => {
    if (!isAdmin) return;
    if (!dragMeta) return;

    // Jika drag berasal dari / ditujukan ke level 3 (detailIndex terisi),
    // update hanya weeks milik PRO tersebut.
    const effectiveDetailIndex = detailIndex ?? dragMeta.detailIndex ?? null;

    if (effectiveDetailIndex !== null && effectiveDetailIndex >= 0) {
      const val = Number(dragMeta.value);
      const sourceItem = items.find((it) => it.id === dragMeta.itemId);

      setLevel3Details((prev) => {
        const list = prev[dragMeta.itemId];
        if (!list || !list[effectiveDetailIndex]) return prev;

        const updatedList = list.map((d, idx) => {
          if (idx !== effectiveDetailIndex) return d;
          const weeks = { ...d.weeks };

          if (dragMeta.fromWeek !== null) {
            weeks[dragMeta.fromWeek] = {
              ...weeks[dragMeta.fromWeek],
              loading: Math.max(0, (weeks[dragMeta.fromWeek].loading || 0) - val),
              available: computeAvailableValue(
                weeks[dragMeta.fromWeek].capacity,
                Math.max(0, (weeks[dragMeta.fromWeek].loading || 0) - val),
                weeks[dragMeta.fromWeek].available
              ),
            };
          }

          weeks[toWeek] = {
            ...weeks[toWeek],
            loading: (weeks[toWeek].loading || 0) + val,
            available: computeAvailableValue(
              weeks[toWeek].capacity,
              (weeks[toWeek].loading || 0) + val,
              weeks[toWeek].available
            ),
          };

          const updatedDetail: Level3Detail = { ...d, weeks };
          return recomputeDetailDspt(updatedDetail);
        });

        // Aggregate kembali ke Item.weeks (sum semua detail)
        const aggregatedWeeks: Record<number, WeekData> = ALL_WEEKS.reduce(
          (acc, w) => {
            const loadingSum = updatedList.reduce(
              (s, d) => s + Number(d.weeks[w]?.loading || 0),
              0
            );
            const capacity =
              updatedList[0]?.weeks[w]?.capacity ??
              prev[dragMeta.itemId]?.[0]?.weeks[w]?.capacity ??
              0;
            acc[w] = {
              capacity,
              loading: loadingSum,
              available: computeAvailableValue(
                capacity,
                loadingSum,
                sourceItem?.weeks[w]?.available
              ),
            };
            return acc;
          },
          {} as Record<number, WeekData>
        );

        setItems((prevItems) =>
          prevItems.map((it) =>
            it.id === dragMeta.itemId
              ? recomputeItemDspt(
                  {
                    ...it,
                    weeks: ALL_WEEKS.reduce((acc, w) => {
                      acc[w] = {
                        ...aggregatedWeeks[w],
                        available:
                          aggregatedWeeks[w]?.available ??
                          computeAvailableValue(
                            aggregatedWeeks[w]?.capacity ?? it.weeks[w]?.capacity ?? 0,
                            aggregatedWeeks[w]?.loading ?? it.weeks[w]?.loading ?? 0,
                            it.weeks[w]?.available
                          ),
                      };
                      return acc;
                    }, {} as Record<number, WeekData>),
                  },
                  updatedList
                )
              : it
          )
        );

        pausePollingUntilRef.current = Date.now() + 30000;

        // Update backend dispatch untuk perpindahan loading level 3
        if (dragMeta.fromWeek !== null) {
          const item = items.find((it) => it.id === dragMeta.itemId);
          const detail = updatedList[effectiveDetailIndex];
          const dsptTotal =
            (detail && Number(detail.initialDspt ?? detail.dspt ?? 0)) || 0;
          void postDispatchUpdate({
            mode: "move",
            so,
            materialId: item ? Number(item.fg) || 0 : dragMeta.itemId,
            process: (detail && detail.process) || (item && item.process) || "",
            year,
            fromWeek: dragMeta.fromWeek,
            toWeek,
            qty: val,
            proName: (detail && detail.itemNo) || "",
            dsptTotal,
          });
        }

        return { ...prev, [dragMeta.itemId]: updatedList };
      });
    } else {
      // Drag dari level 2 (FG) — gunakan weeks agregat di Item
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== dragMeta.itemId) return it;
          const nw = { ...it.weeks };
          const val = Number(dragMeta.value);

          if (dragMeta.fromWeek) {
            nw[dragMeta.fromWeek] = {
              ...nw[dragMeta.fromWeek],
              loading: Math.max(0, (nw[dragMeta.fromWeek].loading || 0) - val),
              available: computeAvailableValue(
                nw[dragMeta.fromWeek].capacity,
                Math.max(0, (nw[dragMeta.fromWeek].loading || 0) - val),
                nw[dragMeta.fromWeek].available
              ),
            };
          }

          nw[toWeek] = {
            ...nw[toWeek],
            loading: (nw[toWeek].loading || 0) + val,
            available: computeAvailableValue(
              nw[toWeek].capacity,
              (nw[toWeek].loading || 0) + val,
              nw[toWeek].available
            ),
          };

          const updatedItem: Item = { ...it, weeks: nw };
          return recomputeItemDspt(updatedItem);
        })
      );
      pausePollingUntilRef.current = Date.now() + 30000;
    }

    setDragMeta(null);
  };

  // Edit modal
  const openEditModal = (itemId: number, week: number, detailIndex: number | null = null) => {
    if (!isAdmin) return;
    let last = 0;
    if (detailIndex !== null && level3Details[itemId]?.[detailIndex]) {
      last = level3Details[itemId]![detailIndex].weeks[week]?.loading || 0;
    } else {
      last = items.find((it) => it.id === itemId)?.weeks[week].loading || 0;
    }
    setEditModal({ open: true, itemId, week, last, detailIndex });
  };

  const applyEditModal = (value: string) => {
    if (!isAdmin) return;
    const num = Number(value) || 0;

    // Edit per PRO (level 3)
    if (
      editModal.detailIndex !== null &&
      editModal.itemId !== null &&
      editModal.week !== null
    ) {
      const itemId = editModal.itemId;
      const week = editModal.week;
      const detailIdx = editModal.detailIndex;
      const sourceItem = items.find((it) => it.id === itemId);

      setLevel3Details((prev) => {
        const list = prev[itemId];
        if (!list || !list[detailIdx]) return prev;

        const updatedList = list.map((d, idx) => {
          if (idx !== detailIdx) return d;
          const weeks = { ...d.weeks };
          weeks[week] = {
            ...weeks[week],
            loading: num,
            available: computeAvailableValue(weeks[week].capacity, num, weeks[week].available),
          };
          const updatedDetail: Level3Detail = { ...d, weeks };
          return recomputeDetailDspt(updatedDetail);
        });

        // Aggregate ke Item.weeks (sum semua PRO)
        const aggregatedWeeks: Record<number, WeekData> = ALL_WEEKS.reduce(
          (acc, w) => {
            const loading = updatedList.reduce(
              (s, d) => s + (d.weeks[w]?.loading || 0),
              0
            );
            const capacity = updatedList[0]?.weeks[w]?.capacity ?? 0;
            acc[w] = {
              capacity,
              loading,
              available: computeAvailableValue(
                capacity,
                loading,
                sourceItem?.weeks[w]?.available
              ),
            };
            return acc;
          },
          {} as Record<number, WeekData>
        );

        setItems((prevItems) =>
          prevItems.map((it) =>
            it.id === itemId
              ? recomputeItemDspt(
                  {
                    ...it,
                    weeks: ALL_WEEKS.reduce((acc, w) => {
                      acc[w] = {
                        ...aggregatedWeeks[w],
                        available:
                          aggregatedWeeks[w]?.available ??
                          computeAvailableValue(
                            aggregatedWeeks[w]?.capacity ?? it.weeks[w]?.capacity ?? 0,
                            aggregatedWeeks[w]?.loading ?? it.weeks[w]?.loading ?? 0,
                            it.weeks[w]?.available
                          ),
                      };
                      return acc;
                    }, {} as Record<number, WeekData>),
                  },
                  updatedList
                )
              : it
          )
        );

        return { ...prev, [itemId]: updatedList };
      });

        pausePollingUntilRef.current = Date.now() + 30000;

        // Sinkron ke backend (dispatch per PRO via modal)
        const item = items.find((it) => it.id === itemId);
      const details = level3Details[itemId];
      const detail = details && details[detailIdx];
      const dsptTotal =
        (detail && Number(detail.initialDspt ?? detail.dspt ?? 0)) || 0;
      const oldQty = editModal.last || 0;

      void postDispatchUpdate({
        mode: "modal",
        so,
        materialId: item ? Number(item.fg) || 0 : itemId,
        process: (detail && detail.process) || (item && item.process) || "",
        year,
        week,
        oldQty,
        newQty: num,
        proName: (detail && detail.itemNo) || "",
        dsptTotal,
      });
    } else {
      // Edit di level 2 (FG) — langsung set ke Item.weeks (total)
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== editModal.itemId) return it;
          const nw = { ...it.weeks };
          if (editModal.week !== null) {
            nw[editModal.week] = {
              ...nw[editModal.week],
              loading: num,
              available: computeAvailableValue(
                nw[editModal.week].capacity,
                num,
                nw[editModal.week].available
              ),
            };
          }
          const updatedItem: Item = { ...it, weeks: nw };
          return recomputeItemDspt(updatedItem);
        })
      );
      pausePollingUntilRef.current = Date.now() + 30000;
    }

    setEditModal({ open: false, itemId: null, week: null, last: 0, detailIndex: null });
  };

  const loadPlannerData = useCallback(
    async (options?: { weeksOnly?: boolean }) => {
      if (isUnmountedRef.current) return;
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999").replace(
        /\/$/,
        ""
      );
      const params = new URLSearchParams();
      if (so) params.append("so", so);
      params.append("year", String(year));
      params.append("fromWeek", String(fromWeek));
      params.append("toWeek", String(toWeek));
      // jangan filter per itemNo di sini supaya semua MaterialID dalam SO yang sama ikut muncul
      const url = `${base}/api/hrz/planner?${params.toString()}`;
      const capacityUrl = `${base}/api/hrz/planner-capacity?${params.toString()}`;

      try {
        if (options?.weeksOnly) {
          if (Date.now() < pausePollingUntilRef.current) return;
          const capRes = await fetch(capacityUrl);
          if (!capRes.ok) throw new Error(`Planner capacity fetch failed: ${capRes.status}`);
          const capData = await capRes.json();
          const capRows = Array.isArray(capData) ? capData : [];
          const capacityMap = new Map<string, { capacity?: number; available?: number }>();

          capRows.forEach((row: any) => {
            const group = String(row.GroupName ?? "");
            const uap = String(row.UAP ?? "");
            const process = String(row.MchProcess ?? "");
            const weekNum = Number(String(row.WeekNum ?? "").replace(/[^\d]/g, "")) || 0;
            if (!group || !uap || !process || weekNum < 1 || weekNum > 52) return;
            const capacity =
              row.Capacity === null || row.Capacity === undefined
                ? undefined
                : Number(row.Capacity);
            const available =
              row.AvailCapacity === null || row.AvailCapacity === undefined
                ? undefined
                : Number(row.AvailCapacity);
            const key = `${group}||${uap}||${process}||${weekNum}`;
            capacityMap.set(key, {
              capacity: Number.isFinite(capacity) ? capacity : undefined,
              available: Number.isFinite(available) ? available : undefined,
            });
          });

          const weekUpdates = new Map<
            string,
            Record<number, { capacity?: number; available?: number }>
          >();

          itemsRef.current.forEach((it) => {
            if (!it.group || !it.uap || !it.process) return;
            const key = buildRowKey(it.process, it.fg, it.description);
            const existing = weekUpdates.get(key) || {};
            ALL_WEEKS.forEach((w) => {
              const capKey = `${it.group}||${it.uap}||${it.process}||${w}`;
              const cap = capacityMap.get(capKey);
              if (!cap) return;
              existing[w] = {
                capacity: typeof cap.capacity === "number" ? cap.capacity : existing[w]?.capacity,
                available: typeof cap.available === "number" ? cap.available : existing[w]?.available,
              };
            });
            weekUpdates.set(key, existing);
          });

          let nextItems: Item[] = [];

          setItems((prevItems) => {
            nextItems = prevItems.map((it) => {
              const key = buildRowKey(it.process, it.fg, it.description);
              const updates = weekUpdates.get(key);
              if (!updates) return it;

              const weeks = { ...it.weeks };
              Object.entries(updates).forEach(([weekKey, update]) => {
                const w = Number(weekKey);
                if (!weeks[w]) return;
                weeks[w] = {
                  ...weeks[w],
                  capacity:
                    typeof update.capacity === "number" && Number.isFinite(update.capacity)
                      ? update.capacity
                      : weeks[w].capacity,
                  available:
                    typeof update.available === "number" && Number.isFinite(update.available)
                      ? update.available
                      : weeks[w].available,
                };
              });

              return { ...it, weeks };
            });

            return nextItems;
          });

          setLevel3Details((prev) => {
            if (!nextItems.length) return prev;
            const itemMap = new Map<number, Item>();
            nextItems.forEach((it) => itemMap.set(it.id, it));

            const updatedEntries = Object.entries(prev).map(([id, details]) => {
              const item = itemMap.get(Number(id));
              if (!item || !details) return [id, details];

              const updatedDetails = details.map((detail) => {
                const weeks = { ...detail.weeks };
                ALL_WEEKS.forEach((w) => {
                  const itemWeek = item.weeks[w];
                  if (!itemWeek) return;
                  weeks[w] = {
                    ...weeks[w],
                    capacity: itemWeek.capacity,
                    available: itemWeek.available,
                  };
                });
                return { ...detail, weeks };
              });

              return [id, updatedDetails];
            });

            return Object.fromEntries(updatedEntries) as Record<number, Level3Detail[]>;
          });

          return;
        }

        const [res, capRes] = await Promise.all([fetch(url), fetch(capacityUrl)]);
        if (!res.ok) throw new Error(`Planner fetch failed: ${res.status}`);
        if (!capRes.ok) throw new Error(`Planner capacity fetch failed: ${capRes.status}`);
        const data = await res.json();
        const capData = await capRes.json();
        const rows = Array.isArray(data) ? data : [];
        const capRows = Array.isArray(capData) ? capData : [];
        const capacityMap = new Map<string, { capacity?: number; available?: number }>();

        capRows.forEach((row: any) => {
          const group = String(row.GroupName ?? "");
          const uap = String(row.UAP ?? "");
          const process = String(row.MchProcess ?? "");
          const weekNum = Number(String(row.WeekNum ?? "").replace(/[^\d]/g, "")) || 0;
          if (!group || !uap || !process || weekNum < 1 || weekNum > 52) return;
          const capacity =
            row.Capacity === null || row.Capacity === undefined
              ? undefined
              : Number(row.Capacity);
          const available =
            row.AvailCapacity === null || row.AvailCapacity === undefined
              ? undefined
              : Number(row.AvailCapacity);
          const key = `${group}||${uap}||${process}||${weekNum}`;
          capacityMap.set(key, {
            capacity: Number.isFinite(capacity) ? capacity : undefined,
            available: Number.isFinite(available) ? available : undefined,
          });
        });

        const itemsMap = new Map<string, Item>();

        rows.forEach((row: any) => {
          const key = buildRowKey(row.process, row.itemNo, row.description);

          let item = itemsMap.get(key);
          if (!item) {
            item = {
              id: itemsMap.size + 1,
              fg: row.itemNo || itemNo || "FG-01",
              description: row.description || description || "Product Description",
              openOrder: Number(row.openOrder) || 0,
              std: Number(row.std) || 0,
              dspt: Number(row.dspt) || 0,
              initialDspt: Number(row.std) || Number(row.dspt) || 0,
              process: row.process || "FG",
              uap: row.uap || "0",
              group: row.group || "FG",
              pro: row.pro || row.PRO_name || "",
              weeks: ALL_WEEKS.reduce((acc, w) => {
                acc[w] = { capacity: 0, loading: 0 };
                return acc;
              }, {} as Record<number, WeekData>),
            };
            itemsMap.set(key, item);
          }

          const weekNum = Number(String(row.weekNum ?? "").replace(/[^\d]/g, "")) || 0;
          if (weekNum >= 1 && weekNum <= 52) {
            const capKey = `${item.group}||${item.uap}||${item.process}||${weekNum}`;
            const cap = capacityMap.get(capKey);
            const capacity =
              typeof cap?.capacity === "number" ? cap.capacity : item.weeks[weekNum].capacity;
            const available =
              typeof cap?.available === "number" ? cap.available : item.weeks[weekNum].available;
            item.weeks[weekNum] = {
              ...item.weeks[weekNum],
              capacity,
              available,
            };
          }
        });

        const mapped = Array.from(itemsMap.values());

        if (!isUnmountedRef.current) {
          const next = mapped.length ? mapped : buildDefaultItems();
          setItems(next);
        }
      } catch (err) {
        console.error("Failed to load planner data", err);
        if (!isUnmountedRef.current) setItems(buildDefaultItems());
      }
    },
    [so, year, fromWeek, toWeek, itemNo, description]
  );

  const loadLevel1List = useCallback(async () => {
    if (isUnmountedRef.current) return;
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999").replace(/\/$/, "");
    const params = new URLSearchParams();
    if (so) params.append("so", so);
    params.append("mode", "level1");
    const url = `${base}/api/hrz/planner?${params.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Planner level1 fetch failed: ${res.status}`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      const itemsMap = new Map<string, Item>();

      rows.forEach((row: any) => {
        const key = buildRowKey(row.process, row.itemNo, row.description);
        if (itemsMap.has(key)) return;
        const item: Item = {
          id: itemsMap.size + 1,
          fg: row.itemNo || itemNo || "FG-01",
          description: row.description || description || "Product Description",
          openOrder: 0,
          std: 0,
          dspt: 0,
          initialDspt: 0,
          process: row.process || "FG",
          uap: "",
          group: "",
          pro: "",
          weeks: ALL_WEEKS.reduce((acc, w) => {
            acc[w] = { capacity: 0, loading: 0 };
            return acc;
          }, {} as Record<number, WeekData>),
        };
        itemsMap.set(key, item);
      });

      if (!isUnmountedRef.current) {
        const mapped = Array.from(itemsMap.values());
        setItems(mapped.length ? mapped : buildDefaultItems());
      }
    } catch (err) {
      console.error("Failed to load level 1 planner data", err);
      if (!isUnmountedRef.current) setItems(buildDefaultItems());
    }
  }, [so, itemNo, description]);

  const loadPlannerItemDetail = useCallback(
    async (item: Item) => {
      if (isUnmountedRef.current) return;
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999").replace(
        /\/$/,
        ""
      );
      const params = new URLSearchParams();
      if (so) params.append("so", so);
      params.append("itemNo", String(item.fg));
      params.append("year", String(year));
      params.append("fromWeek", String(fromWeek));
      params.append("toWeek", String(toWeek));
      const url = `${base}/api/hrz/planner?${params.toString()}`;
      const capacityUrl = `${base}/api/hrz/planner-capacity?${params.toString()}`;

      try {
        const [res, capRes] = await Promise.all([fetch(url), fetch(capacityUrl)]);
        if (!res.ok) throw new Error(`Planner fetch failed: ${res.status}`);
        if (!capRes.ok) throw new Error(`Planner capacity fetch failed: ${capRes.status}`);
        const data = await res.json();
        const capData = await capRes.json();
        const rows = Array.isArray(data) ? data : [];
        const capRows = Array.isArray(capData) ? capData : [];
        const capacityMap = new Map<string, { capacity?: number; available?: number }>();

        capRows.forEach((row: any) => {
          const group = String(row.GroupName ?? "");
          const uap = String(row.UAP ?? "");
          const process = String(row.MchProcess ?? "");
          const weekNum = Number(String(row.WeekNum ?? "").replace(/[^\d]/g, "")) || 0;
          if (!group || !uap || !process || weekNum < 1 || weekNum > 52) return;
          const capacity =
            row.Capacity === null || row.Capacity === undefined
              ? undefined
              : Number(row.Capacity);
          const available =
            row.AvailCapacity === null || row.AvailCapacity === undefined
              ? undefined
              : Number(row.AvailCapacity);
          const key = `${group}||${uap}||${process}||${weekNum}`;
          capacityMap.set(key, {
            capacity: Number.isFinite(capacity) ? capacity : undefined,
            available: Number.isFinite(available) ? available : undefined,
          });
        });

        const updatedItemBase = rows[0];
        const updatedItem: Item = {
          ...item,
          fg: updatedItemBase?.itemNo || item.fg,
          description: updatedItemBase?.description || item.description,
          openOrder: Number(updatedItemBase?.openOrder) || item.openOrder,
          std: Number(updatedItemBase?.std) || 0,
          dspt: Number(updatedItemBase?.dspt) || 0,
          initialDspt:
            Number(updatedItemBase?.std) || Number(updatedItemBase?.dspt) || 0,
          process: updatedItemBase?.process || item.process,
          uap: updatedItemBase?.uap || item.uap,
          group: updatedItemBase?.group || item.group,
          pro: updatedItemBase?.pro || item.pro,
          weeks: ALL_WEEKS.reduce((acc, w) => {
            acc[w] = { capacity: 0, loading: 0 };
            return acc;
          }, {} as Record<number, WeekData>),
        };

        rows.forEach((row: any) => {
          const weekNum = Number(String(row.weekNum ?? "").replace(/[^\d]/g, "")) || 0;
          if (weekNum < 1 || weekNum > 52) return;
          const capKey = `${updatedItem.group}||${updatedItem.uap}||${updatedItem.process}||${weekNum}`;
          const cap = capacityMap.get(capKey);
          updatedItem.weeks[weekNum] = {
            ...updatedItem.weeks[weekNum],
            capacity:
              typeof cap?.capacity === "number"
                ? cap.capacity
                : updatedItem.weeks[weekNum].capacity,
            available:
              typeof cap?.available === "number"
                ? cap.available
                : updatedItem.weeks[weekNum].available,
          };
        });

        setItems((prevItems) =>
          prevItems.map((it) => (it.id === item.id ? updatedItem : it))
        );
      } catch (err) {
        console.error("Failed to load planner item detail", err);
      }
    },
    [so, year, fromWeek, toWeek]
  );

  const loadPlannerAvail = useCallback(async () => {
    if (isUnmountedRef.current || !so) return;
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999").replace(
      /\/$/,
      ""
    );
    const params = new URLSearchParams();
    params.append("so", so);
    if (year) params.append("year", String(year));
    if (fromWeek) params.append("fromWeek", String(fromWeek));
    if (toWeek) params.append("toWeek", String(toWeek));
    const url = `${base}/api/hrz/planner-avail?${params.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Planner avail fetch failed: ${res.status}`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      const availMap = new Map<string, number>();
      rows.forEach((row: any) => {
        const key = String(row.itemNo ?? row.MaterialID ?? "");
        if (!key) return;
        availMap.set(key, Number(row.totalAvail ?? row.TotalAvail ?? 0));
      });

      setItems((prevItems) =>
        prevItems.map((it) => {
          const key = String(it.fg);
          if (!availMap.has(key)) return it;
          const nextAvail = availMap.get(key);
          if (typeof nextAvail !== "number" || !Number.isFinite(nextAvail)) return it;
          return { ...it, dspt: nextAvail };
        })
      );
    } catch (err) {
      console.error("Failed to load planner avail", err);
    }
  }, [fromWeek, so, toWeek, year]);

  useEffect(() => {
    if (!so || !items.length) return;
    items.forEach((it) => {
      if (detailPrefetchRef.current.has(it.id)) return;
      detailPrefetchRef.current.add(it.id);
      void loadPlannerItemDetail(it);
    });
  }, [items, loadPlannerItemDetail, so]);

  useEffect(() => {
    if (!so) return;
    void loadPlannerAvail();
    const intervalId = setInterval(() => {
      void loadPlannerAvail();
    }, 14 * 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [loadPlannerAvail, so]);

  useEffect(() => {
    if (!so || !pagedItems.length) return;
    pagedItems.forEach((it) => {
      if (level3PrefetchRef.current.has(it.id)) return;
      level3PrefetchRef.current.add(it.id);
      void loadLevel3Detail(it);
    });
  }, [pagedItems, loadLevel3Detail, so]);


  const toggleDetail = (itemId: number) =>
    setDetailExpanded((prev) => {
      const next = !prev[itemId];
      if (next) {
        const item = items.find((it) => it.id === itemId);
        if (item) {
          void loadPlannerItemDetail(item);
        }
        loadPlannerData({ weeksOnly: true });
      }
      return { ...prev, [itemId]: next };
    });

  const toggleExpand = (itemId: number) =>
    setExpandedItems((prev) => {
      const next = !prev[itemId];
      if (next) {
        loadPlannerData({ weeksOnly: true });
      }
      return { ...prev, [itemId]: next };
    });

  // Fetch level 1 data dari backend + polling capacity
  useEffect(() => {
    loadLevel1List();
    const intervalId = setInterval(() => {
      loadPlannerData({ weeksOnly: true });
    }, 30 * 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [loadLevel1List, loadPlannerData]);

  return (
    <div ref={fitWrapRef} className="fit-view-root bg-white rounded-lg shadow p-4">
      <div
        ref={fitContentRef}
        className="fit-view-content"
        style={{ transform: `scale(${fitScale})` }}
      >
      {/* Header info */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-500">From</label>
            <input
              type="number"
              min={1}
              max={52}
              value={fromWeek}
              onChange={(e) => {
                const nextFrom = Math.min(Number(e.target.value), 52);
                setFromWeek(nextFrom);
                setToWeek(Math.min(52, nextFrom + visibleCount - 1));
              }}
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
              max={Math.min(52, fromWeek + visibleCount - 1)}
              value={toWeek}
              onChange={(e) => {
                const nextTo = Math.max(Number(e.target.value), fromWeek);
                setToWeek(Math.min(fromWeek + visibleCount - 1, nextTo));
              }}
              className="border rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-between text-sm text-gray-800">
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-2 border rounded bg-gray-50">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Customer</div>
            <div className="font-semibold">{customer || "-"}</div>
          </div>
            <div className="px-3 py-2 border rounded bg-gray-50">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">SO</div>
            <div className="font-semibold">{so || "-"}</div>
          </div>
          </div>

          {/* Year di baris yang sama dengan Customer & SO */}
          <div className="px-3 py-2 border rounded bg-gray-50">
            <div className="text-[10px] uppercase tracking-wide text-gray-500 text-right">Year</div>
            <input
              type="number"
              className="border rounded px-2 py-1 w-24 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-right mt-1"
              value={year}
              onChange={(e) => {
                const val = Number(e.target.value) || initialYear;
                setYear(val);
              }}
            />
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-end gap-2 text-xs text-gray-700">
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="rounded border px-2 py-1 disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {Math.min(currentPage, totalPages)} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          className="rounded border px-2 py-1 disabled:opacity-50"
        >
          Next
        </button>
        <span className="text-[10px] text-gray-500">Total: {items.length}</span>
      </div>

      <div className="flex border rounded-lg shadow-sm bg-white overflow-hidden">
        {/* Left Fixed Table */}
        <div ref={leftTableRef} className="overflow-y-hidden hide-scrollbar bg-gray-50">
          <table className="planner-left-table table-auto border-r w-auto min-w-[800px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th></th>
                <th>Process</th>
                <th>Item No</th>
                <th>Description</th>
                <th>Order</th>
                <th>STD/H</th>
                <th>DSPT</th>
                <th>UAP</th>
                <th>Group</th>
                <th>Legend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                if (row.kind === "TOTAL") {
                  const key = "TOTAL";
                  return (
                    <tr
                      key={`${key}-${rowIndex}`}
                      data-row-key={key}
                      ref={(el) => {
                        leftRowRefs.current[key] = el;
                      }}
                      className="bg-gray-50 h-10"
                    >
                      <td colSpan={11}></td>
                    </tr>
                  );
                }
                const it = itemById.get(row.itemId);
                if (!it) return null;
                const isDetailOpen = !!detailExpanded[it.id];
                const isProcessOpen = !!expandedItems[it.id];
                const detail =
                  row.kind === "L3" && row.detailIndex !== null
                    ? level3Details[it.id]?.[row.detailIndex]
                    : null;
                const rowKey = `${row.kind}-${it.id}-${row.kind === "L3" ? row.detailIndex : "x"}`;
                if (row.kind === "L1") {
                  return (
                    <tr
                      key={rowKey}
                      data-row-key={rowKey}
                      ref={(el) => {
                        leftRowRefs.current[rowKey] = el;
                      }}
                      className="hover:bg-gray-50 h-14"
                    >
                      <td className="cursor-pointer text-center" onClick={() => toggleDetail(it.id)}>
                        {isDetailOpen ? "v" : "+"}
                      </td>
                      <td className="text-center">{it.process}</td>
                      <td className="text-center">{it.fg}</td>
                      <td className="text-center">{it.description}</td>
                      <td className="text-center"></td>
                      <td className="text-center rounded"></td>
                      <td className="text-center"></td>
                      <td className="text-center"></td>
                      <td className="text-center"></td>
                      <td className="text-center"></td>
                      <td className="text-center text-[10px]"></td>
                    </tr>
                  );
                }
                if (row.kind === "L2") {
                  return (
                    <tr
                      key={rowKey}
                      data-row-key={rowKey}
                      ref={(el) => {
                        leftRowRefs.current[rowKey] = el;
                      }}
                      className="hover:bg-gray-50 h-14"
                    >
                      <td className="cursor-pointer text-center" onClick={() => toggleExpand(it.id)}>
                        {isProcessOpen ? "v" : "+"}
                      </td>
                      <td className="text-center">{it.process}</td>
                      <td className="text-center">{it.fg}</td>
                      <td className="text-center">{it.description}</td>
                      <td className="text-center">
                        {level3Details[it.id]?.length ? it.openOrder : ""}
                      </td>
                      <td className="text-center rounded">{formatNumber(it.std, 2)}</td>
                      <td className="bg-blue-50 text-center rounded">
                        {formatNumber(it.dspt, 2)}
                      </td>
                      <td className="text-center">{it.uap}</td>
                      <td className="text-center">{it.group}</td>
                      <td className="flex flex-col gap-0.5 text-[10px] text-center">
                        <div className="p-0.5 bg-yellow-100 rounded">Available</div>
                        <div className="p-0.5 bg-blue-100 rounded">Loading</div>
                        <div className="p-0.5 bg-red-100 rounded">Capacity</div>
                      </td>
                      <td className="text-center text-[10px]"></td>
                    </tr>
                  );
                }
                return (
                  <tr
                    key={rowKey}
                    data-row-key={rowKey}
                    ref={(el) => {
                      leftRowRefs.current[rowKey] = el;
                    }}
                    className="bg-gray-100"
                  >
                    <td></td>
                    <td className="text-center">{detail?.process || it.process}</td>
                    <td className="text-center">{detail?.itemNo || it.pro}</td>
                    <td></td>
                    <td className="text-center">{detail?.openOrder ?? ""}</td>
                    <td className="text-center rounded">
                      {formatNumber(detail?.std ?? it.std, 2)}
                    </td>
                    <td
                      draggable={isAdmin}
                      onDragStart={(e) =>
                        handleDragStart(e, it.id, null, "dspt", Number(detail?.dspt ?? it.dspt))
                      }
                      className="cursor-grab bg-blue-50 text-center rounded"
                    >
                      {formatNumber(detail?.dspt ?? it.dspt, 2)}
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Dynamic Table */}
        <div ref={rightTableRef} className="overflow-x-auto overflow-y-auto flex-1 bg-gray-50">
          <table className="table-fixed min-w-max">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {visibleWeeks.map((w) => (
                  <th
                    key={w}
                    className={`w-24 px-1 border-l text-center text-xs font-semibold ${
                      w === currentWeek ? "bg-yellow-200" : ""
                    }`}
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
              {rows.map((row, rowIndex) => {
                if (row.kind === "TOTAL") {
                  const key = "TOTAL";
                  return (
                    <tr
                      key={`${key}-${rowIndex}`}
                      data-row-key={key}
                      ref={(el) => {
                        rightRowRefs.current[key] = el;
                      }}
                      className="bg-gray-50 font-medium"
                    >
                      {visibleWeeks.map((w) => (
                        <td key={w} className="px-1 border-l text-center">
                          {totals[w]}
                        </td>
                      ))}
                      <td className="text-center">{visibleTotalsSum}</td>
                    </tr>
                  );
                }
                const it = itemById.get(row.itemId);
                if (!it) return null;
                const detail =
                  row.kind === "L3" && row.detailIndex !== null
                    ? level3Details[it.id]?.[row.detailIndex]
                    : null;
                const rowKey = `${row.kind}-${it.id}-${row.kind === "L3" ? row.detailIndex : "x"}`;
                if (row.kind === "L1") {
                  return (
                    <tr
                      key={rowKey}
                      data-row-key={rowKey}
                      ref={(el) => {
                        rightRowRefs.current[rowKey] = el;
                      }}
                      className="hover:bg-gray-50 h-14"
                    >
                      {visibleWeeks.map((w) => (
                        <td key={w} className="px-1 border-l text-center text-xs bg-white" />
                      ))}
                      <td className="text-center font-semibold" />
                    </tr>
                  );
                }
                if (row.kind === "L2") {
                  return (
                    <tr
                      key={rowKey}
                      data-row-key={rowKey}
                      ref={(el) => {
                        rightRowRefs.current[rowKey] = el;
                      }}
                      className="hover:bg-gray-50 h-14"
                    >
                      {visibleWeeks.map((w) => {
                        const slot = it.weeks[w];
                        const avail = getAvailable(it, w);
                        return (
                          <td key={w} className="px-1 border-l text-center text-xs group">
                            <div className="flex flex-col gap-0.5 text-[10px] w-full mt-2">
                              <div className="p-0.5 bg-yellow-100 rounded text-[11px]">{avail}</div>
                              <div
                                className="p-0.5 bg-blue-100 rounded text-[11px]"
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
                        {itemTotalsById.get(it.id) ?? 0}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr
                    key={rowKey}
                    data-row-key={rowKey}
                    ref={(el) => {
                      rightRowRefs.current[rowKey] = el;
                    }}
                    className="bg-gray-100"
                  >
                    {visibleWeeks.map((w) => {
                      const slot = detail?.weeks ? detail.weeks[w] : it.weeks[w];
                      return (
                        <td
                          key={w}
                          className="px-1 border-l text-center bg-white cursor-pointer hover:bg-blue-50"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(it.id, w, row.detailIndex)}
                        >
                          <div className="flex flex-col gap-0.5 text-[10px] w-full">
                              <div
                                draggable={isAdmin}
                              className="p-0.5 bg-blue-100 rounded text-[11px] cursor-grab"
                              onDragStart={(e) =>
                                handleDragStart(
                                  e,
                                  it.id,
                                  w,
                                  "loading",
                                  slot.loading,
                                  row.detailIndex
                                )
                              }
                              onClick={() => openEditModal(it.id, w, row.detailIndex)}
                            >
                              {slot.loading}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <label className="flex items-center gap-2 text-xs text-gray-700">
          Rows
          <select
            className="border rounded px-2 py-1 text-xs"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </label>
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
                onClick={() =>
                  setEditModal({ open: false, itemId: null, week: null, last: 0, detailIndex: null })
                }
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
      <style jsx>{`
        .fit-view-content {
          transform-origin: top left;
        }
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .planner-left-table th,
        .planner-left-table td {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
        }
      `}</style>
      </div>
    </div>
  );
}






