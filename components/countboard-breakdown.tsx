'use client'

import { memo, useState, useEffect, useCallback, useMemo } from 'react'
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
  TicketDate: string
  Type: string
  Action: string
  pic: string
  TicketStatus: string
  Message: string
  Location: string
  Brand: string
}

type LostTimeTableProps = {
  rows: LostData[]
  page: number
  totalPages: number
  loading: boolean
  onPrev: () => void
  onNext: () => void
}

type ProblemTableProps = {
  rows: ProblemData[]
  page: number
  totalPages: number
  loading: boolean
  onPrev: () => void
  onNext: () => void
}

type FetchMetrics = {
  lostMs: number | null
  problemMs: number | null
  totalMs: number | null
  lastUpdated: string | null
}

type ProblemStatusCountRow = {
  TicketStatus: string
  Total: number | string
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
const ROWS_PER_PAGE = 25
const TICKET_STATUS_OPTIONS = ['NEW', 'ONPROG', 'ASSIGNED', 'ESKALASI', 'OPEN']

function formatDuration(ms: number | null): string {
  if (ms === null) return '-'
  return `${Math.round(ms)} ms`
}

function formatTicketTime(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function getTicketTimeMs(value?: string): number {
  if (!value) return 0
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

function normalizeLocation(value?: string): string {
  if (!value) return ''
  return value.trim().toUpperCase().replace(/\s+/g, ' ')
}

function normalizeTicketStatus(value?: string): string {
  if (!value) return ''
  const normalized = value.toUpperCase().replace(/[\s_-]+/g, '')
  if (normalized === 'ONPROGRESS') return 'ONPROG'
  return normalized
}

function toDateInputValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function getCurrentMonthRangeInput(): { from: string; to: string } {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    from: toDateInputValue(monthStart),
    to: toDateInputValue(now),
  }
}

function toApiRange(fromInput: string, toInput: string) {
  const fromDate = new Date(`${fromInput}T00:00:00`)
  const toDateInclusive = new Date(`${toInput}T00:00:00`)
  const toDateExclusive = new Date(toDateInclusive.getTime() + 24 * 60 * 60 * 1000)
  return {
    fromISO: fromDate.toISOString(),
    toISO: toDateExclusive.toISOString(),
  }
}

const LostTimeTable = memo(function LostTimeTable({
  rows,
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
}: LostTimeTableProps) {
  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Lost Time List</h2>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <button
            type="button"
            onClick={onPrev}
            disabled={loading || page <= 1}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={loading || page >= totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

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
            {loading && rows.length === 0 ? (
              <tr>
                <td className="p-3 border text-center text-gray-500" colSpan={5}>
                  Loading lost-time data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 border text-center text-gray-500" colSpan={5}>
                  No data
                </td>
              </tr>
            ) : (
              rows.map((item, index) => (
                <tr
                  key={`${item.MchID}-${item.StatusDate}-${index}`}
                  className="text-center"
                >
                  <td className="p-2 border">{item.Location}</td>
                  <td className="p-2 border">{item.MchID}</td>
                  <td className="p-2 border">{item.Brand}</td>
                  <td className="p-2 border">{item.MchTon}</td>
                  <td className="p-2 border font-semibold text-red-600">
                    {item.DuraMin}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
})

const ProblemActionTable = memo(function ProblemActionTable({
  rows,
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
}: ProblemTableProps) {
  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Problem & Action Plan</h2>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <button
            type="button"
            onClick={onPrev}
            disabled={loading || page <= 1}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={loading || page >= totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Location</th>
              <th className="p-2 border">Problem</th>
              <th className="p-2 border">Action</th>
              <th className="p-2 border">PIC</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Ticket Time</th>
              <th className="p-2 border">Message</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td className="p-3 border text-center text-gray-500" colSpan={7}>
                  Loading problem data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 border text-center text-gray-500" colSpan={7}>
                  No data
                </td>
              </tr>
            ) : (
              rows.map((item, index) => (
                <tr
                  key={`${item.MchID}-${item.Problem}-${item.TicketStatus}-${index}`}
                  className="text-center"
                >
                  <td className="p-2 border">{item.Location}</td>
                  <td className="p-2 border">{item.Problem}</td>
                  <td className="p-2 border">{item.Action}</td>
                  <td className="p-2 border font-semibold">{item.pic}</td>
                  <td className="p-2 border">{item.TicketStatus}</td>
                  <td className="p-2 border whitespace-nowrap">
                    {formatTicketTime(item.TicketDate)}
                  </td>
                  <td className="p-2 border">{item.Message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
})

export default function CountboardBreakdown() {
  const [lostData, setLostData] = useState<LostData[]>([])
  const [problemData, setProblemData] = useState<ProblemData[]>([])
  const [fromDateInput, setFromDateInput] = useState(
    () => getCurrentMonthRangeInput().from
  )
  const [toDateInput, setToDateInput] = useState(
    () => getCurrentMonthRangeInput().to
  )
  const [appliedFromDate, setAppliedFromDate] = useState(
    () => getCurrentMonthRangeInput().from
  )
  const [appliedToDate, setAppliedToDate] = useState(
    () => getCurrentMonthRangeInput().to
  )
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [isLoadingLost, setIsLoadingLost] = useState(true)
  const [isLoadingProblem, setIsLoadingProblem] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchMetrics, setFetchMetrics] = useState<FetchMetrics>({
    lostMs: null,
    problemMs: null,
    totalMs: null,
    lastUpdated: null,
  })
  const [lostPage, setLostPage] = useState(1)
  const [problemPage, setProblemPage] = useState(1)
  const [selectedProblemStatuses, setSelectedProblemStatuses] = useState<string[]>(
    TICKET_STATUS_OPTIONS
  )
  const [problemStatusCounts, setProblemStatusCounts] = useState<
    Record<string, number>
  >({
    NEW: 0,
    ONPROG: 0,
    ASSIGNED: 0,
    OPEN: 0,
    ESKALASI: 0,
  })

  const fetchData = useCallback(async () => {
    const totalStart = performance.now()
    setIsRefreshing(true)
    setIsLoadingLost(true)
    setIsLoadingProblem(true)
    const apiRange = toApiRange(appliedFromDate, appliedToDate)
    const query = new URLSearchParams({
      fromDate: apiRange.fromISO,
      toDate: apiRange.toISO,
    }).toString()

    const fetchLost = async () => {
      const startedAt = performance.now()
      const res = await fetch(`${API_BASE}/api/countboards/lost-time?${query}`)
      const payload = await res.json()
      return {
        data: Array.isArray(payload) ? payload : [],
        duration: performance.now() - startedAt,
      }
    }

    const fetchProblem = async () => {
      const startedAt = performance.now()
      const res = await fetch(`${API_BASE}/api/countboards/problem?${query}`)
      const payload = await res.json()
      return {
        data: Array.isArray(payload) ? payload : [],
        duration: performance.now() - startedAt,
      }
    }

    const fetchProblemStatusCounts = async () => {
      const res = await fetch(`${API_BASE}/api/countboards/problem-status-counts?${query}`)
      const payload = await res.json()
      return Array.isArray(payload) ? (payload as ProblemStatusCountRow[]) : []
    }

    try {
      const [lostResult, problemResult, statusCountResult] = await Promise.allSettled([
        fetchLost(),
        fetchProblem(),
        fetchProblemStatusCounts(),
      ])

      const nextMetrics: FetchMetrics = {
        lostMs: null,
        problemMs: null,
        totalMs: performance.now() - totalStart,
        lastUpdated: new Date().toLocaleTimeString(),
      }

      if (lostResult.status === 'fulfilled') {
        setLostData(lostResult.value.data)
        nextMetrics.lostMs = lostResult.value.duration
      } else {
        console.error('Error fetching lost-time data:', lostResult.reason)
      }

      if (problemResult.status === 'fulfilled') {
        setProblemData(problemResult.value.data)
        nextMetrics.problemMs = problemResult.value.duration
      } else {
        console.error('Error fetching problem data:', problemResult.reason)
      }

      if (statusCountResult.status === 'fulfilled') {
        const nextCounts: Record<string, number> = {
          NEW: 0,
          ONPROG: 0,
          ASSIGNED: 0,
          OPEN: 0,
          ESKALASI: 0,
        }

        for (const row of statusCountResult.value) {
          const key = normalizeTicketStatus(row.TicketStatus)
          const value = Number(row.Total || 0)
          if (Object.prototype.hasOwnProperty.call(nextCounts, key)) {
            nextCounts[key] = Number.isNaN(value) ? 0 : value
          }
        }

        setProblemStatusCounts(nextCounts)
      } else {
        console.error('Error fetching problem status counts:', statusCountResult.reason)
      }

      setFetchMetrics(nextMetrics)
    } catch (error) {
      console.error('Error fetching countboard data:', error)
    } finally {
      setIsRefreshing(false)
      setIsLoadingLost(false)
      setIsLoadingProblem(false)
    }
  }, [appliedFromDate, appliedToDate])
  // auto refresh tiap 10 detik
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  // 🔢 Breakdown = total lost
  const totalBreakdown = lostData.length

  const latestProblemData = useMemo(() => {
    const byLocationAndStatus = new Map<string, ProblemData>()

    for (const item of problemData) {
      const locationKey = normalizeLocation(item.Location)
      const statusKey = normalizeTicketStatus(item.TicketStatus)
      const key = `${locationKey}__${statusKey}`
      const current = byLocationAndStatus.get(key)

      if (!current) {
        byLocationAndStatus.set(key, item)
        continue
      }

      if (getTicketTimeMs(item.TicketDate) > getTicketTimeMs(current.TicketDate)) {
        byLocationAndStatus.set(key, item)
      }
    }

    return Array.from(byLocationAndStatus.values())
  }, [problemData])

  const filteredProblemData = useMemo(() => {
    if (selectedProblemStatuses.length === 0) return []
    const selectedSet = new Set(selectedProblemStatuses.map(normalizeTicketStatus))
    return latestProblemData.filter((item) =>
      selectedSet.has(normalizeTicketStatus(item.TicketStatus))
    )
  }, [latestProblemData, selectedProblemStatuses])

  // 📊 Group PIC (MEKANIK vs MAINTENANCE)
  const picChartData = useMemo(() => {
    const picSummary = filteredProblemData.reduce(
      (acc: Record<string, number>, item) => {
        if (!item.pic) return acc // skip unknown
        acc[item.pic] = (acc[item.pic] || 0) + 1
        return acc
      },
      {}
    )

    return Object.entries(picSummary).map(([name, value]) => ({
      name,
      total: value,
    }))
  }, [filteredProblemData])
  // 📊 Group per MchLoc (chart mesin per lokasi)
  const locChartData = useMemo(() => {
    const locSummary = lostData.reduce((acc: Record<string, number>, item) => {
      const loc = item.MchLoc || 'UNKNOWN'
      acc[loc] = (acc[loc] || 0) + 1
      return acc
    }, {})

    return Object.entries(locSummary).map(([name, total]) => ({
      name,
      total,
    }))
  }, [lostData])

  const lostTotalPages = useMemo(
    () => Math.max(1, Math.ceil(lostData.length / ROWS_PER_PAGE)),
    [lostData.length]
  )

  const problemTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProblemData.length / ROWS_PER_PAGE)),
    [filteredProblemData.length]
  )

  useEffect(() => {
    setLostPage((current) => Math.min(current, lostTotalPages))
  }, [lostTotalPages])

  useEffect(() => {
    setProblemPage((current) => Math.min(current, problemTotalPages))
  }, [problemTotalPages])

  const lostRows = useMemo(() => {
    const start = (lostPage - 1) * ROWS_PER_PAGE
    return lostData.slice(start, start + ROWS_PER_PAGE)
  }, [lostData, lostPage])

  const problemRows = useMemo(() => {
    const start = (problemPage - 1) * ROWS_PER_PAGE
    return filteredProblemData.slice(start, start + ROWS_PER_PAGE)
  }, [filteredProblemData, problemPage])

  const goPrevLostPage = useCallback(() => {
    setLostPage((current) => Math.max(1, current - 1))
  }, [])

  const goNextLostPage = useCallback(() => {
    setLostPage((current) => Math.min(lostTotalPages, current + 1))
  }, [lostTotalPages])

  const goPrevProblemPage = useCallback(() => {
    setProblemPage((current) => Math.max(1, current - 1))
  }, [])

  const goNextProblemPage = useCallback(() => {
    setProblemPage((current) => Math.min(problemTotalPages, current + 1))
  }, [problemTotalPages])

  const toggleProblemStatus = useCallback((status: string) => {
    setProblemPage(1)
    setSelectedProblemStatuses((current) => {
      const exists = current.includes(status)
      if (exists) {
        return current.filter((item) => item !== status)
      }
      return [...current, status]
    })
  }, [])

  const applyDateRange = useCallback(() => {
    if (!fromDateInput || !toDateInput) {
      setRangeError('Please select both start and end date.')
      return
    }
    if (fromDateInput > toDateInput) {
      setRangeError('Start date must be before end date.')
      return
    }

    setRangeError(null)
    setAppliedFromDate(fromDateInput)
    setAppliedToDate(toDateInput)
    setLostPage(1)
    setProblemPage(1)
  }, [fromDateInput, toDateInput])

  const resetToCurrentMonth = useCallback(() => {
    const next = getCurrentMonthRangeInput()
    setRangeError(null)
    setFromDateInput(next.from)
    setToDateInput(next.to)
    setAppliedFromDate(next.from)
    setAppliedToDate(next.to)
    setLostPage(1)
    setProblemPage(1)
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Countboard Breakdown</h1>
        <span className="text-xs text-gray-500">
          {isRefreshing ? 'Refreshing data...' : 'Auto refresh: 10s'}
        </span>
      </div>

      <div className="bg-white rounded-2xl border p-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500" htmlFor="countboard-from-date">
              From
            </label>
            <input
              id="countboard-from-date"
              type="date"
              value={fromDateInput}
              onChange={(event) => setFromDateInput(event.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500" htmlFor="countboard-to-date">
              To
            </label>
            <input
              id="countboard-to-date"
              type="date"
              value={toDateInput}
              onChange={(event) => setToDateInput(event.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyDateRange}
              className="px-3 py-1.5 text-sm rounded bg-black text-white"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetToCurrentMonth}
              className="px-3 py-1.5 text-sm rounded border"
            >
              This Month
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Active range: {appliedFromDate} to {appliedToDate}
        </p>
        {rangeError && <p className="text-xs text-red-600 mt-1">{rangeError}</p>}
      </div>

      <div className="bg-white rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold">Problem Status Filter</p>
          <p className="text-xs text-gray-500">
            Showing {filteredProblemData.length} row(s)
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
          {TICKET_STATUS_OPTIONS.map((status) => (
            <div key={`count-${status}`} className="rounded border px-2 py-1 text-xs">
              <p className="text-gray-500">{status}</p>
              <p className="font-semibold">{problemStatusCounts[status] ?? 0}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap mt-3">
          {TICKET_STATUS_OPTIONS.map((status) => {
            const active = selectedProblemStatuses.includes(status)
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleProblemStatus(status)}
                className={`px-3 py-1 rounded text-xs border ${
                  active
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {status}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-gray-500">Lost API</p>
          <p className="text-sm font-semibold">{formatDuration(fetchMetrics.lostMs)}</p>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-gray-500">Problem API</p>
          <p className="text-sm font-semibold">
            {formatDuration(fetchMetrics.problemMs)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-gray-500">Total Fetch</p>
          <p className="text-sm font-semibold">
            {formatDuration(fetchMetrics.totalMs)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-gray-500">Last Updated</p>
          <p className="text-sm font-semibold">{fetchMetrics.lastUpdated ?? '-'}</p>
        </div>
      </div>

      {/* 🔥 HEADER COMBINED: BREAKDOWN + PIC + MESIN */}
      <div className="bg-white shadow rounded-2xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.5fr_1.7fr_1.7fr] gap-6 items-start">
          {/* 🔢 BREAKDOWN TOTAL (KIRI) */}
          <div className="flex flex-col justify-start pt-2">
            <p className="text-gray-500 text-xs">Breakdown</p>
              <h2 className="text-4xl font-bold text-black mt-1">
                {isLoadingLost && lostData.length === 0 ? '...' : totalBreakdown}
              </h2>
            </div>

          {/* 📊 PIC SUMMARY (TENGAH) */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-center">
              Breakdown with PIC
            </h2>

            <div className="w-full h-[260px]">
              {isLoadingProblem && (
                <p className="text-xs text-gray-500 mb-2">Loading PIC chart...</p>
              )}
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
              {isLoadingLost && (
                <p className="text-xs text-gray-500 mb-2">Loading location chart...</p>
              )}
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
      <LostTimeTable
        rows={lostRows}
        page={lostPage}
        totalPages={lostTotalPages}
        loading={isLoadingLost}
        onPrev={goPrevLostPage}
        onNext={goNextLostPage}
      />

      {/* 📋 TABLE PROBLEM & ACTION PLAN */}
      <ProblemActionTable
        rows={problemRows}
        page={problemPage}
        totalPages={problemTotalPages}
        loading={isLoadingProblem}
        onPrev={goPrevProblemPage}
        onNext={goNextProblemPage}
      />
    </div>
  )
}
