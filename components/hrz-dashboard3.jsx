"use client";
import React, { useState, useEffect } from "react";

const dataRaw = [
  { process: "INJECTION", groups: ["120T - 150T", "151T - 220T", "221T - 280T", "281T -360T", "361T - Up"] },
  { process: "DECORATION", groups: ["PRINTING", "STAMPING", "DIGITAL PRINTING"] },
  { process: "UV COATING", groups: ["SPRAY", "CLEARCOAT", "METALIZE"] },
  { process: "ASSEMBLY", groups: ["ASSY"] },
];

const weekLabels = Array.from({ length: 52 }, (_, i) => `W${i + 1}`);
const randomValue = () => Math.floor(Math.random() * 21) + 80;

export default function Home() {
  const [weekIndex, setWeekIndex] = useState(0);
  const [data, setData] = useState([]);

  // Generate data hanya di client, hindari SSR mismatch
  useEffect(() => {
    const generated = dataRaw.map((section) => ({
      process: section.process,
      groups: section.groups.map((group) => ({
        name: group,
        values: weekLabels.map(() => randomValue()),
      })),
    }));
    setData(generated);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Summary</h1>

      <div className="mb-4">
        <label>
          Select Week: <span className="font-semibold">{weekLabels[weekIndex]}</span>
        </label>
        <input
          type="range"
          min="0"
          max={weekLabels.length - 1}
          value={weekIndex}
          onChange={(e) => setWeekIndex(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-max border border-gray-400 text-center table-fixed">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 py-2 sticky left-0 bg-gray-200 z-10">PROCESS</th>
              <th className="border px-4 py-2 sticky left-[100px] bg-gray-200 z-10">GROUP</th>
              {weekLabels.map((week, idx) => (
                <th key={week} className={`border px-2 py-1 ${idx === weekIndex ? "bg-yellow-200" : ""}`}>
                  {week}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((section) =>
              section.groups.map((group, idx) => (
                <tr key={group.name} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {idx === 0 && (
                    <td className="border px-4 py-2 sticky left-0 bg-white z-10" rowSpan={section.groups.length}>
                      {section.process}
                    </td>
                  )}
                  <td className="border px-4 py-2 sticky left-[100px] bg-white z-10">{group.name}</td>
                  {group.values.map((val, wIdx) => (
                    <td key={wIdx} className={`border px-2 py-1 ${wIdx === weekIndex ? "bg-yellow-100 font-bold" : ""}`}>
                      {val}%
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}