"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import albeaLogo from "@/public/albea-white.png"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { ChevronDownIcon, Loader2, Timer } from "lucide-react"
import { getMqttClient } from "@/lib/mqtt"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type LiveStatus = "GREEN" | "YELLOW" | "RED" | "ORANGE" | "PURPLE" | "BLUE" | "WHITE" | "GREY"

interface LiveMachine {
  MchID?: string
  status?: LiveStatus
  timestamp?: string
  uap?: string
}

interface LiveBuilding {
  id?: string | number
  name?: string
  machines?: LiveMachine[]
}

interface HourlyTrend {
  HourStart: string
  StatusLight: string
  MachineCount: number
  TotalDurationMinutes: number
  TotalDurationHour?: number
  DurationHourPerMachine?: number
}

interface HourlyTrendDetail {
  MchID: string
  MchDesc: string
  StatusLight: string
  HourStart: string
  DurationMinutes: number
  DurationHour: number
}

interface HourlyTrendDetailResponse {
  rows?: HourlyTrendDetail[]
  total?: number
  page?: number
  page_size?: number
}

interface TrendkUniqueLatestSummaryResponse {
  counts?: Record<string, number | string>
  total?: number | string
}

interface TrendkUniqueLatestDetailRow {
  MchID: string
  MchDesc: string
  StatusLight: string
  HourStart: string
}

interface TrendkUniqueLatestDetailResponse {
  rows?: TrendkUniqueLatestDetailRow[]
  total?: number
  page?: number
  page_size?: number
}

type StatusChartKey = "green" | "yellow" | "red" | "orange" | "purple" | "blue" | "white" | "grey"

type HourlyChartRow = {
  hour: number
  hour_label: string
} & Record<StatusChartKey, number>

const statusSeries: Array<{ key: StatusChartKey; label: string; color: string }> = [
  { key: "green", label: "GREEN", color: "#22c55e" },
  { key: "yellow", label: "YELLOW", color: "#eab308" },
  { key: "red", label: "RED", color: "#ef4444" },
  { key: "orange", label: "ORANGE", color: "#f97316" },
  { key: "purple", label: "PURPLE", color: "#a855f7" },
  { key: "blue", label: "BLUE", color: "#3b82f6" },
  { key: "white", label: "WHITE", color: "#d1d5db" },
  { key: "grey", label: "GREY", color: "#6b7280" },
]
const stateDefinitions: Array<{ key: StatusChartKey; title: string; color: string; darkText?: boolean }> = [
  { key: "orange", title: "Breakdown", color: "#f97316" },
  { key: "green", title: "Running", color: "#16a34a" },
  { key: "white", title: "Planned Stop", color: "#e5e7eb", darkText: true },
  { key: "purple", title: "Org Dysfunction", color: "#9333ea" },
  { key: "blue", title: "SMED", color: "#3b82f6" },
  { key: "yellow", title: "Micro Stop", color: "#facc15", darkText: true },
  { key: "red", title: "Non Quality", color: "#ef4444" },
  { key: "grey", title: "Unclassified", color: "#6b7280" },
]
  const statusToChartKey: Record<string, StatusChartKey> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  ORANGE: "orange",
  PURPLE: "purple",
  BLUE: "blue",
  WHITE: "white",
  GREY: "grey",
}

const EXCLUDED_MCHIDS_LOCAL: string[] = [
  // contoh: "BR200012"
]
const normalizeMchId = (value: string | undefined | null) =>
  String(value || "").trim().toUpperCase()

const chartConfig: ChartConfig = {
  green: { label: "Green", color: "var(--color-desktop)" },
  yellow: { label: "Yellow", color: "var(--color-desktop)" },
  red: { label: "Red", color: "var(--color-desktop)" },
  orange: { label: "Breakdown", color: "var(--color-desktop)" },
  purple: { label: "Purple", color: "var(--color-desktop)" },
  blue: { label: "Blue", color: "var(--color-desktop)" },
  white: { label: "White", color: "var(--color-desktop)" },
  grey: { label: "Grey", color: "var(--color-desktop)" },
}

export default function AndonTrendkDashboard() {
  const AUTO_REFRESH_MS = 300000
  const REQUEST_TIMEOUT_MS = 180000
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })
  const [uap, setUap] = useState("ALL")
  const [hourlyAndon, setHourlyAndon] = useState<HourlyTrend[]>([])
  const [hourlyDetail, setHourlyDetail] = useState<HourlyTrendDetail[]>([])
  const [selectedPrimaryState, setSelectedPrimaryState] = useState<string>("ORANGE")
  const [selectedChartStatuses, setSelectedChartStatuses] = useState<StatusChartKey[]>(
    [statusToChartKey["ORANGE"]]
  )
  const [chartMetric, setChartMetric] = useState<"count" | "duration">("count")
  const [isLoading, setIsLoading] = useState(false)
  const [isChartFetching, setIsChartFetching] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailPage, setDetailPage] = useState(1)
  const [detailPageSize] = useState(100)
  const [detailTotalRows, setDetailTotalRows] = useState(0)
  const [selectedCompositionStatus, setSelectedCompositionStatus] = useState<"ALL" | LiveStatus>("ALL")
  const [compositionDetailRows, setCompositionDetailRows] = useState<TrendkUniqueLatestDetailRow[]>([])
  const [compositionDetailPage, setCompositionDetailPage] = useState(1)
  const [compositionDetailPageSize] = useState(50)
  const [compositionDetailTotalRows, setCompositionDetailTotalRows] = useState(0)
  const [isCompositionDetailLoading, setIsCompositionDetailLoading] = useState(false)
  const [uniqueLatestCounts, setUniqueLatestCounts] = useState<Record<StatusChartKey, number>>({
    green: 0,
    yellow: 0,
    red: 0,
    orange: 0,
    purple: 0,
    blue: 0,
    white: 0,
    grey: 0,
  })
  const [isUniqueRangeLoading, setIsUniqueRangeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false)
  const [loadingSeconds, setLoadingSeconds] = useState(0)
  const [refreshTick, setRefreshTick] = useState(0)
  const [liveBuildings, setLiveBuildings] = useState<LiveBuilding[]>([])
  const [selectedMonthPreset, setSelectedMonthPreset] = useState<string | undefined>(undefined)
  const excludedMchIdSet = useMemo(() => {
    const envRaw = process.env.NEXT_PUBLIC_TRENDK_EXCLUDED_MCHIDS || ""
    const envList = envRaw.split(",").map(normalizeMchId).filter(Boolean)
    const localList = EXCLUDED_MCHIDS_LOCAL.map(normalizeMchId).filter(Boolean)
    return new Set([...envList, ...localList])
  }, [])
  const excludedMchIdsCsv = useMemo(
    () => Array.from(excludedMchIdSet).join(","),
    [excludedMchIdSet]
  )
  const formatValue = (value: number, maxFractionDigits = 0) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
    })
      .format(Number(value || 0))
      .replace(/\u202f/g, " ")
  }

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const startOfDay = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const endOfDay = (date: Date) => {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
  }

  const setQuickRange = (mode: "today" | "7d" | "30d" | "month") => {
    setSelectedMonthPreset(undefined)
    const now = new Date()
    if (mode === "today") {
      setSelectedDateRange({
        from: startOfDay(now),
        to: endOfDay(now),
      })
      return
    }
    if (mode === "7d") {
      const from = new Date(now)
      from.setDate(from.getDate() - 6)
      setSelectedDateRange({
        from: startOfDay(from),
        to: endOfDay(now),
      })
      return
    }
    if (mode === "30d") {
      const from = new Date(now)
      from.setDate(from.getDate() - 29)
      setSelectedDateRange({
        from: startOfDay(from),
        to: endOfDay(now),
      })
      return
    }
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    setSelectedDateRange({
      from: startOfDay(monthStart),
      to: endOfDay(now),
    })
  }
  const monthPresetOptions = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const maxMonth = now.getMonth()
    const formatter = new Intl.DateTimeFormat("id-ID", { month: "long" })
    return Array.from({ length: maxMonth + 1 }, (_, idx) => ({
      value: String(idx),
      label: formatter.format(new Date(year, idx, 1)),
      month: idx,
      year,
    }))
  }, [])
  const setMonthInCurrentYear = (month: number) => {
    const now = new Date()
    const year = now.getFullYear()
    const from = new Date(year, month, 1)
    const isCurrentMonth = month === now.getMonth()
    const to = isCurrentMonth ? now : new Date(year, month + 1, 0)
    setSelectedDateRange({
      from: startOfDay(from),
      to: endOfDay(to),
    })
  }

  const todayKey = formatDateLocal(new Date())
  const rangeFrom = selectedDateRange?.from ?? new Date()
  const rangeTo = selectedDateRange?.to ?? selectedDateRange?.from ?? new Date()
  const selectedDateKey = formatDateLocal(rangeFrom)
  const selectedDateToKey = formatDateLocal(rangeTo)
  const queryKey = `${selectedDateKey}|${selectedDateToKey}|${uap}|${selectedPrimaryState}|${excludedMchIdsCsv}`
  const [chartReadyKey, setChartReadyKey] = useState<string>("")
  const isSingleDateRange = selectedDateKey === selectedDateToKey
  const selectedDayCount = useMemo(() => {
    const from = new Date(rangeFrom)
    from.setHours(0, 0, 0, 0)
    const to = new Date(rangeTo)
    to.setHours(0, 0, 0, 0)
    const diffMs = Math.abs(to.getTime() - from.getTime())
    return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1
  }, [rangeFrom, rangeTo])
  const maxVisibleHour = useMemo(() => {
    if (!isSingleDateRange) return 23
    if (selectedDateKey < todayKey) return 23
    if (selectedDateKey > todayKey) return -1
    return new Date().getHours()
  }, [isSingleDateRange, selectedDateKey, todayKey])
  const loadingLabel = useMemo(() => {
    if (isLoading && hourlyAndon.length === 0) return "Memuat grafik trend..."
    return null
  }, [isLoading, hourlyAndon.length])

  useEffect(() => {
    if (!loadingLabel) {
      setLoadingSeconds(0)
      return
    }

    const startAt = Date.now()
    setLoadingSeconds(0)
    const interval = setInterval(() => {
      setLoadingSeconds((Date.now() - startAt) / 1000)
    }, 100)

    return () => clearInterval(interval)
  }, [loadingLabel])

  const parseHourStart = (value: string) => {
    const raw = String(value ?? "")
    const normalized = raw.replace("T", " ").replace("Z", "")
    const dateKey = normalized.slice(0, 10)
    const hourRaw = normalized.slice(11, 13)
    const hour = Number(hourRaw)

    if (dateKey.length === 10 && !Number.isNaN(hour) && hour >= 0 && hour <= 23) {
      return { dateKey, hour }
    }

    const dt = new Date(raw)
    return {
      dateKey: formatDateLocal(dt),
      hour: dt.getHours(),
    }
  }

  useEffect(() => {
    setError(null)
    setHourlyDetail([])
    setIsTimeoutModalOpen(false)
    setDetailPage(1)
    setDetailTotalRows(0)
    setSelectedCompositionStatus("ALL")
    setCompositionDetailRows([])
    setCompositionDetailPage(1)
    setCompositionDetailTotalRows(0)
  }, [rangeFrom, rangeTo, uap, isSingleDateRange, selectedDayCount, selectedPrimaryState])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        setRefreshTick((v) => v + 1)
      }
    }, AUTO_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchLiveSnapshot = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/andon/buildings/injection`)
        if (!res.ok) return
        const json = await res.json()
        const buildings = Array.isArray(json) ? json : null
        if (!buildings) return

        const normalized = (buildings as LiveBuilding[]).map((b) => ({
          ...b,
          machines: (b.machines || [])
            .filter((m) => !excludedMchIdSet.has(normalizeMchId(m.MchID)))
            .map((m) => {
              const status = String(m.status || "").toUpperCase() as LiveStatus
              return {
                ...m,
                status: statusToChartKey[status] ? status : undefined,
              }
            }),
        }))
        setLiveBuildings(normalized)
      } catch {
        // ignore transient live fetch error
      }
    }

    fetchLiveSnapshot()
  }, [refreshTick])

  useEffect(() => {
    const client = getMqttClient()
    client.subscribe("uns/andon")

    const onMessage = (_topic: string, message: any) => {
      try {
        const payload = JSON.parse(message.toString())
        const updates: Record<string, { status: LiveStatus; timestamp?: string }> = {}

        if (Array.isArray(payload)) {
          ;(payload as Array<any>).forEach((p) => {
            const machineId = String(p?.MchID || "")
            const status = String(p?.StatusLight || "").toUpperCase() as LiveStatus
            const timestamp = p?.timestamp ? String(p.timestamp) : undefined
            if (!machineId || !statusToChartKey[status] || excludedMchIdSet.has(normalizeMchId(machineId))) return
            updates[machineId] = { status, timestamp }
          })
        } else {
          const machineId = String(payload?.MchID || "")
          const status = String(payload?.StatusLight || "").toUpperCase() as LiveStatus
          const timestamp = payload?.timestamp ? String(payload.timestamp) : undefined
          if (!machineId || !statusToChartKey[status] || excludedMchIdSet.has(normalizeMchId(machineId))) return
          updates[machineId] = { status, timestamp }
        }

        if (Object.keys(updates).length === 0) return

        setLiveBuildings((prev) =>
          prev.map((building) => ({
            ...building,
            machines: (building.machines || []).map((machine) => {
              const machineId = String(machine.MchID || "")
              const upd = updates[machineId]
              if (!upd) return machine
              return { ...machine, status: upd.status, timestamp: upd.timestamp || machine.timestamp }
            }),
          }))
        )
      } catch {
        // ignore malformed mqtt payload
      }
    }

    client.on("message", onMessage)
    return () => {
      client.off("message", onMessage)
      client.unsubscribe("uns/andon")
    }
  }, [])

  useEffect(() => {
    if (hourlyAndon.length === 0) {
      setIsLoading(true)
    }

    const fetchHourlyAndon = async () => {
      const controller = new AbortController()
      setIsChartFetching(true)
      const requestTimeoutMs = REQUEST_TIMEOUT_MS
      const timer = setTimeout(() => controller.abort(), requestTimeoutMs)
      try {
        const dateFromKey = formatDateLocal(rangeFrom)
        const dateToKey = formatDateLocal(rangeTo)
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trendk/hourly-summary?date_from=${dateFromKey}&date_to=${dateToKey}&uap=${uap}&excluded_mchids=${encodeURIComponent(excludedMchIdsCsv)}`
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        setHourlyAndon(Array.isArray(data) ? data : [])
        setChartReadyKey(queryKey)
        setIsTimeoutModalOpen(false)
      } catch (err: any) {
        setHourlyAndon([])
        setChartReadyKey("")
        const isTimeout = err?.name === "AbortError"
        setError(
          isTimeout
            ? `Request timeout (${Math.round(requestTimeoutMs / 1000)}s). Coba date range lebih pendek.`
            : "Gagal memuat data hourly."
        )
        if (isTimeout) {
          setIsTimeoutModalOpen(true)
        }
      } finally {
        clearTimeout(timer)
        setIsChartFetching(false)
        setIsLoading(false)
      }
    }

    fetchHourlyAndon()
  }, [rangeFrom, rangeTo, uap, isSingleDateRange, selectedDayCount, refreshTick, excludedMchIdsCsv, excludedMchIdSet, queryKey, REQUEST_TIMEOUT_MS])

  useEffect(() => {
    const mapped = statusToChartKey[selectedPrimaryState] ?? statusToChartKey["ORANGE"]
    setSelectedChartStatuses([mapped])
  }, [selectedPrimaryState])

  const hourlyChartData = useMemo(() => {
    const statusKeyMap: Record<string, StatusChartKey> = {
      GREEN: "green",
      YELLOW: "yellow",
      RED: "red",
      ORANGE: "orange",
      PURPLE: "purple",
      BLUE: "blue",
      WHITE: "white",
      GREY: "grey",
    }

    const slots: HourlyChartRow[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      hour_label: `${String(hour).padStart(2, "0")}:00`,
      green: 0,
      yellow: 0,
      red: 0,
      orange: 0,
      purple: 0,
      blue: 0,
      white: 0,
      grey: 0,
    }))

    hourlyAndon.forEach((item) => {
      const parsed = parseHourStart(item.HourStart)
      const hour = parsed.hour
      if (hour < 0 || hour > 23) return
      if (hour > maxVisibleHour) return
      const key = statusKeyMap[item.StatusLight]
      if (!key) return
      const sourceValue =
        chartMetric === "count"
          ? Number(item.MachineCount || 0)
          : Number(
              item.DurationHourPerMachine ??
              item.TotalDurationHour ??
              (Number(item.TotalDurationMinutes || 0) / 60)
            )
      slots[hour][key] += sourceValue
    })

    const visibleSlots = slots.filter((slot) => slot.hour <= maxVisibleHour)
    if (isSingleDateRange) return visibleSlots

    return visibleSlots.map((slot) => {
      const averaged: HourlyChartRow = { ...slot }
      statusSeries.forEach(({ key }) => {
        const divider = Math.max(selectedDayCount, 1)
        const avgValue = averaged[key] / divider
        averaged[key] =
          chartMetric === "count"
            ? Math.round(avgValue)
            : Number(avgValue.toFixed(3))
      })
      return averaged
    })
  }, [hourlyAndon, maxVisibleHour, isSingleDateRange, selectedDayCount, chartMetric])

  const liveCounts = useMemo(() => {
    const counts: Record<StatusChartKey, number> = {
      green: 0,
      yellow: 0,
      red: 0,
      orange: 0,
      purple: 0,
      blue: 0,
      white: 0,
      grey: 0,
    }
    liveBuildings.forEach((building) => {
      ;(building.machines || []).forEach((machine) => {
        const key = statusToChartKey[String(machine.status || "").toUpperCase()]
        if (key) counts[key] += 1
      })
    })
    return counts
  }, [liveBuildings])

  const stateCards = useMemo(() => {
    return stateDefinitions.map((state) => ({
      ...state,
      value: liveCounts[state.key] || 0,
    }))
  }, [liveCounts])

  const liveTotal = useMemo(
    () =>
      liveBuildings.reduce(
        (acc, building) => acc + (building.machines?.length || 0),
        0
      ),
    [liveBuildings]
  )

  const totalHourBuckets = useMemo(() => {
    if (isSingleDateRange) return Math.max(maxVisibleHour + 1, 0)
    return Math.max(selectedDayCount * 24, 0)
  }, [isSingleDateRange, maxVisibleHour, selectedDayCount])

  const totalUniqueMachinesRange = useMemo(
    () => Object.values(uniqueLatestCounts).reduce((acc, val) => acc + Number(val || 0), 0),
    [uniqueLatestCounts]
  )
  const breakdownPercent = useMemo(() => {
    if (totalUniqueMachinesRange <= 0) return 0
    return (uniqueLatestCounts.orange / totalUniqueMachinesRange) * 100
  }, [uniqueLatestCounts.orange, totalUniqueMachinesRange])

  const pieStateRangeData = useMemo(
    () =>
      statusSeries
        .map((series) => ({
          key: series.key,
          name: series.label,
          color: series.color,
          value: uniqueLatestCounts[series.key] || 0,
        }))
        .filter((item) => item.value > 0),
    [uniqueLatestCounts]
  )

  useEffect(() => {
    const controller = new AbortController()

    const fetchUniqueMachineStateRange = async () => {
      setIsUniqueRangeLoading(true)
      try {
        const dateFromKey = formatDateLocal(rangeFrom)
        const dateToKey = formatDateLocal(rangeTo)
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trendk/unique-latest-summary?date_from=${dateFromKey}&date_to=${dateToKey}&uap=${uap}&excluded_mchids=${encodeURIComponent(excludedMchIdsCsv)}`
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = (await response.json()) as TrendkUniqueLatestSummaryResponse
        const rawCounts = data?.counts && typeof data.counts === "object" ? data.counts : {}
        const nextCounts: Record<StatusChartKey, number> = {
          green: 0,
          yellow: 0,
          red: 0,
          orange: 0,
          purple: 0,
          blue: 0,
          white: 0,
          grey: 0,
        }
        Object.entries(rawCounts).forEach(([statusRaw, valueRaw]) => {
          const mapped = statusToChartKey[String(statusRaw || "").toUpperCase()]
          if (!mapped) return
          const value = Number(valueRaw || 0)
          nextCounts[mapped] = Number.isFinite(value) ? value : 0
        })
        setUniqueLatestCounts(nextCounts)
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setUniqueLatestCounts({
            green: 0,
            yellow: 0,
            red: 0,
            orange: 0,
            purple: 0,
            blue: 0,
            white: 0,
            grey: 0,
          })
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsUniqueRangeLoading(false)
        }
      }
    }

    fetchUniqueMachineStateRange()
    return () => {
      controller.abort()
    }
  }, [rangeFrom, rangeTo, uap, refreshTick, excludedMchIdsCsv])

  useEffect(() => {
    const controller = new AbortController()

    const fetchCompositionDetail = async () => {
      setIsCompositionDetailLoading(true)
      try {
        const dateFromKey = formatDateLocal(rangeFrom)
        const dateToKey = formatDateLocal(rangeTo)
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trendk/unique-latest-detail?date_from=${dateFromKey}&date_to=${dateToKey}&uap=${uap}&status_light=${selectedCompositionStatus}&page=${compositionDetailPage}&page_size=${compositionDetailPageSize}&excluded_mchids=${encodeURIComponent(excludedMchIdsCsv)}`
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = (await response.json()) as TrendkUniqueLatestDetailResponse
        setCompositionDetailRows(Array.isArray(data?.rows) ? data.rows : [])
        setCompositionDetailTotalRows(Number(data?.total || 0))
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setCompositionDetailRows([])
          setCompositionDetailTotalRows(0)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCompositionDetailLoading(false)
        }
      }
    }

    fetchCompositionDetail()
    return () => controller.abort()
  }, [rangeFrom, rangeTo, uap, selectedCompositionStatus, compositionDetailPage, compositionDetailPageSize, excludedMchIdsCsv, refreshTick])

  useEffect(() => {
    if (isChartFetching) {
      return
    }
    if (chartReadyKey !== queryKey) {
      return
    }

    const fetchDetail = async () => {
      setIsDetailLoading(true)
      try {
        const dateFromKey = formatDateLocal(rangeFrom)
        const dateToKey = formatDateLocal(rangeTo)
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trendk/hourly-detail?date_from=${dateFromKey}&date_to=${dateToKey}&uap=${uap}&status_light=${selectedPrimaryState}&page=${detailPage}&page_size=${detailPageSize}&excluded_mchids=${encodeURIComponent(excludedMchIdsCsv)}`
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = (await response.json()) as HourlyTrendDetailResponse
        const rows = Array.isArray(data?.rows) ? data.rows : []
        const totalRows = Number(data?.total || 0)
        setHourlyDetail(rows)
        setDetailTotalRows(totalRows)
      } catch {
        setHourlyDetail([])
        setDetailTotalRows(0)
      } finally {
        setIsDetailLoading(false)
      }
    }
    fetchDetail()
  }, [rangeFrom, rangeTo, uap, selectedPrimaryState, isLoading, hourlyAndon.length, excludedMchIdsCsv, isChartFetching, chartReadyKey, queryKey, detailPage, detailPageSize])

  const detailTotalPages = Math.max(1, Math.ceil(detailTotalRows / detailPageSize))
  const compositionDetailTotalPages = Math.max(1, Math.ceil(compositionDetailTotalRows / compositionDetailPageSize))
  const activeLineKey = selectedChartStatuses[0] ?? statusToChartKey["ORANGE"]

  return (
    <div className="w-full">
      <div className="mb-3 grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-2">
          <Image
            src={albeaLogo}
            alt="Albea"
            width={168}
            height={84}
            className="px-2 py-1.5 flex items-center border border-gray-250 rounded-lg text-gray-700 align-middle bg-white"
          />
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-center leading-tight">ANDON TRENDK DASHBOARD</h1>
            <p className="text-xs text-center text-muted-foreground">Hourly Only</p>
          </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5 rounded-xl border border-gray-200 bg-gray-50/80 p-1 shadow-sm">
          <Popover>
            <PopoverTrigger className="flex h-9 items-center text-nowrap gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 shadow-sm">
              <span className="text-xs">
                {selectedDateRange?.from
                  ? `${selectedDateRange.from.toLocaleDateString()} - ${(selectedDateRange.to ?? selectedDateRange.from).toLocaleDateString()}`
                  : "Select date range"}
              </span>
              <ChevronDownIcon className="w-4 h-4" />
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="range"
                selected={selectedDateRange}
                defaultMonth={selectedDateRange?.from ?? new Date()}
                onSelect={(range) => {
                  if (range?.from) {
                    setSelectedMonthPreset(undefined)
                    setSelectedDateRange({
                      from: range.from,
                      to: range.to ?? range.from,
                    })
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              className="h-7 rounded-md px-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setQuickRange("today")}
            >
              Today
            </button>
            <button
              type="button"
              className="h-7 rounded-md px-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setQuickRange("7d")}
            >
              7D
            </button>
            <button
              type="button"
              className="h-7 rounded-md px-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setQuickRange("30d")}
            >
              30D
            </button>
            <button
              type="button"
              className="h-7 rounded-md px-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setQuickRange("month")}
            >
              Month
            </button>
          </div>
          <Select
            value={selectedMonthPreset}
            onValueChange={(value) => {
              setSelectedMonthPreset(value)
              setMonthInCurrentYear(Number(value))
            }}
          >
            <SelectTrigger className="h-9 min-w-[150px] rounded-lg border-gray-200 bg-white shadow-sm text-xs">
              <SelectValue placeholder={`Pilih bulan (${new Date().getFullYear()})`} />
            </SelectTrigger>
            <SelectContent>
              {monthPresetOptions.map((opt) => (
                <SelectItem key={`month-preset-${opt.value}`} value={opt.value}>
                  {`${opt.label} ${opt.year}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPrimaryState} onValueChange={(value) => setSelectedPrimaryState(value)}>
            <SelectTrigger className="h-9 min-w-[100px] rounded-lg border-gray-200 bg-white shadow-sm text-xs">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GREEN">GREEN</SelectItem>
              <SelectItem value="YELLOW">YELLOW</SelectItem>
              <SelectItem value="RED">RED</SelectItem>
              <SelectItem value="ORANGE">ORANGE</SelectItem>
              <SelectItem value="PURPLE">PURPLE</SelectItem>
              <SelectItem value="BLUE">BLUE</SelectItem>
              <SelectItem value="WHITE">WHITE</SelectItem>
              <SelectItem value="GREY">GREY</SelectItem>
            </SelectContent>
          </Select>
          <Select value={uap} onValueChange={(value) => setUap(value)}>
            <SelectTrigger className="h-9 min-w-[100px] rounded-lg border-gray-200 bg-white shadow-sm text-xs">
              <SelectValue placeholder="Select UAP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ALL</SelectItem>
              <SelectItem value="BASIC">BASIC</SelectItem>
              <SelectItem value="PREMIUM">PREMIUM</SelectItem>
              <SelectItem value="LEAN">LEAN</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors ${
                chartMetric === "count"
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setChartMetric("count")}
            >
              Avg Mesin
            </button>
            <button
              type="button"
              className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors ${
                chartMetric === "duration"
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setChartMetric("duration")}
            >
              Duration Hours
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-10 gap-1.5">
              <div className="rounded-lg px-2.5 py-1.5 shadow-sm border border-black/5 text-center bg-slate-800">
                <p className="text-xs text-white">LIVE TOTAL</p>
                <p className="text-3xl leading-none font-bold mt-1 text-white">{formatValue(liveTotal)}</p>
              </div>
              <div className="rounded-lg px-2.5 py-1.5 shadow-sm border border-black/5 text-center bg-rose-700">
                <p className="text-xs text-white">BREAKDOWN RANGE</p>
                <p className="text-3xl leading-none font-bold mt-1 text-white">
                  {`${formatValue(breakdownPercent, 1)}%`}
                </p>
                <p className="text-[10px] text-white/85 mt-1">
                  {isUniqueRangeLoading
                    ? "Menghitung unique mesin..."
                    : `ORANGE ${formatValue(uniqueLatestCounts.orange)} / TOTAL ${formatValue(totalUniqueMachinesRange)} mesin`}
                </p>
              </div>
              {stateCards.map((card) => (
                <div
                  key={`state-card-${card.key}`}
                  className="rounded-lg px-2.5 py-1.5 shadow-sm border border-black/5 text-center"
                  style={{ backgroundColor: card.color }}
                >
                  <p className={`text-xs ${card.darkText ? "text-black" : "text-white"}`}>{card.title}</p>
                  <p className={`text-3xl leading-none font-bold mt-1 ${card.darkText ? "text-black" : "text-white"}`}>
                    {formatValue(card.value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <CardTitle className="text-sm">KOMPOSISI STATE RANGE</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Persentase state berdasarkan jumlah mesin unik (status terakhir mesin pada range aktif).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieStateRangeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={92}
                    innerRadius={44}
                    paddingAngle={1}
                    onClick={(entry: any) => {
                      const picked = String(entry?.payload?.name || entry?.name || "").toUpperCase()
                      if (!picked || !(picked in statusToChartKey)) return
                      setSelectedCompositionStatus(picked as LiveStatus)
                      setCompositionDetailPage(1)
                    }}
                  >
                    {pieStateRangeData.map((entry) => (
                      <Cell key={`pie-${entry.key}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number | string, name: string) => {
                      const numeric = Number(value || 0)
                      const pct = totalUniqueMachinesRange > 0 ? (numeric / totalUniqueMachinesRange) * 100 : 0
                      return [`${formatValue(numeric)} mesin (${formatValue(pct, 1)}%)`, String(name)]
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  selectedCompositionStatus === "ALL"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => {
                  setSelectedCompositionStatus("ALL")
                  setCompositionDetailPage(1)
                }}
              >
                ALL
              </button>
              {pieStateRangeData.map((entry) => {
                const pct = totalUniqueMachinesRange > 0 ? (entry.value / totalUniqueMachinesRange) * 100 : 0
                const isActive = selectedCompositionStatus === entry.name
                return (
                  <button
                    type="button"
                    key={`legend-${entry.key}`}
                    className={`flex items-center gap-1.5 text-xs rounded border px-2 py-1 transition-colors ${
                      isActive
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedCompositionStatus(entry.name as LiveStatus)
                      setCompositionDetailPage(1)
                    }}
                  >
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className={isActive ? "text-white" : "text-muted-foreground"}>{`${entry.name}: ${formatValue(pct, 1)}%`}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <CardTitle className="text-sm">DETAIL MESIN UNIK (KOMPOSISI RANGE)</CardTitle>
            <CardDescription className="text-xs">
              {`${selectedDateKey} s/d ${selectedDateToKey} | Status: ${selectedCompositionStatus}`}
            </CardDescription>
            <CardDescription className="text-xs text-muted-foreground">
              {`Rows: ${formatValue(compositionDetailTotalRows)} | Page ${compositionDetailPage}/${compositionDetailTotalPages}`}
            </CardDescription>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                className="px-2 py-1 text-xs rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCompositionDetailPage((prev) => Math.max(1, prev - 1))}
                disabled={isCompositionDetailLoading || compositionDetailPage <= 1}
              >
                Prev
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCompositionDetailPage((prev) => Math.min(compositionDetailTotalPages, prev + 1))}
                disabled={isCompositionDetailLoading || compositionDetailPage >= compositionDetailTotalPages}
              >
                Next
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-2.5">
            <div className="max-h-[280px] overflow-auto">
              <Table className="table-fixed min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[160px]">Machine ID</TableHead>
                    <TableHead className="text-xs">MchDesc</TableHead>
                    <TableHead className="text-xs w-[120px]">Latest Status</TableHead>
                    <TableHead className="text-xs w-[180px]">Latest HourStart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isCompositionDetailLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <TableRow key={`composition-skeleton-${idx}`}>
                        <TableCell className="text-xs"><div className="h-3 w-24 rounded bg-gray-200 animate-pulse" /></TableCell>
                        <TableCell className="text-xs"><div className="h-3 w-40 rounded bg-gray-200 animate-pulse" /></TableCell>
                        <TableCell className="text-xs"><div className="h-3 w-16 rounded bg-gray-200 animate-pulse" /></TableCell>
                        <TableCell className="text-xs"><div className="h-3 w-32 rounded bg-gray-200 animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : compositionDetailRows.length > 0 ? (
                    compositionDetailRows.map((row) => (
                      <TableRow key={`composition-${row.MchID}`}>
                        <TableCell className="text-xs">{row.MchID}</TableCell>
                        <TableCell className="text-xs">{row.MchDesc}</TableCell>
                        <TableCell className="text-xs">{row.StatusLight}</TableCell>
                        <TableCell className="text-xs">{String(row.HourStart).replace("T", " ").replace("Z", "").slice(0, 19)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground text-xs">
                        Tidak ada data mesin unik untuk filter komposisi ini
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <CardTitle className="text-sm">HOURLY STATUS TREND</CardTitle>
            <CardDescription className="text-xs">
              {isSingleDateRange
                ? `Trend ${selectedPrimaryState} per jam dalam 1 hari (${chartMetric === "count" ? "jumlah mesin" : "duration hours"}).`
                : `Trend rata-rata ${selectedPrimaryState} per jam untuk ${selectedDayCount} hari terpilih (${chartMetric === "count" ? "jumlah mesin" : "duration hours"}).`}
            </CardDescription>
            <CardDescription className="text-xs text-muted-foreground">
              Auto refresh {Math.round(AUTO_REFRESH_MS / 1000)} detik
            </CardDescription>
            <CardDescription className="text-xs text-muted-foreground">
              {`Range aktif: ${selectedDateKey} s/d ${selectedDateToKey} (${selectedDayCount} hari, ${totalHourBuckets} jam bucket).`}
            </CardDescription>
            <CardDescription className="text-xs text-muted-foreground">
              Persentase Breakdown = mesin unik status ORANGE dibagi total mesin unik pada range aktif.
            </CardDescription>
            {isChartFetching && hourlyAndon.length === 0 && (
              <CardDescription className="text-xs">Memuat grafik dulu...</CardDescription>
            )}
            {!isChartFetching && isDetailLoading && (
              <CardDescription className="text-xs">Grafik siap, memuat detail...</CardDescription>
            )}
            {isLoading && hourlyAndon.length === 0 && <CardDescription className="text-xs">Loading hourly data...</CardDescription>}
            {error && <CardDescription className="text-xs text-red-500">{error}</CardDescription>}
            {!isLoading && !error && hourlyAndon.length === 0 && (
              <CardDescription className="text-xs">No hourly data for selected date range/UAP.</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart
                accessibilityLayer
                data={hourlyChartData}
                margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="hour_label"
                  interval={0}
                  minTickGap={8}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    value
                  }
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  allowDecimals={chartMetric !== "count"}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dashed" />}
                  formatter={(value, name) => {
                    const n = Number(value ?? 0)
                    const seriesKey = String(name) as keyof typeof chartConfig
                    const seriesName =
                      seriesKey === "orange"
                        ? "Breakdown"
                        : chartConfig[seriesKey]?.label ?? String(name)
                    if (chartMetric === "count") return [formatValue(Math.round(n)), seriesName]
                    return [formatValue(n, 3), seriesName]
                  }}
                  labelFormatter={(value) =>
                    `${selectedDateKey} s/d ${selectedDateToKey} ${value}`
                  }
                />
                {statusSeries
                  .filter((series) => selectedChartStatuses.includes(series.key))
                  .map((series) => (
                    <Bar
                      key={`bar-${series.key}`}
                      dataKey={series.key}
                      fill={series.color}
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                  ))}
                <Line
                  type="monotone"
                  dataKey={activeLineKey}
                  stroke="#111827"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  legendType="none"
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartContainer>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-gray-500" />
                <span>Sumbu X: Jam (00:00 - 23:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-slate-800" />
                <span>
                  {chartMetric === "count" ? "Sumbu Y: Avg Mesin" : "Sumbu Y: Duration (hour)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
                <span>Orange: Breakdown</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {false && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">FILTER</CardTitle>
              <CardDescription className="text-xs">
                Gabungan filter untuk grafik dan detail. Detail mesin aktif saat single date.
              </CardDescription>
              {isDetailLoading && (
                <CardDescription className="text-xs">Loading detail jam terpilih...</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-xs text-muted-foreground">
                Metrik aktif: {chartMetric === "count" ? "Avg Mesin" : "Duration Hours"} (kontrol di kanan atas).
              </p>
              <p className="text-xs text-muted-foreground">State grafik aktif: {selectedPrimaryState}</p>
              <p className="text-xs text-muted-foreground">
                Detail tabel otomatis untuk seluruh jam pada rentang tanggal terpilih (filter warna mengikuti pilihan kanan atas).
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-1.5">
            <CardTitle className="text-sm">
              DETAIL PER MESIN (24 JAM)
            </CardTitle>
            <CardDescription className="text-xs">
              {`${selectedDateKey} s/d ${selectedDateToKey} | Status: ${selectedPrimaryState}`}
            </CardDescription>
            <CardDescription className="text-xs text-muted-foreground">
              {`Rows: ${formatValue(detailTotalRows)} | Page ${detailPage}/${detailTotalPages}`}
            </CardDescription>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                className="px-2 py-1 text-xs rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setDetailPage((prev) => Math.max(1, prev - 1))}
                disabled={isDetailLoading || detailPage <= 1}
              >
                Prev
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setDetailPage((prev) => Math.min(detailTotalPages, prev + 1))}
                disabled={isDetailLoading || detailPage >= detailTotalPages}
              >
                Next
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-2.5">
            <div className="max-h-[300px] overflow-auto">
              <Table className="table-fixed min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[140px]">Machine ID</TableHead>
                    <TableHead className="text-xs w-[320px]">MchDesc</TableHead>
                    <TableHead className="text-xs w-[100px]">Status</TableHead>
                    <TableHead className="text-xs w-[180px]">HourStart</TableHead>
                    <TableHead className="text-xs text-right">Duration (min)</TableHead>
                    <TableHead className="text-xs text-right">Duration (hour)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isDetailLoading ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                      <TableRow key={`detail-skeleton-${idx}`}>
                        <TableCell className="text-xs">
                          <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="h-3 w-40 rounded bg-gray-200 animate-pulse" />
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="h-3 w-36 rounded bg-gray-200 animate-pulse" />
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <div className="h-3 w-16 ml-auto rounded bg-gray-200 animate-pulse" />
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <div className="h-3 w-16 ml-auto rounded bg-gray-200 animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : hourlyDetail.length > 0 ? (
                    hourlyDetail.map((row) => (
                      <TableRow key={`${row.MchID}-${row.StatusLight}-${row.HourStart}`}>
                        <TableCell className="text-xs">{row.MchID}</TableCell>
                        <TableCell className="text-xs">{row.MchDesc}</TableCell>
                        <TableCell className="text-xs">{row.StatusLight}</TableCell>
                        <TableCell className="text-xs">{String(row.HourStart).replace("T", " ").replace("Z", "").slice(0, 19)}</TableCell>
                        <TableCell className="text-xs text-right">
                          {Number(row.DurationMinutes).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {Number(row.DurationHour).toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground text-xs">
                        Tidak ada data detail untuk filter saat ini
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {`Menampilkan ${hourlyDetail.length} baris per halaman (${detailPageSize} max).`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setDetailPage((prev) => Math.max(1, prev - 1))}
                  disabled={isDetailLoading || detailPage <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setDetailPage((prev) => Math.min(detailTotalPages, prev + 1))}
                  disabled={isDetailLoading || detailPage >= detailTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loadingLabel && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
          <div className="w-[320px] rounded-xl border border-gray-200 bg-white shadow-xl p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-black" />
              <p className="text-sm font-medium text-gray-900">{loadingLabel}</p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
              <Timer className="h-4 w-4" />
              <span>{loadingSeconds.toFixed(1)} detik</span>
            </div>
          </div>
        </div>
      )}

      {isTimeoutModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white shadow-2xl p-5">
            <h3 className="text-base font-semibold text-gray-900">Request Timeout</h3>
            <p className="mt-2 text-sm text-gray-700">
              Data hourly belum berhasil dimuat dalam {Math.round(REQUEST_TIMEOUT_MS / 1000)} detik.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Coba klik ulang, atau kecilkan date range dan filter UAP agar query lebih ringan.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsTimeoutModalOpen(false)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-md bg-black text-white hover:bg-black/90"
                onClick={() => {
                  setIsTimeoutModalOpen(false)
                  setRefreshTick((v) => v + 1)
                }}
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
