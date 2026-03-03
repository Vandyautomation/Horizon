'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
type LostData = {
  StatusDate: string
  DuraMin: number
  MchID: string
  MchLoc: string
  MchNumber: string
  Problem: string
  ActionPlan: string
  Brand: string
  MchTon: number
  Location: string
}

type ProblemData = {
  MchID: string
  Problem: string
  ActionPlan: string
  Type: string
  Action: string
  pic: string
  TicketStatus: string
  Message: string
  Location: string
  Brand: string
  UAP: string
}
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
export default function CountboardBreakdown() {
  const [lostData, setLostData] = useState<LostData[]>([])
  const [problemData, setProblemData] = useState<ProblemData[]>([])
  const [loading, setLoading] = useState(true)
  const [lostPage, setLostPage] = useState(1)
  const [problemPage, setProblemPage] = useState(1)

  const ITEMS_PER_PAGE = 10
  const fetchData = useCallback(async () => {
    try {
      const lostRes = await fetch(`${API_BASE}/api/countboards/lost-time`)
      const lostJson = await lostRes.json()

      const problemRes = await fetch(`${API_BASE}/api/countboards/problem`)
      const problemJson = await problemRes.json()

      setLostData(lostJson || [])
      setProblemData(problemJson || [])
    } catch (error) {
      console.error('Error fetching countboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])
  console.log('Lost Data:', lostData)
  console.log('Problem Data:', problemData)
  // auto refresh tiap 10 detik
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  // 🔢 Breakdown = total lost
  const totalBreakdown = lostData.length

  // 📊 Group PIC
  const picSummary = problemData.reduce((acc: Record<string, number>, item) => {
    if (!item.pic) return acc
    acc[item.pic] = (acc[item.pic] || 0) + 1
    return acc
  }, {})
  const picChartData = Object.entries(picSummary).map(([name, value]) => ({
    name,
    total: value,
  }))
  // 📊 Group per MchLoc (chart mesin per lokasi)
  const locSummary = lostData.reduce((acc: Record<string, number>, item) => {
    const loc = item.MchLoc || 'UNKNOWN'
    acc[loc] = (acc[loc] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="p-6 opacity-30 pointer-events-none"></div>
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-5 flex flex-col items-center gap-4 w-64 animate-fadeIn">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-lg font-semibold text-gray-700">
              Loading Countboard...
            </div>

            <div className="text-sm text-gray-500">
              Please wait while data is loading
            </div>
          </div>
        </div>
      </div>
    )
  }
  const locChartData = Object.entries(locSummary).map(([name, total]) => ({
    name,
    total,
  }))
  // LOST TABLE PAGINATION
  const lostTotalPages = Math.ceil(lostData.length / ITEMS_PER_PAGE)
  const lostPaginated = lostData.slice(
    (lostPage - 1) * ITEMS_PER_PAGE,
    lostPage * ITEMS_PER_PAGE
  )

  // PROBLEM TABLE PAGINATION
  const problemTotalPages = Math.ceil(problemData.length / ITEMS_PER_PAGE)
  const problemPaginated = problemData.slice(
    (problemPage - 1) * ITEMS_PER_PAGE,
    problemPage * ITEMS_PER_PAGE
  )
  return (
    <div className="p-4 space-y-4 text-sm">
      {/* HEADER */}
      <h1 className="text-xl font-semibold">Countboard Breakdown</h1>
      <div className="bg-gradient-to-br from-indigo-50 to-orange-50 shadow-lg rounded-2xl p-6 border border-indigo-100">
        <div className="grid grid-cols-1 lg:grid-cols-[0.5fr_1.7fr_1.7fr] gap-6 items-start">
          {/* 🔢 BREAKDOWN TOTAL */}
          <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
              Breakdown
            </p>
            <h2 className="text-5xl font-bold text-orange-600 mt-3">
              {totalBreakdown}
            </h2>
            <p className="text-gray-400 text-xs mt-2">Total Lost Time</p>
          </div>

          {/* 📊 PIC SUMMARY */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border-t-4 border-orange-500">
            <p className="text-sm font-bold text-gray-800 mb-4">
              📊 Breakdown by PIC
            </p>
            <div className="w-full h-[160px] bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={picChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {picChartData.map((entry, index) => {
                      const color =
                        entry.name?.toUpperCase() === 'MEKANIK'
                          ? '#ef4444'
                          : '#f97316'
                      return <Cell key={index} fill={color} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 🏭 MESIN PER LOKASI */}
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border-t-4 border-blue-500">
            <p className="text-sm font-bold text-gray-800 mb-4">
              🏭 Lost per Location
            </p>
            <div className="w-full h-[220px] bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locChartData}
                layout="vertical"
                margin={{ left: 80, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12, fontWeight: 500 }}
                stroke="#6b7280"
                />
                <YAxis
                type="category"
                dataKey="name"
                width={75}
                tick={{ fontSize: 12, fontWeight: 500 }}
                stroke="#6b7280"
                />
                <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
                formatter={(value) => `${value} items`}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#3b82f6" />
              </BarChart>
              </ResponsiveContainer>
            </div>
            </div>
        </div>
      </div>

      {/* 📋 TABLE LOST TIME */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 📋 TABLE LOST TIME (KIRI) */}
        <div className="bg-white shadow-md rounded-2xl p-6 border-t-4 border-red-500 hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold mb-4">Lost Time List</h2>
          <div className="overflow-auto max-h-[600px]">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide sticky top-0">
                <tr>
                  <th className="px-2 py-2">No</th>
                    <th className="px-2 py-2">
                    <button
                      onClick={() => {
                      const sorted = [...lostData].sort((a, b) =>
                        (a.Location || '').localeCompare(b.Location || '')
                      )
                      setLostData(sorted)
                      }}
                      className="hover:text-blue-600 underline"
                    >
                      Location ↕
                    </button>
                    </th>
                    <th className="px-2 py-2">MchID</th>
                    <th className="px-2 py-2">Brand</th>
                    <th className="px-2 py-2">Ton</th>
                    <th className="px-2 py-2">Duration</th>
                  </tr>
                  </thead>
                  <tbody>
                  {lostPaginated.map((item, index) => (
                    <tr
                    key={index}
                    className="text-center hover:bg-gray-50 border-b"
                    >
                    <td className="p-2 font-medium text-[10px]">
                      {(lostPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-2 py-1 text-[10px]">{item.Location}</td>
                    <td className="px-2 py-1 text-[10px]">{item.MchID}</td>
                    <td className="px-2 py-1 text-[10px]">{item.Brand}</td>
                    <td className="px-2 py-1 text-[10px]">{item.MchTon}</td>
                    <td className="p-2 font-semibold text-red-600">
                      {(item.DuraMin / 60).toFixed(2)} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-4 text-xs">
              <button
                onClick={() => setLostPage((p) => Math.max(p - 1, 1))}
                disabled={lostPage === 1}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-gray-500">
                Page {lostPage} of {lostTotalPages || 1} | Total:{' '}
                {lostData.length} items
              </span>
              <button
                onClick={() =>
                  setLostPage((p) => Math.min(p + 1, lostTotalPages))
                }
                disabled={lostPage === lostTotalPages || lostTotalPages === 0}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* 📋 TABLE PROBLEM & ACTION PLAN (KANAN) */}
        <div className="bg-white shadow-md rounded-2xl p-6 border-t-4 border-orange-500 hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold mb-4">Problem & Action Plan</h2>
          <div className="overflow-auto max-h-[600px]">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide sticky top-0">
                <tr>
                  <th className="px-2 py-2">No</th>
                  <th className="px-2 py-2">UAP</th>
                  <th className="px-2 py-2">Brand</th>
                  <th className="px-2 py-2">Location</th>
                  <th className="px-2 py-2">Problem</th>
                  <th className="px-2 py-2">Action</th>
                  <th className="px-2 py-2">PIC</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {problemPaginated.map((item, index) => (
                  <tr
                    key={index}
                    className="text-center hover:bg-gray-50 border-b"
                  >
                    <td className="p-2 font-medium text-[10px]">
                      {(problemPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-2 py-1 text-[10px]">{item.UAP}</td>
                    <td className="px-2 py-1 text-[10px]">{item.Brand}</td>
                    <td className="px-2 py-1 text-[10px]">{item.Location}</td>
                    <td className="px-2 py-1 text-[10px]">{item.Problem}</td>
                    <td className="px-2 py-1 text-[10px]">{item.Action}</td>
                    <td className="px-2 py-1 font-semibold text-[10px]">
                      {item.pic}
                    </td>
                    <td className="px-2 py-1 text-[10px]">
                      {item.TicketStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-4 text-xs">
              <button
                onClick={() => setProblemPage((p) => Math.max(p - 1, 1))}
                disabled={problemPage === 1}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-gray-500">
                Page {problemPage} of {problemTotalPages || 1} | Total: {problemData.length} items
              </span>
              <button
                onClick={() =>
                  setProblemPage((p) => Math.min(p + 1, problemTotalPages))
                }
                disabled={
                  problemPage === problemTotalPages || problemTotalPages === 0
                }
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
