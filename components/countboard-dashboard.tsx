'use client'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import albeaLogo from '@/public/albea-white.png'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

import Image from 'next/image'
import {
  CalendarIcon,
  FilePlus2,
  Pencil,
  User,
  ChevronDown,
  RefreshCw,
  SprayCan,
  Eye,
  EyeOff,
  Minimize,
  Maximize,
  Flag,
  Timer,
  ArrowLeftRight,
  CircleDot,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { SearchablePOSelect } from './searchable-select-po'
import useSWR, { mutate } from 'swr'
import ErrorState from './ui/error-state'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns/format'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '@/lib/utils'
import { Switch } from './ui/switch'
import ChangeState from './change-state'
import { GearIcon } from '@radix-ui/react-icons'
import { Badge } from './ui/badge'
import Link from 'next/link'

type MachineDetail = {
  machineId: number
  machineName: string
  machineTonage: string
  machineDescription: string
  machineNumber: string
  locationId: number
  locationName: string
  machineStatus: string
  Process?: string
}

type HourlyData = {
  hourlyId: number
  from_datetime: Date
  time: string
  itemNo: string
  itemDesc: string
  target: number
  target_final: number
  target_tolerance: number
  actual: number
  scrap: number
  rework: number
  causes: string
  comments: string
  problem: string
  action: string
}

type OoeData = {
  targetYearly: number
  targetTolerance: number
  timea: number
  pmidle: number
  timeb: number
  breakdown: number
  timee: number
  ooe: number
  oee: number
  breakdownperc: number
  green: number
  red: number
  yellow: number
  white: number
  blue: number
  orange: number
  purple: number
  grey: number
}

type TaskData = {
  id: number
  po_name: string
  machine_name: string
  required_qty: number
  produced_qty: number
  cvt: number
  ct: number
  actual_cvt: number
  actual_ct: number
  target_cvt: number
  target_ct: number
  shift_target_qty: number
  created_at: string
  updated_at: string
}

type NooeData = {
  fromTime: Date
  blue: 1 | null
  orange: 1 | null
  purple: 1 | null
  grey: 1 | null
  yellow: 1 | null
  white: 1 | null
  red: 1 | null
}

type StateData = {
  ID: string
  AdjustedStatusDate: string
  Color: string
}

type PoNumber = {
  poNumber: string
  poId: number
  materialId: number
  materialName: string
}

type ProblemGroup = {
  id: number
  name: string
}

type Problem = {
  id: string
  name: string
  problem_group_id: string
  color: string
  process: string
}

type Todo = {
  id: number
  name: string
  problem_id: number
  pic?: string
  is_escalated?: boolean
}

type ZhafirStdActValue = {
  std: number | string | null
  act: number | string | null
}

type ZhafirStdActResponse = {
  values?: Record<string, ZhafirStdActValue>
  ranges?: Record<
    string,
    { min: number | string | null; max: number | string | null }
  >
}

type ZhafirActualViewResponse = {
  values?: Record<string, number | string | null>
}
type ZhafirSnapshotResponse = {
  stdAct?: ZhafirStdActResponse | null
  actualView?: ZhafirActualViewResponse | null
  indicators?: Record<
    string,
    {
      std: number | null
      act: number | null
      min: number | null
      max: number | null
      status: 'in_range' | 'too_low' | 'too_high' | 'unknown'
    }
  >
}

type ZhafirActualViewWindowHour = {
  hourStart?: string | null
  hourLabel?: string | null
  actualDate?: string | null
  hasData?: boolean
  std?: number | string | null
  min?: number | string | null
  max?: number | string | null
  ranges?: Record<
    string,
    { min: number | string | null; max: number | string | null }
  > | null
  values?: Record<string, number | string | null> | null
}

type ZhafirActualViewWindowResponse = {
  machineId?: string
  endAt?: string
  hoursBack?: number
  ranges?: Record<
    string,
    { min: number | string | null; max: number | string | null }
  >
  hours?: ZhafirActualViewWindowHour[]
}

type ZhafirActiveMaterialResponse = {
  machineId: string
  materialId: string | null
  found: boolean
}

type ZhafirIndicatorStatus = {
  status: 'in_range' | 'too_low' | 'too_high' | 'unknown'
  std: number | null
  act: number | null
  min: number | null
  max: number | null
}

const OTHER_PROBLEM_VALUE = '__other_problem__'
const OTHER_SOLUTION_VALUE = '__other_solution__'

const refreshRateList = ['5000', '15000', '30000', '60000']

const shiftList = ['1', '2', '3']
const ZHAFIR_UI_G_MACHINE_ALLOWLIST = new Set([
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
])
const ZHAFIR_INDICATORS = [
  {
    field: 'InjectScrewPosition',
    label: 'Inj Start Position',
    icon: '/admin/End of plastification (dosing).png',
  },
  {
    field: 'VPPositionText',
    label: 'V/P Position',
    icon: '/admin/Switching position.png',
  },
  {
    field: 'InjPeakPressure',
    label: 'Inj Peak Press',
    icon: '/admin/inj-press.png',
  },
  { field: 'Thickness', label: 'CUSHION', icon: '/admin/Cushion.png' },
  {
    field: 'VPTimeText',
    label: 'V/P Time',
    icon: '/admin/Injection time.png',
  },
] as const

type ZhafirIndicatorField = (typeof ZHAFIR_INDICATORS)[number]['field']
type ZhafirIndicatorMap = Record<ZhafirIndicatorField, ZhafirIndicatorStatus>
type ZhafirTrendPoint = {
  hourLabel: string
  actualDate: string | null
  std: number | null
  value: number | null
  min: number | null
  max: number | null
  status: 'in_range' | 'too_low' | 'too_high' | 'unknown'
}
type ZhafirYAxisConfig = {
  decimals: number
  minTickStep: number
  tickStep?: number
  maxTicks?: number
  initialZoom?: number
  forceZeroAxisLabel?: boolean
  lockStdWindow?: boolean
  outlierHeadroom?: number
  minPaddingAbs: number
  tickCount: number
  clampMinZero?: boolean
}

const SWR_ERROR_RETRY_INTERVAL_MS = 5000
const SWR_MACHINES_REFRESH_INTERVAL_MS = 10000

const swrRecoveryOptions = {
  shouldRetryOnError: true,
  errorRetryInterval: SWR_ERROR_RETRY_INTERVAL_MS,
  errorRetryCount: 999,
  revalidateOnReconnect: true,
} as const

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json()
}

const ZHAFIR_Y_AXIS_CONFIG: Record<ZhafirIndicatorField, ZhafirYAxisConfig> = {
  InjectScrewPosition: {
    decimals: 1,
    minTickStep: 1,
    tickStep: 0.2,
    initialZoom: 2.48,
    forceZeroAxisLabel: true,
    minPaddingAbs: 1,
    tickCount: 5,
    clampMinZero: true,
  },
  VPPositionText: {
    decimals: 1,
    minTickStep: 0.1,
    tickStep: 0.1,
    initialZoom: 2.44,
    forceZeroAxisLabel: true,
    minPaddingAbs: 0.02,
    tickCount: 5,
    clampMinZero: true,
  },
  InjPeakPressure: {
    decimals: 1,
    minTickStep: 1,
    initialZoom: 1.25,
    minPaddingAbs: 2,
    tickCount: 5,
    clampMinZero: true,
  },
  Thickness: {
    decimals: 1,
    minTickStep: 0.5,
    tickStep: 0.5,
    initialZoom: 1.97,
    minPaddingAbs: 0.03,
    tickCount: 5,
    clampMinZero: true,
  },
  VPTimeText: {
    decimals: 1,
    minTickStep: 0.5,
    tickStep: 0.5,
    maxTicks: 10,
    initialZoom: 1.00,
    outlierHeadroom: 1,
    minPaddingAbs: 0.01,
    tickCount: 10,
    clampMinZero: true,
    lockStdWindow: true,
  },
}

const parseFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const formatCompactNumber = (value: number | null, decimals = 2) => {
  if (value === null) return '-'
  if (decimals <= 0) return Math.round(value).toString()
  return value.toFixed(decimals)
}

const toNiceStep = (rawStep: number, minStep: number) => {
  const safeRaw = Number.isFinite(rawStep) && rawStep > 0 ? rawStep : minStep
  const exponent = Math.floor(Math.log10(safeRaw))
  const fraction = safeRaw / 10 ** exponent
  const niceFraction =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return Math.max(niceFraction * 10 ** exponent, minStep)
}

const buildNiceTicks = (
  minValue: number,
  maxValue: number,
  tickCount: number,
  minStep: number,
  fixedStep?: number,
  maxTicks?: number
) => {
  let min = Number.isFinite(minValue) ? minValue : 0
  let max = Number.isFinite(maxValue) ? maxValue : 1
  if (min === max) {
    min -= minStep
    max += minStep
  }
  if (max < min) {
    const temp = min
    min = max
    max = temp
  }
  const step =
    Number.isFinite(fixedStep) && (fixedStep as number) > 0
      ? (fixedStep as number)
      : toNiceStep((max - min) / Math.max(tickCount - 1, 1), minStep)
  const tickMin = Math.floor(min / step) * step
  const tickMax = Math.ceil(max / step) * step
  const ticks: number[] = []
  const maxLoop = 100
  for (
    let current = tickMin, i = 0;
    current <= tickMax + step * 0.5 && i < maxLoop;
    current += step, i += 1
  ) {
    ticks.push(Number(current.toFixed(12)))
  }
  if (ticks.length < 2) {
    return [Number(tickMin.toFixed(12)), Number((tickMin + step).toFixed(12))]
  }
  if (!maxTicks || ticks.length <= maxTicks) return ticks

  if (maxTicks <= 2) return [ticks[0], ticks[ticks.length - 1]]

  const stride = Math.ceil((ticks.length - 1) / (maxTicks - 1))
  const reduced: number[] = [ticks[0]]
  for (let i = stride; i < ticks.length - 1; i += stride) {
    reduced.push(ticks[i])
  }
  reduced.push(ticks[ticks.length - 1])

  while (reduced.length > maxTicks) {
    reduced.splice(reduced.length - 2, 1)
  }
  return reduced
}

const classifyZhafirStatus = (
  value: number | null,
  min: number | null,
  max: number | null,
  std: number | null
): ZhafirIndicatorStatus['status'] => {
  if (value === null) return 'unknown'
  if (min !== null && value < min) return 'too_low'
  if (max !== null && value > max) return 'too_high'
  if (min === null && max === null && std !== null && value > std) {
    return 'too_high'
  }
  return 'in_range'
}

export default function CountboardDashboard() {
  const [selectedMachine, setSelectedMachine] = useState<MachineDetail | null>(
    null
  )
  /*Operator */
  const { data: usersRes } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/users`,
    fetcher
  )

  const users: string[] = Array.isArray(usersRes)
    ? usersRes.map((u: { Nama: string; NIK: string }) => `${u.NIK} - ${u.Nama}`)
    : []

  const [openCell, setOpenCell] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const filteredUsers = users.filter((u) =>
    u.toLowerCase().includes(search.toLowerCase())
  )
  /*  OPERATOR / MEKANIK  */
  const { data } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/assign-users`,
    fetcher
  )

  type UserOption = {
    id: string
    name: string
    dept: string
    uap: string
  }

  const usersOP: UserOption[] = Array.isArray(data)
    ? data
        .filter(
          (u) => u.UserDept === 'OperatorBahan' || u.UserDept === 'Mechanic'
        )
        .map((u) => ({
          id: u.UserRFID,
          name: u.UserName,
          dept: u.UserDept,
          uap: u.UserUAP,
        }))
    : []

  const [openOPPopup, setOpenOPPopup] = useState(false)
  const [selectedAssignTo, setSelectedAssignTo] = useState<string | null>(null)
  const [searchOP, setSearchOP] = useState('')

  const filteredUsersOP = usersOP.filter((u) =>
    `${u.id} ${u.dept} ${u.name}`.toLowerCase().includes(searchOP.toLowerCase())
  )

  /* ambil operator terpilih + UAP */
  const selectedOperator = usersOP.find((u) => u.id === selectedAssignTo)
  const selectedOperatorUAP = selectedOperator?.uap

  /*  SPV  */
  const usersSPV: UserOption[] = Array.isArray(data)
    ? data
        .filter((u) => u.UserDept === 'SPV Production')
        .map((u) => ({
          id: u.UserRFID,
          name: u.UserName,
          dept: u.UserDept,
          uap: u.UserUAP,
        }))
    : []

  const [openSPVPopup, setOpenSPVPopup] = useState(false)
  const [selectedAssignBy, setSelectedAssignBy] = useState<string | null>(null)
  const [searchSPV, setSearchSPV] = useState('')

  /* FILTER SPV BERDASARKAN UAP OPERATOR */
  const filteredUsersSPV = usersSPV
    .filter((u) => {
      if (!selectedOperatorUAP) return false
      return u.uap === selectedOperatorUAP
    })
    .filter((u) =>
      `${u.id} ${u.dept} ${u.name}`
        .toLowerCase()
        .includes(searchSPV.toLowerCase())
    )

  /* RESET SPV JIKA OPERATOR DIGANTI */
  useEffect(() => {
    setSelectedAssignBy(null)
    setSearchSPV('')
  }, [selectedAssignTo])

  // console.log('usersSPV:', usersSPV)

  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDialogConfigurationOpen, setIsDialogConfigurationOpen] =
    useState(false)
  const [selectedComment, setSelectedComment] = useState({
    index: -1,
    hourlyId: -1,
    type: '',
    content: '',
    content2: '',
  })
  const [currentCVT, setCurrentCVT] = useState<number | 0>(0)
  const [editedScrap, setEditedScrap] = useState<number | ''>(0)
  const [editedRework, setEditedRework] = useState<number | ''>(0)
  const [selectedHourlyId, setSelectedHourlyId] = useState<number | null>(null)
  const [currentScrap, setCurrentScrap] = useState<number>(0)
  const [currentRework, setCurrentRework] = useState<number>(0)
  const [isPODialogOpen, setIsPODialogOpen] = useState(false)
  const [isCVTDialogOpen, setIsCVTDialogOpen] = useState(false)
  const [isSCRAPDialogOpen, setIsSCRAPDialogOpen] = useState(false)
  const [isREWORKDialogOpen, setIsREWORKDialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PoNumber | null>(null)
  const [editedCVT, setEditedCVT] = useState(currentCVT)
  const [selectedRefreshRate, setRefreshRate] = useState('5000')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedShift, setSelectedShift] = useState('')
  const [isLoadingRefresh, setIsLoadingRefresh] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [isEscalated, setIsEscalated] = useState<0 | 1 | null>(null)
  const [escalationTarget, setEscalationTarget] = useState<string | null>(null)
  const [isZhafirTrendDialogOpen, setIsZhafirTrendDialogOpen] = useState(false)
  const [selectedTrendIndicator, setSelectedTrendIndicator] = useState<
    (typeof ZHAFIR_INDICATORS)[number] | null
  >(null)
  const [zhafirTrendPoints, setZhafirTrendPoints] = useState<
    ZhafirTrendPoint[]
  >([])
  const [zhafirTrendHoursBack, setZhafirTrendHoursBack] = useState<8 | 24>(24)
  const [isTrendChartFullscreen, setIsTrendChartFullscreen] = useState(false)
  const [zhafirTrendZoom, setZhafirTrendZoom] = useState(1)
  const [isLoadingZhafirTrend, setIsLoadingZhafirTrend] = useState(false)
  const [zhafirTrendError, setZhafirTrendError] = useState<string | null>(null)
  const zhafirTrendOpenGuardRef = useRef<{ key: string; at: number } | null>(
    null
  )
  const zhafirActiveMaterialCacheRef = useRef<
    Map<string, { at: number; data: ZhafirActiveMaterialResponse | null }>
  >(new Map())

  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >()
  const [selectedProblemId, setSelectedProblemId] = useState<
    string | undefined
  >()
  const [selectedSolutionId, setSelectedSolutionId] = useState<
    string | undefined
  >()
  const [newProblemName, setNewProblemName] = useState('')
  const [newSolutionName, setNewSolutionName] = useState('')
  const [isSavingProblem, setIsSavingProblem] = useState(false)
  const [isSavingSolution, setIsSavingSolution] = useState(false)
  const [selectedStateChange, setSelectedStateChange] =
    useState<StateData | null>(null)
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false)
  useEffect(() => {
    if (isStateDialogOpen) {
      setSelectedAssignTo(null)
      setSelectedAssignBy(null)
      setSearchOP('')
      setSearchSPV('')
      setOpenOPPopup(false)
      setOpenSPVPopup(false)
    }
  }, [isStateDialogOpen])
  type OrangeTicketDraft = {
    categoryId: string
    problemId: string
    solutionId: string
  }

  const [draftTicket, setDraftTicket] = useState<OrangeTicketDraft | null>(null)

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  // const [ticketIdMap, setTicketIdMap] = useState<{ [stateId: string]: number | undefined }>({});
  const [userData, setUserData] = useState<any>(null)

  const pathname = usePathname()
  const router = useRouter()
  const zhafirWorkingBaseRef = useRef<string | null>(null)
  const resolveZhafirCandidates = useCallback((endpoint: string) => {
    const trimmedBase = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(
      /\/+$/,
      ''
    )
    const normalizedBase = trimmedBase.endsWith('/api')
      ? trimmedBase.slice(0, -4)
      : trimmedBase
    const unique = new Set<string>()
    const cachedBase = zhafirWorkingBaseRef.current
    if (cachedBase) unique.add(`${cachedBase}/api/zhafir-ze-3600/${endpoint}`)
    if (normalizedBase)
      unique.add(`${normalizedBase}/api/zhafir-ze-3600/${endpoint}`)
    unique.add(`/be/api/zhafir-ze-3600/${endpoint}`)
    unique.add(`/api/zhafir-ze-3600/${endpoint}`)
    return Array.from(unique)
  }, [])
  const fetchFirstOkZhafirJson = useCallback(
    async <T,>(endpoint: string) => {
      const candidates = resolveZhafirCandidates(endpoint)
      for (const url of candidates) {
        try {
          const res = await fetch(url, { cache: 'no-store' })
          if (!res.ok) continue
          const parsed = (await res.json()) as T
          const match = url.match(/^(https?:\/\/[^/]+|\/be|\/api)/)
          if (match?.[1]) {
            const base = match[1]
            if (base.startsWith('http')) {
              zhafirWorkingBaseRef.current = base
            }
          }
          return parsed
        } catch {
          // try next candidate
        }
      }
      return null
    },
    [resolveZhafirCandidates]
  )
  const fetchZhafirIndicatorStatuses = useCallback(
    async (machineName: string): Promise<ZhafirIndicatorMap> => {
      const q = `machine_id=${encodeURIComponent(machineName)}`
      const snapshot =
        await fetchFirstOkZhafirJson<ZhafirSnapshotResponse>(
          `snapshot?${q}&compact=1`
        )
      const stdData = snapshot?.stdAct || null
      const actualData = snapshot?.actualView || null

      const fallbackMap = Object.fromEntries(
        ZHAFIR_INDICATORS.map((item) => [
          item.field,
          {
            status: 'unknown',
            std: null,
            act: null,
            min: null,
            max: null,
          },
        ])
      ) as ZhafirIndicatorMap

      if (!stdData && !actualData) {
        const compactIndicators = snapshot?.indicators
        if (compactIndicators && Object.keys(compactIndicators).length > 0) {
          const compactMap = { ...fallbackMap }
          for (const indicator of ZHAFIR_INDICATORS) {
            const row = compactIndicators[indicator.field]
            if (!row) continue
            compactMap[indicator.field] = {
              status: row.status,
              std: row.std,
              act: row.act,
              min: row.min,
              max: row.max,
            }
          }
          return compactMap
        }
        return fallbackMap
      }

      const map = { ...fallbackMap }
      for (const indicator of ZHAFIR_INDICATORS) {
        const pair = stdData?.values?.[indicator.field]
        const range = stdData?.ranges?.[indicator.field]
        const mergedAct = actualData?.values?.[indicator.field] ?? pair?.act

        const std = parseFiniteNumber(pair?.std)
        const act = parseFiniteNumber(mergedAct)
        const min = parseFiniteNumber(range?.min)
        const max = parseFiniteNumber(range?.max)

        if (act === null) {
          map[indicator.field] = { status: 'unknown', std, act, min, max }
          continue
        }

        map[indicator.field] = {
          status: classifyZhafirStatus(act, min, max, std),
          std,
          act,
          min,
          max,
        }
      }

      return map
    },
    [fetchFirstOkZhafirJson]
  )
  const openZhafirIndicatorTrend = useCallback(
    async (
      indicator: (typeof ZHAFIR_INDICATORS)[number],
      indicatorThreshold?: ZhafirIndicatorStatus,
      hoursBackOverride?: 8 | 24,
      dateOverride?: string
    ) => {
      const machineName = selectedMachine?.machineName
      if (!machineName) return
      const now = Date.now()
      const clickKey = `${machineName}:${indicator.field}:${hoursBackOverride ?? zhafirTrendHoursBack}:${dateOverride ?? ''}`
      const guard = zhafirTrendOpenGuardRef.current
      if (guard && guard.key === clickKey && now - guard.at < 500) {
        return
      }
      zhafirTrendOpenGuardRef.current = { key: clickKey, at: now }

      const hoursBack = hoursBackOverride ?? zhafirTrendHoursBack
      const shouldInitZoom =
        !isZhafirTrendDialogOpen || selectedTrendIndicator?.field !== indicator.field
      if (shouldInitZoom) {
        const initialZoom =
          ZHAFIR_Y_AXIS_CONFIG[indicator.field].initialZoom ?? 1
        setZhafirTrendZoom(Math.max(4, initialZoom))
      }
      setSelectedTrendIndicator(indicator)
      setIsZhafirTrendDialogOpen(true)
      setIsLoadingZhafirTrend(true)
      setZhafirTrendError(null)

      try {
        const ttlMs = 60_000
        const cached = zhafirActiveMaterialCacheRef.current.get(machineName)
        const activeMaterial =
          cached && now - cached.at < ttlMs
            ? cached.data
            : await fetchFirstOkZhafirJson<ZhafirActiveMaterialResponse>(
                `material-active?machine_id=${encodeURIComponent(machineName)}`
              )
        if (!cached || now - cached.at >= ttlMs) {
          zhafirActiveMaterialCacheRef.current.set(machineName, {
            at: Date.now(),
            data: activeMaterial,
          })
        }
        const materialIdParam = (activeMaterial?.materialId || '').trim()
        if (!materialIdParam) {
          setZhafirTrendPoints([])
          setZhafirTrendError(
            'Material aktif tidak ditemukan dari source Zhafir untuk mesin ini'
          )
          return
        }

        const dateParam =
          dateOverride ||
          (selectedDate instanceof Date
            ? format(selectedDate, 'yyyy-MM-dd')
            : null)
        const trendQuery = `actual-view-window?machine_id=${encodeURIComponent(machineName)}&hoursBack=${hoursBack}&compact=1${
          dateParam ? `&date=${encodeURIComponent(dateParam)}` : ''
        }`
        const data =
          await fetchFirstOkZhafirJson<ZhafirActualViewWindowResponse>(
            trendQuery
          )

        if (!data || !Array.isArray(data.hours)) {
          setZhafirTrendPoints([])
          setZhafirTrendError('Data not found')
          return
        }

        const rangeFromStd = data.ranges?.[indicator.field]
        const rangeMin = parseFiniteNumber(rangeFromStd?.min)
        const rangeMax = parseFiniteNumber(rangeFromStd?.max)
        const threshold = indicatorThreshold ?? {
          status: 'unknown' as const,
          std: null,
          act: null,
          min: rangeMin,
          max: rangeMax,
        }
        const points: ZhafirTrendPoint[] = data.hours.map((hour) => {
          const rawValue = hour?.values?.[indicator.field]
          const value = parseFiniteNumber(rawValue)
          const hourlyRange = hour?.ranges?.[indicator.field]
          const min =
            parseFiniteNumber(hourlyRange?.min) ??
            parseFiniteNumber(hour?.min) ??
            rangeMin ??
            threshold.min
          const max =
            parseFiniteNumber(hourlyRange?.max) ??
            parseFiniteNumber(hour?.max) ??
            rangeMax ??
            threshold.max
          const std =
            parseFiniteNumber(hour?.std) ??
            threshold.std ??
            (min !== null && max !== null ? (min + max) / 2 : null)
          const status: ZhafirTrendPoint['status'] =
            classifyZhafirStatus(value, min, max, std)

          const hourDate = hour?.hourStart
            ? new Date(hour.hourStart)
            : hour?.actualDate
              ? new Date(hour.actualDate)
              : null
          const hourLabel =
            (hour?.hourLabel ? String(hour.hourLabel) : null) ||
            (hourDate && !Number.isNaN(hourDate.getTime())
              ? format(hourDate, 'HH:mm')
              : '-')

          return {
            hourLabel,
            actualDate: hour?.actualDate ? String(hour.actualDate) : null,
            std,
            value,
            min,
            max,
            status,
          }
        })

        setZhafirTrendPoints(points)
      } catch (error) {
        setZhafirTrendPoints([])
        setZhafirTrendError((error as Error).message)
      } finally {
        setIsLoadingZhafirTrend(false)
      }
    },
    [
      fetchFirstOkZhafirJson,
      selectedDate,
      selectedMachine?.machineName,
      isZhafirTrendDialogOpen,
      selectedTrendIndicator?.field,
      zhafirTrendHoursBack,
    ]
  )

  const { data: categoryRes } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/problem-master/problem-group/all`,
    fetcher,
    {
      ...swrRecoveryOptions,
      revalidateOnFocus: false,
    }
  )
  const sanitizeSheetName = (name: string) => {
    return name
      .replace(/[:\\/?*\[\]]/g, '') // hapus karakter terlarang
      .substring(0, 31) // Excel max 31 karakter
  }
  const handleExportTrendExcel = () => {
    if (!selectedTrendIndicator || zhafirTrendPoints.length === 0) return

    const rows = zhafirTrendPoints.map((p, i) => ({
      No: i + 1,
      Hour: p.hourLabel,
      STD: p.std ?? '',
      Actual: p.value ?? '',
      Min_STD: p.min ?? '',
      Max_STD: p.max ?? '',
      Status:
        p.status === 'too_low'
          ? 'Too Low'
          : p.status === 'too_high'
            ? 'Too High'
            : p.status === 'in_range'
              ? 'In Range'
              : 'No Data',
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)

    const workbook = XLSX.utils.book_new()
    const sheetName = sanitizeSheetName(selectedTrendIndicator.label)

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const buffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
    })

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `SPC_Trend_${selectedTrendIndicator.label}.xlsx`
    link.click()
  }
  const categoryOrder = [2, 3, 4, 5, 6, 7, 8, 1]

  const rawCategories = categoryRes as ProblemGroup[] | undefined
  const categories: ProblemGroup[] = Array.isArray(rawCategories)
    ? rawCategories
        .filter((c) => categoryOrder.includes(c.id))
        .sort(
          (a, b) => categoryOrder.indexOf(a.id) - categoryOrder.indexOf(b.id)
        )
    : []

  const problemKey = selectedCategoryId
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/problem-master/problem/by-group?groupId=${selectedCategoryId}`
    : null

  const { data: problemRes } = useSWR(problemKey, fetcher, {
    ...swrRecoveryOptions,
    revalidateOnFocus: false,
  })
  const rawProblems = problemRes as Problem[] | undefined
  const problems: Problem[] = Array.isArray(rawProblems) ? rawProblems : []

  const todoKey =
    selectedProblemId && selectedProblemId !== OTHER_PROBLEM_VALUE
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/problem-master/todo/by-problem?problemId=${selectedProblemId}`
      : null

  const { data: todoRes } = useSWR(todoKey, fetcher, {
    ...swrRecoveryOptions,
    revalidateOnFocus: false,
  })

  const rawSolutions = todoRes as Todo[] | undefined
  const solutions: Todo[] = Array.isArray(rawSolutions) ? rawSolutions : []
  const filteredProblems = problems.filter((p) => {
    const matchCategory =
      String(p.problem_group_id) === String(selectedCategoryId)
    const normalize = (val?: string) => val?.trim().toLowerCase()
    const matchProcess =
      normalize(p.process) === normalize(selectedMachine?.Process)
    return matchCategory && matchProcess
  })

  const handleCreateProblemFromOther = useCallback(async () => {
    const name = newProblemName.trim()
    if (!selectedCategoryId) {
      toast.error('Category wajib dipilih')
      return
    }
    if (!name) {
      toast.error('Nama problem wajib diisi')
      return
    }

    const existing = filteredProblems.find(
      (p) => p.name.trim().toLowerCase() === name.toLowerCase()
    )
    if (existing) {
      setSelectedProblemId(String(existing.id))
      setSelectedSolutionId(undefined)
      setNewProblemName('')
      toast.success('Problem sudah ada, langsung dipilih')
      return
    }

    setIsSavingProblem(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/problem-master/problem`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            problem_group_id: selectedCategoryId,
            color: 'ORANGE',
            process: selectedMachine?.Process || 'Injection',
          }),
        }
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal menambahkan problem')
      }

      const refreshed = (await mutate(problemKey)) as Problem[] | undefined
      const latest = Array.isArray(refreshed) ? refreshed : []
      const created = latest.find(
        (p) =>
          String(p.problem_group_id) === String(selectedCategoryId) &&
          p.name.trim().toLowerCase() === name.toLowerCase()
      )
      if (!created) {
        throw new Error(
          'Problem berhasil dibuat, tapi data terbaru belum ditemukan'
        )
      }

      setSelectedProblemId(String(created.id))
      setSelectedSolutionId(undefined)
      setNewProblemName('')
      toast.success('Problem baru berhasil ditambahkan')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSavingProblem(false)
    }
  }, [
    filteredProblems,
    newProblemName,
    problemKey,
    selectedCategoryId,
    selectedMachine?.Process,
  ])

  const handleCreateSolutionFromOther = useCallback(async () => {
    const name = newSolutionName.trim()
    if (!selectedProblemId || selectedProblemId === OTHER_PROBLEM_VALUE) {
      toast.error('Problem wajib dipilih')
      return
    }
    if (!name) {
      toast.error('Nama solution wajib diisi')
      return
    }

    const existing = solutions.find(
      (s) => s.name.trim().toLowerCase() === name.toLowerCase()
    )
    if (existing) {
      setSelectedSolutionId(String(existing.id))
      setNewSolutionName('')
      toast.success('Solution sudah ada, langsung dipilih')
      return
    }

    setIsSavingSolution(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/problem-master/todo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            problem_id: selectedProblemId,
            pic: userData?.UserDept || 'SPV Production',
            is_escalated: false,
          }),
        }
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal menambahkan solution')
      }

      const refreshed = (await mutate(todoKey)) as Todo[] | undefined
      const latest = Array.isArray(refreshed) ? refreshed : []
      const created = latest.find(
        (s) =>
          String(s.problem_id) === String(selectedProblemId) &&
          s.name.trim().toLowerCase() === name.toLowerCase()
      )
      if (!created) {
        throw new Error(
          'Solution berhasil dibuat, tapi data terbaru belum ditemukan'
        )
      }

      setSelectedSolutionId(String(created.id))
      setNewSolutionName('')
      toast.success('Solution baru berhasil ditambahkan')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSavingSolution(false)
    }
  }, [
    newSolutionName,
    selectedProblemId,
    solutions,
    todoKey,
    userData?.UserDept,
  ])

  const checkUser = async () => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/check`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )
      const userDataJson = await userData.json()
      setUserData(userDataJson.data.payload.user)
      // console.log(userDataJson.data.payload.user);
    }
    return null
  }

  useEffect(() => {
    const refreshAtShiftChange = () => {
      const now = new Date()
      const hour = now.getHours()
      const lastRefreshedHour = localStorage.getItem('lastRefreshedHour')

      // If lastRefreshedHour doesn't exist and current hour is a shift change hour, trigger refresh
      if (!lastRefreshedHour && (hour === 6 || hour === 14 || hour === 22)) {
        localStorage.setItem('lastRefreshedHour', hour.toString())
        toast.success('Auto Refreshing every shift ...', { duration: 1000 })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
        return
      }

      if (
        (hour === 6 || hour === 14 || hour === 22) &&
        lastRefreshedHour !== hour.toString()
      ) {
        localStorage.setItem('lastRefreshedHour', hour.toString())
        toast.success('Auto Refreshing every shift ...', { duration: 1000 })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    }

    // Initial check
    refreshAtShiftChange()

    // Set up interval to check every minute
    const intervalId = setInterval(refreshAtShiftChange, 60000)

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  const [shiftStartHour, setShiftStartHour] = useState(0)
  const [shiftEndHour, setShiftEndHour] = useState(0)
  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    let shift = 0

    switch (true) {
      case hour >= 6 && hour < 14:
        shift = 1
        break
      case hour >= 14 && hour < 22:
        shift = 2
        break
      case hour >= 22 || hour < 6:
        shift = 3
        if (hour < 6) {
          now.setDate(now.getDate() - 1) // Move to the previous day
        }
        break
      default:
        throw new Error(`Unexpected hour ${hour}`)
    }

    // Set shift start time
    now.setHours(6 + (shift - 1) * 8, 0, 0, 0)
    setSelectedShift(shift.toString())
    setShiftStartHour(now.getTime())
    now.setHours(6 + (shift - 1) * 8 + 8, 0, 0, 0)
    setShiftEndHour(now.getTime())
  }, [])

  const from = isLiveMode
    ? shiftStartHour
    : new Date(new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24)).setHours(
        6 + (+selectedShift - 1) * 8,
        0,
        0,
        0
      )

  const to = isLiveMode
    ? shiftEndHour // Live mode uses current timestamp
    : new Date(new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24)).setHours(
        6 + (+selectedShift - 1) * 8 + 8,
        0,
        0,
        0
      ) // Set to end of shift

  const {
    data: machines,
    error,
    isValidating,
  } = useSWR<MachineDetail[]>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines?type=injection`,
    fetcher,
    {
      ...swrRecoveryOptions,
      revalidateOnFocus: false,
      refreshInterval: SWR_MACHINES_REFRESH_INTERVAL_MS,
    }
  )
  useEffect(() => {
    setIsLoading(isValidating)
  }, [isValidating])

  const stateDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/state/${
        selectedMachine.machineName
      }${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get(
              'date'
            )}&shift=${new URLSearchParams(window.location.search).get(
              'shift'
            )}`
          : ''
      }`
    : null

  const { data: stateData } = useSWR<StateData[]>(stateDataKey, fetcher, {
    ...swrRecoveryOptions,
    revalidateOnMount: false,
    revalidateOnFocus: false,
    refreshInterval: Number(selectedRefreshRate),
  })

  const refetchStateData = () => mutate(stateDataKey)

  const ticketRows =
    Array.isArray(stateData) && selectedStateChange
      ? (() => {
          const sorted = [...stateData].sort(
            (a, b) =>
              new Date(a.AdjustedStatusDate).getTime() -
              new Date(b.AdjustedStatusDate).getTime()
          )

          // 1) cari index state yang diklik
          const idx = sorted.findIndex((s) => s.ID === selectedStateChange.ID)
          if (idx === -1) return []

          const curr = sorted[idx] // ORANGE yang diklik

          // 2) cari perubahan warna pertama setelahnya yang bukan ORANGE
          let nextChange: StateData | undefined
          for (let j = idx + 1; j < sorted.length; j++) {
            if (sorted[j].Color !== 'ORANGE') {
              nextChange = sorted[j]
              break
            }
          }

          // 3) tentukan Actual Finish (boleh ke warna apa saja)
          const to = nextChange ? nextChange.AdjustedStatusDate : null

          // 4) kembalikan SATU baris saja
          return [
            {
              from: curr.AdjustedStatusDate,
              to,
            },
          ]
        })()
      : []

  // const ticketRows =
  //   Array.isArray(stateData)
  //     ? (() => {
  //         const sorted = [...stateData].sort(
  //           (a, b) =>
  //             new Date(a.AdjustedStatusDate).getTime() -
  //             new Date(b.AdjustedStatusDate).getTime(),
  //         );
  //         const rows: { from: string; to: string | null }[] = [];

  //         for (let i = 0; i < sorted.length; i++) {
  //           const curr = sorted[i];
  //           if (curr.Color !== 'ORANGE') continue;

  //           // Cari perubahan status pertama setelah ORANGE ini
  //           let nextChange: StateData | undefined;
  //           for (let j = i + 1; j < sorted.length; j++) {
  //             if (sorted[j].Color !== 'ORANGE') {
  //               nextChange = sorted[j];
  //               break;
  //             }
  //           }
  //           //ganti changeState Orange ke semua warna
  //           //const to =
  //           //  nextChange && nextChange.Color === 'GREEN'
  //           //    ? nextChange.AdjustedStatusDate
  //           //    : null;

  //           // diganti jadi:
  //           const to = nextChange ? nextChange.AdjustedStatusDate : null;

  //           rows.push({
  //             from: curr.AdjustedStatusDate,
  //             to,
  //           });

  //           // Skip ke setelah blok ORANGE ini supaya tidak duplikat
  //           while (i + 1 < sorted.length && sorted[i + 1].Color === 'ORANGE') {
  //             i++;
  //           }
  //         }

  //         return rows;
  //       })()
  //     : [];
  // const handleOrangeTicketNext = () => {
  //   if (!selectedMachine || !selectedStateChange) {
  //     toast.error('Pilih mesin dan state ORANGE terlebih dahulu')
  //     return
  //   }

  //   if (!selectedProblemId || !selectedSolutionId) {
  //     toast.error('Pilih Problem dan Solution terlebih dahulu')
  //     return
  //   }

  //   const problemObj = problems.find(
  //     (p) => String(p.id) === String(selectedProblemId)
  //   )
  //   const solutionObj = solutions.find(
  //     (s) => String(s.id) === String(selectedSolutionId)
  //   )

  //   if (!problemObj || !solutionObj) {
  //     toast.error('Problem atau Solution tidak ditemukan')
  //     return
  //   }

  //   //  SIMPAN SEMENTARA
  //   setTicketDraft({
  //     machineId: selectedMachine.machineName,
  //     ticketDate: selectedStateChange.AdjustedStatusDate,
  //     problem: problemObj.name,
  //     actionPlan: solutionObj.name,
  //   })

  //   //  BUKA MODAL KE-2
  //   setIsSecondModalOpen(true)
  // }
  const handleNextFromOrangeModal = () => {
    // 1. Validasi form modal pertama
    if (!selectedCategoryId) {
      toast.error('Category wajib dipilih')
      return
    }

    if (!selectedProblemId) {
      toast.error('Problem wajib dipilih')
      return
    }
    if (selectedProblemId === OTHER_PROBLEM_VALUE) {
      toast.error('Simpan problem Others terlebih dahulu')
      return
    }

    if (!selectedSolutionId) {
      toast.error('Solution wajib dipilih')
      return
    }
    if (selectedSolutionId === OTHER_SOLUTION_VALUE) {
      toast.error('Simpan solution Others terlebih dahulu')
      return
    }

    // 2. Simpan ke state sementara (draft)
    setDraftTicket({
      categoryId: selectedCategoryId,
      problemId: selectedProblemId,
      solutionId: selectedSolutionId,
    })

    // 3. Tutup modal pertama, buka modal kedua
    setIsStateDialogOpen(false)
    setIsConfirmDialogOpen(true)
  }
  const handleOrangeTicketSubmit = useCallback(async () => {
    // 1. Pastikan draft ada
    if (!draftTicket) {
      toast.error('Draft ticket tidak ditemukan')
      return
    }

    // 2. Validasi penginput (MODAL KEDUA)
    if (!selectedAssignTo) {
      toast.error('Pilih Operator / Mekanik (Assign To)')
      return
    }

    if (!selectedAssignBy) {
      toast.error('Pilih SPV (Assign By)')
      return
    }

    // 3. Validasi mesin & state
    if (!selectedMachine || !selectedStateChange) {
      toast.error('Mesin atau state ORANGE tidak valid')
      return
    }

    // 4. Ambil problem & solution dari draft
    const problemObj = problems.find(
      (p) => String(p.id) === String(draftTicket.problemId)
    )

    const solutionObj = solutions.find(
      (s) => String(s.id) === String(draftTicket.solutionId)
    )

    if (!problemObj || !solutionObj) {
      toast.error('Problem atau Solution tidak valid')
      return
    }
    if (isEscalated === null) {
      toast.error('Pilih Eskalasi Ya atau Tidak')
      return
    }

    if (isEscalated === 1 && !escalationTarget) {
      toast.error('Pilih tujuan eskalasi')
      return
    }

    const selectedCategory = categories.find(
      (c) => String(c.id) === String(draftTicket.categoryId)
    )
    const isNonQualityOrScrap =
      selectedCategory &&
      (selectedCategory.name.toLowerCase().includes('non quality') ||
        selectedCategory.name.toLowerCase().includes('scrap'))

    setIsLoading(true)

    try {
      // 5. SUBMIT KE BACKEND (FINAL)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/ticket`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machineId: selectedMachine.machineName,
            ticketDate: selectedStateChange.AdjustedStatusDate,
            categoryId: draftTicket.categoryId,
            problem: problemObj.name,
            actionPlan: solutionObj.name,
            assignToId: selectedAssignTo,
            assignById: selectedAssignBy,
            eskalasiFlag: isEscalated,
            eskalasiDept: isEscalated === 1 ? escalationTarget : null,
            ticketColorId: isNonQualityOrScrap ? 'RED' : 'ORANGE',
          }),
        }
      )

      const text = await response.text()
      let data: any = {}

      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { message: text }
        }
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Gagal submit ticket')
      }

      if (data.affected === 0) {
        toast.error(
          'TicketTRX dengan TicketDate ini tidak ditemukan / sudah terisi'
        )
        return
      }

      toast.success('TicketTRX berhasil di-update')

      // 6. Refresh hourly table
      if (selectedMachine) {
        const search = new URLSearchParams(window.location.search)
        const extraParams =
          !isLiveMode && search.get('date') !== null
            ? `&date=${search.get('date')}&shift=${search.get('shift')}`
            : ''

        const hourlyKey = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/hourly/${selectedMachine.machineName}?type=injection${extraParams}`
        await mutate(hourlyKey)
      }

      // 7. Jika Non Quality / Scrap → ORANGE jadi RED
      if (isNonQualityOrScrap && selectedStateChange) {
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/state`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stateId: selectedStateChange.ID,
              color: 'RED',
            }),
          }
        )

        refetchStateData()
      }

      // 8. RESET STATE (BERSIH)
      setDraftTicket(null)
      setSelectedAssignTo(null)
      setSelectedAssignBy(null)
      setIsConfirmDialogOpen(false)
      setIsStateDialogOpen(false)
    } catch (error) {
      toast.error((error as Error).message)
      console.error('Failed to submit ticket:', error)
    } finally {
      setIsLoading(false)
    }
  }, [
    draftTicket,
    selectedAssignTo,
    selectedAssignBy,
    selectedMachine,
    selectedStateChange,
    problems,
    solutions,
    categories,
    refetchStateData,
  ])
  console.log(selectedMachine)
  // const handleOrangeTicketSubmit = useCallback(async () => {
  //   if (!selectedAssignTo || !selectedAssignBy) {
  //     toast.error('Pilih Assign To (Operator/Mekanik) dan Assign By (SPV)')
  //     return
  //   }
  //   if (!selectedMachine || !selectedStateChange) {
  //     toast.error('Pilih mesin dan state ORANGE terlebih dahulu')
  //     return
  //   }

  //   if (!selectedProblemId || !selectedSolutionId) {
  //     toast.error('Pilih Problem dan Solution terlebih dahulu')
  //     return
  //   }

  //   const problemObj = problems.find(
  //     (p) => String(p.id) === String(selectedProblemId)
  //   )
  //   const solutionObj = solutions.find(
  //     (s) => String(s.id) === String(selectedSolutionId)
  //   )

  //   if (!problemObj || !solutionObj) {
  //     toast.error('Problem atau Solution tidak ditemukan')
  //     return
  //   }

  //   setIsLoading(true)
  //   try {
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/ticket`,
  //       {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           machineId: selectedMachine.machineName,
  //           ticketDate: selectedStateChange.AdjustedStatusDate,
  //           problem: problemObj.name,
  //           actionPlan: solutionObj.name,
  //           assignToId: selectedAssignTo,
  //           assignById: selectedAssignBy,
  //         }),
  //       }
  //     )

  //     const text = await response.text()
  //     let data: any = {}
  //     if (text) {
  //       try {
  //         data = JSON.parse(text)
  //       } catch {
  //         data = { message: text }
  //       }
  //     }

  //     if (!response.ok) {
  //       const msg = data.error || data.message || 'Gagal submit ticket'
  //       throw new Error(msg)
  //     }

  //     if (data.affected === 0) {
  //       toast.error(
  //         'TicketTRX dengan TicketDate ini tidak ditemukan / sudah terisi'
  //       )
  //     } else {
  //       toast.success('TicketTRX berhasil di-update')

  //       // Refresh hourly table supaya Problem/Action di per jam ikut update dari TicketTRX
  //       if (selectedMachine) {
  //         const search = new URLSearchParams(window.location.search)
  //         const extraParams =
  //           !isLiveMode && search.get('date') !== null
  //             ? `&date=${search.get('date')}&shift=${search.get('shift')}`
  //             : ''

  //         const hourlyKey = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/hourly/${selectedMachine.machineName}?type=injection${extraParams}`
  //         await mutate(hourlyKey)
  //       }

  //       // Jika CATEGORY yang dipilih adalah Non Quality / Scrap, ubah state ORANGE yang diklik menjadi RED di database
  //       const selectedCategory = categories.find(
  //         (c) => String(c.id) === String(selectedCategoryId)
  //       )
  //       const isNonQualityOrScrapCategory =
  //         selectedCategory &&
  //         (selectedCategory.name.toLowerCase().includes('non quality') ||
  //           selectedCategory.name.toLowerCase().includes('scrap'))

  //       if (isNonQualityOrScrapCategory && selectedStateChange) {
  //         await fetch(
  //           `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/state`,
  //           {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             body: JSON.stringify({
  //               stateId: selectedStateChange.ID,
  //               color: 'RED',
  //             }),
  //           }
  //         )

  //         refetchStateData()
  //       }
  //       setIsStateDialogOpen(false)
  //     }
  //   } catch (error) {
  //     toast.error((error as Error).message)
  //     console.error('Failed to submit ticket or update state:', error)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }, [
  //   selectedMachine,
  //   selectedStateChange,
  //   selectedProblemId,
  //   selectedSolutionId,
  //   selectedAssignTo,
  //   selectedAssignBy,
  //   problems,
  //   solutions,
  //   categories,
  //   selectedCategoryId,
  //   refetchStateData,
  // ])

  // const handleFinalOrangeTicketSubmit = useCallback(async () => {
  //   if (!selectedMachine || !selectedStateChange) {
  //     toast.error('Pilih mesin dan state ORANGE terlebih dahulu')
  //     return
  //   }

  //   if (!selectedProblemId || !selectedSolutionId) {
  //     toast.error('Pilih Problem dan Solution terlebih dahulu')
  //     return
  //   }

  //   const problemObj = problems.find(
  //     (p) => String(p.id) === String(selectedProblemId)
  //   )
  //   const solutionObj = solutions.find(
  //     (s) => String(s.id) === String(selectedSolutionId)
  //   )

  //   if (!problemObj || !solutionObj) {
  //     toast.error('Problem atau Solution tidak ditemukan')
  //     return
  //   }

  //   setIsLoading(true)
  //   try {
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/ticket`,
  //       {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           machineId: selectedMachine.machineName,
  //           ticketDate: selectedStateChange.AdjustedStatusDate,
  //           problem: problemObj.name,
  //           actionPlan: solutionObj.name,
  //         }),
  //       }
  //     )

  //     const text = await response.text()
  //     let data: any = {}
  //     if (text) {
  //       try {
  //         data = JSON.parse(text)
  //       } catch {
  //         data = { message: text }
  //       }
  //     }

  //     if (!response.ok) {
  //       const msg = data.error || data.message || 'Gagal submit ticket'
  //       throw new Error(msg)
  //     }

  //     if (data.affected === 0) {
  //       toast.error(
  //         'TicketTRX dengan TicketDate ini tidak ditemukan / sudah terisi'
  //       )
  //     } else {
  //       toast.success('TicketTRX berhasil di-update')

  //       // Refresh hourly table supaya Problem/Action di per jam ikut update dari TicketTRX
  //       if (selectedMachine) {
  //         const search = new URLSearchParams(window.location.search)
  //         const extraParams =
  //           !isLiveMode && search.get('date') !== null
  //             ? `&date=${search.get('date')}&shift=${search.get('shift')}`
  //             : ''

  //         const hourlyKey = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/hourly/${selectedMachine.machineName}?type=injection${extraParams}`
  //         await mutate(hourlyKey)
  //       }

  //       // Jika CATEGORY yang dipilih adalah Non Quality / Scrap, ubah state ORANGE yang diklik menjadi RED di database
  //       const selectedCategory = categories.find(
  //         (c) => String(c.id) === String(selectedCategoryId)
  //       )
  //       const isNonQualityOrScrapCategory =
  //         selectedCategory &&
  //         (selectedCategory.name.toLowerCase().includes('non quality') ||
  //           selectedCategory.name.toLowerCase().includes('scrap'))

  //       if (isNonQualityOrScrapCategory && selectedStateChange) {
  //         await fetch(
  //           `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/state`,
  //           {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             body: JSON.stringify({
  //               stateId: selectedStateChange.ID,
  //               color: 'RED',
  //             }),
  //           }
  //         )

  //         refetchStateData()
  //         setIsStateDialogOpen(false)
  //       }
  //     }
  //   } catch (error) {
  //     toast.error((error as Error).message)
  //     console.error('Failed to submit ticket or update state:', error)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }, [
  //   selectedMachine,
  //   selectedStateChange,
  //   selectedProblemId,
  //   selectedSolutionId,
  //   problems,
  //   solutions,
  //   categories,
  //   selectedCategoryId,
  //   refetchStateData,
  // ])

  // const refetchMachine = async () => {
  //   setIsLoading(true);
  //   try {
  //     await mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const hourlyDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/hourly/${
        selectedMachine.machineName
      }?type=injection${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `&date=${new URLSearchParams(window.location.search).get(
              'date'
            )}&shift=${new URLSearchParams(window.location.search).get(
              'shift'
            )}`
          : ''
      }`
    : null

  const { data: hourlyData } = useSWR<HourlyData[]>(
    hourlyDataKey,
    async (url) => {
      const promise = fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })

      toast.promise(promise, {
        loading: 'Loading...',
        // success: 'Countboard data refreshed',
        error: 'Failed to load data',
      })

      return promise
    },
    {
      ...swrRecoveryOptions,
      revalidateOnMount: false,
      revalidateOnFocus: false,
      refreshInterval: Number(selectedRefreshRate),
    }
  )

  const refetchHourlyData = useCallback(
    () => mutate(hourlyDataKey),
    [hourlyDataKey]
  )

  const oeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/oee/${
        selectedMachine.machineName
      }${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get(
              'date'
            )}&shift=${new URLSearchParams(window.location.search).get(
              'shift'
            )}`
          : ''
      }`
    : null

  const { data: oeeData } = useSWR<OoeData[]>(oeeDataKey, fetcher, {
    ...swrRecoveryOptions,
    revalidateOnMount: false,
    revalidateOnFocus: false,
    refreshInterval: Number(selectedRefreshRate),
  })

  const refetchOeeData = () => mutate(oeeDataKey)

  const noeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/noee/${
        selectedMachine.machineName
      }${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get(
              'date'
            )}&shift=${new URLSearchParams(window.location.search).get(
              'shift'
            )}`
          : ''
      }`
    : null

  const { data: noeeData } = useSWR<NooeData[]>(noeeDataKey, fetcher, {
    ...swrRecoveryOptions,
    revalidateOnMount: false,
    revalidateOnFocus: false,
    refreshInterval: Number(selectedRefreshRate),
  })

  const refetchNoeeData = () => mutate(noeeDataKey)

  const taskDataKey = selectedMachine?.machineDescription
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/tasks/${
        selectedMachine.machineDescription
      }${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get(
              'date'
            )}&shift=${new URLSearchParams(window.location.search).get(
              'shift'
            )}`
          : ''
      }`
    : null

  const { data: taskData } = useSWR<TaskData[]>(taskDataKey, fetcher, {
    ...swrRecoveryOptions,
    revalidateOnMount: false,
    revalidateOnFocus: false,
    refreshInterval: Number(selectedRefreshRate),
  })
  const refetchTaskData = useCallback(() => {
    mutate(taskDataKey)
  }, [taskDataKey])
  const zhafirIndicatorStatusKey = selectedMachine?.machineName
    ? (['zhafir-indicators', selectedMachine.machineName] as const)
    : null
  const {
    data: zhafirIndicatorStatusMap,
    isLoading: isLoadingZhafirIndicators,
  } = useSWR<ZhafirIndicatorMap>(
    zhafirIndicatorStatusKey,
    () => fetchZhafirIndicatorStatuses(selectedMachine?.machineName ?? ''),
    {
      ...swrRecoveryOptions,
      revalidateOnMount: true,
      revalidateOnFocus: false,
      refreshInterval: isZhafirTrendDialogOpen
        ? 0
        : Math.max(Number(selectedRefreshRate), 15000),
    }
  )
  const currentPo =
    Array.isArray(taskData) && taskData.length > 0
      ? taskData[taskData.length - 1].po_name
      : selectedPO?.poNumber || ''

  const currentMaterial =
    Array.isArray(hourlyData) &&
    hourlyData &&
    hourlyData.filter((data) => data?.itemDesc !== null).length > 0
      ? hourlyData.filter((data) => data?.itemDesc !== null).slice(-1)[0]
          .itemDesc
      : selectedPO
        ? `${selectedPO?.materialId} - ${selectedPO?.materialName}`
        : ''

  const handleOpenParameterSetting = async () => {
    if (!selectedMachine?.machineName) return
    const params = new URLSearchParams()
    params.set('machine_id', selectedMachine.machineName)
    if (selectedMachine?.machineDescription) {
      params.set('machine_desc', selectedMachine.machineDescription)
    }
    if (selectedMachine?.machineNumber) {
      params.set('machine_number', selectedMachine.machineNumber)
    }
    if (selectedMachine?.locationName) {
      params.set('location', selectedMachine.locationName)
    }
    if (currentPo) {
      params.set('po', currentPo)
    }
    if (currentMaterial) {
      params.set('material', currentMaterial)
    }
    try {
      const data = await fetchFirstOkZhafirJson<{ exists?: boolean }>(
        `exists?machine_id=${encodeURIComponent(selectedMachine.machineName)}&mode=param`
      )
      if (!data) {
        throw new Error('Failed to check parameter setting')
      }
      if (!data?.exists) {
        toast.error('Belum ada setting parameter untuk mesin ini')
        return
      }
      params.set('mode', 'param')
      router.push(`/zhafir-ze-3600?${params.toString()}`)
    } catch (error) {
      toast.error((error as Error).message || 'Gagal cek parameter')
    }
  }

  useEffect(() => {
    setCurrentCVT(taskData?.[0]?.actual_cvt ?? 0)
  }, [taskData])

  useEffect(() => {
    if (selectedMachine?.machineName) {
      try {
        Promise.all([
          refetchHourlyData(),
          refetchOeeData(),
          refetchTaskData(),
          refetchNoeeData(),
          refetchStateData(),
        ])
      } catch (error) {
        toast.error('Failed to fetch data')
      }
    }
  }, [selectedMachine?.machineName])

  // if(!machines){
  //   return <div>Loading...</div>
  // }
  const uniqueLocations = Array.from(
    new Set(machines?.map((machine) => machine.locationName))
  )
  const filteredMachines = machines?.filter(
    (machine) => machine.locationName === selectedLocation
  )

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value)
    const params = new URLSearchParams(searchParams)
    params.set('location', value)
    router.push(`${pathname}?${params.toString()}`)
    setSelectedMachineNumber('')
    setSelectedMachine(null)
  }

  const handleMachineNumberChange = (value: string) => {
    setSelectedMachineNumber(value)
    const selected =
      filteredMachines?.find((machine) => machine.machineNumber === value) ||
      null
    setSelectedMachine(selected)
    setCurrentCVT(taskData?.[0]?.actual_cvt ?? 0)
    const params = new URLSearchParams(searchParams)
    params.set('machineNumber', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleRefreshRateChange = (value: string) => {
    setRefreshRate(value)
  }

  const handleLiveMode = () => {
    setIsLiveMode(!isLiveMode)
    const params = new URLSearchParams(searchParams)
    params.set('isLiveMode', String(!isLiveMode))

    if (isLiveMode == false) {
      setRefreshRate('5000')
      params.set('refresh', '5000')
      params.delete('date')
      params.delete('shift')
    } else if (isLiveMode == true) {
      setRefreshRate('30000')
      params.set('refresh', '30000')
      params.set('date', selectedDate.toISOString().split('T')[0])
      params.set('shift', selectedShift.toString())
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const params = new URLSearchParams(searchParams)
    params.set('date', date.toISOString().split('T')[0])
    router.push(`${pathname}?${params.toString()}`)
    handleRefreshButton()
  }

  const handleShiftSelect = (shift: string) => {
    setSelectedShift(shift)
    const params = new URLSearchParams(searchParams)
    params.set('shift', shift)
    router.push(`${pathname}?${params.toString()}`)
    handleRefreshButton()
  }

  const handleRefreshButton = async () => {
    setIsLoadingRefresh(true)
    try {
      await Promise.all([
        refetchHourlyData(),
        refetchOeeData(),
        refetchTaskData(),
        refetchNoeeData(),
        refetchStateData(),
      ])
    } finally {
      setIsLoadingRefresh(false)
    }
  }

  const handleCellClick = (
    index: number,
    hourlyId: number,
    type: 'causes' | 'comments',
    content: string,
    content2: string
  ) => {
    setSelectedCategoryId(undefined)
    setSelectedProblemId(undefined)
    setSelectedSolutionId(undefined)
    setSelectedComment({ index, hourlyId, type, content, content2 })
    setIsDialogOpen(true)
  }

  const handleStateClick = (change: StateData) => {
    if (change.Color === 'ORANGE') {
      setSelectedCategoryId(undefined)
      setSelectedProblemId(undefined)
      setSelectedSolutionId(undefined)
      setNewProblemName('')
      setNewSolutionName('')
      setSelectedStateChange(change)
      setIsStateDialogOpen(true)
    }
  }

  const handleCommentSave = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/comment`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hourlyId: selectedComment?.hourlyId,
            type: selectedComment?.type,
            content: selectedComment?.content,
          }),
        }
      )

      if (!response.ok) {
        // Attempt to extract the server's error message
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to Update Content`

        throw new Error(errorMessage)
      }
      toast.success(`Update Content successfully!`)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(`Failed to Update Content:`, error)
    } finally {
      setIsLoading(false)
    }
    setIsDialogOpen(false)
    refetchHourlyData()
    setSelectedComment(selectedComment)
  }, [selectedComment, refetchHourlyData])
  //scrap update
  const handleScrapUpdate = useCallback(async () => {
    if (!selectedHourlyId) return

    setIsLoading(true)
    const scrapValue = editedScrap === '' ? 0 : editedScrap
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/scrap`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hourlyId: selectedHourlyId,
            scrap: scrapValue,
          }),
        }
      )
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to update Scrap')
      }
      toast.success('Update Scrap successfully!')
      setCurrentScrap(scrapValue)
      refetchHourlyData()
      setIsSCRAPDialogOpen(false)
    } catch (error) {
      toast.error((error as Error).message)
      console.error('Failed to update Scrap:', error)
    } finally {
      setIsLoading(false)
    }
  }, [editedScrap, selectedHourlyId, refetchHourlyData])
  //rework update
  const handleReworkUpdate = useCallback(async () => {
    if (!selectedHourlyId) return

    setIsLoading(true)
    const reworkValue = editedRework === '' ? 0 : editedRework
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/rework`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hourlyId: selectedHourlyId,
            rework: reworkValue,
          }),
        }
      )
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to update Rework')
      }
      toast.success('Update Rework successfully!')
      setCurrentRework(reworkValue)
      refetchHourlyData()
      setIsREWORKDialogOpen(false)
    } catch (error) {
      toast.error((error as Error).message)
      console.error('Failed to update Rework:', error)
    } finally {
      setIsLoading(false)
    }
  }, [editedRework, selectedHourlyId, refetchHourlyData])
  const handleCVTUpdate = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/cvt`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: taskData?.[0]?.id,
            newCvt: editedCVT,
          }),
        }
      )

      if (!response.ok) {
        // Attempt to extract the server's error message
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to Update CVT`

        throw new Error(errorMessage)
      }
      toast.success(`Update CVT successfully!`)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(`Failed to Update CVT:`, error)
    } finally {
      setIsLoading(false)
    }
    setCurrentCVT(editedCVT)
    refetchTaskData()
    setIsCVTDialogOpen(false)
  }, [editedCVT, refetchTaskData, taskData])

  const handlePOAttach = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/task`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poNumber: selectedPO?.poNumber,
            machineName: selectedMachine?.machineName,
          }),
        }
      )

      if (!response.ok) {
        // Attempt to extract the server's error message
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to Attach PO`

        throw new Error(errorMessage)
      }
      setIsPODialogOpen(false)
      toast.success(`Attach PO successfully!`)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(`Failed to Attach PO:`, error)
    }
  }, [selectedPO, selectedMachine])

  const handleSetupUtility = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/utility`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machineNumber: selectedMachine?.machineNumber,
            machineLocation: selectedMachine?.locationName,
            machineName: selectedMachine?.machineName,
            state: 'ON',
          }),
        }
      )

      if (!response.ok) {
        // Attempt to extract the server's error message
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to Update Content`

        throw new Error(errorMessage)
      }
      toast.success(`Utility state updated successfully!`)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(`Failed to Update utility state:`, error)
    } finally {
      setIsLoading(false)
    }
    setIsDialogOpen(false)
  }, [selectedMachine])

  const handleTrialMachine = useCallback(async () => {
    setIsLoading(true)
    const machineStatus =
      selectedMachine?.machineStatus == 'TRIAL' ? 'NORMAL' : 'TRIAL'
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trial/${selectedMachine?.machineName}?machineStatus=${machineStatus}&machineLocation=${selectedMachine?.locationName}&machineNumber=${selectedMachine?.machineNumber}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to Update trial machine`
        throw new Error(errorMessage)
      }
      toast.success(`Trial machine updated successfully!`)
      setIsDialogConfigurationOpen(false)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(`Failed to Update trial machine:`, error)
    } finally {
      setIsLoading(false)
      window.location.reload()
    }
  }, [selectedMachine])

  const handleTAOMachine = useCallback(async () => {
    setIsLoading(true)
    const machineStatus =
      selectedMachine?.machineStatus == 'TAO' ? 'NORMAL' : 'TAO'
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/tao/${selectedMachine?.machineName}?machineStatus=${machineStatus}&machineLocation=${selectedMachine?.locationName}&machineNumber=${selectedMachine?.machineNumber}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to Update TAO machine`
        throw new Error(errorMessage)
      }
      toast.success(`TAO machine updated successfully!`)
      setIsDialogConfigurationOpen(false)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(`Failed to Update TAO machine:`, error)
    } finally {
      setIsLoading(false)
      window.location.reload()
    }
  }, [selectedMachine])

  const getBarColor = (
    actual: number,
    target: number,
    target_tolerance: number
  ) => {
    if (actual >= target) return 'bg-green-500'
    if (actual >= target_tolerance) return 'bg-green-500'
    return 'bg-red-500'
  }

  const getCvtColor = (
    actual_cvt: number | null,
    target_cvt: number | null
  ) => {
    if (actual_cvt === null || target_cvt === null || actual_cvt >= target_cvt)
      return 'text-green-500'
    return 'text-red-500'
  }

  const getCtColor = (actual_ct: number | null, target_ct: number | null) => {
    if (actual_ct === null || target_ct === null || actual_ct <= target_ct)
      return 'text-green-500'
    return 'text-red-500'
  }

  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams)

  let queryMachineNumber = searchParams.get('machineNumber') || ''
  let queryLocation = searchParams.get('location') || ''
  let queryRefreshRate = searchParams.get('refresh') || ''
  let queryLiveMode = searchParams.get('isLiveMode') || ''
  const queryDate = searchParams.get('date') || ''
  const queryShift = searchParams.get('shift') || ''
  const loginRedirectTarget = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const loginHref = `/login/?redirect=${encodeURIComponent(loginRedirectTarget)}`

  if (queryMachineNumber == '') {
    queryMachineNumber = '10'
    params.set('machineNumber', '10')
    router.push(`${pathname}?${params.toString()}`)
  }

  if (queryLocation == '') {
    queryLocation = 'INJ Bld G'
    params.set('location', 'INJ Bld G')
    router.push(`${pathname}?${params.toString()}`)
  }
  if (queryRefreshRate == '') {
    queryRefreshRate = '5000'
    params.set('refresh', '5000')
    router.push(`${pathname}?${params.toString()}`)
  }
  if (queryLiveMode == '') {
    queryLiveMode = 'true'
    params.set('isLiveMode', 'true')
    router.push(`${pathname}?${params.toString()}`)
  }

  // if (queryDate == '' ) {
  //   queryDate = ''
  //   params.set('date', '');
  //   router.push(`${pathname}?${params.toString()}`);
  // }
  // if (queryShift == '' ) {
  //   queryShift = ''
  //   params.set('shift', '');
  //   router.push(`${pathname}?${params.toString()}`);
  // }

  useEffect(() => {
    if (queryLocation) {
      setSelectedLocation(queryLocation)
      // console.log(`machine location from query : ${queryLocation}`);
    }
  }, [queryLocation])

  useEffect(() => {
    if (queryMachineNumber) {
      setSelectedMachineNumber(queryMachineNumber)
      // const selected = filteredMachines?.find(
      //   machine => machine.machineNumber === queryMachineNumber
      // );
      const selected = filteredMachines?.find(
        (machine) => machine.machineNumber == queryMachineNumber
      )
      // console.log(`filteredMachines from query: ${JSON.stringify(filteredMachines)}`);
      // console.log(`selected from query: ${JSON.stringify(selected)}`);

      setSelectedMachine(selected || null)
      // console.log(`machine number from query : ${queryMachineNumber}`);
      // console.log(`selected machine from query :`, selected);
    }
  }, [queryMachineNumber, machines, filteredMachines])

  useEffect(() => {
    if (queryRefreshRate) {
      setRefreshRate(queryRefreshRate)
      // console.log(`refreshRate : ${queryRefreshRate}`);
    }
  }, [queryRefreshRate])

  useEffect(() => {
    if (queryLiveMode) {
      if (queryLiveMode == 'true') {
        setIsLiveMode(true)
      } else if (queryLiveMode == 'false') {
        setIsLiveMode(false)
      }
      // console.log(`liveMode : ${queryLiveMode}`);
    }
  }, [queryLiveMode])

  useEffect(() => {
    if (queryDate) {
      setSelectedDate(
        new Date(new Date(queryDate).getTime() + 1000 * 60 * 60 * 24)
      )
      // console.log(`selectedDate : ${queryDate}`);
    }
  }, [queryDate])

  useEffect(() => {
    if (queryShift) {
      setSelectedShift(queryShift)
      // console.log(`selectedShift : ${queryShift}`);
    }
  }, [queryShift])

  const totalActual =
    (Array.isArray(hourlyData) &&
      hourlyData.reduce((total, item) => {
        return total + (item.actual ?? 0)
      }, 0)) ||
    0

  const totalTarget =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => {
        const now = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Jakarta',
        })
        const nowDate = new Date(now)
        const itemFromTime = new Date(
          new Date(item.from_datetime).getTime() - 6 * 60 * 60 * 1000
        ).getTime()
        const nowTime = nowDate.getTime()
        const remainingSeconds = nowDate.getSeconds()
        const remainingMinutes = nowDate.getMinutes() * 60
        return (
          total +
            (itemFromTime < nowTime
              ? item.target_final * (oeeData?.[0]?.targetTolerance || 1)
              : Math.floor(
                  ((item.target_final * (remainingMinutes + remainingSeconds)) /
                    3600) *
                    (oeeData?.[0]?.targetTolerance || 1)
                )) || 0
        )
      }, 0)) ||
    0
  const totalGap = totalActual - totalTarget

  if (error)
    return (
      <ErrorState message="Error loading machines. Please try again later." />
    )
  console.log('Machine Process:', selectedMachine?.Process)
  console.log('Selected Category:', selectedCategoryId)
  console.log('Problems length:', problems?.length)
  problems.forEach((p) => {
    console.log(
      'Problem process raw:',
      JSON.stringify(p.process),
      '| Machine process raw:',
      JSON.stringify(selectedMachine?.Process)
    )
  })
  const renderNooeIndicators = (from_datetime: Date) => {
    const nooeForTime =
      noeeData?.filter((nooe) => {
        // Convert dates to timestamps for comparison
        const hourlyTime = new Date(from_datetime).getTime()
        const nooeTime = new Date(nooe.fromTime).getTime()

        // Calculate the start and end of the hourly period
        const hourStart = hourlyTime
        const hourEnd = hourlyTime + 60 * 60 * 1000 // Add 1 hour in milliseconds

        return nooeTime >= hourStart && nooeTime < hourEnd
      }) || []
    if (nooeForTime.length === 0) return null

    const colorMap = {
      white: 'bg-gray-100 ml-[0px]',
      blue: 'bg-[#118DFF] ml-[10px]',
      red: 'bg-[#FF0000] ml-[20px]',
      orange: 'bg-[#FF7400] ml-[30px]',
      purple: 'bg-[#6A4C93] ml-[40px]',
      yellow: 'bg-[#FFFF00] ml-[50px]',
      grey: 'bg-[#AAAAAA] ml-[60px]',
    }

    return (
      <div className="flex h-12 flex-col gap-[1px] my-0 pt-0 pb-0 mx-0 px-0">
        {nooeForTime.map((nooe) => {
          const activeColor = Object.keys(colorMap).find(
            (color) => nooe[color as keyof typeof nooe] == 1
          )
          return activeColor ? (
            <div
              className={`w-[10px] h-[5px] ${
                colorMap[activeColor as keyof typeof colorMap]
              }`}
            />
          ) : (
            <div className={`w-[10px] h-[5px] ml-0 bg-none my-0 pt-0 pb-0`} />
          )
        })}
      </div>
    )
  }
  const renderIndicatorIcon = (
    icon: (typeof ZHAFIR_INDICATORS)[number]['icon']
  ) => {
    if (typeof icon === 'string' && icon.startsWith('/')) {
      return (
        <img src={icon} alt="indicator" className="w-14 h-14 object-contain" />
      )
    }
    if (icon === '/admin/inj-press.png')
      return <ArrowLeftRight className="w-10 h-10 text-red-500" />
    if (icon === '/admin/End of plastification (dosing).png')
      return <Flag className="w-10 h-10 text-blue-500" />
    if (icon === '/admin/Injection time.png')
      return <Timer className="w-10 h-10 text-green-500" />
    if (icon === '/admin/Switching position.png')
      return <ArrowLeftRight className="w-10 h-10 text-yellow-500" />

    return <CircleDot className="w-10 h-10 text-purple-500" />
  }
  const normalizedLocationName = (
    selectedMachine?.locationName || ''
  ).trim().toLowerCase()
  const normalizedMachineNumber = String(
    selectedMachine?.machineNumber || ''
  ).trim()
  const shouldShowZhafirIndicators =
    normalizedLocationName === 'inj bld g' &&
    ZHAFIR_UI_G_MACHINE_ALLOWLIST.has(normalizedMachineNumber)
  const buildLineSegments = (
    points: ZhafirTrendPoint[],
    pick: (point: ZhafirTrendPoint) => number | null,
    width: number,
    height: number,
    minY: number,
    maxY: number
  ) => {
    const span = Math.max(maxY - minY, 1e-9)
    const stepX = points.length > 1 ? width / (points.length - 1) : width
    const toY = (value: number) => height - ((value - minY) / span) * height
    const segments: string[] = []
    let current: string[] = []

    points.forEach((point, index) => {
      const value = pick(point)
      if (value === null || !Number.isFinite(value)) {
        if (current.length > 1) {
          segments.push(current.join(' '))
        }
        current = []
        return
      }
      const x = index * stepX
      const y = toY(value)
      current.push(`${x},${y}`)
    })

    if (current.length > 1) {
      segments.push(current.join(' '))
    }

    return segments
  }
  const clampTrendY = (
    rawY: number,
    height: number
  ): { y: number; outside: 'low' | 'high' | null } => {
    if (rawY > height) return { y: height - 2, outside: 'low' as const }
    if (rawY < 0) return { y: 2, outside: 'high' as const }
    return { y: rawY, outside: null }
  }
  const buildActualLineSegments = (
    points: ZhafirTrendPoint[],
    width: number,
    height: number,
    minY: number,
    maxY: number,
    withBoundaryAnchors = true
  ) => {
    const span = Math.max(maxY - minY, 1e-9)
    const stepX = points.length > 1 ? width / (points.length - 1) : width
    const toY = (value: number) => height - ((value - minY) / span) * height
    const segments: string[] = []
    let current: string[] = []
    let prevOutside: 'low' | 'high' | null = null

    points.forEach((point, index) => {
      const value = point.value
      if (value === null || !Number.isFinite(value)) {
        if (current.length > 1) segments.push(current.join(' '))
        current = []
        prevOutside = null
        return
      }

      const x = index * stepX
      const rawY = toY(value)
      const { y, outside } = clampTrendY(rawY, height)

      // Add boundary anchors so transitions look diagonal (not vertical jumps).
      if (withBoundaryAnchors && !prevOutside && outside) {
        const prevPoint = current[current.length - 1]
        const prevX = prevPoint ? Number(prevPoint.split(',')[0]) : x
        const targetAnchorX = x - stepX * 0.45
        const anchorX = Math.max(prevX + stepX * 0.12, Math.max(0, targetAnchorX))
        const anchorY = outside === 'low' ? height - 2 : 2
        current.push(`${anchorX},${anchorY}`)
      }

      if (withBoundaryAnchors && prevOutside && !outside) {
        const prevPoint = current[current.length - 1]
        const prevX = prevPoint ? Number(prevPoint.split(',')[0]) : 0
        const targetAnchorX = x - stepX * 0.55
        const anchorX = Math.max(prevX + stepX * 0.15, Math.max(0, targetAnchorX))
        const anchorY = prevOutside === 'low' ? height - 2 : 2
        current.push(`${anchorX},${anchorY}`)
      }

      current.push(`${x},${y}`)
      prevOutside = outside
    })

    if (current.length > 1) {
      segments.push(current.join(' '))
    }

    return segments
  }
  const buildRangeBandPolygons = (
    points: ZhafirTrendPoint[],
    width: number,
    height: number,
    minY: number,
    maxY: number
  ) => {
    const span = Math.max(maxY - minY, 1e-9)
    const stepX = points.length > 1 ? width / (points.length - 1) : width
    const toY = (value: number) => height - ((value - minY) / span) * height
    const polygons: string[] = []
    let upper: string[] = []
    let lower: string[] = []

    points.forEach((point, index) => {
      if (
        point.min === null ||
        point.max === null ||
        !Number.isFinite(point.min) ||
        !Number.isFinite(point.max)
      ) {
        if (upper.length > 1 && lower.length > 1) {
          polygons.push([...upper, ...lower.reverse()].join(' '))
        }
        upper = []
        lower = []
        return
      }

      const x = index * stepX
      const minValue = Math.min(point.min, point.max)
      const maxValue = Math.max(point.min, point.max)
      upper.push(`${x},${toY(maxValue)}`)
      lower.push(`${x},${toY(minValue)}`)
    })

    if (upper.length > 1 && lower.length > 1) {
      polygons.push([...upper, ...lower.reverse()].join(' '))
    }

    return polygons
  }

  return (
    <div className="p-0 space-y-2 w-full">
      <div className="flex gap-4 justify-between items-center">
        {/* Left side - Logo and Building selection */}
        <div className="flex flex-col gap-4">
          <Image
            src={albeaLogo}
            alt="Albea"
            width={150}
            height={100}
            className="px-3 py-2 flex items-center border border-gray-250 rounded-xl text-gray-700 align-middle"
          />
        </div>

        {/* Right side - Machine info and controls */}
        <div className="flex flex-col gap-2 flex-1">
          {/* First row - Machine info */}
          <div className="flex flex-wrap gap-2">
            {/* {isLoading ? (
              <div></div>
            ) : ( */}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedLocation}
                  onValueChange={handleLocationChange}
                >
                  <SelectTrigger className="w-[120px] h-[43px] text-lg text-nowrap">
                    <SelectValue placeholder="Building" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueLocations?.map((locationName) => (
                      <SelectItem
                        key={locationName}
                        value={locationName}
                        className="text-lg text-nowrap"
                      >
                        {locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedMachineNumber}
                  onValueChange={handleMachineNumberChange}
                >
                  <SelectTrigger className="w-[70px] h-[43px] text-lg text-nowrap">
                    <SelectValue placeholder="MchNumber" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMachines?.map((machine) => (
                      <SelectItem
                        key={machine.machineNumber}
                        value={machine.machineNumber}
                        className="text-lg text-nowrap"
                      >
                        {machine.machineNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            {/* // ) } */}

            <Tooltip>
              <TooltipTrigger asChild>
                <Label className="px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle text-base">
                  {selectedMachine?.machineDescription || 'MchDesc'}{' '}
                  {selectedMachine?.machineStatus == 'TRIAL' ? (
                    <Badge variant="secondary" className="ml-2">
                      TRIAL/PM
                    </Badge>
                  ) : null}{' '}
                  {selectedMachine?.machineStatus == 'TAO' ? (
                    <Badge variant="secondary" className="ml-2">
                      TAO
                    </Badge>
                  ) : null}
                </Label>
              </TooltipTrigger>
              <TooltipContent>
                <p> {selectedMachine?.machineName || 'MchID'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Label className="px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle text-base min-w-[390px]">
                  {Array.isArray(hourlyData) &&
                  hourlyData &&
                  hourlyData.filter((data) => data?.itemDesc !== null).length >
                    0
                    ? hourlyData
                        .filter((data) => data?.itemDesc !== null)
                        .slice(-1)[0].itemDesc
                    : 'Material Description'}
                </Label>
              </TooltipTrigger>
              <TooltipContent>
                <p className="">
                  {Array.isArray(hourlyData) &&
                  hourlyData &&
                  hourlyData.filter((data) => data?.itemDesc !== null).length >
                    0
                    ? hourlyData
                        .filter((data) => data?.itemDesc !== null)
                        .slice(-1)[0].itemDesc
                    : 'Material Description'}
                </p>
              </TooltipContent>
            </Tooltip>
            <Label className="px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle text-base">
              PRO
              {taskData && taskData.length > 0
                ? taskData[taskData.length - 1].po_name
                : ' Number'}
            </Label>
            <Button
              onClick={() => setIsPODialogOpen(true)}
              variant="default"
              className="h-[43px]"
            >
              <FilePlus2 className="w-4 h-4 mr-2" />
              PRO
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleOpenParameterSetting}
                  variant={'default'}
                  className="h-[43px]"
                  disabled={!selectedMachine?.machineName}
                >
                  <GearIcon className="w-4 h-4 mr-2" />
                  Param
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {selectedMachine?.machineName
                  ? 'Buka parameter setting untuk mesin ini'
                  : 'Pilih mesin terlebih dahulu'}
              </TooltipContent>
            </Tooltip>
            <Button
              onClick={() => setIsCVTDialogOpen(true)}
              variant="default"
              className="h-[43px]"
            >
              <Pencil className="w-4 h-4 mr-2" />
              CVT
            </Button>
            <Dialog
              open={isDialogConfigurationOpen}
              onOpenChange={setIsDialogConfigurationOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant={'default'}
                  className="h-[43px]"
                  onClick={() => checkUser()}
                >
                  <GearIcon />
                  Config
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configuration Menu</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="rounded-md border p-3 text-xs text-gray-600">
                    Zhafir Temporary Access dinonaktifkan pada konfigurasi saat ini.
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <GearIcon className="w-4 h-4 mr-2" />
                        Turn ON Utility
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Warning</DialogTitle>
                        <DialogDescription>
                          Ini akan mengubah status utility menjadi ON pada mesin{' '}
                          {selectedMachine?.machineDescription}. Apakah anda
                          yakin?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="default"
                          onClick={() => {
                            handleSetupUtility()
                            setIsDialogConfigurationOpen(false)
                          }}
                        >
                          Yes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogConfigurationOpen(false)}
                        >
                          No
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <GearIcon className="w-4 h-4 mr-2" /> Set Machine into{' '}
                        {selectedMachine?.machineStatus == 'TRIAL'
                          ? 'Normal'
                          : 'Trial'}{' '}
                        from{' '}
                        {selectedMachine?.machineStatus
                          ? selectedMachine?.machineStatus
                          : 'Normal'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Warning</DialogTitle>
                        <DialogDescription>
                          Ini akan mengubah status mesin{' '}
                          {selectedMachine?.machineDescription} menjadi{' '}
                          {selectedMachine?.machineStatus == 'TRIAL'
                            ? 'Normal'
                            : 'Trial'}
                          . Apakah anda yakin?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="default"
                          onClick={() => {
                            handleTrialMachine()
                            setIsDialogConfigurationOpen(false)
                          }}
                        >
                          Yes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogConfigurationOpen(false)}
                        >
                          No
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {!userData && (
                    <div className="text-sm text-gray-500">
                      Need more access for admin ? click{' '}
                      <Link href={loginHref} className="text-blue-500">
                        here
                      </Link>{' '}
                      to login
                    </div>
                  )}
                  {userData &&
                    (userData?.role_name == 'admin' ||
                      userData?.role_name == 'admin_premium' ||
                      userData?.role_name == 'admin_lean') && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <GearIcon className="w-4 h-4 mr-2" /> Set Machine
                            into{' '}
                            {selectedMachine?.machineStatus == 'TAO'
                              ? 'Normal'
                              : 'TAO'}{' '}
                            from{' '}
                            {selectedMachine?.machineStatus
                              ? selectedMachine?.machineStatus
                              : 'Normal'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Warning</DialogTitle>
                            <DialogDescription>
                              Ini akan mengubah status mesin{' '}
                              {selectedMachine?.machineDescription} menjadi{' '}
                              {selectedMachine?.machineStatus == 'TAO'
                                ? 'Normal'
                                : 'TAO'}
                              . Apakah anda yakin?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="default"
                              onClick={() => {
                                handleTAOMachine()
                                setIsDialogConfigurationOpen(false)
                              }}
                            >
                              Yes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                setIsDialogConfigurationOpen(false)
                              }
                            >
                              No
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                </div>
              </DialogContent>
            </Dialog>
            <div className="flex items-center space-x-2 border border-gray-250 rounded-md px-3 py-2">
              <Switch
                id="live-mode"
                checked={isLiveMode}
                onCheckedChange={handleLiveMode}
              />
              <Label htmlFor="live-mode">LIVE MODE</Label>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-[43px] w-[43px]"
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                const isHidden = searchParams.get('hideUI') === 'true'
                if (!isHidden) {
                  params.set('hideUI', 'true')
                } else {
                  params.delete('hideUI')
                }
                router.push(`${pathname}?${params.toString()}`)
              }}
            >
              {searchParams.get('hideUI') === 'true' ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>

            {!isLiveMode && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[155px] justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {selectedDate ? (
                        format(
                          new Date(
                            selectedDate.getTime() - 1000 * 60 * 60 * 24
                          ),
                          'PPP'
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24)
                      }
                      onSelect={(selectedDate) =>
                        handleDateSelect(
                          new Date(
                            selectedDate!.getTime() + 1000 * 60 * 60 * 24
                          )
                        )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Select value={selectedShift} onValueChange={handleShiftSelect}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftList?.map((shift) => (
                      <SelectItem key={shift} value={shift}>
                        Shift {shift}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <div className="relative inline-block w-48">
              <Button
                onClick={() =>
                  setOpenCell(openCell === 'row1-col2' ? null : 'row1-col2')
                }
                className={`h-[43px] px-4 bg-black text-white flex items-center justify-between w-full
          ${openCell === 'row1-col2' ? 'rounded-t-md' : 'rounded-md'}
        `}
              >
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {selectedUsers['row1-col2'] || 'Operator'}
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200
                  ${openCell === 'row1-col2' ? 'rotate-180' : ''}
                `}
                />
              </Button>

              {/* Dropdown */}
              {openCell === 'row1-col2' && (
                <div className="absolute top-full left-0 w-full bg-black text-white rounded-b-md shadow z-20">
                  {/* Search */}
                  <div className="p-2 border-b border-gray-700">
                    <input
                      type="text"
                      placeholder="Cari user..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-2 py-1 text-sm bg-gray-900 text-white rounded outline-none"
                    />
                  </div>

                  {/* List */}
                  <div className="max-h-20 overflow-y-auto">
                    {search.length > 0 &&
                      (filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <div
                            key={u}
                            onClick={() => {
                              setSelectedUsers((prev) => ({
                                ...prev,
                                ['row1-col2']: u,
                              }))
                              setOpenCell(null)
                              setSearch('')
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-700 flex items-center"
                          >
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            {u}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-400 text-sm">
                          User tidak ditemukan
                        </div>
                      ))}
                  </div>
                  {/* <div className="max-h-32 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <div
                            key={u}
                            onClick={() => {
                              setSelectedUsers((prev) => ({
                                ...prev,
                                ['row1-col2']: u,
                              }))
                              setOpenCell(null)
                              setSearch('')
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-700 flex items-center"
                          >
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            {u}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-400 text-sm">
                          User tidak ditemukan
                        </div>
                      )}
                    </div> */}
                </div>
              )}
            </div>
            <div className="flex items-start gap-2">
              {shouldShowZhafirIndicators ? (
                <div className="-mt-[1px] flex items-start gap-3 overflow-x-auto pb-1">
                  {ZHAFIR_INDICATORS.map((indicator) => {
                    const indicatorStatus =
                      zhafirIndicatorStatusMap?.[indicator.field] ??
                      ({
                        status: 'unknown',
                        std: null,
                        act: null,
                        min: null,
                        max: null,
                      } as ZhafirIndicatorStatus)

                    const isTooLow = indicatorStatus.status === 'too_low'
                    const isTooHigh = indicatorStatus.status === 'too_high'
                    const isOutOfRange = isTooLow || isTooHigh
                    const isInRange = indicatorStatus.status === 'in_range'

                    const caption = isTooLow
                      ? 'Too low'
                      : isTooHigh
                        ? 'Too high'
                        : isInRange
                          ? 'In a range'
                          : 'Data not found'

                    return (
                      <div
                        key={indicator.field}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openZhafirIndicatorTrend(indicator, indicatorStatus)
                        }
                        className={`flex-none h-[72px] min-w-[220px] rounded-lg border px-3 py-2 ${
                          isOutOfRange
                            ? 'animate-alertBlink border-red-500'
                            : isInRange
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-gray-300 bg-gray-50'
                        } cursor-pointer`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white">
                            {renderIndicatorIcon(indicator.icon)}
                          </div>

                          <div className="flex flex-col leading-tight">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                              {indicator.label}
                            </div>

                            <div
                              className={`text-sm font-semibold ${
                                isOutOfRange
                                  ? 'text-red-700'
                                  : isInRange
                                    ? 'text-emerald-700'
                                    : 'text-gray-700'
                              }`}
                            >
                              {caption}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {/* Second row - Controls
          <div className="flex flex-wrap gap-2">
            
          </div> */}
        </div>
      </div>
      {selectedMachine === null && isLoading == false ? (
        <div className="text-center">Please select machine...</div>
      ) : (
        <div className="flex gap-2 md:grid-cols-2 lg:grid-cols-4 text-center h-32 w-full mb-2">
          <Card className="p-0">
            <CardHeader className="text-lg font-bold text-nowrap p-0 flex items-center justify-center gap-2 space-y-0 flex-row pb-2">
              Production Output
              <p className="text-lg font-bold text-green-500">
                OOE = {(oeeData?.[0]?.targetTolerance || 0) * 100}%
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 p-2 pr-4">
              <div>
                <div className="text-4xl font-bold text-black">
                  {Math.floor(totalTarget)}
                </div>
                <div className="text-lg ">Target</div>
              </div>
              <div>
                <div className={`text-4xl font-bold text-black`}>
                  {totalActual}
                </div>
                <div className="text-lg ">Actual</div>
              </div>

              <div>
                <div
                  className={`text-4xl font-bold ${
                    totalGap < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {Math.abs(totalGap).toFixed(0)}
                </div>
                <div className="text-lg ">Delta</div>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setIsCVTDialogOpen(true)}>
            <CardHeader className="py-2 text-lg font-bold p-0 pb-2">
              Cavities
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 p-2 pr-4">
              <div>
                <div className="text-4xl font-bold">
                  {taskData?.[0]?.target_cvt || 0}
                </div>
                <div className="text-lg ">Target</div>
              </div>
              <div>
                <div
                  className={`text-4xl font-bold ${getCvtColor(
                    taskData?.[0]?.actual_cvt ?? 0,
                    taskData?.[0]?.target_cvt ?? 0
                  )}`}
                >
                  {taskData?.[0]?.actual_cvt ?? 0}
                </div>
                <div className="text-lg ">Actual</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2 text-lg font-bold p-0 pb-0">
              Cycle Time <p className="text-xs font-normal">(in second)</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 p-2 pb-0 pt-0 pr-4">
              <div>
                <div className="text-4xl font-bold">
                  {taskData?.[0]?.target_ct.toFixed(1) ?? 0.0}
                </div>
                <div className="text-lg ">Target</div>
              </div>
              <div>
                <div
                  className={`text-4xl font-bold ${getCtColor(
                    taskData?.[0]?.actual_ct ?? 0,
                    taskData?.[0]?.target_ct ?? 0
                  )}`}
                >
                  {taskData?.[0]?.actual_ct.toFixed(1) ?? 0.0}
                </div>
                <div className="text-lg ">Actual</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2 text-lg font-bold text-black text-nowrap p-0 pb-1">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-red-500 px-8">
                  Non O.O.E
                </div>
                <div className="text-lg font-bold text-black px-2 mr-8 pt-1 bg-green-500 rounded-md">
                  OK
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 p-2 pb-0">
              <div>
                <div className="text-4xl font-bold text-red-500">
                  {((oeeData?.[0]?.breakdownperc || 0) * 100.0).toFixed(1)}%
                </div>
              </div>
              <div>
                <div
                  className={`text-4xl font-bold ${
                    (oeeData?.[0]?.ooe || 0) * 100.0 >
                    (oeeData?.[0]?.targetTolerance || 0) * 100.0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {((oeeData?.[0]?.ooe || 0) * 100.0).toFixed(1)}%
                </div>
              </div>
            </CardContent>
            {/* <div className="text-lg text-right pr-4">
            Target {(oeeData?.[0]?.targetYearly || 0).toFixed(1)}%</div> */}
          </Card>

          <Card className="w-1/2 pb-0">
            <CardHeader className="py-2 text-lg font-bold p-0 pb-4 flex">
              Downtime (in minutes)
            </CardHeader>
            <CardContent className="grid grid-cols-7 p-2 pb-0 pt-0 w-full">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <div className="text-4xl font-bold">
                        {((oeeData?.[0]?.white || 0) * 60.0).toFixed(0) || 0}'
                      </div>
                      <div className="text-xl text-black bg-white border border-black  px-2 pt-1 pb-0 rounded-l-md">
                        PS
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="">Planned Stoppage</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <div className="text-4xl font-bold text-[#118DFF]">
                        {((oeeData?.[0]?.blue || 0) * 60.0).toFixed(0) || 0}'
                      </div>
                      <div className="text-xl text-white bg-[#118DFF] border border-black  px-2 pt-1 pb-0">
                        C/O
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="">Change Over</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <div className="text-4xl font-bold text-[#FF0000] px-0">
                        {((oeeData?.[0]?.red || 0) * 60.0).toFixed(0) || 0}'
                      </div>
                      <div className="text-xl text-white bg-[#FF0000] border border-black  px-2 pt-1 pb-0">
                        NQ
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="">Non Quality</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <div className="text-4xl font-bold text-[#FF7400]">
                        {((oeeData?.[0]?.orange || 0) * 60.0).toFixed(0) || 0}'
                      </div>
                      <div className="text-xl text-white bg-[#FF7400] border border-black  px-2 pt-1 pb-0">
                        BD
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="">Breakdown</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <div className="text-4xl font-bold text-[#6A4C93]">
                        {((oeeData?.[0]?.purple || 0) * 60.0).toFixed(0) || 0}'
                      </div>
                      <div className="text-xl text-white bg-[#6A4C93] border border-black  px-2 pt-1 pb-0">
                        OP
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="">Organizational Disfunction</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="">
                      <div className="text-4xl font-bold text-black px-0">
                        {((oeeData?.[0]?.yellow || 0) * 60.0).toFixed(0) || 0}'
                      </div>
                      <div className="text-xl text-black bg-[#FFFF00] border border-black  px-2 pt-1 pb-0">
                        SD
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="">Slow Down</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="">
                      <div className="text-4xl font-bold text-[#AAAAAA] px-0">
                        {((oeeData?.[0]?.grey || 0) * 60.0).toFixed(0) || 0}'
                      </div>
                      <div className="text-xl text-white bg-[#AAAAAA] border border-black  px-2 pt-1 pb-0 rounded-r-md">
                        UC
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="">Unclassified</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedMachine === null ? null : (
        <div className="p-0 w-full space-y-2 justify-between flex flex-col">
          <TooltipProvider>
            <Card className="w-full">
              <CardContent className="pb-0">
                <div className="w-full flex overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px] text-lg text-nowrap font-bold text-black border border-r-1 border-l-0 border-t-0 border-gray-300">
                          Time
                        </TableHead>
                        <TableHead className="w-[60px] text-lg text-nowrap font-bold text-black border border-r-1 border-l-0 border-t-0 border-gray-300">
                          ItemNo
                        </TableHead>
                        <TableHead className="w-[60px] text-lg text-nowrap font-bold text-black border border-r-1 border-l-0 border-t-0 border-gray-300">
                          Target
                        </TableHead>
                        <TableHead className="w-[50px] text-lg text-nowrap font-bold text-black text-right border border-r-1 border-l-0 border-t-0 border-gray-300">
                          Actual
                        </TableHead>
                        <TableHead className="w-[250px] text-left text-lg text-nowrap font-bold text-green-500 flex items-center justify-center ">
                          OOE 100% ⸺ /{' '}
                          {(oeeData?.[0]?.targetTolerance || 0) * 100}% - - -
                        </TableHead>
                        <TableHead className="w-[60px] text-lg text-nowrap font-bold text-black border border-r-1 border-l-0 border-t-0 border-gray-300">
                          Delta
                        </TableHead>
                        <TableHead className="w-[60px] text-center text-lg text-nowrap font-bold text-black border border-r-1 border-l-0 border-t-0 border-gray-300">
                          Scrap
                        </TableHead>
                        <TableHead className="w-[60px] text-center text-lg text-nowrap font-bold text-black border border-r-1 border-l-0 border-t-0 border-gray-300">
                          Rework
                        </TableHead>
                        <TableHead className="text-center border border-r-1 border-l-1 border-t-0 border-b-0 text-lg text-nowrap font-bold text-black px-0 gap-0 mx-0">
                          NOOE
                          <div className="flex grid-cols-7 items-center justify-center gap-0 mx-0 px-0">
                            <div className="bg-gray-100 w-[10px] h-[5px] mb-0" />
                            <div className="bg-[#118DFF] w-[10px] h-[5px] mb-0" />
                            <div className="bg-[#FF0000] w-[10px] h-[5px] mb-0" />
                            <div className="bg-[#FF7400] w-[10px] h-[5px] mb-0" />
                            <div className="bg-[#6A4C93] w-[10px] h-[5px] mb-0" />
                            <div className="bg-[#FFFF00] w-[10px] h-[5px] mb-0" />
                            <div className="bg-[#AAAAAA] w-[10px] h-[5px] mb-0" />
                          </div>
                        </TableHead>
                        <TableHead className="w-[350px] max-w-[350px] border border-r-1 border-l-0 border-t-0 border-gray-300 text-lg nowrap font-bold text-black">
                          Causes
                        </TableHead>
                        <TableHead className="w-[350px] max-w-[350px]  text-lg nowrap font-bold text-black">
                          Comments/Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="pb-0 ">
                      {Array.isArray(hourlyData) && hourlyData?.length === 0 ? (
                        <TableRow className="h-12 ">
                          <TableCell
                            colSpan={10}
                            className="text-center text-lg text-nowrap  text-black"
                          >
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        hourlyData?.map((row, index) => {
                          const now = new Date().toLocaleString('en-US', {
                            timeZone: 'Asia/Jakarta',
                          })
                          const nowDate = new Date(now)
                          const remainingSeconds = nowDate.getSeconds()
                          const remainingMinutes = nowDate.getMinutes() * 60
                          const to_datetime = new Date(
                            new Date(row.from_datetime).getTime() -
                              6 * 60 * 60 * 1000
                          )
                          let textAnimation = 'animate-pulse'
                          var target_show = 0
                          var target_show_100 = 0
                          if (to_datetime < nowDate || row.target == 0) {
                            console.log(
                              'to_datetime < nowDate',
                              to_datetime,
                              nowDate
                            )
                            target_show = Math.floor(
                              row.target_final *
                                (oeeData?.[0]?.targetTolerance || 1)
                            )
                            target_show_100 = row.target_final
                            textAnimation = ''
                          } else {
                            console.log(
                              'to_datetime > nowDate',
                              to_datetime,
                              nowDate
                            )
                            textAnimation = 'animate-pulse'
                            target_show = Math.floor(
                              ((row.target_final *
                                (remainingMinutes + remainingSeconds)) /
                                3600) *
                                (oeeData?.[0]?.targetTolerance || 1)
                            )
                            target_show_100 = Math.floor(
                              (row.target_final *
                                (remainingMinutes + remainingSeconds)) /
                                3600
                            )
                          }

                          var delta = row.actual - target_show
                          // if(delta < 0){
                          //   delta = 0;
                          // }
                          return (
                            <TableRow
                              className={`h-[56px] ${
                                index === (hourlyData?.length ?? 0) - 1
                                  ? 'border-b border-black'
                                  : ''
                              }`}
                              key={row.time}
                            >
                              <TableCell className="h-full text-xl text-nowrap text-black">
                                {row.time}
                              </TableCell>
                              <TableCell className="h-full text-xl text-nowrap text-black">
                                {row.itemNo}
                              </TableCell>
                              <TableCell
                                className={`text-center h-full text-xl text-nowrap text-black border border-r-0 border-l-1 border-t-0 border-b-0 border-gray-300${textAnimation}`}
                              >
                                {target_show}
                              </TableCell>
                              <TableCell
                                className={`text-center w-[60px] h-full text-xl text-nowrap text-black border border-r-0 border-l-1 border-t-0 border-b-0 border-gray-300  ${textAnimation} ${
                                  row.actual >= target_show
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }`}
                              >
                                {row.actual}
                              </TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <TableCell className="relative overflow-hidden h-full">
                                    <div className="flex items-center h-full w-full">
                                      {(() => {
                                        const maxValue =
                                          hourlyData?.reduce(
                                            (max, item) =>
                                              Math.max(
                                                max,
                                                item.actual,
                                                target_show_100 * 1.1
                                              ),
                                            0
                                          ) || 100
                                        return (
                                          <>
                                            <div
                                              className={`absolute inset-0 h-full rounded ${textAnimation} ${getBarColor(
                                                row.actual,
                                                row.target,
                                                target_show
                                              )}`}
                                              style={{
                                                width: `${Math.min(
                                                  (row.actual / maxValue) * 100,
                                                  100
                                                )}%`, // Ensure accurate scaling
                                                // maxWidth: "260px",
                                              }}
                                            />
                                            <div
                                              className="absolute inset-0 h-full w-[1px] border-dashed border-r-4 border-green-600"
                                              style={{
                                                left: `${Math.min(
                                                  (target_show / maxValue) *
                                                    100,
                                                  100
                                                )}%`, // Accurate tolerance position
                                              }}
                                            />
                                            <div
                                              className="absolute inset-0 h-full w-[1px] border-r-4 border-green-600"
                                              style={{
                                                left: `${Math.min(
                                                  (target_show_100 / maxValue) *
                                                    100,
                                                  100
                                                )}%`, // Accurate target position
                                              }}
                                            />
                                          </>
                                        )
                                      })()}
                                      {/* <span className={`relative z-10 ml-2 text-xl text-nowrap  text-black ${row.actual >= row.target_tolerance ? "text-black" : "text-white"}`}>{row.actual}</span> */}
                                    </div>
                                  </TableCell>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>- - - Target : {target_show}</p>
                                  <p>⸺ Target : {target_show_100}</p>
                                </TooltipContent>
                              </Tooltip>

                              <TableCell
                                className={`text-xl text-nowrap  text-black ${
                                  delta >= 0 ? 'text-green-600' : 'text-red-600'
                                } border border-r-1 border-b-0 border-l-0 border-gray-300`}
                              >
                                {Math.abs(delta).toFixed(0)}
                              </TableCell>
                              <TableCell
                                className="h-[43px] border border-r-1 border-b-0 border-l-0 border-gray-300 text-center text-xl text-nowrap text-black cursor-pointer"
                                onClick={() => {
                                  setSelectedHourlyId(row.hourlyId)
                                  setCurrentScrap(row.scrap)
                                  setEditedScrap(row.scrap)
                                  setIsSCRAPDialogOpen(true)
                                }}
                              >
                                {row.scrap}
                              </TableCell>
                              <TableCell
                                className="h-[43px] border border-r-1 border-b-0 border-l-0 border-gray-300 text-center text-xl text-nowrap text-black cursor-pointer"
                                onClick={() => {
                                  setSelectedHourlyId(row.hourlyId)
                                  setCurrentRework(row.rework)
                                  setEditedRework(row.rework)
                                  setIsREWORKDialogOpen(true)
                                }}
                              >
                                {row.rework}
                              </TableCell>
                              {/* <TableCell
                                className="text-center text-xl text-nowrap text-black"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const newValue = Number(
                                    e.currentTarget.innerText
                                  )
                                  row.scrap = isNaN(newValue)
                                    ? row.scrap
                                    : newValue
                                }}
                              >
                                {row.scrap}
                              </TableCell>

                              <TableCell
                                className="text-center text-xl text-nowrap text-black"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const newValue = Number(
                                    e.currentTarget.innerText
                                  )
                                  row.rework = isNaN(newValue)
                                    ? row.rework
                                    : newValue
                                }}
                              >
                                {row.rework}
                              </TableCell> */}
                              <TableCell className="w-[70px] py-0 h-full border border-r-1 border-l-1 border-b-0 border-gray-300">
                                {renderNooeIndicators(row.from_datetime)}
                              </TableCell>
                              <TableCell
                                onClick={() =>
                                  handleCellClick(
                                    index,
                                    row.hourlyId,
                                    'causes',
                                    row.causes,
                                    row.problem
                                  )
                                }
                                className="w-[350px] max-w-[350px] border border-r border-l border-t-0 border-b-0 border-gray-300 cursor-pointer"
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-2xl overflow-hidden  text-ellipsis whitespace-nowrap text-nowrap">
                                      {row.problem && row.causes
                                        ? row.problem + ' ' + row.causes
                                        : row.causes
                                          ? row.causes
                                          : row.problem
                                            ? row.problem
                                            : ''}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {row.problem && row.causes
                                        ? row.problem + ' ' + row.causes
                                        : row.causes
                                          ? row.causes
                                          : row.problem
                                            ? row.problem
                                            : 'Click to add causes'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell
                                onClick={() =>
                                  handleCellClick(
                                    index,
                                    row.hourlyId,
                                    'comments',
                                    row.comments,
                                    row.action
                                  )
                                }
                                className="w-[350px] max-w-[350px] border border-r border-1 border-t-0 border-b-0 border-gray-300 cursor-pointer"
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-2xl overflow-hidden  text-ellipsis whitespace-nowrap text-nowrap">
                                      {row.action && row.comments
                                        ? row.action + ' ' + row.comments
                                        : row.comments
                                          ? row.comments
                                          : row.action
                                            ? row.action
                                            : ''}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {row.action && row.comments
                                        ? row.action + ' ' + row.comments
                                        : row.comments
                                          ? row.comments
                                          : row.action
                                            ? row.action
                                            : 'Click to add comments'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                      {hourlyData && hourlyData.length > 0 && (
                        <TableRow className="h-12 pb-1 border-t border-black">
                          <TableCell colSpan={4}></TableCell>
                          <TableCell className="w-[250px]"></TableCell>
                          <TableCell className="text-nowrap font-bold text-black">
                            <div
                              className={`text-xl text-nowrap font-bold ${
                                totalActual - totalTarget >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {Math.abs(totalActual - totalTarget).toFixed(0)}
                            </div>
                          </TableCell>
                          <TableCell className=" text-nowrap font-bold text-black">
                            <div className="text-xl text-center text-nowrap font-bold text-black">
                              {hourlyData?.reduce(
                                (acc, row) => acc + row.scrap,
                                0
                              ) || 0}
                            </div>
                          </TableCell>
                          <TableCell className=" text-nowrap font-bold text-black">
                            <div className="text-xl text-center text-nowrap font-bold text-black">
                              {hourlyData?.reduce(
                                (acc, row) => acc + row.rework,
                                0
                              ) || 0}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TooltipProvider>

          {/* <div className="flex gap-2">
          
        </div> */}
          {selectedMachine?.machineName ? (
            stateData != undefined &&
            stateData.length > 0 &&
            hourlyData != undefined &&
            hourlyData.length > 0 ? (
              <div className="w-full  rounded-xl shadow-md border-2 border-gray-250">
                <ChangeState
                  data={stateData}
                  isLive={isLiveMode}
                  onStateClick={handleStateClick}
                />
              </div>
            ) : (
              <></>
            )
          ) : (
            //   <iframe
            //   src={`${process.env.NEXT_PUBLIC_GRAFANA_STATE}?orgId=1&var-MchID=${selectedMachine.machineName}&from=${from}&to=${to}&panelId=23&theme=light`}
            //   width="100%"
            //   height="100"
            // ></iframe>
            <></>
          )}

          <Dialog
            open={isZhafirTrendDialogOpen}
            onOpenChange={(open) => {
              setIsZhafirTrendDialogOpen(open)
              if (!open) {
                setIsTrendChartFullscreen(false)
                setZhafirTrendZoom(1)
              }
            }}
          >
            <DialogContent
              className={`${
                isTrendChartFullscreen
                  ? 'w-[99vw] max-w-[99vw] h-[96vh]'
                  : 'w-[96vw] max-w-6xl'
              } rounded-2xl border-slate-200 bg-gradient-to-b from-white to-slate-50`}
            >
              <DialogHeader>
                <DialogTitle>
                  SPC Trend ({zhafirTrendHoursBack}h) -{' '}
                  {selectedTrendIndicator?.label || '-'}
                </DialogTitle>
                <DialogDescription className="p-0 m-0">
                  Line chart actual dengan batas min/max dari
                  MachineParameterSettingSTD.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-3 bg-green-500 text-white"
                  onClick={handleExportTrendExcel}
                >
                  Export Excel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() => setIsTrendChartFullscreen((prev) => !prev)}
                >
                  {isTrendChartFullscreen ? (
                    <>
                      <Minimize className="mr-1 h-4 w-4" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize className="mr-1 h-4 w-4" />
                      Fullscreen
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() =>
                    setZhafirTrendZoom((prev) =>
                      Number(Math.min(prev * 1.25, 6).toFixed(2))
                    )
                  }
                >
                  <ZoomIn className="mr-1 h-4 w-4" />
                  Zoom In
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() =>
                    setZhafirTrendZoom((prev) =>
                      Number(Math.max(prev / 1.25, 1).toFixed(2))
                    )
                  }
                >
                  <ZoomOut className="mr-1 h-4 w-4" />
                  Zoom Out
                </Button>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                  Zoom {zhafirTrendZoom.toFixed(2)}x
                </span>
                <Input
                  type="date"
                  className="h-8 w-[140px]"
                  value={
                    selectedDate instanceof Date
                      ? format(selectedDate, 'yyyy-MM-dd')
                      : ''
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    if (!value) return
                    const parsedDate = new Date(`${value}T00:00:00`)
                    if (Number.isNaN(parsedDate.getTime())) return
                    setSelectedDate(parsedDate)
                    if (selectedTrendIndicator) {
                      openZhafirIndicatorTrend(
                        selectedTrendIndicator,
                        zhafirIndicatorStatusMap?.[
                          selectedTrendIndicator.field
                        ],
                        zhafirTrendHoursBack,
                        value
                      )
                    }
                  }}
                />
                <Button
                  type="button"
                  variant={zhafirTrendHoursBack === 8 ? 'default' : 'outline'}
                  className="h-8 px-3"
                  onClick={() => {
                    setZhafirTrendHoursBack(8)
                    if (selectedTrendIndicator) {
                      openZhafirIndicatorTrend(
                        selectedTrendIndicator,
                        zhafirIndicatorStatusMap?.[
                          selectedTrendIndicator.field
                        ],
                        8
                      )
                    }
                  }}
                >
                  Last 8h
                </Button>
                <Button
                  type="button"
                  variant={zhafirTrendHoursBack === 24 ? 'default' : 'outline'}
                  className="h-8 px-3"
                  onClick={() => {
                    setZhafirTrendHoursBack(24)
                    if (selectedTrendIndicator) {
                      openZhafirIndicatorTrend(
                        selectedTrendIndicator,
                        zhafirIndicatorStatusMap?.[
                          selectedTrendIndicator.field
                        ],
                        24
                      )
                    }
                  }}
                >
                  Last 24h
                </Button>
              </div>

              {isLoadingZhafirTrend ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Loading trend...
                </div>
              ) : zhafirTrendError ? (
                <div className="py-8 text-center text-sm text-red-600">
                  {zhafirTrendError}
                </div>
              ) : (
                (() => {
                  const chartWidth = isTrendChartFullscreen ? 1780 : 1220
                  const chartHeight = isTrendChartFullscreen ? 760 : 410
                  const marginLeft = 68
                  const marginRight = 22
                  const marginTop = 20
                  const marginBottom = 60
                  const plotWidth = chartWidth - marginLeft - marginRight
                  const plotHeight = chartHeight - marginTop - marginBottom
                  const allYValues = zhafirTrendPoints
                    .flatMap((point) => [point.value, point.std, point.min, point.max])
                    .filter((value): value is number => value !== null)
                  const controlYValues = zhafirTrendPoints
                    .flatMap((point) => [point.std, point.min, point.max])
                    .filter((value): value is number => value !== null)

                  const rawMin =
                    allYValues.length > 0 ? Math.min(...allYValues) : 0
                  const rawMax =
                    allYValues.length > 0 ? Math.max(...allYValues) : 1
                  const controlMin =
                    controlYValues.length > 0 ? Math.min(...controlYValues) : rawMin
                  const controlMax =
                    controlYValues.length > 0 ? Math.max(...controlYValues) : rawMax
                  const axisConfig =
                    selectedTrendIndicator?.field !== undefined
                      ? ZHAFIR_Y_AXIS_CONFIG[selectedTrendIndicator.field]
                      : ({
                          decimals: 1,
                          minTickStep: 0.1,
                          minPaddingAbs: 0.05,
                          tickCount: 5,
                          clampMinZero: true,
                        } as ZhafirYAxisConfig)
                  const effectiveStep =
                    axisConfig.tickStep ?? axisConfig.minTickStep
                  const valueSpan = Math.max(controlMax - controlMin, effectiveStep)
                  const padding = Math.max(
                    valueSpan * 0.2,
                    axisConfig.minPaddingAbs
                  )
                  const paddedMin = axisConfig.clampMinZero
                    ? Math.max(0, controlMin - padding)
                    : controlMin - padding
                  const paddedMax = controlMax + padding
                  let yTicks = buildNiceTicks(
                    paddedMin,
                    paddedMax,
                    axisConfig.tickCount,
                    axisConfig.minTickStep,
                    axisConfig.tickStep,
                    axisConfig.maxTicks ?? 10
                  )
                  const stdReference =
                    zhafirTrendPoints.find((point) => point.std !== null)?.std ??
                    null
                  const minReference =
                    zhafirTrendPoints.find((point) => point.min !== null)?.min ??
                    null
                  const maxReference =
                    zhafirTrendPoints.find((point) => point.max !== null)?.max ??
                    null

                  // Keep baseline scale aligned to STD/min/max for each parameter.
                  // Zoom controls can be used to inspect outliers in detail.

                  if (allYValues.length > 0 && yTicks.length > 1) {
                    const minData = Math.min(...allYValues)
                    const maxData = Math.max(...allYValues)
                    const step =
                      yTicks.length > 1 ? yTicks[1] - yTicks[0] : effectiveStep
                    let start = yTicks[0]
                    let end = yTicks[yTicks.length - 1]
                    if (axisConfig.lockStdWindow) {
                      const headroom = Math.max(axisConfig.outlierHeadroom ?? 0, 0)
                      while (minData < start - headroom) {
                        start -= step
                      }
                      while (maxData > end + headroom) {
                        end += step
                      }
                    } else {
                      // Keep control lines (STD/min/max) and outliers visible together
                      // by expanding the window, not shifting it upward.
                      while (minData < start) {
                        start -= step
                      }
                      while (maxData > end) {
                        end += step
                      }
                    }

                    yTicks = Array.from({ length: yTicks.length }, (_, i) =>
                      Number((start + i * step).toFixed(12))
                    )
                    if (axisConfig.lockStdWindow) {
                      while (yTicks[yTicks.length - 1] < maxData + (axisConfig.outlierHeadroom ?? 0)) {
                        yTicks.push(
                          Number(
                            (
                              yTicks[yTicks.length - 1] +
                              step
                            ).toFixed(12)
                          )
                        )
                      }
                    }
                  }

                  let yMin = yTicks[0] ?? paddedMin
                  let yMax = yTicks[yTicks.length - 1] ?? paddedMax
                  if (zhafirTrendZoom > 1 && yMax > yMin) {
                    const center = stdReference ?? (yMin + yMax) / 2
                    const zoomStepFloor = Math.pow(
                      10,
                      -Math.max(axisConfig.decimals, 0)
                    )
                    const zoomTickStep = Math.max(
                      effectiveStep / zhafirTrendZoom,
                      zoomStepFloor
                    )
                    const halfSpan = Math.max(
                      (yMax - yMin) / (2 * zhafirTrendZoom),
                      zoomTickStep * 1.5
                    )
                    let zoomMin = center - halfSpan
                    let zoomMax = center + halfSpan
                    const controlReferences = [
                      minReference,
                      stdReference,
                      maxReference,
                    ].filter((value): value is number => value !== null)
                    if (controlReferences.length > 0) {
                      const controlMinRef = Math.min(...controlReferences)
                      const controlMaxRef = Math.max(...controlReferences)
                      zoomMin = Math.min(zoomMin, controlMinRef - zoomTickStep)
                      zoomMax = Math.max(zoomMax, controlMaxRef + zoomTickStep)
                    }
                    if (axisConfig.clampMinZero) {
                      zoomMin = Math.max(0, zoomMin)
                    }
                    if (zoomMax <= zoomMin) {
                      zoomMax = zoomMin + effectiveStep * 3
                    }

                    yTicks = buildNiceTicks(
                      zoomMin,
                      zoomMax,
                      axisConfig.tickCount,
                      zoomTickStep,
                      zoomTickStep,
                      axisConfig.maxTicks ?? 10
                    )
                    yMin = yTicks[0] ?? zoomMin
                    yMax = yTicks[yTicks.length - 1] ?? zoomMax
                  }
                  const ySpan = Math.max(yMax - yMin, effectiveStep)
                  const hasZeroTick = yTicks.some(
                    (tick) => Math.abs(tick) < Math.max(effectiveStep, 1e-6) * 0.5
                  )
                  const showForcedZeroAxisLabel =
                    Boolean(axisConfig.forceZeroAxisLabel) && !hasZeroTick
                  const stepX =
                    zhafirTrendPoints.length > 1
                      ? plotWidth / (zhafirTrendPoints.length - 1)
                      : plotWidth
                  const toY = (value: number) =>
                    plotHeight - ((value - yMin) / ySpan) * plotHeight
                  const valueDecimals = axisConfig.decimals
                  const controlAxisLabelsRaw = [
                    {
                      key: 'min',
                      label: 'Min',
                      value: minReference,
                      color: '#ef4444',
                    },
                    {
                      key: 'std',
                      label: 'Nominal',
                      value: stdReference,
                      color: '#16a34a',
                    },
                    {
                      key: 'max',
                      label: 'Max',
                      value: maxReference,
                      color: '#ef4444',
                    },
                  ]
                    .filter((item) => item.value !== null)
                    .map((item) => ({
                      ...item,
                      y: toY(item.value as number),
                    }))
                    .filter((item) => Number.isFinite(item.y))
                    .sort((a, b) => a.y - b.y)
                  const controlAxisLabels: Array<{
                    key: string
                    label: string
                    value: number
                    color: string
                    y: number
                  }> = controlAxisLabelsRaw.map((item) => ({
                    key: item.key,
                    label: item.label,
                    value: item.value as number,
                    color: item.color,
                    y: item.y,
                  }))
                  const isNearControlLabel = (y: number) =>
                    controlAxisLabels.some(
                      (item) => Math.abs(item.y - y) < 12
                    )
                  // const xLabelStep = zhafirTrendPoints.length > 12 ? 2 : 1

                  const actualSegments = buildActualLineSegments(
                    zhafirTrendPoints,
                    plotWidth,
                    plotHeight,
                    yMin,
                    yMax,
                    zhafirTrendZoom <= 1.5
                  )
                  const rangeBandPolygons = buildRangeBandPolygons(
                    zhafirTrendPoints,
                    plotWidth,
                    plotHeight,
                    yMin,
                    yMax
                  )
                  const hasFixedRangeBand =
                    minReference !== null && maxReference !== null
                  const fixedRangeTop = hasFixedRangeBand
                    ? toY(Math.max(minReference as number, maxReference as number))
                    : 0
                  const fixedRangeBottom = hasFixedRangeBand
                    ? toY(Math.min(minReference as number, maxReference as number))
                    : 0
                  return (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                        <svg
                          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                          className={`${isTrendChartFullscreen ? 'h-[72vh]' : 'h-[460px]'} w-full`}
                          role="img"
                          aria-label="SPC trend chart"
                        >
                          <defs>
                            <linearGradient
                              id="actualAreaGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#ffffff"
                                stopOpacity="0.24"
                              />
                              <stop
                                offset="100%"
                                stopColor="#ffffff"
                                stopOpacity="0.03"
                              />
                            </linearGradient>
                            <filter
                              id="lineGlow"
                              x="-30%"
                              y="-30%"
                              width="160%"
                              height="160%"
                            >
                              <feGaussianBlur
                                stdDeviation="2.4"
                                result="blur"
                              />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <g
                            transform={`translate(${marginLeft},${marginTop})`}
                          >
                            {hasFixedRangeBand ? (
                              <>
                                <rect
                                  x="0"
                                  y="0"
                                  width={plotWidth}
                                  height={Math.max(
                                    0,
                                    Math.min(fixedRangeTop, fixedRangeBottom)
                                  )}
                                  fill="#fee2e2"
                                  opacity="0.45"
                                />
                                <rect
                                  x="0"
                                  y={Math.max(fixedRangeTop, fixedRangeBottom)}
                                  width={plotWidth}
                                  height={Math.max(
                                    0,
                                    plotHeight -
                                      Math.max(fixedRangeTop, fixedRangeBottom)
                                  )}
                                  fill="#fee2e2"
                                  opacity="0.45"
                                />
                                <rect
                                  x="0"
                                  y={Math.min(fixedRangeTop, fixedRangeBottom)}
                                  width={plotWidth}
                                  height={Math.abs(
                                    fixedRangeBottom - fixedRangeTop
                                  )}
                                  fill="#dcfce7"
                                  opacity="0.45"
                                />
                              </>
                            ) : (
                              rangeBandPolygons.map((polygon, idx) => (
                                <polygon
                                  key={`range-band-${idx}`}
                                  points={polygon}
                                  fill="#dcfce7"
                                  opacity="0.45"
                                />
                              ))
                            )}

                            {yTicks.map((tickValue, idx) => {
                              const y = toY(tickValue)
                              return (
                                <g key={`grid-${idx}`}>
                                  <line
                                    x1="0"
                                    y1={y}
                                    x2={plotWidth}
                                    y2={y}
                                    stroke="#cbd5e1"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={-8}
                                    y={y + 3}
                                    textAnchor="end"
                                    className="fill-gray-500 text-[10px]"
                                    opacity={isNearControlLabel(y) ? 0 : 1}
                                  >
                                    {formatCompactNumber(tickValue, valueDecimals)}
                                  </text>
                                </g>
                              )
                            })}
                            {controlAxisLabels.map((item) => (
                              <g key={`axis-label-${item.key}`}>
                                <line
                                  x1="0"
                                  y1={item.y}
                                  x2={plotWidth}
                                  y2={item.y}
                                  stroke={item.color}
                                  strokeWidth={item.key === 'std' ? '2.2' : '2'}
                                  strokeDasharray={item.key === 'std' ? '7 5' : '7 5'}
                                />
                                <line
                                  x1="-3"
                                  y1={item.y}
                                  x2="0"
                                  y2={item.y}
                                  stroke={item.color}
                                  strokeWidth="2"
                                />
                                <text
                                  x={-62}
                                  y={item.y + 3}
                                  textAnchor="start"
                                  className="text-[10px] font-semibold"
                                  fill={item.color}
                                  stroke="white"
                                  strokeWidth="2.5"
                                  paintOrder="stroke"
                                >
                                  {item.label}: {formatCompactNumber(
                                    item.value,
                                    valueDecimals
                                  )}
                                </text>
                              </g>
                            ))}
                            {showForcedZeroAxisLabel ? (
                              <g>
                                <circle
                                  cx="0"
                                  cy={plotHeight}
                                  r="2.5"
                                  fill="#64748b"
                                />
                                <text
                                  x={-8}
                                  y={plotHeight + 12}
                                  textAnchor="end"
                                  className="fill-gray-500 text-[10px]"
                                >
                                  0
                                </text>
                              </g>
                            ) : null}

                            {actualSegments.map((segment, idx) => {
                              const points = segment.split(' ')
                              const first = points[0]
                              const last = points[points.length - 1]
                              const firstX = first?.split(',')[0] || '0'
                              const lastX = last?.split(',')[0] || '0'
                              return (
                                <polygon
                                  key={`act-area-${idx}`}
                                  points={`${segment} ${lastX},${plotHeight} ${firstX},${plotHeight}`}
                                  fill="url(#actualAreaGradient)"
                                />
                              )
                            })}

                            {actualSegments.map((segment, idx) => (
                              <polyline
                                key={`act-${idx}`}
                                points={segment}
                                fill="none"
                                stroke="#16a34a"
                                strokeWidth="3.5"
                                // filter="url(#lineGlow)"
                              />
                            ))}

                            {zhafirTrendPoints.map((point, idx) => {
                              if (point.value === null) return null
                              const x = idx * stepX
                              const rawY = toY(point.value)
                              const fallback = clampTrendY(rawY, plotHeight)
                              const y = fallback.y
                              const outside = fallback.outside
                              const isBelowRange = outside === 'low'
                              const isAboveRange = outside === 'high'
                              const labelY = isBelowRange
                                ? plotHeight - 10
                                : isAboveRange
                                  ? 12
                                  : Math.max(12, Math.min(plotHeight - 6, y - 14))
                              return (
                                <g key={`point-${idx}`}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={isBelowRange || isAboveRange ? '5' : '6'}
                                  fill={
                                      point.status === 'too_high'
                                        ? '#dc2626'
                                        : point.status === 'too_low'
                                          ? '#d97706'
                                          : '#16a34a'
                                  }
                                  stroke="white"
                                  strokeWidth="1.2"
                                />
                                  <text
                                    x={x}
                                    y={labelY}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="bold"
                                    fill="#111827"
                                    stroke="white"
                                    strokeWidth="3"
                                    paintOrder="stroke"
                                  >
                                    {formatCompactNumber(
                                      point.value,
                                      valueDecimals
                                    )}
                                  </text>

                                  <title>
                                    {point.hourLabel}
                                    {'\n'}STD: {point.std}
                                    {'\n'}Actual: {point.value}
                                    {'\n'}Min: {point.min}
                                    {'\n'}Max: {point.max}
                                  </title>
                                </g>
                              )
                            })}

                            <line
                              x1="0"
                              y1={plotHeight}
                              x2={plotWidth}
                              y2={plotHeight}
                              stroke="#64748b"
                              strokeWidth="1"
                            />
                          </g>

                          {zhafirTrendPoints.map((point, idx) => {
                            // if (idx % xLabelStep !== 0) return null
                            const x = marginLeft + idx * stepX
                            return (
                              <text
                                key={`xlabel-${idx}`}
                                x={x}
                                y={chartHeight - 18}
                                textAnchor="middle"
                                className="fill-gray-600 text-[10px]"
                              >
                                {point.hourLabel}
                              </text>
                            )
                          })}
                        </svg>

                      <div className="mt-2 flex flex-wrap gap-4 text-xs">
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                            <span className="inline-block w-6 border-t-[3px] border-green-600" />
                            Actual
                          </div>
                            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                            <span className="inline-block w-6 border-t-2 border-dashed border-green-600" />
                            <span>Nominal</span>
                            <span className="font-bold text-black">
                              {stdReference === null
                              ? '-'
                              : stdReference.toFixed(1)}
                            </span>
                            </div>
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                            <span className="inline-block w-6 border-t-2 border-dashed border-red-500" />
                            <span>Min (STD)</span>
                            <span className="font-bold text-black">
                              {minReference === null
                                ? '-'
                                : minReference.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                            <span className="inline-block w-6 border-t-2 border-dashed border-red-500" />
                            <span>Max (STD)</span>
                            <span className="font-bold text-black">
                              {maxReference === null
                                ? '-'
                                : maxReference.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                            <span className="inline-block h-2.5 w-6 rounded bg-green-500 shadow-sm" />
                            Y (nilai)
                          </div>
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                            <span className="inline-block h-2.5 w-6 rounded bg-blue-500 shadow-sm" />
                            X (jam)
                          </div>
                        </div>
                      </div>

                      <div
                        className={`${
                          isTrendChartFullscreen ? 'max-h-[20vh]' : 'max-h-48'
                        } overflow-auto rounded-md border`}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Hour</TableHead>
                              <TableHead>Nominal</TableHead>
                              <TableHead>Actual</TableHead>
                              <TableHead>Min</TableHead>
                              <TableHead>Max</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {zhafirTrendPoints.map((point, idx) => (
                              <TableRow key={`${point.hourLabel}-row-${idx}`}>
                                <TableCell>{point.hourLabel}</TableCell>
                                <TableCell>
                                  {point.std === null
                                  ? '-'
                                  : point.std.toFixed(1)}
                                </TableCell>
                                <TableCell>
                                  {point.value === null
                                    ? '-'
                                    : point.value.toFixed(1)}
                                </TableCell>
                                <TableCell>
                                  {point.min === null
                                    ? '-'
                                    : point.min.toFixed(1)}
                                </TableCell>
                                <TableCell>
                                  {point.max === null
                                    ? '-'
                                    : point.max.toFixed(1)}
                                </TableCell>
                                <TableCell>
                                  {point.status === 'too_low'
                                    ? 'Too low'
                                    : point.status === 'too_high'
                                      ? 'Too high'
                                      : point.status === 'in_range'
                                      ? 'In range'
                                      : 'No data'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                })()
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isStateDialogOpen} onOpenChange={setIsStateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Causes for Orange State</DialogTitle>
              </DialogHeader>
              <DialogDescription className="p-0 m-0">
                {selectedStateChange
                  ? `State: ${selectedStateChange.Color} at ${selectedStateChange.AdjustedStatusDate}`
                  : ''}
              </DialogDescription>

              <div className="mt-2 space-y-3">
                <div className="flex flex-col space-y-1">
                  <Label>Category</Label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={(value) => {
                      setSelectedCategoryId(value)
                      setSelectedProblemId(undefined)
                      setSelectedSolutionId(undefined)
                      setNewProblemName('')
                      setNewSolutionName('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1">
                  <Label>Problem</Label>
                  <Select
                    value={selectedProblemId}
                    onValueChange={(value) => {
                      setSelectedProblemId(value)
                      setSelectedSolutionId(undefined)
                      setNewSolutionName('')
                    }}
                    disabled={!selectedCategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih problem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OTHER_PROBLEM_VALUE}>
                        Others (+ Add New Problem)
                      </SelectItem>
                      {filteredProblems.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProblemId === OTHER_PROBLEM_VALUE ? (
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={newProblemName}
                        onChange={(e) => setNewProblemName(e.target.value)}
                        placeholder="Input problem baru"
                        disabled={isSavingProblem}
                      />
                      <Button
                        type="button"
                        onClick={handleCreateProblemFromOther}
                        disabled={isSavingProblem || !newProblemName.trim()}
                      >
                        {isSavingProblem ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col space-y-1">
                  <Label>Solution</Label>
                  <Select
                    value={selectedSolutionId}
                    onValueChange={(value) => {
                      setSelectedSolutionId(value)
                    }}
                    disabled={
                      !selectedProblemId ||
                      selectedProblemId === OTHER_PROBLEM_VALUE
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih solution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OTHER_SOLUTION_VALUE}>
                        Others (+ Add New Solution)
                      </SelectItem>
                      {solutions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSolutionId === OTHER_SOLUTION_VALUE ? (
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={newSolutionName}
                        onChange={(e) => setNewSolutionName(e.target.value)}
                        placeholder="Input solution baru"
                        disabled={isSavingSolution}
                      />
                      <Button
                        type="button"
                        onClick={handleCreateSolutionFromOther}
                        disabled={isSavingSolution || !newSolutionName.trim()}
                      >
                        {isSavingSolution ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Ticket dari TicketTRX
                  </Label>
                  <div className="mt-2 border rounded-md max-h-48 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket Date</TableHead>
                          <TableHead>Actual Finish</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ticketRows.map((t, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {t.from
                                ? format(
                                    new Date(
                                      new Date(t.from).getTime() -
                                        7 * 60 * 60 * 1000
                                    ),
                                    'dd-MM-yyyy HH:mm:ss'
                                  )
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {t.to
                                ? format(
                                    new Date(
                                      new Date(t.to).getTime() -
                                        7 * 60 * 60 * 1000
                                    ),
                                    'dd-MM-yyyy HH:mm:ss'
                                  )
                                : 'Belum selesai (masih ORANGE)'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Textarea cause untuk periode ORANGE (belum digunakan, jadi di-hide dulu)
                <Textarea
                  placeholder="Masukkan cause untuk periode orange ini (trial, belum disimpan ke database)"
                  className="min-h-[100px]"
                />
                */}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsStateDialogOpen(false)}
                  disabled={isLoading}
                >
                  Close
                </Button>
                {/* <Button
                  onClick={handleOrangeTicketSubmit}
                  disabled={
                    isLoading || !selectedProblemId || !selectedSolutionId
                  }
                >
                  {isLoading ? 'Submitting...' : 'Submit ke TicketTRX'}
                </Button> */}
                <Button
                  onClick={handleNextFromOrangeModal}
                  disabled={
                    !selectedCategoryId ||
                    !selectedProblemId ||
                    !selectedSolutionId ||
                    selectedProblemId === OTHER_PROBLEM_VALUE ||
                    selectedSolutionId === OTHER_SOLUTION_VALUE
                  }
                >
                  Next
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isConfirmDialogOpen}
            onOpenChange={setIsConfirmDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Konfirmasi Ticket ORANGE</DialogTitle>
              </DialogHeader>

              {/* Ringkasan draft */}
              <div className="space-y-2 text-sm">
                <div>
                  <b>Category:</b>{' '}
                  {
                    categories.find(
                      (c) => String(c.id) === draftTicket?.categoryId
                    )?.name
                  }
                </div>
                <div>
                  <b>Problem:</b>{' '}
                  {
                    problems.find(
                      (p) => String(p.id) === draftTicket?.problemId
                    )?.name
                  }
                </div>
                <div>
                  <b>Solution:</b>{' '}
                  {
                    solutions.find(
                      (s) => String(s.id) === draftTicket?.solutionId
                    )?.name
                  }
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Eskalasi atau Tidak?
                </Label>

                <div className="mt-2 border rounded-md p-3 space-y-3">
                  {/* YES */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="escalation"
                      checked={isEscalated === 1}
                      onChange={() => setIsEscalated(1)}
                    />
                    <span>Ya (Eskalasi)</span>
                  </label>

                  {/* NO */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="escalation"
                      checked={isEscalated === 0}
                      onChange={() => {
                        setIsEscalated(0)
                        setEscalationTarget(null)
                      }}
                    />
                    <span>Tidak</span>
                  </label>
                  {isEscalated === 1 && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                      <Label className="text-xs text-gray-500">
                        Eskalasi ke Departemen
                      </Label>

                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={escalationTarget ?? ''}
                        onChange={(e) => setEscalationTarget(e.target.value)}
                      >
                        <option value="">Pilih Departemen</option>
                        <option value="MTC">MTC</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="MIXING">MIXING</option>
                        <option value="MOLDSHOP">MOLDSHOP</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Informasi Penginput
                </Label>
                <div className="mt-2 border rounded-md max-h-48 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diisi oleh : </TableHead>
                        <TableHead>Di validasi oleh :</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div
                            onClick={() => setOpenOPPopup(true)}
                            className="cursor-pointer flex items-center justify-between px-2 py-1"
                          >
                            {selectedAssignTo
                              ? usersOP.find((u) => u.id === selectedAssignTo)
                                ? `${
                                    usersOP.find(
                                      (u) => u.id === selectedAssignTo
                                    )?.dept
                                  } - ${
                                    usersOP.find(
                                      (u) => u.id === selectedAssignTo
                                    )?.name
                                  }`
                                : 'Operator / Mekanik'
                              : 'Operator / Mekanik'}

                            <ChevronDown className="w-4 h-4 ml-2" />
                          </div>

                          {/* {openCellOP === 'row1-col1' && (
                              <div className="absolute top-full left-0 w-56 bg-white text-black rounded-md shadow-lg z-20 border">
                                Search
                                <input
                                  className="w-full px-3 py-2 text-sm border-b outline-none"
                                  placeholder="Cari user..."
                                  value={searchOP}
                                  onChange={(e) => setSearchOP(e.target.value)}
                                />

                                <div className="max-h-40 overflow-y-auto">
                                  {searchOP.length > 0 &&
                                    (filteredUsersOP.length > 0 ? (
                                      filteredUsersOP.slice(0, 10).map((u) => (
                                        <div
                                          key={u.id}
                                          onClick={() => {
                                            setSelectedAssignTo(u.id)
                                            setOpenCellOP(null)
                                            setSearchOP('')
                                          }}
                                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                                        >
                                          <User className="w-4 h-4 mr-2 text-gray-400" />
                                          {u.name}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="px-3 py-2 text-gray-400 text-sm">
                                        User tidak ditemukan
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )} */}
                        </TableCell>

                        <TableCell className="relative">
                          <div
                            onClick={() => {
                              if (!selectedAssignTo) return
                              setOpenSPVPopup(true)
                            }}
                            className={`cursor-pointer flex items-center justify-between px-2 py-1
      ${!selectedAssignTo ? 'opacity-50 cursor-not-allowed' : ''}
    `}
                          >
                            {selectedAssignBy
                              ? usersSPV.find((u) => u.id === selectedAssignBy)
                                ? `${
                                    usersSPV.find(
                                      (u) => u.id === selectedAssignBy
                                    )?.dept
                                  } - 
           ${usersSPV.find((u) => u.id === selectedAssignBy)?.name}`
                                : 'SPV'
                              : selectedAssignTo
                                ? 'Pilih SPV'
                                : 'Pilih Operator dulu'}

                            <ChevronDown className="w-4 h-4 ml-2" />
                          </div>

                          {/* {openCellSPV === 'row1-col2' && (
                              <div className="absolute top-full left-0 w-56 bg-white text-black rounded-md shadow-lg z-20 border">
                                <input
                                  className="w-full px-3 py-2 text-sm border-b outline-none"
                                  placeholder="Cari SPV..."
                                  value={searchSPV}
                                  onChange={(e) => setSearchSPV(e.target.value)}
                                />

                                <div className="max-h-40 overflow-y-auto">
                                  {searchSPV.length > 0 && (filteredUsersSPV.length > 0 ? (
                                    filteredUsersSPV.slice(0, 10).map((u) => (
                                      <div
                                        key={u.id}
                                        onClick={() => {
                                          setSelectedAssignBy(u.id)
                                          setOpenCellSPV(null)
                                          setSearchSPV('')
                                        }}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                                      >
                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                        {u.name}
                                        <span className="ml-auto text-xs text-gray-400">
                                          {u.uap}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                      SPV dengan UAP ini tidak ditemukan
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )} */}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  {/* open OP popup */}
                  {openOPPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                      <div className="w-96 bg-white rounded-lg shadow-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                          <h3 className="font-semibold">
                            Pilih Operator / Mekanik
                          </h3>
                          <button
                            onClick={() => {
                              setOpenOPPopup(false)
                              setSearchOP('')
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Search */}
                        <div className="p-3">
                          <input
                            className="w-full px-3 py-2 border rounded-md outline-none"
                            placeholder="Cari user..."
                            value={searchOP}
                            onChange={(e) => setSearchOP(e.target.value)}
                            autoFocus
                          />
                        </div>

                        {/* Result (UI-only fix, sama seperti SPV) */}
                        <div className="max-h-60 overflow-y-auto">
                          {searchOP.trim() === '' ? (
                            <div className="px-4 py-3 text-sm text-gray-400">
                              Ketik untuk mencari Operator / Mekanik
                            </div>
                          ) : filteredUsersOP.length > 0 ? (
                            filteredUsersOP.slice(0, 10).map((u) => (
                              <div
                                key={u.id}
                                onClick={() => {
                                  setSelectedAssignTo(u.id)
                                  setOpenOPPopup(false)
                                  setSearchOP('')
                                }}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                              >
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{u.name}</span>
                                <span className="ml-auto text-xs text-gray-400">
                                  {u.dept}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-400">
                              User tidak ditemukan
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* open SPV popup */}
                  {openSPVPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                      <div className="w-96 bg-white rounded-lg shadow-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                          <h3 className="font-semibold">Pilih SPV</h3>
                          <button
                            onClick={() => {
                              setOpenSPVPopup(false)
                              setSearchSPV('')
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Search */}
                        <div className="p-3">
                          <input
                            className="w-full px-3 py-2 border rounded-md outline-none"
                            placeholder="Cari SPV..."
                            value={searchSPV}
                            onChange={(e) => setSearchSPV(e.target.value)}
                            autoFocus
                          />
                        </div>

                        {/* Result */}
                        <div className="max-h-60 overflow-y-auto">
                          {searchSPV.length > 0 ? (
                            filteredUsersSPV.length > 0 ? (
                              filteredUsersSPV.slice(0, 10).map((u, index) => (
                                <div
                                  key={`${u.id}-${u.uap}-${index}`}
                                  onClick={() => {
                                    setSelectedAssignBy(u.id)
                                    setOpenSPVPopup(false)
                                    setSearchSPV('')
                                  }}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                                >
                                  <User className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{u.name}</span>
                                  <span className="ml-auto text-xs text-gray-400">
                                    {u.uap}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-400">
                                SPV tidak ditemukan
                              </div>
                            )
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-400">
                              Ketik untuk mencari SPV
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Assign To & Assign By TETAP PAKAI STATE YANG SAMA */}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsConfirmDialogOpen(false)
                    setIsStateDialogOpen(true)
                  }}
                >
                  Back
                </Button>

                <Button
                  onClick={handleOrangeTicketSubmit}
                  disabled={!selectedAssignBy || !selectedAssignTo || isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedComment.type === 'causes'
                    ? 'Edit Causes'
                    : 'Edit Comments/Actions'}
                </DialogTitle>
              </DialogHeader>

              {/* Dropdown hanya dipakai di dialog Orange sekarang */}

              <DialogDescription className="p-0 m-0">
                {selectedComment.type === 'causes'
                  ? 'Catatan tambahan (opsional)'
                  : 'Provide your message here'}
              </DialogDescription>
              <Textarea
                value={selectedComment.content}
                onChange={(e) =>
                  setSelectedComment({
                    ...selectedComment,
                    content: e.target.value,
                  })
                }
                placeholder={`Enter ${selectedComment.type}...`}
                className="min-h-[100px]"
              />
              <Label className="text-sm text-gray-500">
                {selectedComment.type === 'causes' ? 'Problem' : 'Action'} dari
                Andon App:
              </Label>
              <Textarea
                value={selectedComment.content2}
                disabled={true}
                className="min-h-[100px]"
              />
              <DialogFooter>
                <Button onClick={handleCommentSave}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isPODialogOpen} onOpenChange={setIsPODialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Attach PO</DialogTitle>
              </DialogHeader>
              <DialogDescription className="p-0 m-0">
                Select PO to attach to this machine
              </DialogDescription>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="machine">Machine</Label>
                  <Input
                    id="machine"
                    value={selectedMachine?.machineName}
                    disabled
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="po-number">PO Number</Label>
                  <SearchablePOSelect
                    value={selectedPO}
                    onValueChange={(newValue) => setSelectedPO(newValue)}
                    type="Injection"
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="po-number">Material</Label>
                  <Input
                    id="po-number"
                    placeholder="Please Select PO First"
                    value={
                      selectedPO?.materialId + ' - ' + selectedPO?.materialName
                    }
                    disabled
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handlePOAttach}>Attach PO</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCVTDialogOpen} onOpenChange={setIsCVTDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update CVT</DialogTitle>
              </DialogHeader>
              <DialogDescription className="p-0 m-0">
                Update cavity for machine {selectedMachine?.machineName}
              </DialogDescription>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-cvt">Current CVT</Label>
                  <Input id="current-cvt" value={currentCVT} disabled />
                </div>
                <div>
                  <Label htmlFor="new-cvt">New CVT</Label>
                  <Input
                    autoFocus
                    id="new-cvt"
                    type="number"
                    onChange={(e) => {
                      const value =
                        e.target.value === '' ? 0 : Number(e.target.value)
                      setEditedCVT(value)
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCVTUpdate} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Update CVT'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isSCRAPDialogOpen} onOpenChange={setIsSCRAPDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Scrap</DialogTitle>
              </DialogHeader>
              {/* <DialogDescription className="p-0 m-0">
                Update cavity for machine {selectedMachine?.machineName}
              </DialogDescription> */}
              <div className="space-y-4">
                <div>
                  <Label>Current Scrap</Label>
                  <Input value={currentScrap} disabled />
                </div>
                <div>
                  <Label>New Scrap</Label>
                  <Input
                    autoFocus
                    type="number"
                    min={0}
                    step={1}
                    value={editedScrap}
                    onChange={(e) => {
                      const value = e.target.value

                      if (value === '') {
                        setEditedScrap('')
                        return
                      }

                      const num = Number(value)
                      if (!isNaN(num) && num >= 0) {
                        setEditedScrap(num)
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleScrapUpdate} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Update Scrap'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isREWORKDialogOpen}
            onOpenChange={setIsREWORKDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Rework</DialogTitle>
              </DialogHeader>
              {/* <DialogDescription className="p-0 m-0">
                Update cavity for machine {selectedMachine?.machineName}
              </DialogDescription> */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="">Current Rework</Label>
                  <Input value={currentRework} disabled />
                </div>
                <div>
                  <Label htmlFor="">New Rework</Label>
                  <Input
                    autoFocus
                    type="number"
                    min={0}
                    step={1}
                    value={editedRework}
                    onChange={(e) => {
                      const value = e.target.value

                      if (value === '') {
                        setEditedRework('')
                        return
                      }

                      const num = Number(value)
                      if (!isNaN(num) && num >= 0) {
                        setEditedRework(num)
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleReworkUpdate} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Update Rework'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
