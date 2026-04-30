'use client'
import { Button } from '@/components/ui/button'
import albeaLogo from '@/public/albea-white.png'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { CameraDetailModal } from '@/components/uv-scrap/camera-detail-modal'
import Image from 'next/image'
import {
  Box,
  CalendarIcon,
  Camera,
  FilePlus2,
  Pencil,
  RefreshCw,
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { useState, useEffect, useCallback, use } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { CameraFeed } from './uv-scrap/camera-feed'
import Link from 'next/link'
import { Badge } from './ui/badge'
import { GearIcon } from '@radix-ui/react-icons'
import { log } from 'console'

type MachineDetail = {
  machineId: number
  machineName: string
  machineTonage: string
  machineDescription: string
  machineNumber: string
  locationId: number
  locationName: string
  machineStatus: string
  machineType: string
}

type HourlyData = {
  hourlyId: number
  from_datetime: Date
  time: string
  task_id: number
  itemNo: string
  itemDesc: string
  target: number
  target_tolerance: number
  target_final: number
  actual: number
  actual_in: number
  top_actual: number
  top_actual_in: number
  delta: number
  gap: number
  scrap: number
  rework: number
  reject_a: number | 0
  reject_b: number | 0
  reject_c: number | 0
  reject_d: number | 0
  reject_e: number | 0
  causes: string
  comments: string
  problem: string
  action: string
  reject_a_name: string
  reject_b_name: string
  reject_c_name: string
  reject_d_name: string
  reject_e_name: string
  process: string
}

type OoeData = {
  targetYearly: number
  targetToleranceUv: number
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
type Spindle = {
  SpindleSTD: number
  SpindleACT: number
}

type StateData = {
  ID: string
  AdjustedStatusDate: string
  Color: string
}

type RejectList = {
  id: number
  name: string
}
interface Camera {
  id: string
  name: string
  video_source: string
  yaml_file: string
  yaml_file_content: string
  udp_ip: string
  udp_port: number
  device_name: string
  is_active: boolean
  is_paused: boolean
  status: 'running' | 'paused' | 'error' | 'stopped'
}

const refreshRateList = ['5000', '15000', '30000', '60000']

const shiftList = ['1', '2', '3']

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type PoNumber = {
  poNumber: string
  poId: number
  materialId: number
  materialName: string
}

interface VideoSource {
  id: string
  name: string
  url: string
}

interface DeviceName {
  id: string
  name: string
  value: string
  machine_id: string
}

type ModalType = 'camera' | 'videoSource' | 'deviceName'
type ModalMode = 'add' | 'edit'

interface ModalState {
  open: boolean
  type: ModalType
  mode: ModalMode
  initialData: Camera | VideoSource | DeviceName | null
  id?: string
}

export default function CountboardDashboardUv() {
  const [selectedMachine, setSelectedMachine] = useState<MachineDetail | null>(
    null
  )
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedRejectA, setSelectedRejectA] = useState<string>('')
  const [selectedRejectB, setSelectedRejectB] = useState<string>('')
  const [selectedRejectC, setSelectedRejectC] = useState<string>('')
  const [selectedRejectD, setSelectedRejectD] = useState<string>('')
  const [selectedRejectE, setSelectedRejectE] = useState<string>('')

  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState({
    index: -1,
    hourlyId: -1,
    type: '',
    content: '',
  })
  const [isPODialogOpen, setIsPODialogOpen] = useState(false)
  const [IsTopScrapDialogOpen, setIsTopScrapDialogOpen] = useState(false)
  const [IsProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [IsCameraDialogOpen, setIsCameraDialogOpen] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState('')

  const [selectedPO, setSelectedPO] = useState<PoNumber | null>(null)
  const [selectedRefreshRate, setRefreshRate] = useState('5000')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedShift, setSelectedShift] = useState('')
  const [isLoadingRefresh, setIsLoadingRefresh] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [rejectList, setRejectList] = useState<RejectList[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [isDialogConfigurationOpen, setIsDialogConfigurationOpen] =
    useState(false)
  const [userData, setUserData] = useState<any>(null)

  const [videoSources, setVideoSources] = useState<VideoSource[]>([])
  const [deviceNames, setDeviceNames] = useState<DeviceName[]>([])
  const [yamlFiles, setYamlFiles] = useState<{ name: string }[]>([])
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    type: 'camera',
    mode: 'add',
    initialData: null,
    id: undefined,
  })

  const pathname = usePathname()
  const router = useRouter()

  const [shiftStartHour, setShiftStartHour] = useState(0)

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
    loadInitialData()
  }, [])

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

  const from = isLiveMode
    ? shiftStartHour
    : new Date(new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24)).setHours(
        6 + (+selectedShift - 1) * 8,
        0,
        0,
        0
      )

  const to = isLiveMode
    ? 'now' // Live mode uses current timestamp
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
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines?type=uv`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )
  const isMachineListLoading = !machines && isValidating

  useEffect(() => {
    if (selectedMachine?.machineName) {
      Promise.all([
        refetchHourlyData(),
        refetchOeeData(),
        refetchTaskData(),
        refetchNoeeData(),
        refetchStateData(),
        refetchCameraData(),
      ])
    }
  }, [selectedMachine?.machineName])

  // const refetchMachine = async () => {
  //   setIsLoading(true);
  //   try {
  //     await mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const spindleDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/spindle/${selectedMachine.machineName}${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
      }`
    : null

  const { data: spindleData } = useSWR<Spindle[]>(spindleDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  })
  const refetchSpindleData = useCallback(
    () => mutate(spindleDataKey),
    [spindleDataKey]
  )

  const cameraDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/detection/api/cameras/${selectedMachine.machineName}`
    : null

  const { data: cameraData } = useSWR<Camera[]>(cameraDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  })
  useEffect(() => {
    setCameras(cameraData || [])
  }, [cameraData])
  const refetchCameraData = useCallback(
    () => mutate(cameraDataKey),
    [cameraDataKey]
  )

  const hourlyDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/hourly/${selectedMachine.machineName}?type=uv${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `&date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
      }`
    : null

  const { data: hourlyData } = useSWR<HourlyData[]>(
    hourlyDataKey,
    async (url) => {
      return fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
    },
    {
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: Number(selectedRefreshRate),
    }
  )
  const refetchHourlyData = useCallback(
    () => mutate(hourlyDataKey),
    [hourlyDataKey]
  )

  const oeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/oee/${selectedMachine.machineName}${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
      }`
    : null

  const { data: oeeData } = useSWR<OoeData[]>(oeeDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  })

  const refetchOeeData = () => mutate(oeeDataKey)

  const noeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/noee/${selectedMachine.machineName}${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
      }`
    : null

  const { data: noeeData } = useSWR<NooeData[]>(noeeDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  })

  const refetchNoeeData = () => mutate(noeeDataKey)

  const stateDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/state/${selectedMachine.machineName}${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
      }`
    : null

  const { data: stateData } = useSWR<StateData[]>(stateDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  })

  const refetchStateData = () => mutate(stateDataKey)

  const taskDataKey = selectedMachine?.machineDescription
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/tasks/${selectedMachine.machineDescription}${
        !isLiveMode &&
        new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
      }`
    : null

  const { data: taskData } = useSWR<TaskData[]>(taskDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  })
  const refetchTaskData = useCallback(() => {
    mutate(taskDataKey)
  }, [taskDataKey])

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
        refetchSpindleData(),
        refetchCameraData(),
      ])
    } finally {
      setIsLoadingRefresh(false)
    }
  }

  const handleCellClick = (
    index: number,
    hourlyId: number,
    type: 'causes' | 'comments',
    content: string
  ) => {
    setSelectedComment({ index, hourlyId, type, content })
    setIsDialogOpen(true)
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
            uap: 'uv',
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

  const handleTopScrapUpdate = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/topscrap`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId:
              taskData && taskData.length > 0
                ? taskData[0].id
                : new Error('Task ID not found'),
            hourlyId:
              hourlyData && hourlyData.length > 0
                ? hourlyData
                    .slice()
                    .reverse()
                    .find((h) => h.task_id !== null)?.hourlyId
                : null,
            reject_a: selectedRejectA,
            reject_b: selectedRejectB,
            reject_c: selectedRejectC,
            reject_d: selectedRejectD,
          }),
        }
      )

      if (!response.ok) {
        // Attempt to extract the server's error message
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to Update Top Scrap`

        throw new Error(errorMessage)
      }
      toast.success(`Update Top Scrap successfully!`)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(`Failed to Update Top Scrap:`, error)
    } finally {
      setIsLoading(false)
    }
    refetchTaskData()
    setIsTopScrapDialogOpen(false)
  }, [
    hourlyData,
    selectedRejectA,
    selectedRejectB,
    selectedRejectC,
    selectedRejectD,
    refetchTaskData,
    taskData,
  ])

  const handleProcessChange = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/process`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hourlyId:
              hourlyData && hourlyData.length > 0
                ? hourlyData
                    .slice()
                    .reverse()
                    .find((h) => h.task_id !== null)?.hourlyId
                : null,
            process: selectedProcess,
          }),
        }
      )

      if (!response.ok) {
        // Attempt to extract the server's error message
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to Change Process`

        throw new Error(errorMessage)
      }
      setIsProcessDialogOpen(false)
      toast.success(`Change Process success!`)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(`Failed to Change Process:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedProcess, hourlyData])

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

  const getBarColor = (
    actual: number,
    target: number,
    target_tolerance: number
  ) => {
    if (actual >= target) return 'bg-green-500'
    if (actual >= target_tolerance) return 'bg-green-500'
    return 'bg-red-500'
  }

  const getSpindleColor = (
    SpindleACT: number | null,
    SpindleSTD: number | null
  ) => {
    if (SpindleACT === null || SpindleSTD === null || SpindleACT >= SpindleSTD)
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

  // if (queryMachineNumber == '') {
  //   queryMachineNumber = '1';
  //   params.set('machineNumber', '1');
  //   router.push(`${pathname}?${params.toString()}`);
  // }

  // if (queryLocation == '') {
  //   queryLocation = 'K';
  //   params.set('location', 'K');
  //   router.push(`${pathname}?${params.toString()}`);

  // }
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
      hourlyData?.reduce((total, item) => total + (item.actual || 0), 0)) ||
    0
  const totalActualEK =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.top_actual || 0), 0)) ||
    0
  const totalTopActual =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.top_actual || 0), 0)) ||
    0
  const totalTopActualIn =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce(
        (total, item) => total + (item.top_actual_in || 0),
        0
      )) ||
    0
  const totalActualIn =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.actual_in || 0), 0)) ||
    0
  const totalSensorOutput =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.top_actual || 0), 0)) ||
    0
  const totalSensorOutputMSP =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.actual || 0), 0)) ||
    0
  const totalSensorInput =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.actual_in || 0), 0)) ||
    0
  const gapEK =
    totalActualIn + totalTopActualIn - (totalActual + totalTopActual)
  const gap = totalActualIn - totalActual
  console.log(`totalActualIn : ${totalSensorOutput}`)
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
              ? item.target_final * (oeeData?.[0]?.targetToleranceUv || 1)
              : Math.floor(
                  ((item.target_final * (remainingMinutes + remainingSeconds)) /
                    3600) *
                    (oeeData?.[0]?.targetToleranceUv || 1)
                )) || 0
        )
      }, 0)) ||
    0
  console.log(`totalActual : ${totalActual}`)
  console.log(`totalTarget : ${totalTarget}`)

  const totalGapEK = totalActualEK - totalTarget
  const totalGap = totalActual - totalTarget

  console.log(`totalGap : ${totalGap}`)
  const totalGapSpindle =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + item.gap, 0)) ||
    0

  const totalRejectA =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.reject_a || 0), 0)) ||
    0
  const totalRejectB =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.reject_b || 0), 0)) ||
    0
  const totalRejectC =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.reject_c || 0), 0)) ||
    0
  const totalRejectD =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.reject_d || 0), 0)) ||
    0
  const totalRejectE =
    (Array.isArray(hourlyData) &&
      hourlyData?.reduce((total, item) => total + (item.reject_e || 0), 0)) ||
    0
  const lastSpindle = spindleData?.[spindleData.length - 1]
  const spindleAct = lastSpindle?.SpindleACT ?? 0
  const spindleStd = lastSpindle?.SpindleSTD ?? 0
  const totalRejectOverall =
    totalRejectA + totalRejectB + totalRejectC + totalRejectD + totalRejectE

  let rejectPercentage = 0.02
  if (
    selectedMachine?.locationName == 'K' ||
    selectedMachine?.locationName == 'E'
  ) {
    rejectPercentage = 0.09
  } else if (selectedMachine?.locationName == 'M') {
    rejectPercentage = 0.05
  }

  // console.log(`totalRejectA : ${totalRejectA}`)
  // console.log(`totalRejectOverall : ${totalRejectOverall}`)

  if (error)
    return (
      <ErrorState message="Error loading machines. Please try again later." />
    )

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
              className={`w-[10px] h-[5px] ${colorMap[activeColor as keyof typeof colorMap]}`}
            />
          ) : (
            <div className={`w-[10px] h-[5px] ml-0 bg-none my-0 pt-0 pb-0`} />
          )
        })}
      </div>
    )
  }

  const { data: rejectListFetched, error: rejectError } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/rejects`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  useEffect(() => {
    setRejectList(rejectListFetched)
  }, [rejectListFetched])

  const isLoadingRejectList = !rejectList && !rejectError
  const fetchRejectList = useCallback(async () => {
    if (isLoadingRejectList) return
    mutate(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/rejects`,
      async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/rejects`,
          {
            credentials: 'include',
          }
        )
        const data = await response.json()
        return data
      },
      {
        revalidate: false,
        rollbackOnError: true,
      }
    )
  }, [isLoadingRejectList])

  useEffect(() => {
    if (isLoadingRejectList) {
      fetchRejectList()
    }
  }, [isLoadingRejectList, fetchRejectList])

  const beUrl = process.env.NEXT_PUBLIC_BACKEND_URL + '/api/detection'

  const handleRestartCamera = async (id: string) => {
    const camera = cameras.find((c) => c.id === id)
    if (!camera) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/detection/api/cameras/restart`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            camera_id: id,
            action: 'restart',
            yaml_file: camera.yaml_file,
            video_source: camera.video_source,
            udp_ip: camera.udp_ip,
            udp_port: camera.udp_port,
            device_name: camera.device_name,
            name: camera.name,
          }),
        }
      )

      const result = await response.json()

      if (result.success) {
        toast.success(`Camera restarted successfully`)
        refetchCameraData()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(`Failed to restart camera: ${error}`)
    }
  }

  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch(`${beUrl}/api/cameras/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      if (!data) {
        console.error('No status data received')
        return
      }

      const statusMap = data
      console.log('statusMap', statusMap)
      setCameras((prevCameras) => {
        if (!prevCameras) return []
        return prevCameras.map((camera) => ({
          ...camera,
          is_active: statusMap[camera.id] === 'running',
          is_paused: statusMap[camera.id] === 'paused',
          is_error: !statusMap[camera.id],
          status: statusMap[camera.id],
        }))
      })
    }

    // Initial fetch
    fetchStatus()

    // Set up interval to fetch every second
    const intervalId = setInterval(fetchStatus, 3000)

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [beUrl])

  const loadInitialData = async () => {
    try {
      const [camerasRes, sourcesRes, devicesRes, yamlRes, machineRes] =
        await toast.promise(
          Promise.all([
            fetch(`${beUrl}/api/cameras`, {
              // credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            }),
            fetch(`${beUrl}/api/video_sources`, {
              // credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            }),
            fetch(`${beUrl}/api/device_names`, {
              // credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            }),
            fetch(`${beUrl}/api/yaml`, {
              // credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            }),
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines`, {
              // credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            }),
            // fetch(`${beUrl}/api/udp_settings`, {
            //   // credentials: 'include',
            //   headers: {
            //     'Content-Type': 'application/json'
            //   }
            // }),
          ]),
          {
            loading: 'Loading data...',
            success: 'Data loaded successfully!',
            error: 'Failed to load data',
          }
        )

      const camerasData = await camerasRes.json()
      const sourcesData = await sourcesRes.json()
      const devicesData = await devicesRes.json()
      const yamlData = await yamlRes.json()
      const machineData = await machineRes.json()
      // const udpSettingsData = await udpSettingsRes.json()
      setCameras(
        Object.entries(camerasData.data).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
      )
      setVideoSources(sourcesData.data)
      setDeviceNames(devicesData.data)
      setYamlFiles(yamlData.data)
      // setUdpSettings(udpSettingsData.data)
    } catch (error) {
      toast.error('Failed to load initial data')
    }
  }
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

  return (
    <div className="p-0 space-y-2 w-full min-h-screen">
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
            {isLoading ? (
              <div></div>
            ) : (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedLocation}
                  onValueChange={handleLocationChange}
                >
                  <SelectTrigger className="w-[80px] h-[43px] text-lg text-nowrap">
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
                  <SelectTrigger className="w-[60px] h-[43px] text-lg text-nowrap">
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
            )}
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
            <Button
              onClick={() => {
                ;(setIsTopScrapDialogOpen(true),
                  mutate(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/rejects`
                  ))
              }}
              variant="default"
              className="h-[43px]"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Top Scrap
            </Button>

            {selectedMachine?.locationName == 'K' ||
            selectedMachine?.locationName == 'E' ? (
              <Label
                className="px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle cursor-pointer"
                onClick={() => {
                  setIsProcessDialogOpen(true)
                }}
              >
                Process :{' '}
                {hourlyData && hourlyData.length > 0
                  ? hourlyData
                      .slice()
                      .reverse()
                      .find((h) => h.task_id !== null)?.process || 'N/A'
                  : 'N/A'}
                <Pencil className="w-4 h-4 rounded ml-4" />
              </Label>
            ) : null}

            <div className="flex items-center space-x-2 border border-gray-250 rounded-md px-3 py-2">
              <Switch
                id="live-mode"
                checked={isLiveMode}
                onCheckedChange={handleLiveMode}
              />
              <Label htmlFor="live-mode">LIVE MODE</Label>
            </div>

            {!isLiveMode && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[185px] justify-start text-left font-normal',
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

            <Button onClick={() => setIsCameraDialogOpen(true)}>
              <Camera />
              Camera Status
            </Button>

            <Dialog
              open={IsCameraDialogOpen}
              onOpenChange={setIsCameraDialogOpen}
            >
              <DialogContent className="w-[2100px]">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Camera Live View</CardTitle>
                  </CardHeader>
                  <CardContent className="w-full h-full">
                    <div className="grid grid-cols-4 gap-4">
                      {cameras.length > 0 ? (
                        cameras.map((camera) => (
                          <CameraFeed
                            camerasVisible={IsCameraDialogOpen}
                            key={camera.id}
                            id={camera.id}
                            name={camera.name}
                            status={camera.status}
                            onClick={() => setSelectedCamera(camera)}
                            onRestart={() => handleRestartCamera(camera.id)}
                          />
                        ))
                      ) : (
                        <div className="text-center">
                          No cameras found, add camera in{' '}
                          <Link href="/detection" className="text-blue-500">
                            Detection
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isDialogConfigurationOpen}
              onOpenChange={setIsDialogConfigurationOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant={'default'}
                  className=""
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
                      <Link
                        href={`/login/?redirect=${window.location.pathname}${window.location.search}`}
                        className="text-blue-500"
                      >
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
          </div>
        </div>
      </div>
      {selectedMachine === null && !isMachineListLoading ? (
        <div className="text-center">Please select machine...</div>
      ) : (
        <div className="flex gap-2 md:grid-cols-2 lg:grid-cols-4 text-center h-32 w-full mb-2">
          {/* <Image src={albeaLogo} alt="Albea" width={200} height={100} className="px-3 py-2 flex items-center border border-gray-250 rounded-xl text-gray-700 align-middle"/> */}
          <Card className="p-0">
            <CardHeader className="text-lg font-bold text-nowrap p-0 flex items-center justify-center gap-2 space-y-0 flex-row pb-2">
              Production Output
              <p className="text-lg font-bold text-green-500">
                OOE = {(oeeData?.[0]?.targetToleranceUv || 0) * 100}%
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-6 p-2 pr-4">
              <div>
                <div className="text-3xl font-bold">
                  {Math.floor(totalTarget)}
                </div>
                <div className="text-lg ">Target</div>
              </div>
              <div>
                <div className={`text-3xl font-bold`}>
                  {selectedMachine?.locationName === 'E' ||
                  selectedMachine?.locationName === 'K'
                    ? selectedProcess === 'Base Coat'
                      ? totalActual
                      : selectedProcess === 'Top Coat'
                      ? totalActualEK
                      : totalActual
                    : totalActual}
                </div>
                <div className="text-lg ">Actual</div>
              </div>

              <div>
                <div
                  className={`text-3xl font-bold ${
                    (selectedMachine?.locationName === 'E' ||
                    selectedMachine?.locationName === 'K'
                      ? selectedProcess === 'Base Coat'
                        ? totalGap
                        : selectedProcess === 'Top Coat'
                        ? totalGapEK
                        : totalGap
                      : totalGap) < 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {Math.abs(
                    selectedMachine?.locationName === 'E' ||
                    selectedMachine?.locationName === 'K'
                      ? selectedProcess === 'Base Coat'
                        ? totalGap
                        : selectedProcess === 'Top Coat'
                        ? totalGapEK
                        : totalGap
                      : totalGap
                  ).toFixed(0)}
                </div>
                <div className="text-lg ">Delta</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-lg font-bold text-nowrap p-0 flex items-center justify-center gap-2 space-y-0 flex-row pb-2">
              Sensor Product Status
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-6 p-2 pr-4">
              <div>
                {selectedMachine?.locationName === 'K' || selectedMachine?.locationName === 'E' ? (
                  <>
                    <div className={`text-3xl font-bold`}>
                      {totalActual}
                    </div>
                    <div className="text-lg">Basecoat</div>
                  </>
                ) : (
                  <>
                    <div className={`text-3xl font-bold`}>
                      {totalActualIn}
                    </div>
                    <div className="text-lg">Input</div>
                  </>
                )}
              </div>
              <div>
                {selectedMachine?.locationName === 'K' || selectedMachine?.locationName === 'E' ? (
                  <>
                    <div className={`text-3xl font-bold`}>
                      {totalActualEK}
                    </div>
                    <div className="text-lg">Topcoat</div>
                  </>
                ) : (
                  <>
                    <div className={`text-3xl font-bold`}>
                      {totalActual}
                    </div>
                    <div className="text-lg">Output</div>
                  </>
                )}
              </div>
              <div>
                <div
                  className={`text-3xl font-bold ${
                    (selectedMachine?.locationName === 'E' ||
                    selectedMachine?.locationName === 'K'
                      ? gapEK
                      : gap) > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {((selectedMachine?.locationName === 'E' ||
                  selectedMachine?.locationName === 'K'
                    ? gapEK
                    : gap) < 0
                    ? 0
                    : Math.abs(
                        selectedMachine?.locationName === 'E' ||
                          selectedMachine?.locationName === 'K'
                          ? gapEK
                          : gap
                      )
                  ).toFixed(0)}
                </div>
                <div className="text-lg ">Drop</div>
              </div>
            </CardContent>
          </Card>
          {/* <Card>
          <CardHeader className="text-lg font-bold text-nowrap p-0 flex items-center justify-center gap-2 space-y-0 flex-row pb-2">Sensor Product Status</CardHeader>
          <CardContent className="grid grid-cols-3 gap-6 p-2 pr-4">
            <div>
                <div className={`text-3xl font-bold`}>
                {totalActualIn}
                </div>
              <div className="text-lg">Input</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{totalActual}</div>
              <div className="text-lg ">Output</div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${totalActualIn - totalActual > 0 ? 'text-red-500': 'text-green-500'}`}>
                {Math.abs(totalActualIn - totalActual)}
                </div>
              <div className="text-lg">Gap</div>
            </div>
          </CardContent>
        </Card> */}

          <Card>
            <CardHeader className="text-lg font-bold text-nowrap p-0 flex items-center justify-center gap-2 space-y-0 flex-row pb-2">
              Scrap Status
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-6 p-2 pr-4">
              <div>
                <div className={`text-3xl font-bold`}>{totalRejectOverall}</div>
                <div className="text-lg">Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {(rejectPercentage * 100).toFixed(0)}%
                </div>
                <div className="text-lg">Target</div>
              </div>
              <div>
                <div
                  className={`text-3xl font-bold ${
                    totalRejectOverall /
                      (selectedMachine?.locationName === 'E' ||
                      selectedMachine?.locationName === 'K'
                        ? totalActualEK
                        : totalActual) >
                    rejectPercentage
                      ? 'text-red-500'
                      : 'text-green-500'
                  }`}
                >
                  {(
                    (totalRejectOverall /
                      (selectedMachine?.locationName === 'E' ||
                      selectedMachine?.locationName === 'K'
                        ? totalActualEK
                        : totalActual)) *
                    100
                  ).toFixed(0)}%
                </div>
                <div className="text-lg">Actual</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-lg font-bold text-nowrap p-0 flex items-center justify-center gap-2 space-y-0 flex-row pb-2">
              Spindles
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-6 p-2 pr-4">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`text-3xl font-bold ${getSpindleColor(spindleAct, spindleStd)}`}
                    >
                      {/* {lastSpindle?.SpindleACT ?? 0} */}
                      {spindleAct > spindleStd ? spindleStd : spindleAct}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Highest count</p>
                  </TooltipContent>
                </Tooltip>
                <div className="text-lg">Actual</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {spindleStd}
                </div>
                <div className="text-lg">Target</div>
              </div>
              <div>
                <div
                  className={`text-3xl font-bold ${getSpindleColor(spindleAct, spindleStd)}`}
                >
                  {/* {(((lastSpindle?.SpindleACT ?? 0) / (lastSpindle?.SpindleSTD ?? 1)) * 100).toFixed(0)}% */}
                  {spindleAct > spindleStd
                    ? '100%'
                    : `${((spindleAct / (spindleStd || 1)) * 100).toFixed(0)}%`}
                </div>
                <div className="text-lg">Achieve</div>
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
                <div className="text-3xl font-bold text-red-500">
                  {((oeeData?.[0]?.breakdownperc || 0) * 100.0).toFixed(1)}%
                </div>
              </div>
              <div>
                <div
                  className={`text-3xl font-bold ${(oeeData?.[0]?.ooe || 0) * 100.0 > (oeeData?.[0]?.targetToleranceUv || 0) * 100.0 ? 'text-green-500' : 'text-red-500'}`}
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
                      <div className="text-3xl font-bold">
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
                      <div className="text-3xl font-bold text-[#118DFF]">
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
                      <div className="text-3xl font-bold text-[#FF0000] px-0">
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
                      <div className="text-3xl font-bold text-[#FF7400]">
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
                      <div className="text-3xl font-bold text-[#6A4C93]">
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
                      <div className="text-3xl font-bold text-black px-0">
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
                      <div className="text-3xl font-bold text-[#AAAAAA] px-0">
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
        <div className="p-0 w-full space-y-4 justify-between flex flex-col">
          <TooltipProvider>
            <Card className="w-full">
              <CardContent>
                <div className="w-full flex overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]"></TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                        <TableHead className="w-[150px] text-center"></TableHead>
                        <TableHead
                          colSpan={4}
                          className="w-[60px] text-center text-lg text-nowrap font-bold"
                        >
                          Scrap
                        </TableHead>
                        <TableHead
                          colSpan={3}
                          className="w-[60px] text-center text-lg text-nowrap font-bold"
                        >
                          Top 5 Scrap
                        </TableHead>
                        <TableHead></TableHead>
                        <TableHead></TableHead>
                        <TableHead></TableHead>
                        <TableHead className="w-[150px] truncate text-center"></TableHead>
                        <TableHead className="w-[150px] truncate text-center"></TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead className="w-[60px] text-lg text-nowrap font-bold">
                          Time
                        </TableHead>
                        <TableHead className="w-[60px] text-lg text-nowrap font-bold">
                          ItemNo
                        </TableHead>
                        <TableHead className="w-[60px] text-center text-lg text-nowrap font-bold">
                          Target
                        </TableHead>
                        <TableHead className="w-[60px] text-center text-lg text-nowrap font-bold">
                          Actual Qty
                        </TableHead>
                        <TableHead className="w-[60px] text-center text-lg text-nowrap font-bold">
                          Gap
                        </TableHead>
                        <TableHead className="w-[50px] text-center text-lg font-bold">
                          Scrap Qty
                        </TableHead>
                        <TableHead className="w-[50px] text-center text-lg font-bold">
                          % Scrap
                        </TableHead>
                        <TableHead className="w-[50px] text-center text-lg font-bold">
                          A
                        </TableHead>
                        <TableHead className="w-[50px] text-center text-lg font-bold">
                          B
                        </TableHead>
                        <TableHead className="w-[50px] text-center text-lg font-bold">
                          C
                        </TableHead>
                        <TableHead className="w-[50px] text-center text-lg font-bold">
                          D
                        </TableHead>
                        <TableHead className="w-[50px] text-center text-lg font-bold">
                          E
                        </TableHead>
                        <TableHead className="w-[70px] text-center border border-r-1 border-l-1 border-t-0 border-b-0 text-lg text-nowrap font-bold px-0 gap-0 mx-0">
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
                        <TableHead className="w-[250px] text-center text-lg font-bold border-r border-gray-300">
                          Causes
                        </TableHead>
                        <TableHead className="w-[200px] text-center text-lg font-bold">
                          Comments/Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(hourlyData) && hourlyData?.length === 0 ? (
                        <TableRow className="h-12">
                          <TableCell colSpan={15} className="text-center">
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
                                (oeeData?.[0]?.targetToleranceUv || 1)
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
                                (oeeData?.[0]?.targetToleranceUv || 1)
                            )
                            target_show_100 = Math.floor(
                              (row.target_final *
                                (remainingMinutes + remainingSeconds)) /
                                3600
                            )
                          }

                          // var delta = row.actual - target_show;
                          var delta = row.actual - row.actual_in
                          var top_delta =
                            (row.top_actual || 0) - (row.top_actual_in || 0)

                          const isEK =
                            selectedMachine.locationName == 'E' ||
                            selectedMachine.locationName == 'K'
                          const displayActual = isEK
                            ? row.top_actual || 0
                            : row.actual
                          const displayDelta = isEK ? top_delta : delta

                          // if(delta < 0){
                          //   delta = 0;
                          // }
                          return (
                            <TableRow className="h-12" key={row.time}>
                              <TableCell className="h-full">
                                {row.time}
                              </TableCell>
                              <TableCell className="h-full">
                                {row.itemNo}
                              </TableCell>
                              <TableCell
                                className={`text-center h-full text-nowrap border border-r-0 border-l-1 border-t-0 border-b-0 ${textAnimation}`}
                              >
                                {target_show}
                              </TableCell>
                              <TableCell className="relative overflow-hidden h-full">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center h-full w-full">
                                      {(() => {
                                        const maxValue =
                                          hourlyData?.reduce((max, item) => {
                                            return Math.max(
                                              max,
                                              isEK
                                                ? item.top_actual || 0
                                                : item.actual,
                                              target_show_100 * 1.1
                                            )
                                          }, 0) || 100

                                        return (
                                          <>
                                            <div
                                              className={`absolute inset-0 h-full rounded ${getBarColor(displayActual, row.target, target_show)}`}
                                              style={{
                                                width: `${Math.min((displayActual / maxValue) * 100, 100)}%`,
                                                maxWidth: '250px',
                                              }}
                                            />
                                            <div
                                              className="absolute inset-0 h-full w-[1px] border-dashed border-r-4 border-green-600"
                                              style={{
                                                left: `${Math.min((target_show / maxValue) * 100, 100)}%`, // Accurate tolerance position
                                              }}
                                            />
                                            <div
                                              className="absolute inset-0 h-full w-[1px] border-r-4 border-green-600"
                                              style={{
                                                left: `${Math.min((target_show_100 / maxValue) * 100, 100)}%`, // Accurate target position
                                              }}
                                            />
                                          </>
                                        )
                                      })()}
                                      <span className="relative z-10 ml-2">
                                        {displayActual}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>- - - Target : {target_show}</p>
                                    <p>⸺ Target : {target_show_100}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>

                              <TableCell
                                className={
                                  displayDelta >= 0
                                    ? 'text-green-600 text-center'
                                    : 'text-red-600 text-center'
                                }
                              >
                                {displayDelta}
                              </TableCell>

                              <TableCell className="text-center">
                                {row.reject_a +
                                  row.reject_b +
                                  row.reject_c +
                                  row.reject_d +
                                  row.reject_e || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {isNaN(
                                  ((row.reject_a +
                                    row.reject_b +
                                    row.reject_c +
                                    row.reject_d +
                                    row.reject_e) /
                                    (row.actual + row.top_actual) || 0) * 100
                                )
                                  ? 0
                                  : (
                                      ((row.reject_a +
                                        row.reject_b +
                                        row.reject_c +
                                        row.reject_d +
                                        row.reject_e) /
                                        (row.actual + row.top_actual) || 0) *
                                      100
                                    ).toFixed(2)}{' '}
                                %
                              </TableCell>
                              <TableCell className="text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-center">
                                      {row.reject_a || 0}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {row.reject_a_name}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>

                              <TableCell className="text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-center">
                                      {row.reject_b || 0}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {row.reject_b_name}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>

                              <TableCell className="text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-center">
                                      {row.reject_c || 0}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {row.reject_c_name}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>

                              <TableCell className="text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-center">
                                      {row.reject_d || 0}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {row.reject_d_name}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>

                              <TableCell className="text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-center">
                                      {row.reject_e || 0}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Other</TooltipContent>
                                </Tooltip>
                              </TableCell>

                              <TableCell className="w-[70px] py-0 h-full border border-r-1 border-l-1 border-b-0 border-black-250 px-0">
                                {renderNooeIndicators(row.from_datetime)}
                              </TableCell>

                              <TableCell
                                onClick={() =>
                                  handleCellClick(
                                    index,
                                    row.hourlyId,
                                    'causes',
                                    row.causes
                                  )
                                }
                                className="text-left w-[250px] max-w-[250px] overflow-hidden border-r border-gray-300"
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate block">
                                      {row.causes}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {row.causes
                                        ? `${row.causes} 
                            (Click to edit causes)`
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
                                    row.comments
                                  )
                                }
                                className="text-left w-[200px] max-w-[200px] overflow-hidden"
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate block">
                                      {row.comments}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {row.comments
                                        ? `${row.comments} 
                            (Click to edit comments)`
                                        : 'Click to add comments'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}

                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center"
                        ></TableCell>
                        <TableCell
                          className={`text-center ${isNaN(totalRejectA / totalRejectOverall) ? '' : totalRejectA / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectA / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}
                        >
                          {isNaN(totalRejectA / totalRejectOverall)
                            ? 0
                            : (
                                (totalRejectA / totalRejectOverall) *
                                100
                              ).toFixed(2)}
                          %
                        </TableCell>
                        <TableCell
                          className={`text-center ${isNaN(totalRejectB / totalRejectOverall) ? '' : totalRejectB / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectB / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}
                        >
                          {isNaN(totalRejectB / totalRejectOverall)
                            ? 0
                            : (
                                (totalRejectB / totalRejectOverall) *
                                100
                              ).toFixed(2)}
                          %
                        </TableCell>
                        <TableCell
                          className={`text-center ${isNaN(totalRejectC / totalRejectOverall) ? '' : totalRejectB / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectC / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}
                        >
                          {isNaN(totalRejectC / totalRejectOverall)
                            ? 0
                            : (
                                (totalRejectC / totalRejectOverall) *
                                100
                              ).toFixed(2)}
                          %
                        </TableCell>
                        <TableCell
                          className={`text-center ${isNaN(totalRejectD / totalRejectOverall) ? '' : totalRejectC / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectD / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}
                        >
                          {isNaN(totalRejectD / totalRejectOverall)
                            ? 0
                            : (
                                (totalRejectD / totalRejectOverall) *
                                100
                              ).toFixed(2)}
                          %
                        </TableCell>
                        <TableCell
                          className={`text-center ${isNaN(totalRejectE / totalRejectOverall) ? '' : totalRejectE / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectE / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}
                        >
                          {isNaN(totalRejectE / totalRejectOverall)
                            ? 0
                            : (
                                (totalRejectE / totalRejectOverall) *
                                100
                              ).toFixed(2)}
                          %
                        </TableCell>
                        {/* <TableCell colSpan={2} className="text-center"></TableCell>
                    <TableCell className="text-center" style={{color: totalGapSpindle >= 0 ? "green" : "red"}}>
                      {totalGapSpindle}
                    </TableCell> */}
                      </TableRow>
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
                <ChangeState data={stateData} isLive={isLiveMode} />
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedComment.type === 'causes'
                    ? 'Edit Causes'
                    : 'Edit Comments/Actions'}
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="p-0 m-0">
                Provide your message here
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
              <div className="space-y-4">
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
                    type="Metalizing, Spray Painting, Coating"
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

          <Dialog
            open={IsProcessDialogOpen}
            onOpenChange={setIsProcessDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Process</DialogTitle>
              </DialogHeader>
              <DialogDescription className="p-0 m-0">
                Select Current Process for this machine
              </DialogDescription>
              <div className="space-y-4">
                <Select
                  value={selectedProcess}
                  defaultValue={selectedProcess}
                  onValueChange={(value) => setSelectedProcess(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Process" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Top Coat">Top Coat</SelectItem>
                    <SelectItem value="Base Coat">Base Coat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleProcessChange}>Update Process</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={IsTopScrapDialogOpen}
            onOpenChange={setIsTopScrapDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Top 4 Scrap</DialogTitle>
              </DialogHeader>
              <DialogDescription className="p-0 m-0">
                Update top 4 scrap for machine {selectedMachine?.machineName}
              </DialogDescription>

              <div className="gap-2 grid grid-cols-2">
                <div>
                  <Label htmlFor="current-reject-a">Current Reject A</Label>
                  <Input
                    id="current-reject-a"
                    value={
                      (Array.isArray(hourlyData) &&
                        hourlyData
                          .slice()
                          .reverse()
                          .find((h) => h.task_id !== null)?.reject_a_name) ||
                      'N/A'
                    }
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="new-reject-a">New Reject A</Label>
                  <Select
                    value={selectedRejectA}
                    defaultValue={selectedRejectA}
                    onValueChange={(value) => setSelectedRejectA(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reject" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(rejectList) &&
                        rejectList
                          .filter(
                            (reject) =>
                              ![
                                selectedRejectB,
                                selectedRejectC,
                                selectedRejectD,
                                selectedRejectE,
                              ].includes(reject.id.toString())
                          )
                          .map((reject) => (
                            <SelectItem
                              key={reject.id}
                              value={reject.id.toString()}
                            >
                              {reject.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="gap-2 grid grid-cols-2">
                <div>
                  <Label htmlFor="current-reject-b">Current Reject B</Label>
                  <Input
                    id="current-reject-b"
                    value={
                      (Array.isArray(hourlyData) &&
                        hourlyData
                          .slice()
                          .reverse()
                          .find((h) => h.task_id !== null)?.reject_b_name) ||
                      'N/A'
                    }
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="new-reject-b">New Reject B</Label>
                  <Select
                    value={selectedRejectB}
                    defaultValue={selectedRejectB}
                    onValueChange={(value) => setSelectedRejectB(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reject" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(rejectList) &&
                        rejectList
                          .filter(
                            (reject) =>
                              ![
                                selectedRejectA,
                                selectedRejectC,
                                selectedRejectD,
                                selectedRejectE,
                              ].includes(reject.id.toString())
                          )
                          .map((reject) => (
                            <SelectItem
                              key={reject.id}
                              value={reject.id.toString()}
                            >
                              {reject.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="gap-2 grid grid-cols-2">
                <div>
                  <Label htmlFor="current-reject-c">Current Reject C</Label>
                  <Input
                    id="current-reject-c"
                    value={
                      (Array.isArray(hourlyData) &&
                        hourlyData
                          .slice()
                          .reverse()
                          .find((h) => h.task_id !== null)?.reject_c_name) ||
                      'N/A'
                    }
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="new-reject-c">New Reject C</Label>
                  <Select
                    value={selectedRejectC}
                    defaultValue={selectedRejectC}
                    onValueChange={(value) => setSelectedRejectC(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reject" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(rejectList) &&
                        rejectList
                          .filter(
                            (reject) =>
                              ![
                                selectedRejectA,
                                selectedRejectB,
                                selectedRejectD,
                                selectedRejectE,
                              ].includes(reject.id.toString())
                          )
                          .map((reject) => (
                            <SelectItem
                              key={reject.id}
                              value={reject.id.toString()}
                            >
                              {reject.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="gap-2 grid grid-cols-2">
                <div>
                  <Label htmlFor="current-reject-d">Current Reject D</Label>
                  <Input
                    id="current-reject-d"
                    value={
                      (Array.isArray(hourlyData) &&
                        hourlyData
                          .slice()
                          .reverse()
                          .find((h) => h.task_id !== null)?.reject_d_name) ||
                      'N/A'
                    }
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="new-reject-d">New Reject D</Label>
                  <Select
                    value={selectedRejectD}
                    defaultValue={selectedRejectD}
                    onValueChange={(value) => setSelectedRejectD(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reject" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(rejectList) &&
                        rejectList
                          .filter(
                            (reject) =>
                              ![
                                selectedRejectA,
                                selectedRejectB,
                                selectedRejectC,
                                selectedRejectE,
                              ].includes(reject.id.toString())
                          )
                          .map((reject) => (
                            <SelectItem
                              key={reject.id}
                              value={reject.id.toString()}
                            >
                              {reject.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleTopScrapUpdate} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Update Top Scrap'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <CameraDetailModal
        open={!!selectedCamera}
        camera={selectedCamera}
        onClose={() => {
          setSelectedCamera(null)
          loadInitialData()
        }}
        camerasVisible={!!selectedCamera}
        id={selectedCamera?.id || ''}
        yamlFiles={yamlFiles}
        defaultYamlFile={selectedCamera?.yaml_file}
        defaultYamlFileContent={selectedCamera?.yaml_file_content}
        onSettings={() => {
          setModalState({
            open: true,
            type: 'camera',
            mode: 'edit',
            initialData: selectedCamera,
            id: selectedCamera?.id || '',
          })
        }}
      />
    </div>
  )
}
