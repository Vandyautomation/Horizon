"use client"
import { Button } from "@/components/ui/button"
import albeaLogo from "@/public/albea-white.png"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ResponsiveContainer, XAxis, YAxis, BarChart, Bar, ReferenceLine, Cell, PolarRadiusAxis, RadialBar, RadialBarChart, CartesianGrid, Line } from "recharts"
import { Label as RechartsLabel }  from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"

import Image from 'next/image'
import {   Box, CalendarIcon, FilePlus2, Pencil, RefreshCw } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useState, useEffect, useCallback, use } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { SearchablePOSelect } from "./searchable-select-po"
import useSWR, { mutate } from "swr"
import ErrorState from "./ui/error-state"
import { toast } from "react-hot-toast"
import { format } from "date-fns/format"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "@/lib/utils"
import { Switch } from "./ui/switch"



type MachineDetail = {
  machineId: number;
  machineName: string;
  machineTonage: string;
  machineDescription: string;
  machineNumber: string;
  locationId: number;
  locationName: string;
};

type HourlyData = {
  hourlyId: number;
  time: string;
  task_id: number;
  itemNo: string;
  itemDesc: string;
  target: number;
  target_tolerance: number;
  actual: number;
  actual_in: number;
  delta: number;
  gap: number;
  scrap: number;
  rework: number;
  reject_a: number | 0;
  reject_b: number | 0;
  reject_c: number | 0;
  reject_d: number | 0;
  reject_e: number | 0;
  causes: string;
  comments: string;
  reject_a_name: string ;
  reject_b_name: string ;
  reject_c_name: string ;
  reject_d_name: string ;
  reject_e_name: string ;
  process: string;
};

type OoeData = {
  timea: number;
  pmidle: number;
  timeb: number;
  breakdown: number;
  timee: number;
  ooe: number;
  oee: number;
  breakdownperc: number;
  green: number;
  red: number;
  yellow: number;
  white: number;
  blue: number;
  orange: number;
  purple: number;
  grey: number;
};

type TaskData = {
  id: number;
  po_name: string;
  machine_name: string;
  required_qty: number;
  produced_qty: number;
  cvt: number;
  ct: number;
  actual_cvt: number;
  actual_ct: number;
  target_cvt: number;
  target_ct: number;
  shift_target_qty: number;
  created_at: string;
  updated_at: string;
};

type NooeData = {
  NooeId: number;
  hourlyId: number;
  blue: boolean | null;
  orange: boolean | null;
  purple: boolean | null;
  grey: boolean | null;
  yellow: boolean | null;
  white: boolean | null;
  red: boolean | null;
};

type Spindle = {
  SpindleSTD: number;
  SpindleACT: number;
  created_at: Date;
  totalCountProductIn: number;
  totalCountSpindleIn: number;
  highestCountProductIn: number;
  highestCountProductInCurrentCycle: number;
  highestCountSpindleIn: number;
  highestCountSpindleInCurrentCycle: number;
  totalCountProductOut: number;
  totalCountSpindleOut: number;
  highestCountProductOut: number;
  highestCountProductOutCurrentCycle: number;
  highestCountSpindleOut: number;
  highestCountSpindleOutCurrentCycle: number;
  count_in_product: number;
  last_data_in_product: number;
  count_in_spindle: number;
  last_data_in_spindle: number;
  count_out_product: number;
  last_data_out_product: number;
  count_out_spindle: number;
  last_data_out_spindle: number;
  count_start: number;
  last_data_start: number;
  last_data_reject_a: number;
  last_data_reject_b: number;
  last_data_reject_c: number;
  last_data_reject_d: number;
  last_data_reject_e: number;
  count_reject_a: number;
  count_reject_b: number;
  count_reject_c: number;
  count_reject_d: number;
  count_reject_e: number;
}

type StateData = {
  ID: string;
  AdjustedStatusDate: string;
  Color: string
}

type RejectList = {
  id: number;
  name: string
}
const refreshRateList = [
  '15000','30000','60000'
]

const shiftList = ['1','2','3']

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CountboardDashboardUvManagement() {
  const [selectedMachine, setSelectedMachine] = useState<MachineDetail | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedRejectA, setSelectedRejectA] = useState<string>('');
  const [selectedRejectB, setSelectedRejectB] = useState<string>('');
  const [selectedRejectC, setSelectedRejectC] = useState<string>('');
  const [selectedRejectD, setSelectedRejectD] = useState<string>('');
  const [selectedRejectE, setSelectedRejectE] = useState<string>('');

  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState({ index: -1, hourlyId: -1, type: '', content: '' });
  const [isPODialogOpen, setIsPODialogOpen] = useState(false);
  const [IsTopScrapDialogOpen, setIsTopScrapDialogOpen] = useState(false);
  const [IsProcessDialogOpen, setIsProcessDialogOpen] = useState(false);

  const [selectedProcess, setSelectedProcess] = useState('');

  const [selectedPO, setSelectedPO] = useState('');
  const [selectedRefreshRate, setRefreshRate] = useState('15000');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState('');
  const [isLoadingRefresh, setIsLoadingRefresh] = useState(false); 
  const [isLiveMode, setIsLiveMode] = useState(true); 
  const [loading, setLoading] = useState(true);
  const [rejectList, setRejectList] = useState<RejectList[]>([]);

  const pathname = usePathname()
  const router = useRouter()

  const [shiftStartHour, setShiftStartHour] = useState(0);
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    let shift = 0;

  
    switch (true) {
      case hour >= 6 && hour < 14:
        shift = 1;
        break;
      case hour >= 14 && hour < 22:
        shift = 2;
        break;
      case hour >= 22 || hour < 6:
        shift = 3;
        if (hour < 6) {
          now.setDate(now.getDate() - 1); // Move to the previous day
        }
        break;
      default:
        throw new Error(`Unexpected hour ${hour}`);
    }
  
    // Set shift start time
    now.setHours(6 + (shift - 1) * 8, 0, 0, 0);
    setSelectedShift(shift.toString());
    setShiftStartHour(now.getTime());
  }, []);

  useEffect(() => {
    const refreshAtShiftChange = () => {
      const now = new Date();
      const hour = now.getHours();
      const lastRefreshedHour = localStorage.getItem("lastRefreshedHour");

      if ((hour === 6 || hour === 14 || hour === 22) && lastRefreshedHour != hour.toString()) {
        localStorage.setItem("lastRefreshedHour", hour.toString());
        toast.success("Auto Refreshing every shift ...", { duration: 1000 });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    refreshAtShiftChange();
  }, [router]);
  
  const from = isLiveMode 
    ? shiftStartHour 
    : new Date(new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24)).setHours(6 + (+selectedShift - 1) * 8, 0, 0, 0);
  
  const to = isLiveMode
    ? 'now' // Live mode uses current timestamp
    : new Date(new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24)).setHours(6 + (+selectedShift - 1) * 8 + 8, 0, 0, 0); // Set to end of shift
  
  

  const { data: machines, error, isValidating } = useSWR<MachineDetail[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines?type=uv`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  useEffect(() => {
    setIsLoading(isValidating);
  }, [isValidating]);

    useEffect(() => {
    if(selectedMachine?.machineName){
          Promise.all([
      refetchHourlyData(),
      refetchOeeData(),
      refetchTaskData(),
      refetchNoeeData(),
      refetchStateData(),
      refetchSpindleData(),
    ]);
    }
  }, [selectedMachine?.machineName]);

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
    !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
      ? `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
      : ''
  }`
  : null;

  const { data: spindleData } = useSWR<Spindle[]>(spindleDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });
  const refetchSpindleData = useCallback(() => mutate(spindleDataKey), [spindleDataKey]);

  const hourlyDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/hourly/${selectedMachine.machineName}?type=uv${
      !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
        ? `&date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
        : ''
    }`
    : null;

  const { data: hourlyData } = useSWR<HourlyData[]>(hourlyDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });
  const refetchHourlyData = useCallback(() => mutate(hourlyDataKey), [hourlyDataKey]);

  const oeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/oee/${selectedMachine.machineName}${
      !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
      }`
    : null;

  const { data: oeeData } = useSWR<OoeData[]>(oeeDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });

  const refetchOeeData = () => mutate(oeeDataKey);

  const noeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/noee/${selectedMachine.machineName}${
      !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
      ?  `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
    }`
    : null;

  const { data: noeeData } = useSWR<NooeData[]>(noeeDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });

  const refetchNoeeData = () => mutate(noeeDataKey);


  const stateDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/state/${selectedMachine.machineName}${
      !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
      ?  `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
    }`
    : null;

  const { data: stateData } = useSWR<StateData[]>(stateDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });

  const refetchStateData = () => mutate(stateDataKey);

  const taskDataKey = selectedMachine?.machineDescription
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/tasks/${selectedMachine.machineDescription}${
      !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
      ? `?date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
          : ''
    }`
    : null;

  const { data: taskData } = useSWR<TaskData[]>(taskDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });
  const refetchTaskData = useCallback(() => {
    mutate(taskDataKey);
  }, [taskDataKey]);

 

  const uniqueLocations = Array.from(new Set(machines?.map(machine => machine.locationName)));
  const filteredMachines = machines?.filter(machine => machine.locationName === selectedLocation);

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    const params = new URLSearchParams(searchParams);
    params.set("location", value);
    router.push(`${pathname}?${params.toString()}`);
    setSelectedMachineNumber('');
    setSelectedMachine(null);
  };

  const handleMachineNumberChange = (value: string) => {
    setSelectedMachineNumber(value);
    const selected = filteredMachines?.find(machine => machine.machineNumber === value) || null;
    setSelectedMachine(selected);
    const params = new URLSearchParams(searchParams);
    params.set("machineNumber", value);
    router.push(`${pathname}?${params.toString()}`);
  };
  

  const handleRefreshRateChange = (value: string) => {
    setRefreshRate(value);
  }

  const handleLiveMode = () => {
    setIsLiveMode(!isLiveMode);
    const params = new URLSearchParams(searchParams);
    params.set("isLiveMode", String(!isLiveMode));


    if (isLiveMode == false) {
      setRefreshRate('15000')
      params.set("refresh", '15000');
      params.delete("date");
      params.delete("shift");
    } else if (isLiveMode == true){
      setRefreshRate('30000')
      params.set("refresh", '30000');
      params.set("date", selectedDate.toISOString().split('T')[0]);
      params.set("shift", selectedShift.toString());
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const params = new URLSearchParams(searchParams);
    params.set("date", date.toISOString().split('T')[0]);
    router.push(`${pathname}?${params.toString()}`);
    handleRefreshButton()
  }

  const handleShiftSelect = (shift: string) => {
    setSelectedShift(shift);
    const params = new URLSearchParams(searchParams);
    params.set("shift", shift);
    router.push(`${pathname}?${params.toString()}`);
    handleRefreshButton()

  }

  const handleRefreshButton = async () => {
    setIsLoadingRefresh(true);
    try {
      await Promise.all([
        refetchHourlyData(),
        refetchOeeData(),
        refetchTaskData(),
        refetchNoeeData(),
        refetchStateData(),
      ]);
    } finally {
      setIsLoadingRefresh(false);
    }
  }

  const handleCellClick = (index: number, hourlyId: number, type: 'causes' | 'comments', content: string) => {
    setSelectedComment({ index, hourlyId, type, content });
    setIsDialogOpen(true);
  };


  const handleCommentSave = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/comment`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({"hourlyId":selectedComment?.hourlyId, "type": selectedComment?.type, "content":selectedComment?.content, "uap":"uv" }),
        });

        if (!response.ok) {
          // Attempt to extract the server's error message
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to Update Content`;
  
          throw new Error(errorMessage);
        }
        toast.success(`Update Content successfully!`);
      } catch (error) {
        toast.error((error as Error).message);
        console.error(`Failed to Update Content:`, error);
      }
      finally {
        setIsLoading(false);
      }
      setIsDialogOpen(false);
      refetchHourlyData();
      setSelectedComment(selectedComment)
    },
    [selectedComment, refetchHourlyData]
  );



    const handleTopScrapUpdate = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/topscrap`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "taskId": taskData && taskData.length > 0 ? taskData[0].id : new Error("Task ID not found"),
            "hourlyId": hourlyData && hourlyData.length > 0 ? hourlyData.slice().reverse().find(h => h.task_id !== null)?.hourlyId : null,
            "reject_a":selectedRejectA, 
            "reject_b": selectedRejectB, 
            "reject_c": selectedRejectC, 
            "reject_d": selectedRejectD,
          }),
        });

        if (!response.ok) {
          // Attempt to extract the server's error message
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to Update Top Scrap`;
  
          throw new Error(errorMessage);
        }
        toast.success(`Update Top Scrap successfully!`);
      } catch (error) {
        toast.error((error as Error).message);
        console.error(`Failed to Update Top Scrap:`, error);
      } finally {
        setIsLoading(false);
      }
      refetchTaskData();
      setIsTopScrapDialogOpen(false);
    },
    [hourlyData, selectedRejectA, selectedRejectB, selectedRejectC, selectedRejectD, refetchTaskData, taskData]
  );

  const handleProcessChange = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/process`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            {
              "hourlyId":hourlyData && hourlyData.length > 0 ? hourlyData.slice().reverse().find(h => h.task_id !== null)?.hourlyId : null,
              "process": selectedProcess 
            }),
        });

        if (!response.ok) {
          // Attempt to extract the server's error message
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to Change Process`;
  
          throw new Error(errorMessage);
        }
        setIsProcessDialogOpen(false);
        toast.success(`Change Process success!`);
      } catch (error) {
        toast.error((error as Error).message);
        console.error(`Failed to Change Process:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedProcess, hourlyData]
  );


  const handlePOAttach = useCallback(
    async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/task`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({"poNumber":selectedPO, "machineName": selectedMachine?.machineName }),
        });

        if (!response.ok) {
          // Attempt to extract the server's error message
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to Attach PO`;
  
          throw new Error(errorMessage);
        }
        setIsPODialogOpen(false);
        toast.success(`Attach PO successfully!`);
      } catch (error) {
        toast.error((error as Error).message);
        console.error(`Failed to Attach PO:`, error);
      }
    },
    [selectedPO, selectedMachine]
  );


  const getBarColor = (actual: number, target: number, target_tolerance: number) => {
    if (actual >= target) return 'bg-green-500';
    if (actual >= target_tolerance) return 'bg-green-500';
    return 'bg-red-500';
  };



  const getSpindleColor = (SpindleACT: number | null, SpindleSTD: number | null) => {
    if (SpindleACT === null || SpindleSTD === null || SpindleACT >= SpindleSTD) return 'text-green-500';
    return 'text-red-500';
  };


  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams);

  let queryMachineNumber = searchParams.get('machineNumber') || '';
  let queryLocation = searchParams.get('location') || '';
  let queryRefreshRate = searchParams.get('refresh') || '';
  let queryLiveMode = searchParams.get('isLiveMode') || '' ;
  const queryDate = searchParams.get('date') || '' ;
  const queryShift = searchParams.get('shift') || '' ;



  if (queryMachineNumber == '') {
    queryMachineNumber = '1';
    params.set('machineNumber', '1');
    router.push(`${pathname}?${params.toString()}`);
  }

  if (queryLocation == '') {
    queryLocation = 'K';
    params.set('location', 'K');
    router.push(`${pathname}?${params.toString()}`);

  }
  if (queryRefreshRate == '') {
    queryRefreshRate = '15000';
    params.set('refresh', '15000');
    router.push(`${pathname}?${params.toString()}`);
  }
  if (queryLiveMode == '' ) {
    queryLiveMode = 'true'
    params.set('isLiveMode', 'true');
    router.push(`${pathname}?${params.toString()}`);
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
      setSelectedLocation(queryLocation);
      console.log(`machine location from query : ${queryLocation}`);
    }
  }, [queryLocation]);

  useEffect(() => {
    if (queryMachineNumber) {
      setSelectedMachineNumber(queryMachineNumber);
      // const selected = filteredMachines?.find(
      //   machine => machine.machineNumber === queryMachineNumber
      // );
      const selected = filteredMachines?.find(machine => machine.machineNumber == queryMachineNumber);
      console.log(`filteredMachines from query: ${JSON.stringify(filteredMachines)}`);
      console.log(`selected from query: ${JSON.stringify(selected)}`);

      setSelectedMachine(selected || null);
      console.log(`machine number from query : ${queryMachineNumber}`);
      console.log(`selected machine from query :`, selected);
    }
  }, [queryMachineNumber, machines, filteredMachines]);

  useEffect(() => {
    if (queryRefreshRate) {
      setRefreshRate(queryRefreshRate);
      console.log(`refreshRate : ${queryRefreshRate}`);
    }
  }, [queryRefreshRate]);

  useEffect(() => {
    if (queryLiveMode){
      if(queryLiveMode == 'true'){
        setIsLiveMode(true);
      } else if (queryLiveMode == 'false'){
        setIsLiveMode(false);
      }
      console.log(`liveMode : ${queryLiveMode}`);
    }
  }, [queryLiveMode]);

  useEffect(() => {
    if (queryDate) {
      setSelectedDate(new Date(new Date(queryDate).getTime() + 1000 * 60 * 60 * 24));
      console.log(`selectedDate : ${queryDate}`);
    }
  }, [queryDate]);

  useEffect(() => {
    if (queryShift) {
      setSelectedShift(queryShift);
      console.log(`selectedShift : ${queryShift}`);
    }
  }, [queryShift]);

  // const totalActual = Array.isArray(hourlyData) && hourlyData?.reduce((total, item) => total + (item.actual || 0), 0) || 0
  // const totalTarget = Array.isArray(hourlyData) && hourlyData?.reduce((total, item) => total + (item.target || 0), 0) || 0
  const totalInput = Array.isArray(hourlyData) && hourlyData?.reduce((total, item) => total + (item.actual_in || 0), 0) || 0
  const totalOutput = Array.isArray(hourlyData) && hourlyData?.reduce((total, item) => total + (item.actual || 0), 0) || 0

  const totalGap = Array.isArray(hourlyData) && hourlyData?.reduce((total, item) => total + (item.actual_in || 0) - (item.actual || 0), 0) || 0

  const gapPercentage = Math.abs(totalGap / totalInput * 100) || 0

  const rejectAByName: any = {};
  const rejectBByName: any = {};
  const rejectCByName: any = {};
  const rejectDByName: any = {};

  // Group rejects by name and sum their values
  if (Array.isArray(hourlyData) && hourlyData?.length > 0) {
    hourlyData.forEach(item => {
      // Handle reject A
      if (item.reject_a_name) {
        rejectAByName[item.reject_a_name] = (rejectAByName[item.reject_a_name] || 0) + (item.reject_a || 0)
      }
      // Handle reject B
      if (item.reject_b_name) {
        rejectBByName[item.reject_b_name] = (rejectBByName[item.reject_b_name] || 0) + (item.reject_b || 0)
      }
      // Handle reject C
      if (item.reject_c_name) {
        rejectCByName[item.reject_c_name] = (rejectCByName[item.reject_c_name] || 0) + (item.reject_c || 0)
      }
      // Handle reject D
      if (item.reject_d_name) {
        rejectDByName[item.reject_d_name] = (rejectDByName[item.reject_d_name] || 0) + (item.reject_d || 0)
      }
    })
  }

  // Find top reject for each category by amount
  const getTopReject = (rejectObj: any) => {
    let topName = 'N/A'
    let topValue = 0
    
    Object.entries(rejectObj).forEach(([name, value]: [string, any]) => {
      if (value > topValue) {
      topValue = value
      topName = name
      }
    })
    
    return { name: topName, value: topValue }
  }

  const topRejectA = getTopReject(rejectAByName)
  const topRejectB = getTopReject(rejectBByName)
  const topRejectC = getTopReject(rejectCByName)
  const topRejectD = getTopReject(rejectDByName)

  // Calculate totals
  const totalRejectA = topRejectA.value
  const totalRejectB = topRejectB.value
  const totalRejectC = topRejectC.value
  const totalRejectD = topRejectD.value
  const totalRejectE = Array.isArray(hourlyData) && hourlyData?.reduce((total, item) => total + (item.reject_e || 0), 0) || 0

  const totalRejectOverall = totalRejectA + totalRejectB + totalRejectC + totalRejectD + totalRejectE

  const rejectDataGauge = [{ target: 9, actual: 14, full: 100 }]
  // (totalRejectOverall / totalOutput) * 100

  // Get top reject names
  const TopRejectAName = topRejectA.name
  const TopRejectBName = topRejectB.name
  const TopRejectCName = topRejectC.name
  const TopRejectDName = topRejectD.name
  const TopRejectEName = Array.isArray(hourlyData) && hourlyData?.[0]?.reject_e_name || 'Other'


  let targetScrap = 0.02;
  if (selectedLocation === 'K' || selectedLocation === 'E') {
    targetScrap = 0.09;
  } else if (selectedLocation === 'M') {
    targetScrap = 0.05;
  } else if (selectedLocation === 'SP') {
    targetScrap = 0.02;
  } 
  
  // You can add more conditions here
  // else if (selectedLocation === 'X') {
  //   targetScrap = 0.05;
  // }




  const renderNooeIndicators = (hourlyId: number) => {
    const nooeForTime = noeeData?.filter(nooe => nooe.hourlyId === hourlyId) || [];
    if (nooeForTime.length === 0) return null;

    const colorMap = {
      blue: 'bg-blue-500 ml-0',
      orange: 'bg-orange-500 ml-1',
      purple: 'bg-purple-500 ml-2',
      grey: 'bg-gray-500 ml-3',
      yellow: 'bg-yellow-500 ml-3',
      white: 'bg-white border border-gray-300 ml-4',
      red: 'bg-red-500 ml-4',
    };

    return (
      <div className="flex h-12 flex-col gap-0.5 mb-0">
      {nooeForTime.map((nooe) => {
        const activeColor = Object.keys(colorMap).find(color => nooe[color as keyof typeof nooe] === true);
        return activeColor ? (
          <div 
            key={nooe.NooeId}
            className={`w-0.5 h-0.5 ${colorMap[activeColor as keyof typeof colorMap]}`}
          />
        ) : (
        <div className={`w-0.5 h-0.5 bg-none`} />
      );
      })}
    </div>
    );
  };


  const { data: rejectListFetched, error: rejectError } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/rejects`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  useEffect(() => {
    setRejectList(rejectListFetched);
  }, [rejectListFetched]);

  const isLoadingRejectList = !rejectList && !rejectError;
  const fetchRejectList = useCallback(async () => {
    if (isLoadingRejectList) return;
    mutate(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/rejects`,
      async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/rejects`,
          {
            credentials: "include",
          },
        );
        const data = await response.json();
        return data;
      },
      {
        revalidate: false,
        rollbackOnError: true,
      },
    );
  }, [isLoadingRejectList]);

  useEffect(() => {
    if (isLoadingRejectList) {
      fetchRejectList();
    }
  }, [isLoadingRejectList, fetchRejectList]);

  if (error) return <ErrorState message="Error loading machines. Please try again later." />;



  return (
    <div className="p-2 space-y-2 w-full">
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <Label className=" px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle">
          Loading ...
        </Label>
        ) : (
          <Select value={selectedLocation} onValueChange={handleLocationChange} >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Building" />
            </SelectTrigger>
            <SelectContent>
              {uniqueLocations?.map(locationName => (
                <SelectItem key={locationName} value={locationName}>
                  {locationName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

      {isLoading ? (
          <div></div>
        ) : (
        <Select value={selectedMachineNumber} onValueChange={handleMachineNumberChange}>
          <SelectTrigger className="w-[60px]">
            <SelectValue placeholder="MchNumber" />
          </SelectTrigger>
          <SelectContent>
            {filteredMachines?.map(machine => (
              <SelectItem key={machine.machineNumber} value={machine.machineNumber}>
                {machine.machineNumber}
              </SelectItem>
            ))} 
          </SelectContent>
        </Select>)}

        <Label className=" px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle">
          {selectedMachine?.machineDescription || "MchDesc"}
        </Label>
        {/* <Label className="px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle">
          {Array.isArray(hourlyData) && hourlyData && hourlyData.filter(data => data?.itemDesc !== null).length > 0 ? hourlyData.filter(data => data?.itemDesc !== null).slice(-1)[0].itemDesc : "Material Description"}
        </Label>
        <Label className="px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle">
         PO{taskData && taskData.length > 0 ? taskData[taskData.length - 1].po_name : " Number"}
        </Label> */}
        
        <Select value={selectedRefreshRate} onValueChange={handleRefreshRateChange}>
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="Refresh Rate">
              <div className="flex gap-1 align-middle items-center">
              <RefreshCw size={15}/>
              {Number(selectedRefreshRate)/1000} s
              </div>
              </SelectValue>
          </SelectTrigger>
          <SelectContent >
            {refreshRateList?.map(refreshRate => (
                <SelectItem key={refreshRate} value={refreshRate}>
                  {Number(refreshRate) / 1000} s
                </SelectItem>
              ))} 
          </SelectContent>
        </Select>
        <Button
          onClick={() => handleRefreshButton()}
          disabled={isLoadingRefresh}
          variant="default"
        >
            <RefreshCw className="w-4 h-4" style={{ animation: isLoadingRefresh ? "spin 2s linear infinite" : "none" }} />
        </Button>
        {/* <Button onClick={() => setIsPODialogOpen(true)} variant="default">
            <FilePlus2 className="w-4 h-4 mr-2"  />
            PO
        </Button>
        <Button onClick={() => {setIsTopScrapDialogOpen(true), mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/rejects`)}} variant="default">
            <Pencil className="w-4 h-4 mr-2" />
            Top Scrap
        </Button> */}
        
        {/* {selectedMachine?.locationName == 'K' || selectedMachine?.locationName == 'E' ? (
        <Label className="px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle cursor-pointer" onClick={() => {setIsProcessDialogOpen(true)}}>
        Process : {hourlyData && hourlyData.length > 0 ? hourlyData.slice().reverse().find(h => h.task_id !== null)?.process || 'N/A' : "N/A"}
            <Pencil className="w-4 h-4 rounded ml-4" />
        </Label>  
        ) : ( null)} */}
        


        <div className="flex items-center space-x-2 border border-gray-250 rounded-md px-3 py-2">
        <Switch id="live-mode" 
            checked={isLiveMode}
            onCheckedChange={handleLiveMode} />
        <Label htmlFor="live-mode">LIVE MODE</Label>
        </div>

        {!isLiveMode && (
          <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[185px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {selectedDate ? format(new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24) }
                onSelect={selectedDate => handleDateSelect(new Date(selectedDate!.getTime() + 1000 * 60 * 60 * 24))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select value={selectedShift} onValueChange={handleShiftSelect}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Shift" />
            </SelectTrigger>
            <SelectContent>
              {shiftList?.map(shift => (
                <SelectItem key={shift} value={shift}>
                  Shift {shift}
                </SelectItem>
              ))} 
            </SelectContent>
          </Select>
          </>
        )}

        {/* <Button onClick={() => router.push("/countboard")}><Box/>Go to Injection</Button> */}



      </div>
      {selectedMachine === null && isLoading == false ? (
        <div className="text-center">Please select machine...</div>
      ) : (
      <div className="flex gap-2 md:grid-cols-2 lg:grid-cols-4 text-center">
        {/* <Image src={albeaLogo} alt="Albea" width={200} height={100} className="px-3 py-2 flex items-center border border-gray-250 rounded-xl text-gray-700 align-middle"/> */}        
        <Card className="p-0 w-full ">
          <CardHeader className="py-2 text-lg font-medium">Production Status</CardHeader>
          <CardContent className="grid grid-cols-4 gap-4 items-center align-middle justify-center p-0">
            <div>
            <div className="text-2xl font-bold text-green-500">{totalInput}</div>
              <div className="text-sm text-muted-foreground">Input Product</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">{totalOutput}</div>
              <div className="text-sm text-muted-foreground">Output Product</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${totalGap < 0 ? "text-red-600" : "text-green-500"}`}>{totalGap}</div>
              <div className="text-sm text-muted-foreground">Gap</div>
            </div>

            <div>
              <div className={`text-2xl font-bold ${totalGap < 0 ? "text-red-600" : "text-green-500"}`}>{gapPercentage.toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">%Gap</div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full ">
          <CardHeader className="py-2 text-lg font-medium">Spindles</CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 items-center align-middle justify-center p-0 ">
            <div>
                {/* <div className={`text-2xl font-bold ${getSpindleColor(
                Array.isArray(spindleData) && spindleData.length > 0 
                  ? spindleData.reduce((sum, spindle) => sum + (spindle.SpindleACT || 0), 0) / spindleData.length 
                  : 0,
                spindleData?.[0]?.SpindleSTD ?? 0
                )}`}>
                {Array.isArray(spindleData) && spindleData.length > 0 
                  ? Math.round(spindleData.reduce((sum, spindle) => sum + (spindle.SpindleACT || 0), 0) / spindleData.length) 
                  : 0}
                </div> */}
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`text-2xl font-bold ${getSpindleColor(spindleData?.[spindleData.length -1 ]?.SpindleACT ?? 0, spindleData?.[spindleData.length -1 ]?.SpindleSTD ?? 0)}`}>
                    {spindleData?.[spindleData.length - 1]?.SpindleACT ?? 0}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Highest count cycle sebelumnya</p>
                  </TooltipContent>
                  </Tooltip>
              <div className="text-sm text-muted-foreground">Actual</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{spindleData?.[0]?.SpindleSTD ?? 0}</div>
              <div className="text-sm text-muted-foreground">Target</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getSpindleColor(spindleData?.[0]?.SpindleACT ?? 0, spindleData?.[0]?.SpindleSTD ?? 0)}`}>{(((spindleData?.[0]?.SpindleACT ?? 0) / (spindleData?.[0]?.SpindleSTD ?? 1)) * 100).toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">Achieve</div>
            </div>
          </CardContent>
        </Card>

      </div> 
      )} 
      {selectedMachine === null ? (
        null
      ) : (
      <div className="p-0 w-full space-y-4 justify-between flex flex-col">
        
            
        <div className="flex gap-2"> 
      <Card className="flex flex-col w-1/2">
      <CardHeader className="items-center pb-0">
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <div className="h-full w-1/2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={spindleData?.map((item, index, array) => {
          // Calculate cycle time based on count_start incremental differences
          const prevItem = index > 0 ? array[index - 1] : null;
          const countDiff = prevItem ? item.count_start - prevItem.count_start : 0;
          // Avoid division by zero and handle first item
          const cycleTime = countDiff > 0 ? 3600 / countDiff : 0; // seconds per cycle (3600 sec = 1 hour)
          
          return {
            time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'N/A',
            cycleTime: cycleTime > 0 && cycleTime < 100 ? cycleTime : null, // Filter out extreme values
            countDiff
          };
              }).filter(item => item.cycleTime !== null)}
              margin={{ top: 5, right: 30, left: 20, bottom: 35 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
          dataKey="time" 
          angle={-45} 
          textAnchor="end" 
          tick={{ fontSize: 10 }}
          height={60} 
              />
              <YAxis 
          label={{ value: 'Cycle Time (sec)', angle: -90, position: 'insideLeft' }}
          domain={['auto', 'auto']}
              />
              <ChartTooltip 
          formatter={(value, name) => [
            `${typeof value === 'number' ? value.toFixed(2) : value} seconds`, 
            "Cycle Time"
          ]} 
              />
              <Bar 
          dataKey="cycleTime" 
          fill="hsl(var(--chart-4))" 
          radius={[4, 4, 0, 0]}
          name="Cycle Time"
              >
          {spindleData?.map((entry, index, array) => {
            const prevItem = index > 0 ? array[index - 1] : null;
            const countDiff = prevItem ? entry.count_start - prevItem.count_start : 0;
            const cycleTime = countDiff > 0 ? 3600 / countDiff : 0;
            // Color bars based on cycle time performance
            const targetCycleTime = entry.SpindleSTD > 0 ? 3600 / entry.SpindleSTD : 0;
            return (
              <Cell 
                key={`cell-${index}`} 
                fill={cycleTime <= targetCycleTime ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              />
            );
          })}
              </Bar>
              <ReferenceLine 
          y={spindleData?.[0]?.SpindleSTD || 0 > 0 ? 3600 / (spindleData?.[0]?.SpindleSTD || 1) : 0}
          stroke="hsl(var(--chart-1))" 
          strokeDasharray="3 3"
          label={{ value: 'Target Cycle', position: 'top', fill: 'hsl(var(--chart-1))' }} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartContainer
          config={{
        target: {
          label: 'Target',
          color: 'hsl(var(--chart-1))'
        },
        actual: {
          label: 'Actual',
          color: 'hsl(var(--chart-2))'
        }
          }}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
          data={[{ 
            value: ((totalRejectOverall / totalOutput) * 100) || 0, 
            fill: (totalRejectOverall/totalOutput) > targetScrap ? "hsl(var(--destructive))" : "hsl(var(--success))",
            target: targetScrap * 100
          }]}
        startAngle={180}
        endAngle={0}
        innerRadius={100}
        outerRadius={140}
        barSize={20}
          >
        <PolarRadiusAxis
          angle={90}
          domain={[0, 20]}
          tick={false}
          tickLine={false}
          axisLine={false}
        />
        <RadialBar
          background
          dataKey="value"
          fill="fill"
          cornerRadius={10}
          className="stroke-transparent"
        />
        <RechartsLabel
          content={({ viewBox }) => {
            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
          return (
            <g>
              <text 
            x={viewBox.cx} 
            y={(viewBox.cy || 0) - 15} 
            textAnchor="middle"
            className="fill-foreground text-3xl font-bold"
              >
            {((totalRejectOverall / totalOutput) * 100).toFixed(2)}%
              </text>
              <text 
            x={viewBox.cx} 
            y={(viewBox.cy || 0) + 15} 
            textAnchor="middle"
            className="fill-muted-foreground text-sm"
              >
            Scrap Rate
              </text>
              <text 
            x={viewBox.cx} 
            y={(viewBox.cy || 0) + 40} 
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
              >
            Target: {(targetScrap * 100).toFixed(2)}%
              </text>
            </g>
          );
            }
            return null;
          }}
        />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
    <Card className="flex flex-col w-1/2">
      <CardHeader className="items-center pb-0">
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <div className="h-full w-1/2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { name: TopRejectAName || 'N/A', value: totalRejectA, percent: (totalRejectA / totalRejectOverall) * 100 || 0 },
                { name: TopRejectBName || 'N/A', value: totalRejectB, percent: (totalRejectB / totalRejectOverall) * 100 || 0 },
                { name: TopRejectCName || 'N/A', value: totalRejectC, percent: (totalRejectC / totalRejectOverall) * 100 || 0 },
                { name: TopRejectDName || 'N/A', value: totalRejectD, percent: (totalRejectD / totalRejectOverall) * 100 || 0 },
                { name: TopRejectEName || 'N/A', value: totalRejectE, percent: (totalRejectE / totalRejectOverall) * 100 || 0 }
              ].sort((a, b) => b.value - a.value)}
              margin={{ top: 5, right: 30, left: 20, bottom: 35 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                tick={{ fontSize: 10 }}
                height={60} 
              />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <ChartTooltip 
                formatter={(value, name, props) => [
                  `${value} (${props.payload.percent.toFixed(2)}%)`, 
                  "Quantity"
                ]} 
              />
              <Bar 
                yAxisId="left" 
                dataKey="value" 
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="percent" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2} 
                dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartContainer
          config={{
        target: {
          label: 'Target',
          color: 'hsl(var(--chart-1))'
        },
        actual: {
          label: 'Actual',
          color: 'hsl(var(--chart-2))'
        }
          }}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
          data={[{ 
            value: ((totalRejectOverall / totalOutput) * 100) || 0, 
            fill: (totalRejectOverall/totalOutput) > targetScrap ? "hsl(var(--destructive))" : "hsl(var(--success))",
            target: targetScrap * 100
          }]}
        startAngle={180}
        endAngle={0}
        innerRadius={100}
        outerRadius={140}
        barSize={20}
          >
        <PolarRadiusAxis
          angle={90}
          domain={[0, 20]}
          tick={false}
          tickLine={false}
          axisLine={false}
        />
        <RadialBar
          background
          dataKey="value"
          fill="fill"
          cornerRadius={10}
          className="stroke-transparent"
        />
        <RechartsLabel
          content={({ viewBox }) => {
            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
          return (
            <g>
              <text 
            x={viewBox.cx} 
            y={(viewBox.cy || 0) - 15} 
            textAnchor="middle"
            className="fill-foreground text-3xl font-bold"
              >
            {((totalRejectOverall / totalOutput) * 100).toFixed(2)}%
              </text>
              <text 
            x={viewBox.cx} 
            y={(viewBox.cy || 0) + 15} 
            textAnchor="middle"
            className="fill-muted-foreground text-sm"
              >
            Scrap Rate
              </text>
              <text 
            x={viewBox.cx} 
            y={(viewBox.cy || 0) + 40} 
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
              >
            Target: {(targetScrap * 100).toFixed(2)}%
              </text>
            </g>
          );
            }
            return null;
          }}
        />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>

    </div>

<div className="flex gap-2"> 
        <TooltipProvider>
        <Card className="w-1/2">
          <CardContent>
            <div className="w-full flex overflow-x-auto">
            <Table>
              <TableHeader>
              <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead colSpan={5} className="text-center">Scrap Actual</TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead className="w-[125px] truncate text-center"></TableHead>
                  <TableHead className="w-[125px] truncate text-center"></TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="w-[60px]">Time</TableHead>
                  <TableHead className="w-[60px]">ItemNo</TableHead>
                  <TableHead className="w-[60px]">Target</TableHead>
                  <TableHead className="w-[50px] text-center">SCRAP TOTAL</TableHead>
                  <TableHead className="w-[50px] text-center">% SCRAP</TableHead>
                  <TableHead className="w-[50px] text-center">A</TableHead>
                  <TableHead className="w-[50px] text-center">B</TableHead>
                  <TableHead className="w-[50px] text-center">C</TableHead>
                  <TableHead className="w-[50px] text-center">D</TableHead>
                  <TableHead className="w-[50px] text-center">E</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(hourlyData) && hourlyData?.length === 0 ? (
                  <TableRow className="h-12">
                    <TableCell colSpan={17} className="text-center">No data available</TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(hourlyData) ? hourlyData : []).map((row, index) => (
                    <TableRow className="h-12" key={row.time}>
                      <TableCell className="h-full">{row.time}</TableCell>
                      <TableCell className="h-full">{row.itemNo}</TableCell>
                      <TableCell className="text-center h-full">{row.target}</TableCell>
                      <TableCell className="text-center">{row.reject_a + row.reject_b + row.reject_c + row.reject_d + row.reject_e || 0}</TableCell>
                      <TableCell className="text-center">{isNaN(((row.reject_a + row.reject_b + row.reject_c + row.reject_d + row.reject_e) / row.actual || 0)*100) ? 0 : (((row.reject_a + row.reject_b + row.reject_c + row.reject_d + row.reject_e) / row.actual || 0)*100).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-center">{row.reject_a || 0}</span>
                        </TooltipTrigger>
                        <TooltipContent>{row.reject_a_name}</TooltipContent>
                      </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-center">{row.reject_b || 0}</span>
                        </TooltipTrigger>
                        <TooltipContent>{row.reject_b_name}</TooltipContent>
                      </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-center">{row.reject_c || 0}</span>
                        </TooltipTrigger>
                        <TooltipContent>{row.reject_c_name}</TooltipContent>
                      </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-center">{row.reject_d || 0}</span>
                        </TooltipTrigger>
                        <TooltipContent>{row.reject_d_name}</TooltipContent>
                      </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-center">{row.reject_e || 0}</span>
                        </TooltipTrigger>
                        <TooltipContent>Other</TooltipContent>
                      </Tooltip>
                      </TableCell>


                    </TableRow>
                  ))
                )}

                  <TableRow>
                    <TableCell colSpan={5} className="text-center"></TableCell>
                    <TableCell className={`text-center ${isNaN(totalRejectA / totalRejectOverall) ? '' : totalRejectA / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectA / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}>
                      {isNaN(totalRejectA / totalRejectOverall) ? 0 : ((totalRejectA / totalRejectOverall)*100).toFixed(2)}%
                    </TableCell>
                    <TableCell className={`text-center ${isNaN(totalRejectB / totalRejectOverall) ? '' : totalRejectB / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectB / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}>
                      {isNaN(totalRejectB / totalRejectOverall) ? 0 : ((totalRejectB / totalRejectOverall)*100).toFixed(2)}%
                    </TableCell>
                    <TableCell className={`text-center ${isNaN(totalRejectC / totalRejectOverall) ? '' : totalRejectB / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectC / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}>
                      {isNaN(totalRejectC / totalRejectOverall) ? 0 : ((totalRejectC / totalRejectOverall)*100).toFixed(2)}%
                    </TableCell>
                    <TableCell className={`text-center ${isNaN(totalRejectD / totalRejectOverall) ? '' : totalRejectC / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectD / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}>
                      {isNaN(totalRejectD / totalRejectOverall) ? 0 : ((totalRejectD / totalRejectOverall)*100).toFixed(2)}%
                    </TableCell>
                    <TableCell className={`text-center ${isNaN(totalRejectE / totalRejectOverall) ? '' : totalRejectE / totalRejectOverall > 0.75 ? 'text-red-600' : totalRejectE / totalRejectOverall > 0.4 ? 'text-yellow-600' : ''}`}>
                      {isNaN(totalRejectE / totalRejectOverall) ? 0 : ((totalRejectE / totalRejectOverall)*100).toFixed(2)}%
                    </TableCell>
                  </TableRow>
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
        </TooltipProvider>

        <Card className="w-1/2">
        <CardHeader className="py-2 text-md font-medium">Spindle</CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 items-center align-middle justify-center p-0 ">
                     <ChartContainer
                        config={{
                          consumption: {
                            label: 'Spindle',
                            color: 'hsl(var(--chart-3))',
                          },
                        }}
                        className="h-full w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={spindleData}
                            layout="horizontal"
                            barSize={Math.max(100 / 24, 40)} // Dynamic bar sizing
                            barGap={0}
                            barCategoryGap={0}
                            margin={{ top: 10, right: 5, bottom: -22, left: -5 }}
                          >
                            <XAxis
                              dataKey="created_at"
                              tickLine={true}
                              axisLine={true}
                              tick={{ fontSize: 14 }}
                              interval={0} // Ensures all 24 hours show
                            />
                            <YAxis
                              tickLine={true}
                              axisLine={true}
                              tick={{ fontSize: 14 }}
                              tickFormatter={(value) => `${value}`}
                              domain={[
                                0,
                                Number(spindleData && spindleData[0].SpindleSTD || 0),
                              ]}
                            />
                            <ReferenceLine
                              y={spindleData && spindleData[0].SpindleSTD}
                              stroke="red"
                              strokeDasharray="5 5"
                              label={{
                                value: `${spindleData && spindleData[0].SpindleSTD}`,
                                position: 'left',
                                fill: 'red',
                                fontSize: 12,
                              }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="SpindleACT" radius={[4, 4, 0, 0]}>
                              {spindleData && spindleData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.SpindleACT < entry.SpindleSTD
                                      ? 'red' // 🔴 Change to red if exceeding threshold
                                      : 'var(--color-consumption)' // Default color
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      </CardContent>
                      </Card>
                      </div>

            
        
      </div>)}
 
  </div>
  )
}