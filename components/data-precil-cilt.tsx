'use client'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import 'react-day-picker/dist/style.css'
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Settings,
  Layers,
  LayoutDashboard,
  ChevronDown,
  Building2,
  FileText,
  Search,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
// ================= TYPESCRIPT INTERFACE =================
type CiltMonitoringData = {
  MchId: string
  machine_name: string
  material_name: string
  UAP: string
  MchLoc: string
  daily_shoot: number
  mold_name: string
  statusCILT: string
  statuslight: string
  CILTLvl: string
  sum_dailyshoot: number
  created_at: string
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL

export default function Dprecilt() {
  const [selectedBuilding, setSelectedBuilding] =
    useState<string>('All Buildings')
  const [selectedUap, setSelectedUap] = useState<string>('All UAP')
  const [data, setData] = useState<CiltMonitoringData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  // Ubah state menjadi array
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cilt/cilt-trx`)
      if (!res.ok) throw new Error('Network response was not ok')
      const json = await res.json()
      setData(json || [])
    } catch (error) {
      console.error('Error fetching CILT data:', error)
    } finally {
      setLoading(false)
    }
  }, [])
  console.log('Fetched CILT data:', data)
  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ================= FILTER LOGIC =================
  // Mengambil list building dan uap unik secara dinamis dari data MchLoc yang ada
  const buildingsList = useMemo(() => {
    const uniqueLocs = Array.from(
      new Set(data.map((item) => item.MchLoc).filter(Boolean))
    )
    return ['All Buildings', ...uniqueLocs.sort()]
  }, [data])
  const uapList = useMemo(() => {
    const uniqueUaps = Array.from(
      new Set(data.map((item) => item.UAP).filter(Boolean))
    )
    return ['All UAP', ...uniqueUaps.sort()]
  }, [data])
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchBuilding =
        selectedBuilding === 'All Buildings' || item.MchLoc === selectedBuilding
      const matchUap = selectedUap === 'All UAP' || item.UAP === selectedUap
      // Logika Pencarian: Cek machine_name atau mold_name
      const searchLower = searchTerm.toLowerCase()
      const matchSearch =
        searchTerm === '' ||
        item.machine_name?.toLowerCase().includes(searchLower) ||
        item.mold_name?.toLowerCase().includes(searchLower)
      const itemDate = item.created_at
        ? new Date(item.created_at).toISOString().split('T')[0]
        : ''
      const matchDate =
        (!startDate || itemDate >= startDate) &&
        (!endDate || itemDate <= endDate)
      return matchBuilding && matchUap && matchSearch && matchDate
    })
  }, [selectedBuilding, selectedUap, searchTerm, startDate, endDate, data])
  const sortedData = useMemo(() => {
    return [...filteredData].sort(
      (a, b) => (b.daily_shoot || 0) - (a.daily_shoot || 0)
    )
  }, [filteredData])
  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert('Tidak ada data untuk diexport')

    // Format data agar header Excel rapi
    const excelData = filteredData.map((item, index) => ({
      No: index + 1,
      Machine: item.machine_name,
      Mold: item.mold_name,
      UAP: item.UAP,
      Building: item.MchLoc,
      Shoot: item.daily_shoot,
      Status: item.statusCILT ? 'CILT' : 'RUNNING',
      Date: item.created_at
        ? new Date(item.created_at).toLocaleDateString('id-ID')
        : '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CILT_Report')

    // Download file
    XLSX.writeFile(workbook, `CILT_Export_${new Date().getTime()}.xlsx`)
  }
  return (
    <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] p-6 lg:p-10">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              CILT data monitoring dashboard
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* DYNAMIC FILTER */}
          <div className="flex flex-wrap items-center gap-3">
            {/* FILTER UAP */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                <Layers size={16} />
              </div>
              <select
                value={selectedUap}
                onChange={(e) => setSelectedUap(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 pl-10 pr-10 py-2 rounded-xl text-sm font-semibold shadow-sm hover:border-blue-200 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]"
              >
                {uapList.map((uap) => (
                  <option key={uap} value={uap}>
                    {uap}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* FILTER BUILDING */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                <Building2 size={16} />
              </div>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 pl-10 pr-10 py-2 rounded-xl text-sm font-semibold shadow-sm hover:border-blue-200 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[160px]"
              >
                {buildingsList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
          <Link href="/cil-monitoring/" >
            <button className="flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-cyan-700 transition-colors">
              <FileText size={16} /> Real Time CILT Monitoring
            </button>
          </Link>

          {/* <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-200 transition-all">
            Admin Dashboard
          </button> */}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-700">
              Data Precil CILT Monitoring
            </h3>
            {/* <h3 className="font-bold text-gray-700">
             Data Precil CILT Monitoring - Active Issues: {activeIssuesCount}
            </h3> */}
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">
              {selectedBuilding}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* SEARCH INPUT */}
            <div className="relative flex-1 min-w-[240px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-xl shadow-sm">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                className="text-sm outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="text-gray-400">to</span>
            {/* Input Tanggal End */}
            <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-xl shadow-sm">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                className="text-sm outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:bg-green-700 transition-all"
            >
              <FileText size={16} /> Export Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold text-center w-16">No</th>
                <th className="px-6 py-4 font-semibold">Machine</th>
                <th className="px-6 py-4 font-semibold">Mold</th>
                <th className="px-6 py-4 font-semibold">UAP</th>
                <th className="px-6 py-4 font-semibold">Building</th>
                <th className="px-6 py-4 font-semibold text-center">Shoot</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Status Mold
                </th>
                {/* <th className="px-6 py-4 font-semibold">Machine Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th> */}
                <th className="px-6 py-4 font-semibold text-center">date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {sortedData.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-4 text-center text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">
                    {item.machine_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono">
                    {item.mold_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono">
                    {item.UAP}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.MchLoc}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-sm font-bold px-4 py-3 rounded-xl ${
                        item.daily_shoot >= 5000
                          ? 'text-red-700 bg-red-100 animate-pulse' // Critical (Merah)
                          : item.daily_shoot >= 2500
                            ? 'text-yellow-700 bg-yellow-100 animate-pulse' // Warning (Kuning)
                            : 'text-gray-600' // Normal (Abu-abu)
                      }`}
                    >
                      {item.daily_shoot === 0 || item.daily_shoot === null
                        ? '-'
                        : item.daily_shoot.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.statusCILT
                            ? 'bg-yellow-500 text-white shadow-sm'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {item.statusCILT ? (
                          <AlertCircle size={12} className="animate-bounce" />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        {item.statusCILT ? 'CILT' : 'RUNNING'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('id-ID')
                      : '-'}
                  </td>
                  {/* <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          item.statuslight === 'GREEN'
                            ? 'bg-green-500'
                            : item.statuslight === 'RED'
                              ? 'bg-red-500'
                              : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-xs font-medium text-gray-400">
                        {item.statuslight}
                      </span>
                    </div>
                  </td> */}
                  {/* <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs underline underline-offset-4">
                      Details
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredData.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              No data found in database.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
