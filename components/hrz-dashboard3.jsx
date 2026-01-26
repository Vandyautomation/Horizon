'use client'

import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
const ROWS_PER_PAGE = 15
const weekLabels = Array.from({ length: 52 }, (_, i) => `W${i + 1}`)

/* =======================
   TRANSFORM DATA
======================= */
function normalizeWeekNum(week) {
  // DB: w01 -> W1, w10 -> W10
  const num = parseInt(week.replace(/^w/i, ''), 10)
  return `W${num}`
}

function transformHRZData(rows) {
  return rows.map((row) => {
    const weeks = {}
    if (row.WeekNum) {
      const weekKey = normalizeWeekNum(row.WeekNum)
      weeks[weekKey] = true
    }
    return {
      process: row.MchProcess,
      group: row.GroupID,
      weeks,
    }
  })
}

/* =======================
   COMPONENT
======================= */
export default function HRZDashboard3() {
  const [startWeek, setStartWeek] = useState('w01')
  const [endWeek, setEndWeek] = useState('w52')

  // Fungsi helper untuk merubah angka ke format DB 'w01'
  const formatToDBWeek = (index) => `w${String(index + 1).padStart(2, '0')}`
  const [rawData, setRawData] = useState([])
  const [uapList, setUapList] = useState([])
  const [selectedUAP, setSelectedUAP] = useState('')
  const [weekIndex, setWeekIndex] = useState(0)
  // const totalColSpan = 2 + filteredWeeks.length;
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  /* =======================
     FETCH UAP LIST
  ======================= */
  useEffect(() => {
    const fetchUAPList = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hrz/hrz-uap-list`)
        const json = await res.json()
        setUapList(json.data || [])
      } catch (err) {
        console.error(err)
      }
    }

    fetchUAPList()
  }, [])

  /* =======================
     FETCH PAGED DATA
  ======================= */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          startWeek: startWeek, // Kirim ke backend
          endWeek: endWeek, // Kirim ke backend
        })

        if (selectedUAP) params.append('uap', selectedUAP)

        const res = await fetch(
          `${API_BASE}/api/hrz/hrz-capacity?${params.toString()}`
        )
        const json = await res.json()

        setRawData(json.data || [])
        setTotalPages(json.totalPages || 1)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, selectedUAP, startWeek, endWeek]) // Tambahkan dependency

  /* =======================
   FILTERED WEEK LABELS
======================= */
  const filteredWeeks = useMemo(() => {
    // Ambil angka dari string 'w01', 'w02'
    const startNum = parseInt(startWeek.replace('w', ''), 10)
    const endNum = parseInt(endWeek.replace('w', ''), 10)

    // Filter weekLabels (W1, W2...) berdasarkan urutan angkanya
    return weekLabels.filter((_, index) => {
      const currentNum = index + 1
      return currentNum >= startNum && currentNum <= endNum
    })
  }, [startWeek, endWeek])

  /* =======================
     TRANSFORM DATA
  ======================= */
  const tableData = useMemo(() => {
    return transformHRZData(rawData)
  }, [rawData])
  const totalColSpan = 2 + filteredWeeks.length

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">HRZ Capacity Summary</h1>

      {/* FILTER */}
      <div className="mb-4 flex gap-4 items-center">
        <select
          value={selectedUAP}
          onChange={(e) => {
            setSelectedUAP(e.target.value)
            setPage(1)
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

     
      </div>
      <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-md">
        <div>
          <label className="block text-xs font-bold">START WEEK</label>
          <select
            value={startWeek}
            onChange={(e) => {
              setStartWeek(e.target.value)
              setPage(1)
            }}
            className="border p-1"
          >
            {weekLabels.map((_, i) => (
              <option key={i} value={formatToDBWeek(i)}>
                {weekLabels[i]}
              </option>
            ))}
          </select>
        </div>

        <div className="font-bold mt-4">TO</div>

        <div>
          <label className="block text-xs font-bold">END WEEK</label>
          <select
            value={endWeek}
            onChange={(e) => {
              setEndWeek(e.target.value)
              setPage(1)
            }}
            className="border p-1"
          >
            {weekLabels.map((_, i) => (
              <option key={i} value={formatToDBWeek(i)}>
                {weekLabels[i]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-max border-collapse text-center">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 sticky left-0 bg-gray-200">PROCESS</th>
              <th className="border px-4 left-[140px] bg-gray-200">GROUP</th>
              {/* Ganti weekLabels jadi filteredWeeks */}
              {filteredWeeks.map((w) => (
                <th key={w} className="border px-2 min-w-[50px]">
                  {w}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={totalColSpan}
                  className="p-6 text-center text-blue-500 font-semibold"
                >
                  Loading data...
                </td>
              </tr>
            ) : tableData.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColSpan}
                  className="p-6 text-center text-gray-500"
                >
                  No Data found for this range
                </td>
              </tr>
            ) : (
              tableData.map((row, idx) => (
                <tr key={`${row.process}-${row.group}-${idx}`}>
                  <td className="border sticky left-0 bg-white font-bold">
                    {row.process}
                  </td>
                  <td className="border sticky left-[130px] bg-white">
                    {row.group}
                  </td>
                  {filteredWeeks.map((w) => {
                    const hasData = row.weeks[w]
                    return (
                      <td
                        key={w}
                        className={`border ${
                          hasData ? 'bg-yellow-400' : 'bg-gray-100'
                        }`}
                      />
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex gap-4 mt-4 items-center justify-start">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="border px-3 py-1 disabled:opacity-50"
        >
          Prev
        </button>

        <span>
          Page {page} / {totalPages}
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
  )
}
