"use client"
import { Button } from "@/components/ui/button"
import albeaLogo from "@/public/albea-white.png"
import {
  Card,
  CardContent,
  CardHeader,
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
import { toast } from "sonner"
import { format } from "date-fns/format"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "@/lib/utils"
import { Switch } from "./ui/switch"
import ChangeState from "./change-state"


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
  '5000','15000','30000','60000'
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
  const [selectedRefreshRate, setRefreshRate] = useState('5000');
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
    Promise.all([
      refetchHourlyData(),
      refetchOeeData(),
      refetchTaskData(),
      refetchNoeeData(),
      refetchSpindleData(),
      refetchStateData()
    ]);
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
      setRefreshRate('5000')
      params.set("refresh", '5000');
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
    queryRefreshRate = '5000';
    params.set('refresh', '5000');
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
      <div className="flex gap-2 md:grid-cols-2 lg:grid-cols-4 text-center h-1/2">
        {/* <Image src={albeaLogo} alt="Albea" width={200} height={100} className="px-3 py-2 flex items-center border border-gray-250 rounded-xl text-gray-700 align-middle"/> */}
        <Card className="w-full ">
          <CardHeader className="py-2 text-lg font-medium">Spindles</CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 items-center align-middle justify-center p-0 pt-6">
            <div>
                <div className={`text-2xl font-bold ${getSpindleColor(
                Array.isArray(spindleData) && spindleData.length > 0 
                  ? spindleData.reduce((sum, spindle) => sum + (spindle.SpindleACT || 0), 0) / spindleData.length 
                  : 0,
                spindleData?.[0]?.SpindleSTD ?? 0
                )}`}>
                {Array.isArray(spindleData) && spindleData.length > 0 
                  ? Math.round(spindleData.reduce((sum, spindle) => sum + (spindle.SpindleACT || 0), 0) / spindleData.length) 
                  : 0}
                </div>
              <div className="text-sm text-muted-foreground">Average</div>
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
        
        <Card className="p-0 w-full ">
          <CardHeader className="py-2 text-lg font-medium">Production Status</CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 items-center align-middle justify-center p-0 pt-6">
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
          </CardContent>
        </Card>

      </div> 
      )} 
      {selectedMachine === null ? (
        null
      ) : (
      <div className="p-0 w-full space-y-4 justify-between flex flex-col">
        <Card>
          <CardHeader className="py-2 text-lg font-medium items-center">Scrap Status</CardHeader>
          <CardContent className="grid grid-cols-5 gap-8 items-center align-middle justify-center pb-8 pt-8 text-center">
            <div>
              <div className={`text-2xl font-bold `}>{totalRejectA}</div>
              <div className="text-sm text-muted-foreground">{TopRejectAName}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalRejectB}</div>
              <div className="text-sm text-muted-foreground">{TopRejectBName}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalRejectC}</div>
              <div className="text-sm text-muted-foreground">{TopRejectCName}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalRejectD}</div>
              <div className="text-sm text-muted-foreground">{TopRejectDName}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalRejectE}</div>
              <div className="text-sm text-muted-foreground">{TopRejectEName}</div>
            </div>

            <div className="col-span-2 items-center align-middle justify-center grid">
              <div className="text-2xl font-bold">{totalRejectOverall}</div>
              <div className="text-sm text-muted-foreground">Cummulative Scrap</div>
            </div>

            <div>
              <div className="text-2xl font-bold">{(targetScrap * 100).toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">%Target Scrap</div>
            </div>

              <div className="col-span-2 items-center align-middle justify-center grid">
                <div className={`text-2xl font-bold ${(totalRejectOverall/totalOutput) > targetScrap ? "text-green-500" : "text-red-500"}`}>{(((totalRejectOverall )/ totalOutput ) * 100).toFixed(2)}%</div>
                  <div className={`text-sm text-muted-foreground `}>%Scrap</div>
                </div>
              </CardContent>
            </Card>

            {/* <TooltipProvider>
            <Card className="w-full">

              <CardContent>
              <div className="w-full flex overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="w-[250px] text-center"></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead colSpan={5} className="text-center">Scrap Actual</TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="w-[60px]">Time</TableHead>
                  <TableHead className="w-[60px]">ItemNo</TableHead>
                  <TableHead className="w-[60px]">Target</TableHead>
                  <TableHead className="w-[250px] text-center">Actual Qty</TableHead>
                  <TableHead className="w-[60px] text-center">Delta</TableHead>
                  <TableHead className="w-[50px] text-center">SCRAP TOTAL</TableHead>
                  <TableHead className="w-[50px] text-center">%SCRAP</TableHead>
                  <TableHead className="w-[50px] text-center">A</TableHead>
                  <TableHead className="w-[50px] text-center">B</TableHead>
                  <TableHead className="w-[50px] text-center">C</TableHead>
                  <TableHead className="w-[50px] text-center">D</TableHead>
                  <TableHead className="w-[50px] text-center">E</TableHead>
                  <TableHead className="w-[100px] text-center">NOOE</TableHead>
                  <TableHead className="w-[200px] text-center">Actual Input vs Output</TableHead>
                  <TableHead className="w-[60px] text-center">Gap</TableHead>
                  <TableHead className="w-[125px] text-center">Causes</TableHead>
                  <TableHead className="w-[125px] text-center">Comments/Actions</TableHead>
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
                      <TableCell className="relative overflow-hidden h-full">
                      <div className="flex items-center h-full w-full">
                        {(() => {
                          const maxValue = hourlyData?.reduce((max, item) => Math.max(max, item.actual, item.target), 0) || 100;
                          return (
                            <>
                              <div
                                className={`absolute inset-0 h-full rounded ${getBarColor(row.actual, row.target, row.target_tolerance)}`}
                                style={{
                                  width: `${Math.min((row.actual / maxValue) * 100, 100)}%`, // Ensure accurate scaling
                                  maxWidth: "250px",
                                }}
                              />
                              <div
                                className="absolute inset-0 h-full w-px bg-green-600"
                                style={{
                                  left: `${Math.min((row.target / maxValue) * 100, 100)}%`, // Accurate target position
                                }}
                              />
                              <div
                                className="absolute inset-0 h-full w-px bg-yellow-500"
                                style={{
                                  left: `${Math.min((row.target_tolerance / maxValue) * 100, 100)}%`, // Accurate tolerance position
                                }}
                              />
                            </>
                          );
                        })()}
                        <span className="relative z-10 ml-2">{row.actual} ({row.process || "N/A"})</span>
                      </div>
                    </TableCell>


                      <TableCell className={row.delta >= 0 ? "text-green-600 text-center" : "text-red-600 text-center"}>{row.delta}</TableCell>
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


                      <TableCell className="w-24 py-0 h-full">
                      {renderNooeIndicators(row.hourlyId)}
                      </TableCell>

                      <TableCell className="relative overflow-hidden h-full">
                      <div className="flex items-center h-full w-full">
                      {(() => {
                          const maxValue = hourlyData?.reduce((max, item) => Math.max(max, item.actual, item.actual_in), 0) || 100;
                          return (
                            <>
                              <div
                                className={`absolute inset-0 h-full rounded z-10 ${getBarColor(row.actual, row.actual_in, row.actual_in)}`}
                                style={{
                                  width: `${Math.min((row.actual / maxValue) * 100, 100)}%`, // Ensure accurate scaling
                                  maxWidth: "200px",
                                }}
                              />
                              <div
                                className="absolute inset-0 h-full w-px z-20 bg-blue-300"
                                style={{
                                  left: `${Math.min((row.actual_in / maxValue) * 100, 100)}%`, // Accurate target position
                                }}
                              />
                              <div
                                className="absolute inset-0 h-full rounded z-5 bg-blue-300"
                                style={{
                                  width: `${Math.min((row.actual_in / maxValue) * 100, 100)}%`, // Accurate target position
                                  maxWidth: "200px",
                                }} />
                            </>
                          );
                        })()}
                          <span className="relative z-30 ml-2">{row.actual}</span>
                      </div>
                      </TableCell>
                      <TableCell className="text-center" style={{color: row.actual >= row.actual_in ? "green" : "red"}} >{row.gap}</TableCell>



                      <TableCell onClick={() => handleCellClick(index, row.hourlyId, 'causes', row.causes)} className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{row.causes || 'N/A'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{row.causes ? 'Click to edit causes' : 'Click to add causes'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell onClick={() => handleCellClick(index, row.hourlyId, 'comments', row.comments)} className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{row.comments || 'N/A'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{row.comments ? 'Click to edit comments' : 'Click to add comments'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}

                  <TableRow>
                    <TableCell colSpan={7} className="text-center"></TableCell>
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
        </TooltipProvider> */}

        {/* <div className="flex gap-2">
          
        </div> */}
        {/* <div className="w-full border border-gray-250 rounded-md">
        {selectedMachine?.machineName ? (
          // <ChangeState data={stateData} />
        <iframe
          src={`${process.env.NEXT_PUBLIC_GRAFANA_STATE}?orgId=1&var-MchID=${selectedMachine.machineName}&from=${from}&to=${to}&panelId=23&theme=light`}
          width="100%" 
          height="150"
        ></iframe>
        ) : (
          <></>
        )}
        </div> */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedComment.type === 'causes' ? 'Edit Causes' : 'Edit Comments/Actions'}</DialogTitle>
            </DialogHeader>
            <DialogDescription className="p-0 m-0">Provide your message here</DialogDescription>
            <Textarea
              value={selectedComment.content}
              onChange={(e) => setSelectedComment({ ...selectedComment, content: e.target.value })}
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
            <DialogDescription className="p-0 m-0">Select PO to attach to this machine</DialogDescription>
            <div className="space-y-4">
              <div>
                <Label htmlFor="machine">Machine</Label>
                <Input id="machine" value={selectedMachine?.machineName} disabled />
              </div>
              <div className="flex flex-col">
              <Label htmlFor="po-number">PO Number</Label>
                <SearchablePOSelect
                    value={selectedPO}
                    onValueChange={(newValue) => setSelectedPO(newValue)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePOAttach}>Attach PO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <Dialog open={IsProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Process</DialogTitle>
            </DialogHeader>
            <DialogDescription className="p-0 m-0">Select Current Process for this machine</DialogDescription>
            <div className="space-y-4">
            <Select value={selectedProcess} 
                    defaultValue={selectedProcess}  
                    onValueChange={(value) => setSelectedProcess(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Process" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Top Coat" >
                        Top Coat
                      </SelectItem>
                      <SelectItem value="Base Coat" >
                        Base Coat
                      </SelectItem>
                  </SelectContent>
                </Select>
              
            </div>
            <DialogFooter>
              <Button onClick={handleProcessChange}>Update Process</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={IsTopScrapDialogOpen} onOpenChange={setIsTopScrapDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Top 4 Scrap</DialogTitle>
            </DialogHeader>
            <DialogDescription className="p-0 m-0">Update top 4 scrap for machine {selectedMachine?.machineName}</DialogDescription>

            <div className="gap-2 grid grid-cols-2">
              <div>
                <Label htmlFor="current-reject-a">Current Reject A</Label>
                <Input id="current-reject-a" value={Array.isArray(hourlyData) && hourlyData.slice().reverse().find(h => h.task_id !== null)?.reject_a_name || 'N/A'} disabled />
              </div>
              <div>
                <Label htmlFor="new-reject-a">New Reject A</Label>
                <Select value={selectedRejectA} defaultValue={selectedRejectA}  onValueChange={(value) => setSelectedRejectA(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reject" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(rejectList) && rejectList.filter(reject => ![selectedRejectB, selectedRejectC, selectedRejectD, selectedRejectE].includes(reject.id.toString()))
                    .map((reject) => (
                      <SelectItem key={reject.id} value={reject.id.toString()}>
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
                <Input id="current-reject-b" value={Array.isArray(hourlyData) && hourlyData.slice().reverse().find(h => h.task_id !== null)?.reject_b_name || 'N/A'} disabled />
              </div>
              <div>
                <Label htmlFor="new-reject-b">New Reject B</Label>
                <Select value={selectedRejectB} defaultValue={selectedRejectB} onValueChange={(value) => setSelectedRejectB(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reject" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(rejectList) 
                    && rejectList.filter(reject => ![selectedRejectA, selectedRejectC, selectedRejectD, selectedRejectE].includes(reject.id.toString()))
                    .map((reject) => (
                      <SelectItem key={reject.id} value={reject.id.toString()}>
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
                <Input id="current-reject-c" value={Array.isArray(hourlyData) && hourlyData.slice().reverse().find(h => h.task_id !== null)?.reject_c_name || 'N/A'} disabled />
              </div>
              <div>
                <Label htmlFor="new-reject-c">New Reject C</Label>
                <Select value={selectedRejectC} defaultValue={selectedRejectC} onValueChange={(value) => setSelectedRejectC(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reject" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(rejectList) 
                    && rejectList.filter(reject => ![selectedRejectA, selectedRejectB, selectedRejectD, selectedRejectE].includes(reject.id.toString()))
                    .map((reject) => (
                      <SelectItem key={reject.id} value={reject.id.toString()}>
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
                <Input id="current-reject-d" value={Array.isArray(hourlyData) && hourlyData.slice().reverse().find(h => h.task_id !== null)?.reject_d_name || 'N/A'} disabled />
              </div>
                <div>
                  <Label htmlFor="new-reject-d">New Reject D</Label>
                  <Select value={selectedRejectD} defaultValue={selectedRejectD} onValueChange={(value) => setSelectedRejectD(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reject" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(rejectList) 
                      && rejectList.filter(reject => ![selectedRejectA, selectedRejectB, selectedRejectC, selectedRejectE].includes(reject.id.toString()))
                      .map((reject) => (
                        <SelectItem key={reject.id} value={reject.id.toString()}>
                          {reject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>              
            <DialogFooter>
              <Button
                onClick={handleTopScrapUpdate}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Update Top Scrap'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>)}
 
  </div>
  )
}