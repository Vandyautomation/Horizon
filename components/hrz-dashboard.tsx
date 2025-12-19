"use client"

import { useState, useEffect } from "react";
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

  useEffect(() => {
    async function fetchData() {
      try {
        const base = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9999').replace(/\/$/, '');
        // backend routes are mounted under /api/hrz in this project
        const endpoint =
          uapFilter && uapFilter !== "ALL"
            ? `${base}/api/hrz/data?uap=${encodeURIComponent(uapFilter)}`
            : `${base}/api/hrz/data`;
        const res = await fetch(endpoint);
        const json = await res.json();

        const mappedData: SalesData[] = json.map((d: any) => ({
          salesOrder: Array.isArray(d.SalesOrder) ? d.SalesOrder.join(',') : (d.SalesOrder ?? ""),
          itemNo: Array.isArray(d.ItemNo) ? d.ItemNo.join(',') : (d.ItemNo ?? ""),
          description: d.Description || "",
          project: Boolean(Number(d.Project || 0)),
          customer: d.Customer || "",
          dlvDate: d.DlvDate ? new Date(d.DlvDate).toISOString().slice(0, 10) : "",
          order: d.OrderQty || 0,
          value: Math.round((d.OrderValue || 0) * 10) / 10,
          produceValue: d.Stock || 0,
          producePercent: d.Stock ? Math.round(((d.Stock || 0) / d.OrderQty) * 100) : 0,
          tbp: d.tbp,
          unrest: d.QtyUnrest || 0,
          qi: d.QtyQuality || 0,
          uap: d.UAP || "",
        }));

        setData(mappedData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [uapFilter]);

  const staticUapOptions = ["BASIC", "PREMIUM", "LEAN"];
  const uapOptions = Array.from(
    new Set([
      ...staticUapOptions,
      ...data.map((d) => d.uap).filter((v) => v && v.trim().length > 0),
    ])
  ).sort();

  const filteredData = data.filter((d) =>
    d[searchBy].toLowerCase().includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) =>
    sortAsc
      ? new Date(a.dlvDate).getTime() - new Date(b.dlvDate).getTime()
      : new Date(b.dlvDate).getTime() - new Date(a.dlvDate).getTime()
  );

  const openDetail = (d: SalesData) => {
    const url = `/hrz/detail?so=${encodeURIComponent(
      d.salesOrder
    )}&itemNo=${encodeURIComponent(d.itemNo)}&description=${encodeURIComponent(
      d.description
    )}&customer=${encodeURIComponent(d.customer)}`;

    console.log("Opening detail page with URL:", url);
    router.push(url);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Sales Order Table</h1>

      {loading && <p className="mb-4 text-gray-600">Loading data...</p>}
      {!loading && data.length === 0 && <p className="mb-4 text-red-600">Data kosong</p>}

      <div className="flex mb-4 items-center justify-between">
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
            className="border border-gray-300 p-2 rounded w-48 placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Kanan: filter UAP di pojok kanan baris */}
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
      </div>


      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="sticky top-0 bg-blue-100 z-8 text-center text-gray-700">
              <th rowSpan={2} className="border px-3 py-2 w-44 text-sm md:text-base text-left">Sales Order</th>
              <th rowSpan={2} className="border px-3 py-2 w-44 text-sm md:text-base text-left">Item No</th>
              <th rowSpan={2} className="border px-3 py-2">Description</th>
              <th rowSpan={2} className="border px-3 py-2">NP</th>
              <th rowSpan={2} className="border px-3 py-2">Customer</th>
              <th
                rowSpan={2}
                className="border px-3 py-2 w-40 cursor-pointer text-sm md:text-base"
                onClick={() => setSortAsc(!sortAsc)}
              >
                Dlv Date {sortAsc ? "▲" : "▼"}
              </th>
              <th rowSpan={2} className="border px-3 py-2">Order</th>
              <th rowSpan={2} className="border px-3 py-2">Value(USD)</th>
              <th colSpan={2} className="border px-3 py-2 bg-blue-200 font-semibold">Produce</th>
              <th rowSpan={2} className="border px-3 py-2">TBP</th>
              <th rowSpan={2} className="border px-3 py-2">Unrest</th>
              <th rowSpan={2} className="border px-3 py-2">QI</th>
            </tr>
            <tr className="bg-blue-50 text-gray-700 text-center">
              <th className="border px-3 py-2">Stock</th>
              <th className="border px-3 py-2">%</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedData.map((d, i) => (
              <tr
                  key={i}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => openDetail(d)}
                >
                  <td className="border px-3 py-2 text-blue-600 underline w-56 break-words text-sm md:text-base text-left">{d.salesOrder}</td>
                  <td className="border px-3 py-2 w-44 break-words text-sm md:text-base text-left">{d.itemNo}</td>
                <td className="border px-3 py-2">{d.description}</td>
                <td className="border px-3 py-2 text-center text-blue-600">
                  {d.project ? "★" : ""}
                </td>
                <td className="border px-3 py-2">{d.customer}</td>
                <td className="border px-3 py-2">{d.dlvDate}</td>
                <td className="border px-3 py-2 text-right">{d.order.toLocaleString()}</td>
                <td className="border px-3 py-2 text-right">{d.value.toLocaleString()}</td>
                <td className="border px-3 py-2 text-right">{d.produceValue.toLocaleString()}</td>
                <td className="border px-3 py-2 text-center">{d.producePercent}%</td>
                <td className="border px-3 py-2 text-center">{d.tbp}</td>
                <td className="border px-3 py-2 text-right">{d.unrest.toLocaleString()}</td>
                <td className="border px-3 py-2 text-right">{d.qi.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
