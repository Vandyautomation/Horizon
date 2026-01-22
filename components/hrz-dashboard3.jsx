"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const ROWS_PER_PAGE = 15;
const weekLabels = Array.from({ length: 52 }, (_, i) => `W${i + 1}`);
const randomValue = () => Math.floor(Math.random() * 21) + 80;

function transformHRZData(rows) {
const map = {};

  rows.forEach((row) => {
    if (!map[row.MchProcess]) {
      map[row.MchProcess] = { process: row.MchProcess, groups: [] };
    }
    map[row.MchProcess].groups.push({
      name: row.GroupID,
      values: weekLabels.map(() => randomValue()),
    });
  });

  return Object.values(map);
}

export default function HRZDashboard3() {
  const [rawData, setRawData] = useState([]);
  const [uapList, setUapList] = useState([]);
  const [selectedUAP, setSelectedUAP] = useState("");
  const [weekIndex, setWeekIndex] = useState(0);
  const [page, setPage] = useState(1);

  // ambil UAP list
  useEffect(() => {
    const fetchUAPList = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hrz/hrz-uap-list`);
        const json = await res.json();
        setUapList(json.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUAPList();
  }, []);

  // ambil semua data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hrz/hrz-capacity`);
        const json = await res.json();
        setRawData(json.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // filter di frontend
  const filteredData = useMemo(() => {
    return selectedUAP
      ? rawData.filter((r) => r.UAP === selectedUAP)
      : rawData;
  }, [rawData, selectedUAP]);

  // paging + transform
  const pagedData = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = page * ROWS_PER_PAGE;
    return transformHRZData(filteredData.slice(start, end));
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">HRZ Capacity Summary</h1>

      {/* FILTER UAP */}
      <div className="mb-4 flex gap-4 items-center">
        <select
          value={selectedUAP}
          onChange={(e) => {
            setSelectedUAP(e.target.value);
            setPage(1);
          }}
          className="border p-2"
        >
          <option value="">All UAP</option>
          {uapList.map((uap) => (
            <option key={uap} value={uap}>
              {uap}
            </option>
          ))}
        </select>

        <span>
          Week: <b>{weekLabels[weekIndex]}</b>
        </span>
      </div>

      {/* WEEK SLIDER */}
      <input
        type="range"
        min="0"
        max={51}
        value={weekIndex}
        onChange={(e) => setWeekIndex(Number(e.target.value))}
        className="w-full mb-4"
      />

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-max border text-center">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 sticky left-0 bg-gray-200">PROCESS</th>
              <th className="border px-4 sticky left-[120px] bg-gray-200">GROUP</th>
              {weekLabels.map((w, i) => (
                <th key={w} className={`border px-2 ${i === weekIndex ? "bg-yellow-300" : ""}`}>
                  {w}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pagedData.map((section) =>
              section.groups.map((group, idx) => (
                <tr key={`${section.process}-${group.name}-${idx}`}>
                  {idx === 0 && (
                    <td rowSpan={section.groups.length} className="border sticky left-0 bg-white font-bold">
                      {section.process}
                    </td>
                  )}
                  <td className="border sticky left-[120px] bg-white">{group.name}</td>
                  {group.values.map((val, wIdx) => (
                    <td key={wIdx} className={`border ${wIdx === weekIndex ? "bg-yellow-100 font-bold" : ""}`}>
                      {val}%
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex gap-4 mt-4 items-center">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="border px-3 py-1 disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page} / {totalPages || 1}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="border px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
