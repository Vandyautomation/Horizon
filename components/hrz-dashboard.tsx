"use client"

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface SalesData {
  salesOrder: string;
  itemNo: string;
  description: string;
  project: boolean;
  customer: string;
  dlvDate: string;
  order: number;
  value: number;
  produceValue: number;
  producePercent: number;
  tbp: number;
  unrest: number;
  qi: number;
  uap: string;
}

export default function HRZDashboard() {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [searchBy, setSearchBy] = useState<"salesOrder" | "itemNo" | "description" | "customer">("salesOrder");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uapFilter, setUapFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    new Date().getMonth() + 1
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const formatDlvDate = (raw: unknown) => {
    if (!raw) return "";
    const dt = new Date(String(raw));
    if (!Number.isNaN(dt.getTime())) {
      return dt.toISOString().slice(0, 10);
    }

    const text = String(raw).trim();
    const match = text.match(
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{4})/i
    );
    if (!match) return "";

    const monthMap: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };
    const month = monthMap[match[1].toLowerCase()];
    const day = match[2].padStart(2, "0");
    const year = match[3];
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const base = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9999').replace(/\/$/, '');
        // backend routes are mounted under /api/hrz in this project
        const monthParam = selectedMonth ? `&month=${selectedMonth}` : "";
        const baseParams = `page=${currentPage}&limit=${pageSize}&year=${selectedYear}${monthParam}${
          selectedDay ? `&day=${selectedDay}` : ""
        }`;
        const searchTerm = search.trim();
        const searchParams = searchTerm
          ? `&search=${encodeURIComponent(searchTerm)}&searchBy=${encodeURIComponent(searchBy)}`
          : "";
        const endpoint =
          uapFilter && uapFilter !== "ALL"
            ? `${base}/api/hrz/data?uap=${encodeURIComponent(uapFilter)}&itemPrefix=1&${baseParams}${searchParams}`
            : `${base}/api/hrz/data?itemPrefix=1&${baseParams}${searchParams}`;
        const res = await fetch(endpoint);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const total = typeof json?.total === "number" ? json.total : rows.length;

        const mappedData: SalesData[] = rows.map((d: any) => {
          const salesOrder = Array.isArray(d.SalesOrder) ? d.SalesOrder.join(",") : d.SalesOrder;
          const itemNo = Array.isArray(d.ItemNo) ? d.ItemNo.join(",") : d.ItemNo;
          const dlvDate = formatDlvDate(d.DlvDate);
          const orderQty = Number(d.OrderQty) || 0;
          const DelQty = Number(d.dlvqty) || 0;
          const stockValue = Number(d.Stock) || 0;

          return {
            salesOrder: String(salesOrder ?? ""),
            itemNo: String(itemNo ?? ""),
            description: String(d.Description || ""),
            project: Boolean(Number(d.Project || 0)),
            customer: String(d.Customer || ""),
            dlvDate,
            order: orderQty,
            value: DelQty,
            produceValue: stockValue,
            producePercent: Math.round((d.tbp / orderQty) * 100),
            tbp: Number(d.tbp.toLocaleString()) || 0,
            unrest: Number(d.QtyUnrest) || 0,
            qi: Number(d.QtyQuality) || 0,
            uap: String(d.UAP || ""),
          };
        });

        setData(mappedData);
        setTotalCount(total);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [uapFilter, currentPage, pageSize, selectedYear, selectedMonth, selectedDay, search, searchBy]);

  const staticUapOptions = ["BASIC", "PREMIUM", "LEAN"];
  const uapOptions = Array.from(
    new Set([
      ...staticUapOptions,
      ...data.map((d) => d.uap).filter((v) => v && v.trim().length > 0),
    ])
  ).sort();

  const sortedData = [...data].sort((a, b) =>
    sortAsc
      ? new Date(a.dlvDate).getTime() - new Date(b.dlvDate).getTime()
      : new Date(b.dlvDate).getTime() - new Date(a.dlvDate).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagedData = useMemo(() => {
    return sortedData;
  }, [sortedData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, searchBy, uapFilter, sortAsc, pageSize, selectedYear, selectedMonth, selectedDay]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openDetail = (d: SalesData) => {
    const url = `/hrz/detail?so=${encodeURIComponent(
      d.salesOrder
    )}&itemNo=${encodeURIComponent(d.itemNo)}&description=${encodeURIComponent(
      d.description
    )}&customer=${encodeURIComponent(d.customer)}`;

    console.log("Opening detail page with URL:", url);
    const basePath = "/admin";
    window.location.href = `${window.location.origin}${basePath}${url}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Sales Order Table</h1>

      {loading && <p className="mb-4 text-gray-600">Loading data...</p>}
      {!loading && data.length === 0 && <p className="mb-4 text-red-600">Data kosong</p>}

      <div className="relative mb-4 flex items-center gap-4">
        {/* Kiri: searchBy + search text */}
        <div className="flex space-x-4 items-center">
          <select
            value={searchBy}
            onChange={(e) =>
              setSearchBy(e.target.value as "salesOrder" | "itemNo" | "description" | "customer")
            }
            className="border p-2 rounded"
          >
            <option value="salesOrder">Sales Order</option>
            <option value="itemNo">Item No</option>
            <option value="description">Description</option>
            <option value="customer">Customer</option>
          </select>

          <input
            type="text"
            placeholder={`Search ${searchBy}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 p-2 rounded w-64 placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Tengah: pagination */}
        <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-sm text-gray-700">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="pointer-events-auto rounded border px-2 py-1 disabled:opacity-50"
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
            className="pointer-events-auto rounded border px-2 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Kanan: filter UAP + month/year */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={uapFilter}
            onChange={(e) => setUapFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">All UAP</option>
            {uapOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <select
            value={selectedMonth ?? ""}
            onChange={(e) =>
              (() => {
                const value = e.target.value;
                if (value) {
                  setSelectedMonth(Number(value));
                } else {
                  setSelectedMonth(null);
                  setSelectedDay(null);
                }
              })()
            }
            className="border p-2 rounded"
          >
            <option value="">All months</option>
            <option value={1}>Jan</option>
            <option value={2}>Feb</option>
            <option value={3}>Mar</option>
            <option value={4}>Apr</option>
            <option value={5}>May</option>
            <option value={6}>Jun</option>
            <option value={7}>Jul</option>
            <option value={8}>Aug</option>
            <option value={9}>Sep</option>
            <option value={10}>Oct</option>
            <option value={11}>Nov</option>
            <option value={12}>Dec</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border p-2 rounded"
          >
            {Array.from({ length: 6 }, (_, idx) => {
              const year = new Date().getFullYear() - 2 + idx;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          <select
            value={selectedDay ?? ""}
            onChange={(e) =>
              setSelectedDay(e.target.value ? Number(e.target.value) : null)
            }
            className="border p-2 rounded"
          >
            <option value="">All days</option>
            {Array.from({ length: 31 }, (_, idx) => {
              const day = idx + 1;
              return (
                <option key={day} value={day}>
                  {day}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="sticky top-0 bg-blue-100 z-8 text-center text-gray-700">
              <th rowSpan={2} className="border px-3 py-2 text-sm md:text-base text-left">Sales Order</th>
              <th rowSpan={2} className="border px-3 py-2 text-sm md:text-base text-left">Item No</th>
              <th rowSpan={2} className="border px-3 py-2">Description</th>
              <th rowSpan={2} className="border px-3 py-2">NP</th>
              <th rowSpan={2} className="border px-3 py-2">Customer</th>
              <th
                rowSpan={2}
                className="border px-3 py-2 w-40 cursor-pointer text-sm md:text-base"
                onClick={() => setSortAsc(!sortAsc)}
              >
                GI Date {sortAsc ? "▲" : "▼"}
              </th>
              <th rowSpan={2} className="border px-3 py-2">Order</th>
              {/*<th rowSpan={2} className="border px-3 py-2">Value(USD)</th>*/}
              <th rowSpan={2} className="border px-3 py-2">Dlv Qty</th>
              <th rowSpan={2} className="border px-3 py-2">TBP</th>
              <th className="border px-3 py-2">% TBP</th>
              <th className="border px-3 py-2">Stock</th>
              {/*<th colSpan={2} className="border px-3 py-2 bg-blue-200 font-semibold">Produce</th>*/}
              <th rowSpan={2} className="border px-3 py-2">Unrest</th>
              <th rowSpan={2} className="border px-3 py-2">QI</th>
            </tr>
            {/*<tr className="bg-blue-50 text-gray-700 text-center">
              <th className="border px-3 py-2">Stock</th>
              <th className="border px-3 py-2">%</th>
            </tr>*/}
          </thead>
          <tbody className="bg-white">
            {pagedData.map((d, i) => (
              <tr
                  key={i}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => openDetail(d)}
                >
                  <td className="border px-3 py-2 text-blue-600 underline break-words text-sm md:text-base text-left">{d.salesOrder}</td>
                  <td className="border px-3 py-2 break-words text-sm md:text-base text-left">{d.itemNo}</td>
                <td className="border px-3 py-2">{d.description}</td>
                <td className="border px-3 py-2 text-center text-blue-600 text-xl leading-none">
                  {d.project ? "★" : ""}
                </td>
                <td className="border px-3 py-2">{d.customer}</td>
                <td className="border px-3 py-2">{d.dlvDate}</td>
                <td className="border px-3 py-2 text-right">{d.order.toLocaleString()}</td>
                <td className="border px-3 py-2 text-right">{d.value.toLocaleString()}</td>
                <td className="border px-3 py-2 text-center">{d.tbp.toLocaleString()}</td>
                <td className="border px-3 py-2 text-center">{d.producePercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%</td>
                <td className="border px-3 py-2 text-right">{d.produceValue.toLocaleString()}</td>
                {/*<td className="border px-3 py-2 text-center">{d.producePercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%</td>*/}
                <td className="border px-3 py-2 text-right">{d.unrest.toLocaleString()}</td>
                <td className="border px-3 py-2 text-right">{d.qi.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex justify-end text-xs text-gray-700">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
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
          <span className="text-[10px] text-gray-500">Total: {totalCount}</span>
        </div>
      </div>
    </div>
  );
}
