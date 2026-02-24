'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
// import { format } from 'date-fns'
import 'react-day-picker/dist/style.css'
import {
  addDays,
  differenceInCalendarDays,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL

export default function CountboardEskalasi() {
  const [ticketList, setTicketList] = useState([])
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState()
  const [showCalendar, setShowCalendar] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [formMessage, setFormMessage] = useState('')
  const [formStatus, setFormStatus] = useState('open')
  const [timePage, setTimePage] = useState(0)
  const [chartMode, setChartMode] = useState('day')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [activeSort, setActiveSort] = useState(null)
  const [locationSort, setLocationSort] = useState('asc')
  const [dateSort, setDateSort] = useState('asc')
  const normalize = (val) => val?.toLowerCase().replace(/\s+/g, '')
  useEffect(() => {
    setTimePage(0)
  }, [range])
  const daysDiff = useMemo(() => {
    if (!range?.from || !range?.to) return 1
    return differenceInCalendarDays(range.to, range.from) + 1
  }, [range])

  const mode = useMemo(() => {
    if (daysDiff <= 1) return 'day'
    if (daysDiff <= 31) return 'week'
    return 'month'
  }, [daysDiff])

  const totalPages = useMemo(() => {
    if (!range?.from || !range?.to) return 1

    if (mode === 'week') {
      return Math.ceil(daysDiff / 7)
    } else {
      const months =
        (range.to.getFullYear() - range.from.getFullYear()) * 12 +
        (range.to.getMonth() - range.from.getMonth()) +
        1
      return months
    }
  }, [range, mode, daysDiff])

  useEffect(() => {
    const today = new Date()
    setRange({ from: today, to: today })
  }, [])

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchTicketEskalasi = async () => {
      setLoading(true)
      try {
        let url = `${API_BASE}/api/countboards/eskalasi`

        if (range?.from && range?.to) {
          url += `?fromDate=${format(
            range.from,
            'yyyy-MM-dd'
          )}&toDate=${format(range.to, 'yyyy-MM-dd')}`
        }

        const res = await fetch(url)
        const json = await res.json()

        setTicketList(Array.isArray(json) ? json : [])
      } catch (error) {
        console.error(error)
        setTicketList([])
      } finally {
        setLoading(false)
      }
    }

    if (range) fetchTicketEskalasi()
  }, [range])

  const filteredTickets = useMemo(() => {
    return ticketList.filter((item) => {
      const deptMatch =
        deptFilter === 'ALL' ||
        normalize(item.AssignToDept) === normalize(deptFilter)

      const statusMatch =
        statusFilter === 'ALL' ||
        normalize(item.EskalasiStatus) === normalize(statusFilter)

      return deptMatch && statusMatch
    })
  }, [ticketList, deptFilter, statusFilter])

  /* ================= PAGINATION ================= */
  const stripTime = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const pagedTickets = useMemo(() => {
    if (mode === 'day') {
      return [...filteredTickets].sort((a, b) => {
        if (locationSort) {
          const locCompare = (a.MchLoc || '').localeCompare(b.MchLoc || '')

          if (locCompare !== 0) {
            return locationSort === 'asc' ? locCompare : -locCompare
          }
        }

        const dateA = new Date(a.TicketDate)
        const dateB = new Date(b.TicketDate)

        return dateSort === 'asc' ? dateA - dateB : dateB - dateA
      })
    }

    let start, end

    if (mode === 'week') {
      start = addDays(range.from, timePage * 7)
      end = addDays(start, 6)
    } else {
      const base = new Date(
        range.from.getFullYear(),
        range.from.getMonth() + timePage,
        1
      )
      start = startOfMonth(base)
      end = endOfMonth(base)
    }

    if (end > range.to) end = range.to

    return filteredTickets
      .filter((item) => {
        if (!item.TicketDate) return false
        const d = stripTime(new Date(item.TicketDate))
        const s = stripTime(start)
        const e = stripTime(end)

        return d >= s && d <= e
      })
      .sort((a, b) => {
        if (activeSort === 'location') {
          return locationSort === 'asc'
            ? (a.MchLoc || '').localeCompare(b.MchLoc || '')
            : (b.MchLoc || '').localeCompare(a.MchLoc || '')
        }

        if (activeSort === 'date') {
          const dateA = new Date(a.TicketDate)
          const dateB = new Date(b.TicketDate)

          return dateSort === 'asc'
            ? dateA - dateB
            : dateB - dateA
        }

        return 0
      })
  }, [filteredTickets, timePage, range, mode, locationSort, dateSort])

  const pageLabel = useMemo(() => {
    if (!range?.from) return ''

    if (mode === 'week') {
      return `Week ${timePage + 1}`
    } else {
      const date = new Date(
        range.from.getFullYear(),
        range.from.getMonth() + timePage,
        1
      )
      return format(date, 'MMMM yyyy')
    }
  }, [timePage, range, mode])
  const handleExport = async () => {
    if (!range?.from || !range?.to) return

    const fromDate = format(range.from, 'yyyy-MM-dd')
    const toDate = format(range.to, 'yyyy-MM-dd')

    const url = `${API_BASE}/api/export/eskalasi?fromDate=${fromDate}&toDate=${toDate}&dept=${deptFilter}`

    const res = await fetch(url)
    const blob = await res.blob()

    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = 'eskalasi.xlsx'
    link.click()
  }

  /* ================= CALCULATIONS ================= */
  const totalEskalasi = filteredTickets.length
  const totalOpen = filteredTickets.filter(
    (i) => normalize(i.EskalasiStatus) === 'open'
  ).length

  const totalProgress = filteredTickets.filter(
    (i) => normalize(i.EskalasiStatus) === 'onprogress'
  ).length

  const totalClose = filteredTickets.filter(
    (i) => normalize(i.EskalasiStatus) === 'close'
  ).length
  console.log('totalClose', totalClose)
  console.log('totalOpen', totalOpen)
  const chartData = useMemo(() => {
    const map = {}

    filteredTickets.forEach((item) => {
      if (!item.TicketDate) return
      const date = new Date(item.TicketDate)

      let key

      if (chartMode === 'day') {
        key = format(date, 'yyyy-MM-dd')
      }

      if (chartMode === 'week') {
        const startWeek = format(date, 'yyyy-MM-dd')
        const weekNumber = Math.ceil(
          (date.getDate() +
            new Date(date.getFullYear(), date.getMonth(), 1).getDay()) /
          7
        )
        key = `Week ${weekNumber} - ${format(date, 'MMM yyyy')}`
      }

      if (chartMode === 'month') {
        key = format(date, 'MMM yyyy')
      }

      map[key] = (map[key] || 0) + 1
    })

    return Object.keys(map).map((k) => ({
      label: k,
      total: map[k],
    }))
  }, [filteredTickets, chartMode])

  useEffect(() => {
    if (!selectedTicket) return
    console.log('Selected Ticket:', selectedTicket)
    setFormMessage(selectedTicket.Message || '')

    const allowedStatus = ['open', 'on progress', 'close']
    const statusFromDB = selectedTicket.EskalasiStatus?.toLowerCase()

    setFormStatus(allowedStatus.includes(statusFromDB) ? statusFromDB : 'open')
  }, [selectedTicket])

  const chartColorMap = {
    ALL: '#38bdf8',
    Maintenance: '#fb923c',
    Moldshop: '#2dd4bf',
    Mixing: '#f87171',
  }
  const handleSave = async () => {
    if (!selectedTicket) return

    try {
      await fetch(`${API_BASE}/api/countboards/eskalasi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mchId: selectedTicket.MchID,
          ticketDate: selectedTicket.TicketDate,
          message: formMessage,
          eskalasiStatus: formStatus,
        }),
      })

      setShowDialog(false)
      setSelectedTicket(null)
      setRange({ ...range }) // trigger refetch
    } catch (err) {
      console.error(err)
    }
  }

  const chartColor = chartColorMap[deptFilter] || '#38bdf8'

  function DashboardCard({ title, value, color, icon }) {
    const colorMap = {
      red: 'bg-red-200 text-red-600',
      orange: 'bg-orange-200 text-orange-600',
      turquoise: 'bg-teal-200 text-teal-600',
    }
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-800">{value}</p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${colorMap[color]}`}
          >
            {icon}
          </div>
        </div>
      </div>
    )
  }
  const durationChartData = useMemo(() => {
    const map = {}

    filteredTickets.forEach((item) => {
      if (!item.ActualSubmit || !item.ActualEskalasiFinish) return

      const submit = new Date(item.ActualSubmit)
      const finish = new Date(item.ActualEskalasiFinish)

      const diffHours = (finish.getTime() - submit.getTime()) / (1000 * 60 * 60)

      let key

      if (chartMode === 'day') {
        key = format(submit, 'yyyy-MM-dd')
      }

      if (chartMode === 'week') {
        const weekNumber = Math.ceil(
          (submit.getDate() +
            new Date(submit.getFullYear(), submit.getMonth(), 1).getDay()) /
          7
        )
        key = `Week ${weekNumber} - ${format(submit, 'MMM yyyy')}`
      }

      if (chartMode === 'month') {
        key = format(submit, 'MMM yyyy')
      }

      if (!map[key]) map[key] = 0
      map[key] += diffHours
    })

    return Object.keys(map).map((k) => ({
      label: k,
      totalHours: Number(map[k].toFixed(2)),
    }))
  }, [filteredTickets, chartMode])

  return (
    <div className="p-6 space-y-4">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Ticket Eskalasi</h2>
        <div className="flex items-center gap-3">
          {/* DATE FILTER */}
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs"
          >
            Export Excel
          </button>
          <div className="relative">
            <button
              onClick={() => setShowCalendar((p) => !p)}
              className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs shadow-sm"
            >
              📅
              {range?.from && range?.to
                ? `${format(range.from, 'dd MMM yyyy')} - ${format(
                  range.to,
                  'dd MMM yyyy'
                )}`
                : 'Filter Tanggal'}
            </button>

            {showCalendar && (
              <div className="absolute right-0 z-10 mt-2 rounded-lg border bg-white p-3 shadow-lg scale-90">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={(val) => {
                    setRange(val)
                    setTimePage(0)
                  }}
                  numberOfMonths={1}
                />

                <div className="mt-2 text-right">
                  <button
                    onClick={() => {
                      const today = new Date()
                      setRange({ from: today, to: today })
                      setTimePage(0)
                      setShowCalendar(false)
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Reset ke Hari Ini
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-xs shadow-sm"
          >
            <option value="ALL">All Status</option>
            <option value="open">Open</option>
            <option value="on progress">On Progress</option>
            <option value="close">Close</option>
          </select>
          {/* DEPT FILTER */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-xs shadow-sm"
          >
            <option value="ALL">All Department</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Moldshop">Moldshop</option>
            <option value="Mixing">Mixing</option>
          </select>
        </div>
      </div>

      {/* ================= DASHBOARD ================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Eskalasi"
          value={totalEskalasi}
          color="red"
          icon="⚠️"
        />
        <DashboardCard
          title="Open"
          value={totalOpen}
          color="turquoise"
          icon="🟢"
        />

        <DashboardCard
          title="On Progress"
          value={totalProgress}
          color="orange"
          icon="🟡"
        />

        <DashboardCard title="Close" value={totalClose} color="red" icon="🔴" />
      </div>
      <div className="flex gap-2 mb-3">
        {['day', 'week', 'month'].map((m) => (
          <button
            key={m}
            onClick={() => setChartMode(m)}
            className={`px-3 py-1 text-xs rounded-full border ${chartMode === m ? 'bg-blue-600 text-white' : 'bg-white'
              }`}
          >
            {m === 'day' ? 'Daily' : m === 'week' ? 'Weekly' : 'Monthly'}
          </button>
        ))}
      </div>

      {/* ================= CHART ================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Total Ticket per Hari
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: chartColor, color: '#fff' }}
            >
              {deptFilter}
            </span>
          </p>

          {chartData.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada data</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="total"
                    fill={chartColor}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Total Durasi Eskalasi
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: chartColor, color: '#fff' }}
            >
              {deptFilter}
            </span>
          </p>

          {chartData.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada data</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={durationChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />

                  <YAxis tickFormatter={(v) => `${v}h`} />
                  <Tooltip formatter={(v) => `${v} jam`} />

                  <Bar
                    dataKey="totalHours"
                    fill={chartColor}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        {mode !== 'day' && (
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
            <p className="text-xs font-medium text-gray-600">
              {mode === 'week' ? 'Weekly View' : 'Monthly View'} — {pageLabel}
            </p>

            <div className="flex gap-2">
              <button
                disabled={timePage === 0}
                onClick={() => setTimePage((p) => p - 1)}
                className="px-3 py-1 text-xs border rounded disabled:opacity-40"
              >
                ⬅ Prev
              </button>
              <button
                disabled={timePage >= totalPages - 1}
                onClick={() => setTimePage((p) => p + 1)}
                className="px-3 py-1 text-xs border rounded disabled:opacity-40"
              >
                Next ➡
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3 w-28">
                  <div className="flex items-center gap-1">
                    Ticket Date
                    <button
                      onClick={() => {
                        setActiveSort('date')
                        setDateSort(prev => prev === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      {dateSort === 'asc' ? '▲' : '▼'}
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 w-24">Mch ID</th>
                <th className="px-4 py-3 w-40">
                  <div className="flex items-center gap-1">
                    Location
                    <button
                      onClick={() => {
                        setActiveSort('location')
                        setLocationSort(prev => prev === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      {locationSort === 'asc' ? '▲' : '▼'}
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3">Problem</th>
                <th className="px-4 py-3">Action Plan</th>
                <th className="px-4 py-3 w-28">Dept</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3 w-24 text-center">Status</th>
                <th className="px-4 py-3 w-24 text-center">Eskalasi</th>
              </tr>
            </thead>

            <tbody className="divide-y text-sm">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : pagedTickets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-4 text-center">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                pagedTickets.map((item, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedTicket(item)
                      setShowDialog(true)
                    }}
                  >
                    {/* No */}
                    <td className="px-3 py-2 text-center font-medium whitespace-nowrap">
                      {i + 1}
                    </td>

                    {/* Date */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {item.TicketDate
                        ? format(
                          new Date(item.TicketDate),
                          'dd/MM/yyyy - HH:mm'
                        )
                        : '-'}
                    </td>

                    {/* Mch ID */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {item.MchID}
                    </td>

                    {/* Location */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {item.MchLoc || '-'}-{item.MchNumber || '-'}
                    </td>

                    {/* Problem */}
                    <td className="px-3 py-2 max-w-[180px] truncate">
                      {item.Problem}
                    </td>

                    {/* Action Plan */}
                    <td className="px-3 py-2 max-w-[180px] truncate">
                      {item.ActionPlan}
                    </td>

                    {/* Dept */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {item.AssignToDept}
                    </td>

                    {/* Message */}
                    <td className="px-3 py-2 max-w-[150px] truncate">
                      {item.Message || '-'}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${item.EskalasiStatus?.toLowerCase() === 'close'
                          ? 'bg-red-100 text-red-700'
                          : item.EskalasiStatus?.toLowerCase() ===
                            'on progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : item.EskalasiStatus?.toLowerCase() === 'open'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {item.EskalasiStatus || 'Open'}
                      </span>
                    </td>

                    {/* Eskalasi */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                        Eskalasi
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showDialog && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Update Eskalasi</h3>

            <div className="space-y-3">
              <textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={3}
                className="w-full rounded-lg border p-2 text-sm"
                placeholder="Message..."
              />

              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full rounded-lg border p-2 text-sm"
              >
                <option value="open">Open</option>
                <option value="on progress">On Progress</option>
                <option value="close">Close</option>
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDialog(false)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
