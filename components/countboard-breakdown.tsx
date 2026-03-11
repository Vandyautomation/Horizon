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
import { ArrowUpDown } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
  const searchParams = useSearchParams()
  const machineNumber = searchParams.get('machine_number') || ''
  const location = searchParams.get('location') || ''
  const eskalasiHref = `/countboard/eskalasi`
  const countboardHref = `/countboard?machineNumber=${encodeURIComponent(machineNumber || '')}&location=${encodeURIComponent(location || '')}`
  const [sortField, setSortField] = useState<'Location' | 'DuraMin' | null>(
    null
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const ITEMS_PER_PAGE = 20
  const handleSort = (field: 'Location' | 'DuraMin') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
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
  const sortedLostData = [...lostData].sort((a, b) => {
    if (!sortField) return 0

    let valueA = a[sortField]
    let valueB = b[sortField]

    if (sortField === 'Location') {
      valueA = valueA?.toString().toLowerCase()
      valueB = valueB?.toString().toLowerCase()
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const lostTotalPages = Math.ceil(sortedLostData.length / ITEMS_PER_PAGE)

  const lostPaginated = sortedLostData.slice(
    (lostPage - 1) * ITEMS_PER_PAGE,
    lostPage * ITEMS_PER_PAGE
  )

  // PROBLEM TABLE PAGINATION
  const problemTotalPages = Math.ceil(problemData.length / ITEMS_PER_PAGE)
  const problemPaginated = problemData.slice(
    (problemPage - 1) * ITEMS_PER_PAGE,
    problemPage * ITEMS_PER_PAGE
  )
  const handleExportBreakdown = async () => {
    try {
      const url = `${API_BASE}/api/exportBreak/breakdown`

      const res = await fetch(url)
      const blob = await res.blob()

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = 'breakdown.xlsx'
      link.click()
    } catch (error) {
      console.error('Export error', error)
    }
  }
  return (
    <div className="p-4 space-y-4 text-sm">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={countboardHref}>Countboard Injection</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={eskalasiHref}>Countboard Eskalasi</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breakdown</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* HEADER */}
      <h1 className="text-xl font-semibold">Countboard Breakdown</h1>
      <button
        onClick={handleExportBreakdown}
        className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs"
      >
        Export Excel
      </button>
      <div className="bg-gradient-to-br from-indigo-50 to-orange-50 shadow-lg rounded-2xl p-6 border border-indigo-100">
        <div className="grid grid-cols-1 lg:grid-cols-[0.5fr_1.7fr_1.7fr] gap-6 items-start">
          {/* LEFT COLUMN - BREAKDOWN CARDS */}
          <div className="grid grid-rows-2 gap-6 h-full">
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
            {/* 🔢 BREAKDOWN TOTAL */}
            <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                Breakdown
              </p>
              <h2 className="text-5xl font-bold text-orange-600 mt-3">
                {
                  lostData.filter((item) => !item.Problem || !item.ActionPlan)
                    .length
                }
              </h2>
              <p className="text-gray-400 text-xs mt-2">
                Missing Problem/Action Plan
              </p>
            </div>
          </div>
          {/* 📊 PIC SUMMARY */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border-t-4 border-orange-500">
            <p className="text-sm font-bold text-gray-800 mb-4">
              📊 Breakdown by PIC
            </p>

            {/* Samakan tinggi jadi 220px & padding p-3 */}
            <div className="w-full h-[220px] bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3">
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

            <div className="flex justify-center gap-6 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                Mekanik
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full" />
                Maintenance / Others
              </div>
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
            <div className="flex justify-center gap-6 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full" />
                Total Tiket per Gedung
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"></div> */}
      {/* 📋 TABLE LOST TIME */}
      <div className="bg-white shadow-md rounded-2xl p-4 border-t-4 border-red-500 hover:shadow-lg transition-shadow">
        <h2 className="text-base font-semibold mb-3">Lost Time List</h2>

        <div className="overflow-auto max-h-[600px]">
          <table className="w-full table-fixed text-xs">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide sticky top-0 z-10">
              <tr className="text-gray-600">
                <th className="px-2 py-2 w-[40px]">No</th>

                <th
                  onClick={() => handleSort('Location')}
                  className="px-2 py-2 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center justify-center gap-1">
                    Location
                    <ArrowUpDown size={12} />
                    {sortField === 'Location'
                      ? sortDirection === 'asc'
                        ? '▲'
                        : '▼'
                      : ''}
                  </div>
                </th>

                <th className="px-2 py-2 w-[80px]">MchID</th>

                <th className="px-2 py-2 w-[80px]">Brand</th>

                <th className="px-2 py-2">Problem</th>

                <th className="px-2 py-2">Action</th>

                <th className="px-2 py-2 w-[60px]">Ton</th>

                <th
                  onClick={() => handleSort('DuraMin')}
                  className="px-2 py-2 cursor-pointer hover:text-blue-600 w-[90px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    Duration
                    <ArrowUpDown size={12} />
                    {sortField === 'DuraMin'
                      ? sortDirection === 'asc'
                        ? '▲'
                        : '▼'
                      : ''}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {lostPaginated.map((item, index) => (
                <tr
                  key={index}
                  className="text-center hover:bg-gray-50 border-b"
                >
                  <td className="py-1 font-medium">
                    {(lostPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>

                  <td className="py-1">{item.Location}</td>

                  <td className="py-1">{item.MchID}</td>

                  <td className="py-1">{item.Brand}</td>

                  <td className="py-1 truncate max-w-[180px] text-center">
                    {item.Problem}
                  </td>

                  <td className="py-1 truncate max-w-[180px] text-center">
                    {item.ActionPlan}
                  </td>

                  <td className="py-1">{item.MchTon}</td>

                  <td
                    className={`py-1 font-semibold
                    ${
                      item.DuraMin > 180
                        ? 'text-red-600'
                        : item.DuraMin > 60
                          ? 'text-yellow-600'
                          : 'text-gray-700'
                    }`}
                  >
                    {(item.DuraMin / 60).toFixed(2)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 text-xs">
            <button
              onClick={() => setLostPage((p) => Math.max(p - 1, 1))}
              disabled={lostPage === 1}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-gray-500">
              Page {lostPage} / {lostTotalPages || 1} • {lostData.length} items
            </span>

            <button
              onClick={() =>
                setLostPage((p) => Math.min(p + 1, lostTotalPages))
              }
              disabled={lostPage === lostTotalPages || lostTotalPages === 0}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* 📋 TABLE PROBLEM & ACTION PLAN */}
      <div className="bg-white shadow-md rounded-2xl p-4 border-t-4 border-orange-500 hover:shadow-lg transition-shadow">
        <h2 className="text-base font-semibold mb-3">Problem & Action Plan</h2>

        <div className="overflow-auto max-h-[600px]">
          <table className="w-full table-fixed text-xs">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide sticky top-0 z-10">
              <tr className="text-gray-600">
                <th className="px-2 py-2 w-[40px]">No</th>

                <th className="px-2 py-2 w-[90px]">UAP</th>

                <th className="px-2 py-2 w-[80px]">Brand</th>

                <th className="px-2 py-2 w-[90px]">Location</th>

                <th className="px-2 py-2">Problem</th>

                <th className="px-2 py-2">Action</th>

                <th className="px-2 py-2 w-[90px]">PIC</th>

                <th className="px-2 py-2 w-[110px]">Status</th>
              </tr>
            </thead>

            <tbody>
              {problemPaginated.map((item, index) => (
                <tr
                  key={index}
                  className="text-center hover:bg-gray-50 border-b"
                >
                  <td className="py-1 font-medium">
                    {(problemPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>

                  <td className="py-1">{item.UAP}</td>

                  <td className="py-1">{item.Brand}</td>

                  <td className="py-1">{item.Location}</td>

                  <td className="py-1 truncate max-w-[200px] text-center ">
                    {item.Problem}
                  </td>

                  <td className="py-1 truncate max-w-[200px] text-center ">
                    {item.Action}
                  </td>

                  <td className="py-1 font-semibold text-blue-600">
                    {item.pic}
                  </td>

                  <td className="py-1">
                    <span
                      className={`px-2 py-[2px] rounded-full text-[11px] font-medium
                ${
                  item.TicketStatus?.toLowerCase() === 'open'
                    ? 'bg-red-100 text-red-600'
                    : item.TicketStatus?.toLowerCase() === 'progress'
                      ? 'bg-yellow-100 text-yellow-700'
                      : item.TicketStatus?.toLowerCase() === 'close'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-600'
                }`}
                    >
                      {item.TicketStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 text-xs">
            <button
              onClick={() => setProblemPage((p) => Math.max(p - 1, 1))}
              disabled={problemPage === 1}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-gray-500">
              Page {problemPage} / {problemTotalPages || 1} •{' '}
              {problemData.length} items
            </span>

            <button
              onClick={() =>
                setProblemPage((p) => Math.min(p + 1, problemTotalPages))
              }
              disabled={
                problemPage === problemTotalPages || problemTotalPages === 0
              }
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
