'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  ProblemGroupName: string
  Problem: string
  ActionPlan: string
  Brand: string
  MchTon: number
  Location: string
  material_name: string
}

type ProblemData = {
  MchID: string
  ProblemGroupName: string
  material_name: string
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
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardPage, setLeaderboardPage] = useState(1)
  const leaderboardLimit = 10
  const [leaderboardTotalPages, setLeaderboardTotalPages] = useState(1)
  const handleSort = (field: 'Location' | 'DuraMin') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  const [leaderboardTotalItems, setLeaderboardTotalItems] = useState(0)

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/countboards/leaderboard?page=${leaderboardPage}&limit=${leaderboardLimit}`
      )
      const json = await res.json()
      const leaderboardItems = Array.isArray(json) ? json : json.data || []
      setLeaderboard(leaderboardItems)
      setLeaderboardTotalPages(
        typeof json.totalPages === 'number'
          ? json.totalPages
          : Math.max(1, Math.ceil(leaderboardItems.length / leaderboardLimit))
      )
      setLeaderboardTotalItems(
        typeof json.totalItems === 'number'
          ? json.totalItems
          : leaderboardItems.length
      )
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLeaderboard([])
      setLeaderboardTotalPages(1)
      setLeaderboardTotalItems(0)
    }
  }, [leaderboardPage, leaderboardLimit])
  const chartData = useMemo(() => {
    const grouped = leaderboard.reduce((acc: any, item: any) => {
      const machineName = item.Location
      const count = parseInt(item.total) || 0

      if (!acc[machineName]) {
        acc[machineName] = { name: machineName, totalCount: 0 }
      }
      acc[machineName].totalCount += count
      return acc
    }, {})

    return Object.values(grouped)
  }, [leaderboard])
  const { machineChartData, problemChartData } = useMemo(() => {
    // Grouping per Mesin
    const machineGroup = leaderboard.reduce((acc: any, item: any) => {
      const name = item.Location
      const count = parseInt(item.total) || 0
      if (!acc[name]) acc[name] = { name, totalCount: 0 }
      acc[name].totalCount += count
      return acc
    }, {})

    // Grouping per Nama Problem
    const problemGroup = leaderboard.reduce((acc: any, item: any) => {
      const name = item.Problem
      const count = parseInt(item.total) || 0
      if (!acc[name]) acc[name] = { name, totalCount: 0 }
      acc[name].totalCount += count
      return acc
    }, {})

    return {
      machineChartData: Object.values(machineGroup),
      problemChartData: Object.values(problemGroup),
    }
  }, [leaderboard])
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
    fetchLeaderboard()

    const interval = setInterval(() => {
      fetchData()
      fetchLeaderboard()
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchData, fetchLeaderboard])

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
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-gray-100 text-gray-600 uppercase tracking-tight sticky top-0 z-10 border-b">
              <tr>
                <th className="px-2 py-2 w-[35px] text-center">No</th>
                <th
                  onClick={() => handleSort('Location')}
                  className="px-2 py-2 cursor-pointer hover:bg-gray-200 w-[80px] text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    Loc <ArrowUpDown size={10} />
                    {sortField === 'Location' &&
                      (sortDirection === 'asc' ? '▲' : '▼')}
                  </div>
                </th>
                <th className="px-2 py-2 w-[70px] text-center">MchID</th>
                <th className="px-2 py-2 w-[70px] text-center">Brand</th>
                {/* Kolom yang lebar dibiarkan tanpa w- agar mengambil sisa space */}
                <th className="px-2 py-2 text-left min-w-[120px]">
                  Material Name
                </th>
                <th className="px-2 py-2 text-left min-w-[100px]">
                  Problem Group
                </th>
                <th className="px-2 py-2 text-left min-w-[120px]">Problem</th>
                <th className="px-2 py-2 text-left min-w-[120px]">Action</th>
                <th className="px-2 py-2 w-[50px] text-center">Ton</th>
                <th
                  onClick={() => handleSort('DuraMin')}
                  className="px-2 py-2 cursor-pointer hover:bg-gray-200 w-[70px] text-center border-l"
                >
                  <div className="flex items-center justify-center gap-1">
                    Dur <ArrowUpDown size={10} />
                    {sortField === 'DuraMin' &&
                      (sortDirection === 'asc' ? '▲' : '▼')}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {lostPaginated.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="py-1.5 px-2 text-center text-gray-400">
                    {(lostPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="py-1.5 px-2 text-center font-medium">
                    {item.Location}
                  </td>
                  <td className="py-1.5 px-2 text-center text-gray-600">
                    {item.MchID}
                  </td>
                  <td className="py-1.5 px-2 text-center">{item.Brand}</td>
                  <td
                    className="py-1.5 px-2 truncate max-w-[150px]"
                    title={item.material_name}
                  >
                    {item.material_name}
                  </td>
                  <td
                    className="py-1.5 px-2 truncate max-w-[120px]"
                    title={item.ProblemGroupName}
                  >
                    {item.ProblemGroupName}
                  </td>
                  <td
                    className="py-1.5 px-2 truncate max-w-[150px]"
                    title={item.Problem}
                  >
                    {item.Problem}
                  </td>
                  <td
                    className="py-1.5 px-2 truncate max-w-[150px]"
                    title={item.ActionPlan}
                  >
                    {item.ActionPlan}
                  </td>
                  <td className="py-1.5 px-2 text-center text-gray-500">
                    {item.MchTon}
                  </td>
                  <td
                    className={`py-1.5 px-2 text-center font-bold border-l ${
                      item.DuraMin > 180
                        ? 'text-red-600 bg-red-50'
                        : item.DuraMin > 60
                          ? 'text-orange-600 bg-orange-50'
                          : 'text-gray-700'
                    }`}
                  >
                    {(item.DuraMin / 60).toFixed(1)}h
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

      {/* --- SECTION LEADERBOARD --- */}
      <div className="bg-white shadow-md rounded-2xl border-t-4 border-purple-500 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Leaderboard Analysis
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Data visualization for Page {leaderboardPage}
            </p>
          </div>
        </div>

        {/* TWO CHARTS SIDE BY SIDE */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
          {/* Chart 1: Berdasarkan Mesin */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[11px] font-bold text-gray-600 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span> By
              Machine Location
            </p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={machineChartData}
                  margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#dbeafe' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '10px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="totalCount"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Berdasarkan Nama Problem */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[11px] font-bold text-gray-600 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full"></span> By
              Problem Type
            </p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={problemChartData}
                  margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    hide={false} // Jika nama problem terlalu panjang, bisa di-hide atau dipersingkat
                    tickFormatter={(value) =>
                      value.length > 10 ? `${value.substring(0, 10)}...` : value
                    }
                  />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#e0f2fe' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '10px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="totalCount"
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TABEL AREA */}
        <div className="px-4 pb-4">
          <div className="overflow-auto max-h-[350px] border border-gray-100 rounded-lg">
            <table className="w-full border-collapse text-[11px]">
              <thead className="bg-gray-50 text-gray-500 uppercase sticky top-0 z-10">
                <tr className="border-b">
                  <th className="px-3 py-2 text-center w-[50px]">Rank</th>
                  <th className="px-3 py-2 text-center">Loc</th>
                  <th className="px-3 py-2 text-left">Material Name</th>
                  <th className="px-3 py-2 text-left">Problem</th>
                  <th className="px-3 py-2 text-center">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {leaderboard?.length > 0 ? (
                  leaderboard.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="py-2 px-3 text-center font-bold text-gray-400">
                        {(leaderboardPage - 1) * leaderboardLimit + index + 1}
                      </td>
                      <td className="py-2 px-3 text-center font-semibold text-gray-700">
                        {item.Location}
                      </td>
                      <td className="py-2 px-3 truncate max-w-[150px] text-gray-600">
                        {item.material_name}
                      </td>
                      <td className="py-2 px-3 truncate max-w-[200px] text-gray-600">
                        {item.Problem}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                          {item.total}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between mt-4 text-[11px]">
            <button
              onClick={() => setLeaderboardPage((p) => Math.max(p - 1, 1))}
              disabled={leaderboardPage === 1}
              className="px-4 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
            >
              Previous
            </button>
            <span>
        Page <strong className="text-gray-800">{leaderboardPage}</strong> / {leaderboardTotalPages} • {leaderboardTotalItems} items
      </span>
            <button
              onClick={() => setLeaderboardPage((p) => p + 1)}
              disabled={leaderboard.length < leaderboardLimit}
              className="px-4 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
            >
              Next Page
            </button>
          </div>
        </div>
      </div>
      {/* 📋 TABLE PROBLEM & ACTION PLAN */}
      <div className="bg-white shadow-md rounded-2xl p-4 border-t-4 border-orange-500 hover:shadow-lg transition-shadow">
        <h2 className="text-base font-semibold mb-3">Problem & Action Plan</h2>

        <div className="overflow-auto max-h-[600px]">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-gray-100 text-gray-600 uppercase tracking-tight sticky top-0 z-10 border-b">
              <tr>
                <th className="px-2 py-2 w-[35px] text-center">No</th>
                <th className="px-2 py-2 w-[60px] text-center">UAP</th>
                <th className="px-2 py-2 w-[70px] text-center">Brand</th>
                <th className="px-2 py-2 w-[80px] text-center">Loc</th>
                <th className="px-2 py-2 text-left min-w-[120px]">
                  Material Name
                </th>
                <th className="px-2 py-2 text-left min-w-[140px]">Problem</th>
                <th className="px-2 py-2 text-left min-w-[140px]">Action</th>
                <th className="px-2 py-2 w-[80px] text-center">PIC</th>
                <th className="px-2 py-2 w-[90px] text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {problemPaginated.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-blue-50/40 transition-colors"
                >
                  <td className="py-1.5 px-2 text-center text-gray-400">
                    {(problemPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="py-1.5 px-2 text-center">{item.UAP}</td>
                  <td className="py-1.5 px-2 text-center text-gray-600">
                    {item.Brand}
                  </td>
                  <td className="py-1.5 px-2 text-center font-medium">
                    {item.Location}
                  </td>

                  {/* Kolom Teks Panjang menggunakan text-left agar tidak banyak space kosong */}
                  <td
                    className="py-1.5 px-2 truncate max-w-[150px]"
                    title={item.material_name}
                  >
                    {item.material_name}
                  </td>
                  <td
                    className="py-1.5 px-2 truncate max-w-[200px]"
                    title={item.Problem}
                  >
                    {item.Problem}
                  </td>
                  <td
                    className="py-1.5 px-2 truncate max-w-[200px]"
                    title={item.Action}
                  >
                    {item.Action}
                  </td>

                  <td className="py-1.5 px-2 text-center">
                    <span className="text-blue-600 font-medium">
                      {item.pic}
                    </span>
                  </td>

                  <td className="py-1.5 px-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block w-[75px]
              ${
                item.TicketStatus?.toLowerCase() === 'open' ||
                item.TicketStatus?.toLowerCase() === 'new'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : item.TicketStatus?.toLowerCase() === 'progress' ||
                      item.TicketStatus?.toLowerCase() === 'onprog'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : item.TicketStatus?.toLowerCase() === 'close'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
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
