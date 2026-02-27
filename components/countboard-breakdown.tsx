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
}
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
export default function CountboardBreakdown() {
  const [lostData, setLostData] = useState<LostData[]>([])
  const [problemData, setProblemData] = useState<ProblemData[]>([])
  const [loading, setLoading] = useState(true)

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

  // 📊 Group PIC (MEKANIK vs MAINTENANCE)
  const picSummary = problemData.reduce((acc: Record<string, number>, item) => {
    if (!item.pic) return acc // skip unknown
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
    return <div className="p-6">Loading countboard...</div>
  }
  const locChartData = Object.entries(locSummary).map(([name, total]) => ({
    name,
    total,
  }))
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold">Countboard Breakdown</h1>

      {/* 🔥 HEADER COMBINED: BREAKDOWN + PIC + MESIN */}
      <div className="bg-white shadow rounded-2xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.5fr_1.7fr_1.7fr] gap-6 items-start">
          {/* 🔢 BREAKDOWN TOTAL (KIRI) */}
          <div className="flex flex-col justify-start pt-2">
            <p className="text-gray-500 text-xs">Breakdown</p>
            <h2 className="text-4xl font-bold text-black mt-1">
              {totalBreakdown}
            </h2>
          </div>

          {/* 📊 PIC SUMMARY (TENGAH) */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-center">
              Breakdown with PIC
            </h2>

            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={picChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {picChartData.map((entry, index) => {
                      let color = '#f59e0b' // default orange (lainnya)

                      if (entry.name?.toUpperCase() === 'MEKANIK') {
                        color = '#ef4444' // merah
                      } else if (entry.name?.toUpperCase() === 'MAINTENANCE') {
                        color = '#f97316' // orange
                      }

                      return <Cell key={index} fill={color} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend bawah chart */}
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

          {/* 🏭 MESIN / MchLoc (KANAN - CHART BIRU GRADASI) */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-center">
              Lost per Location (MchLoc)
            </h2>

            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={locChartData}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={90} />
                  <Tooltip />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                    {locChartData.map((_, index) => {
                      // gradasi biru dari tebal (atas) ke redup (bawah)
                      const opacity = 1 - index * 0.15
                      return (
                        <Cell
                          key={index}
                          fill="#3b82f6"
                          fillOpacity={opacity < 0.3 ? 0.3 : opacity}
                        />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 TABLE LOST TIME */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Lost Time List</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Location</th>
                <th className="p-2 border">MchID</th>
                <th className="p-2 border">Brand</th>
                <th className="p-2 border">Ton</th>
                <th className="p-2 border">Duration (Min)</th>
              </tr>
            </thead>
            <tbody>
              {lostData.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="p-2 border">{item.Location}</td>
                  <td className="p-2 border">{item.MchID}</td>
                  <td className="p-2 border">{item.Brand}</td>
                  <td className="p-2 border">{item.MchTon}</td>
                  <td className="p-2 border font-semibold text-red-600">
                    {item.DuraMin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📋 TABLE PROBLEM & ACTION PLAN */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Problem & Action Plan</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Location</th>
                <th className="p-2 border">Problem</th>
                <th className="p-2 border">Action</th>
                <th className="p-2 border">PIC</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Message</th>
              </tr>
            </thead>
            <tbody>
              {problemData.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="p-2 border">{item.Location}</td>
                  <td className="p-2 border">{item.Problem}</td>
                  <td className="p-2 border">{item.Action}</td>
                  <td className="p-2 border font-semibold">{item.pic}</td>
                  <td className="p-2 border">{item.TicketStatus}</td>
                  <td className="p-2 border">{item.Message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
