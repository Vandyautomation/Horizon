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
import {   CalendarIcon, FilePlus2, Pencil, RefreshCw, SprayCan, Eye, EyeOff, Minimize, Maximize } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
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
import ChangeState from "./change-state"
import { GearIcon } from "@radix-ui/react-icons"
import { Badge } from "./ui/badge"
import Link from "next/link"


type MachineDetail = {
  machineId: number;
  machineName: string;
  machineTonage: string;
  machineDescription: string;
  machineNumber: string;
  locationId: number;
  locationName: string;
  machineStatus: string;
};

type HourlyData = {
  hourlyId: number;
  from_datetime: Date;
  time: string;
  itemNo: string;
  itemDesc: string;
  target: number;
  target_final: number;
  target_tolerance: number;
  actual: number;
  scrap: number;
  rework: number;
  causes: string;
  comments: string;
  problem: string;
  action: string;
};

type OoeData = {
  targetYearly: number;
  targetTolerance: number;
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
  fromTime: Date;
  blue: 1 | null;
  orange: 1 | null;
  purple: 1 | null;
  grey: 1 | null;
  yellow: 1 | null;
  white: 1 | null;
  red: 1 | null;
};

type StateData = {
  ID: string;
  AdjustedStatusDate: string;
  Color: string
}

type PoNumber = {
  poNumber: string
  poId: number
  materialId: number
  materialName: string
}

const refreshRateList = [
  '5000','15000','30000','60000'
]

const shiftList = ['1','2','3']

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CountboardDashboard() {
  const [selectedMachine, setSelectedMachine] = useState<MachineDetail | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogConfigurationOpen, setIsDialogConfigurationOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState({ index: -1, hourlyId: -1, type: '', content: '', content2: '' });
  const [currentCVT, setCurrentCVT] = useState<number | 0>(0);
  const [isPODialogOpen, setIsPODialogOpen] = useState(false);
  const [isCVTDialogOpen, setIsCVTDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PoNumber | null>(null);
  const [editedCVT, setEditedCVT] = useState(currentCVT);
  const [selectedRefreshRate, setRefreshRate] = useState('5000');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState('');
  const [isLoadingRefresh, setIsLoadingRefresh] = useState(false); 
  const [isLiveMode, setIsLiveMode] = useState(true); 

  const [userData, setUserData] = useState<any>(null);

  const pathname = usePathname()
  const router = useRouter()

  const checkUser = async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/check`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const userDataJson = await userData.json();
      setUserData(userDataJson.data.payload.user);
      // console.log(userDataJson.data.payload.user);
    }
    return null;
  }

  useEffect(() => {
    const refreshAtShiftChange = () => {
      const now = new Date();
      const hour = now.getHours();
      const lastRefreshedHour = localStorage.getItem("lastRefreshedHour");

      // If lastRefreshedHour doesn't exist and current hour is a shift change hour, trigger refresh
      if (!lastRefreshedHour && (hour === 6 || hour === 14 || hour === 22)) {
        localStorage.setItem("lastRefreshedHour", hour.toString());
        toast.success("Auto Refreshing every shift ...", { duration: 1000 });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      if ((hour === 6 || hour === 14 || hour === 22) && lastRefreshedHour !== hour.toString()) {
        localStorage.setItem("lastRefreshedHour", hour.toString());
        toast.success("Auto Refreshing every shift ...", { duration: 1000 });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    // Initial check
    refreshAtShiftChange();

    // Set up interval to check every minute
    const intervalId = setInterval(refreshAtShiftChange, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);


  const [shiftStartHour, setShiftStartHour] = useState(0);
  const [shiftEndHour, setShiftEndHour] = useState(0);
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
    now.setHours(6 + (shift - 1) * 8 + 8, 0, 0, 0);
    setShiftEndHour(now.getTime());
  }, []);
  
  const from = isLiveMode 
    ? shiftStartHour 
    : new Date(new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24)).setHours(6 + (+selectedShift - 1) * 8, 0, 0, 0);
  
  const to = isLiveMode
    ? shiftEndHour // Live mode uses current timestamp
    : new Date(new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24)).setHours(6 + (+selectedShift - 1) * 8 + 8, 0, 0, 0); // Set to end of shift
  
  

  const { data: machines, error, isValidating } = useSWR<MachineDetail[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines?type=injection`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  useEffect(() => {
    setIsLoading(isValidating);
  }, [isValidating]);

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

  // const refetchMachine = async () => {
  //   setIsLoading(true);
  //   try {
  //     await mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const hourlyDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/hourly/${selectedMachine.machineName}?type=injection${
      !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
        ? `&date=${new URLSearchParams(window.location.search).get('date')}&shift=${new URLSearchParams(window.location.search).get('shift')}`
        : ''
    }`
    : null;

  const { data: hourlyData } = useSWR<HourlyData[]>(hourlyDataKey, async (url) => {
          const promise = fetch(url).then(res => {
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
          });
          
          toast.promise(promise, {
            loading: 'Loading...',
            // success: 'Countboard data refreshed',
            error: 'Failed to load data'
          });

          return promise;
    }, {
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

  useEffect(() => {
    setCurrentCVT(taskData?.[0]?.actual_cvt ?? 0);
  }, [taskData]);

  useEffect(() => {
    if(selectedMachine?.machineName){
          try {
            Promise.all([
      refetchHourlyData(),
      refetchOeeData(),
      refetchTaskData(),
      refetchNoeeData(),
      refetchStateData(),
    ]);
          } catch (error) {
            toast.error("Failed to fetch data");
          }
    }
  }, [selectedMachine?.machineName]);

  // if(!machines){
  //   return <div>Loading...</div>
  // }
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
    setCurrentCVT(taskData?.[0]?.actual_cvt ?? 0);
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

  const handleCellClick = (index: number, hourlyId: number, type: 'causes' | 'comments', content: string, content2: string) => {
    setSelectedComment({ index, hourlyId, type, content, content2 });
    setIsDialogOpen(true);
  };


  const handleCommentSave = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/comment`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({"hourlyId":selectedComment?.hourlyId, "type": selectedComment?.type, "content":selectedComment?.content }),
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



    const handleCVTUpdate = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/cvt`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({"taskId":taskData?.[0]?.id, "newCvt": editedCVT }),
        });

        if (!response.ok) {
          // Attempt to extract the server's error message
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to Update CVT`;
  
          throw new Error(errorMessage);
        }
        toast.success(`Update CVT successfully!`);
      } catch (error) {
        toast.error((error as Error).message);
        console.error(`Failed to Update CVT:`, error);
      } finally {
        setIsLoading(false);
      }
      setCurrentCVT(editedCVT);
      refetchTaskData();
      setIsCVTDialogOpen(false);
    },
    [editedCVT, refetchTaskData, taskData]
  );

  const handlePOAttach = useCallback(
    async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/task`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({"poNumber":selectedPO?.poNumber, "machineName": selectedMachine?.machineName }),
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


  const handleSetupUtility = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/utility`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "machineNumber": selectedMachine?.machineNumber,
            "machineLocation": selectedMachine?.locationName,
            "machineName": selectedMachine?.machineName,
            "state": "ON"
           }),
        });

        if (!response.ok) {
          // Attempt to extract the server's error message
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to Update Content`;
  
          throw new Error(errorMessage);
        }
        toast.success(`Utility state updated successfully!`);
      } catch (error) {
        toast.error((error as Error).message);
        console.error(`Failed to Update utility state:`, error);
      }
      finally {
        setIsLoading(false);
      }
      setIsDialogOpen(false);
    },
    [selectedMachine]
  );

  const handleTrialMachine = useCallback(
    async () => {
      setIsLoading(true);
      const machineStatus = selectedMachine?.machineStatus == 'TRIAL' ? 'NORMAL' : 'TRIAL';
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trial/${selectedMachine?.machineName}?machineStatus=${machineStatus}&machineLocation=${selectedMachine?.locationName}&machineNumber=${selectedMachine?.machineNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || `Failed to Update trial machine`;
        throw new Error(errorMessage);
      }
      toast.success(`Trial machine updated successfully!`);
      setIsDialogConfigurationOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
      console.error(`Failed to Update trial machine:`, error);
    }
    finally {
      setIsLoading(false);
      window.location.reload();
    }
  }, [selectedMachine]);

    const handleTAOMachine = useCallback(
    async () => {
      setIsLoading(true);
      const machineStatus = selectedMachine?.machineStatus == 'TAO' ? 'NORMAL' : 'TAO';
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/tao/${selectedMachine?.machineName}?machineStatus=${machineStatus}&machineLocation=${selectedMachine?.locationName}&machineNumber=${selectedMachine?.machineNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || `Failed to Update TAO machine`;
        throw new Error(errorMessage);
      }
      toast.success(`TAO machine updated successfully!`);
      setIsDialogConfigurationOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
      console.error(`Failed to Update TAO machine:`, error);
    }
    finally {
      setIsLoading(false);
      window.location.reload();
    }
  }, [selectedMachine]);


  const getBarColor = (actual: number, target: number, target_tolerance: number) => {
    if (actual >= target) return 'bg-green-500';
    if (actual >= target_tolerance) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getCvtColor = (actual_cvt: number | null, target_cvt: number | null) => {
    if (actual_cvt === null || target_cvt === null || actual_cvt >= target_cvt) return 'text-green-500';
    return 'text-red-500';
  };

  const getCtColor = (actual_ct: number | null, target_ct: number | null) => {
    if (actual_ct === null || target_ct === null || actual_ct <= target_ct) return 'text-green-500';
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
    queryMachineNumber = '10';
    params.set('machineNumber', '10');
    router.push(`${pathname}?${params.toString()}`);
  }

  if (queryLocation == '') {
    queryLocation = 'INJ Bld G';
    params.set('location', 'INJ Bld G');
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
      // console.log(`machine location from query : ${queryLocation}`);
    }
  }, [queryLocation]);

  useEffect(() => {
    if (queryMachineNumber) {
      setSelectedMachineNumber(queryMachineNumber);
      // const selected = filteredMachines?.find(
      //   machine => machine.machineNumber === queryMachineNumber
      // );
      const selected = filteredMachines?.find(machine => machine.machineNumber == queryMachineNumber);
      // console.log(`filteredMachines from query: ${JSON.stringify(filteredMachines)}`);
      // console.log(`selected from query: ${JSON.stringify(selected)}`);

      setSelectedMachine(selected || null);
      // console.log(`machine number from query : ${queryMachineNumber}`);
      // console.log(`selected machine from query :`, selected);
    }
  }, [queryMachineNumber, machines, filteredMachines]);

  useEffect(() => {
    if (queryRefreshRate) {
      setRefreshRate(queryRefreshRate);
      // console.log(`refreshRate : ${queryRefreshRate}`);
    }
  }, [queryRefreshRate]);

  useEffect(() => {
    if (queryLiveMode){
      if(queryLiveMode == 'true'){
        setIsLiveMode(true);
      } else if (queryLiveMode == 'false'){
        setIsLiveMode(false);
      }
      // console.log(`liveMode : ${queryLiveMode}`);
    }
  }, [queryLiveMode]);

  useEffect(() => {
    if (queryDate) {
      setSelectedDate(new Date(new Date(queryDate).getTime() + 1000 * 60 * 60 * 24));
      // console.log(`selectedDate : ${queryDate}`);
    }
  }, [queryDate]);

  useEffect(() => {
    if (queryShift) {
      setSelectedShift(queryShift);
      // console.log(`selectedShift : ${queryShift}`);
    }
  }, [queryShift]);

  const totalActual = Array.isArray(hourlyData) && hourlyData?.reduce((total, item) => total + (item.actual || 0), 0) || 0
  const totalTarget = Array.isArray(hourlyData) && hourlyData?.reduce((total, item) => {
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const nowDate = new Date(now);
    const itemFromTime = new Date(new Date(item.from_datetime).getTime() - 6 * 60 * 60 * 1000).getTime();
    const nowTime = nowDate.getTime();
    const remainingSeconds = nowDate.getSeconds();
    const remainingMinutes = nowDate.getMinutes() * 60;
    return (
      total +
      (
        itemFromTime < nowTime
          ? item.target_final * (oeeData?.[0]?.targetTolerance || 1)
          : Math.floor(
              (item.target_final * (remainingMinutes + remainingSeconds) / 3600) *
              (oeeData?.[0]?.targetTolerance || 1)
            )
      )
    ) || 0;
  }, 0) || 0;
  const totalGap = totalActual - totalTarget;


  if (error) return <ErrorState message="Error loading machines. Please try again later." />;

  const renderNooeIndicators = (from_datetime: Date) => {
    const nooeForTime = noeeData?.filter(nooe => {
      // Convert dates to timestamps for comparison
      const hourlyTime = new Date(from_datetime).getTime();
      const nooeTime = new Date(nooe.fromTime).getTime();
      
      // Calculate the start and end of the hourly period
      const hourStart = hourlyTime;
      const hourEnd = hourlyTime + 60 * 60 * 1000; // Add 1 hour in milliseconds
      
      return nooeTime >= hourStart && nooeTime < hourEnd;
    }) || [];
    if (nooeForTime.length === 0) return null;

    const colorMap = {
      white: 'bg-gray-100 ml-[0px]',
      blue: 'bg-[#118DFF] ml-[10px]',
      red: 'bg-[#FF0000] ml-[20px]',
      orange: 'bg-[#FF7400] ml-[30px]',
      purple: 'bg-[#6A4C93] ml-[40px]',
      yellow: 'bg-[#FFFF00] ml-[50px]',
      grey: 'bg-[#AAAAAA] ml-[60px]',
    };

    return (
      <div className="flex h-12 flex-col gap-[1px] my-0 pt-0 pb-0 mx-0 px-0">
      {nooeForTime.map((nooe) => {
        const activeColor = Object.keys(colorMap).find(color => nooe[color as keyof typeof nooe] == 1);
        return activeColor ? (
          <div 
            className={`w-[10px] h-[5px] ${colorMap[activeColor as keyof typeof colorMap]}`}
          />
        ) : (
        <div className={`w-[10px] h-[5px] ml-0 bg-none my-0 pt-0 pb-0`} />
      );
      })}
    </div>
    );
  };


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
            {isLoading ? (
              <div></div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={selectedLocation} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-[120px] h-[43px] text-lg text-nowrap">
                <SelectValue placeholder="Building" />
              </SelectTrigger>
              <SelectContent>
                {uniqueLocations?.map(locationName => (
                  <SelectItem key={locationName} value={locationName} className="text-lg text-nowrap">
                    {locationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              <Select value={selectedMachineNumber} onValueChange={handleMachineNumberChange}>
                <SelectTrigger className="w-[70px] h-[43px] text-lg text-nowrap">
                  <SelectValue placeholder="MchNumber" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMachines?.map(machine => (
                    <SelectItem key={machine.machineNumber} value={machine.machineNumber} className="text-lg text-nowrap">
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
                    {selectedMachine?.machineDescription || "MchDesc"} {selectedMachine?.machineStatus == 'TRIAL' ? <Badge variant="secondary" className="ml-2">TRIAL/PM</Badge> : null } {selectedMachine?.machineStatus == 'TAO' ? <Badge variant="secondary" className="ml-2">TAO</Badge> : null }
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p> {selectedMachine?.machineName || "MchID"}</p>
                </TooltipContent>
              </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Label className="px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle text-base min-w-[390px]">
                  {Array.isArray(hourlyData) && hourlyData && hourlyData.filter(data => data?.itemDesc !== null).length > 0 ? hourlyData.filter(data => data?.itemDesc !== null).slice(-1)[0].itemDesc : "Material Description"}
                </Label>
              </TooltipTrigger>
              <TooltipContent>
                <p className="">{Array.isArray(hourlyData) && hourlyData && hourlyData.filter(data => data?.itemDesc !== null).length > 0 ? hourlyData.filter(data => data?.itemDesc !== null).slice(-1)[0].itemDesc : "Material Description"}</p>
              </TooltipContent>
            </Tooltip>
            <Label className="px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle text-base">
              PRO{taskData && taskData.length > 0 ? taskData[taskData.length - 1].po_name : " Number"}
            </Label>
            <Button onClick={() => setIsPODialogOpen(true)} variant="default" className="h-[43px]">
              <FilePlus2 className="w-4 h-4 mr-2" />
              PRO
            </Button>
            <Button onClick={() => setIsCVTDialogOpen(true)} variant="default" className="h-[43px]">
              <Pencil className="w-4 h-4 mr-2" />
              CVT
            </Button>
            <Dialog open={isDialogConfigurationOpen} onOpenChange={setIsDialogConfigurationOpen}>
              <DialogTrigger asChild>
                <Button variant={"default"} className="h-[43px]" onClick={() => checkUser()}><GearIcon/>Config</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configuration Menu</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <GearIcon className="w-4 h-4 mr-2" />Turn ON Utility
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Warning</DialogTitle>
                        <DialogDescription>
                          Ini akan mengubah status utility menjadi ON pada mesin {selectedMachine?.machineDescription}. Apakah anda yakin?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="default" onClick={() => { handleSetupUtility(); setIsDialogConfigurationOpen(false) }}>
                          Yes
                        </Button>
                        <Button variant="outline" onClick={() => setIsDialogConfigurationOpen(false)}>
                          No
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                       <GearIcon className="w-4 h-4 mr-2" /> Set Machine into {selectedMachine?.machineStatus == 'TRIAL' ? 'Normal' : 'Trial'} from {selectedMachine?.machineStatus ? selectedMachine?.machineStatus : 'Normal'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Warning</DialogTitle>
                        <DialogDescription>
                          Ini akan mengubah status mesin {selectedMachine?.machineDescription} menjadi {selectedMachine?.machineStatus == 'TRIAL' ? 'Normal' : 'Trial'}. Apakah anda yakin?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="default" onClick={() => { handleTrialMachine(); setIsDialogConfigurationOpen(false) }}>
                          Yes
                        </Button>
                        <Button variant="outline" onClick={() => setIsDialogConfigurationOpen(false)}>
                          No
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {!userData && (
                    <div className="text-sm text-gray-500">
                      Need more access for admin ? click <Link href={`/login/?redirect=${window.location.pathname}${window.location.search}`} className="text-blue-500">here</Link> to login
                    </div>
                  )}
                  {userData && (userData?.role_name == 'admin' || userData?.role_name == 'admin_premium' || userData?.role_name == 'admin_lean') && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                       <GearIcon className="w-4 h-4 mr-2" /> Set Machine into {selectedMachine?.machineStatus == 'TAO' ? 'Normal' : 'TAO'} from {selectedMachine?.machineStatus ? selectedMachine?.machineStatus : 'Normal'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Warning</DialogTitle>
                        <DialogDescription>
                          Ini akan mengubah status mesin {selectedMachine?.machineDescription} menjadi {selectedMachine?.machineStatus == 'TAO' ? 'Normal' : 'TAO'}. Apakah anda yakin?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="default" onClick={() => { handleTAOMachine(); setIsDialogConfigurationOpen(false) }}>
                          Yes
                        </Button>
                        <Button variant="outline" onClick={() => setIsDialogConfigurationOpen(false)}>
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
                const params = new URLSearchParams(searchParams);
                const isHidden = searchParams.get('hideUI') === 'true';
                if (!isHidden) {
                  params.set('hideUI', 'true');
                } else {
                  params.delete('hideUI');
                }
                router.push(`${pathname}?${params.toString()}`);
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
                      variant={"outline"}
                      className={cn(
                        "w-[155px] justify-start text-left font-normal",
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
                      selected={new Date(selectedDate.getTime() - 1000 * 60 * 60 * 24)}
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
          <CardHeader className="text-lg font-bold text-nowrap p-0 flex items-center justify-center gap-2 space-y-0 flex-row pb-2">Production Output 
            <p className="text-lg font-bold text-green-500">OOE = {(oeeData?.[0]?.targetTolerance || 0) * 100}%</p></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 p-2 pr-4">
            
            <div>
              <div className="text-4xl font-bold text-black">{Math.floor(totalTarget)}</div>
              <div className="text-lg ">Target</div>
            </div>
            <div>
            <div className={`text-4xl font-bold text-black`}>{totalActual}</div>
              <div className="text-lg ">Actual</div>
            </div>
            
            <div>
              <div className={`text-4xl font-bold ${totalGap < 0 ? "text-red-600" : "text-green-600"}`}>{Math.abs(totalGap).toFixed(0)}</div>
              <div className="text-lg ">Delta</div>
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => setIsCVTDialogOpen(true)}>
          <CardHeader className="py-2 text-lg font-bold p-0 pb-2">Cavities</CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-2 pr-4">
            <div>
              <div className="text-4xl font-bold">{taskData?.[0]?.target_cvt || 0}</div>
              <div className="text-lg ">Target</div>
            </div>
            <div>
              <div className={`text-4xl font-bold ${getCvtColor(taskData?.[0]?.actual_cvt ?? 0, taskData?.[0]?.target_cvt ?? 0)}`}>{taskData?.[0]?.actual_cvt ?? 0}</div>
              <div className="text-lg ">Actual</div>
            </div>
          </CardContent>
        </Card>

        <Card>
         <CardHeader className="py-2 text-lg font-bold p-0 pb-0">Cycle Time <p className="text-xs font-normal">(in second)</p></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-2 pb-0 pt-0 pr-4">
            <div>
              <div className="text-4xl font-bold">{taskData?.[0]?.target_ct.toFixed(1) ?? 0.0}</div>
              <div className="text-lg ">Target</div>
            </div>
            <div>
              <div className={`text-4xl font-bold ${getCtColor(taskData?.[0]?.actual_ct ?? 0, taskData?.[0]?.target_ct ?? 0)}`}>{taskData?.[0]?.actual_ct.toFixed(1) ?? 0.0}</div>
              <div className="text-lg ">Actual</div>
            </div>
          </CardContent>
        </Card>

        <Card>
         <CardHeader className="py-2 text-lg font-bold text-black text-nowrap p-0 pb-1">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-red-500 px-8">Non O.O.E</div>
            <div className="text-lg font-bold text-black px-2 mr-8 pt-1 bg-green-500 rounded-md">OK</div>
          </div>
         </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-2 pb-0">
            <div>
              <div className="text-4xl font-bold text-red-500">{((oeeData?.[0]?.breakdownperc || 0) * 100.0).toFixed(1)}%</div>
            </div>
            <div>
              <div className={`text-4xl font-bold ${((oeeData?.[0]?.ooe || 0) * 100.0) > (oeeData?.[0]?.targetTolerance || 0) * 100.0 ? "text-green-500" : "text-red-500"}`}>{((oeeData?.[0]?.ooe || 0) * 100.0).toFixed(1)}%</div>
            </div>
          </CardContent>
          {/* <div className="text-lg text-right pr-4">
            Target {(oeeData?.[0]?.targetYearly || 0).toFixed(1)}%</div> */}
        </Card>

        <Card className="w-1/2 pb-0">
          <CardHeader className="py-2 text-lg font-bold p-0 pb-4 flex">Downtime (in minutes)</CardHeader>
          <CardContent className="grid grid-cols-7 p-2 pb-0 pt-0 w-full">
            <div>
               <Tooltip>
              <TooltipTrigger asChild>
                <div>
                <div className="text-4xl font-bold">{((oeeData?.[0]?.white || 0) * 60.0).toFixed(0) || 0}'</div>
                <div className="text-xl text-black bg-white border border-black  px-2 pt-1 pb-0 rounded-l-md">PS</div>
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
                  <div className="text-4xl font-bold text-[#118DFF]">{((oeeData?.[0]?.blue || 0) * 60.0).toFixed(0) || 0}'</div>
                  <div className="text-xl text-white bg-[#118DFF] border border-black  px-2 pt-1 pb-0">C/O</div>
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
                  <div className="text-4xl font-bold text-[#FF0000] px-0">{((oeeData?.[0]?.red || 0) * 60.0).toFixed(0) || 0}'</div>
                  <div className="text-xl text-white bg-[#FF0000] border border-black  px-2 pt-1 pb-0">NQ</div>
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
                  <div className="text-4xl font-bold text-[#FF7400]">{((oeeData?.[0]?.orange || 0) * 60.0).toFixed(0) || 0}'</div>
                  <div className="text-xl text-white bg-[#FF7400] border border-black  px-2 pt-1 pb-0">BD</div>
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
                  <div className="text-4xl font-bold text-[#6A4C93]">{((oeeData?.[0]?.purple || 0) * 60.0).toFixed(0) || 0}'</div>
                  <div className="text-xl text-white bg-[#6A4C93] border border-black  px-2 pt-1 pb-0">OP</div>
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
                  <div className="text-4xl font-bold text-black px-0">{((oeeData?.[0]?.yellow || 0) * 60.0).toFixed(0) || 0}'</div>
                  <div className="text-xl text-black bg-[#FFFF00] border border-black  px-2 pt-1 pb-0">SD</div>

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
                  <div className="text-4xl font-bold text-[#AAAAAA] px-0">{((oeeData?.[0]?.grey || 0) * 60.0).toFixed(0) || 0}'</div>
                  <div className="text-xl text-white bg-[#AAAAAA] border border-black  px-2 pt-1 pb-0 rounded-r-md">UC</div>
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
      {selectedMachine === null ? (
        null
      ) : (
      <div className="p-0 w-full space-y-2 justify-between flex flex-col">
      <TooltipProvider>
      <Card className="w-full">
          <CardContent className="pb-0">
            <div className="w-full flex overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-lg text-nowrap font-bold text-black">Time</TableHead>
                  <TableHead className="w-[60px] text-lg text-nowrap font-bold text-black">ItemNo</TableHead>
                  <TableHead className="w-[60px] text-lg text-nowrap font-bold text-black border border-r-0 border-l-1 border-t-0">Target</TableHead>
                  <TableHead className="w-[50px] text-lg text-nowrap font-bold text-black text-right">Actual</TableHead>
                  <TableHead className="w-[250px] text-left text-lg text-nowrap font-bold text-green-500 flex items-center justify-center">OOE 100% ⸺ / {(oeeData?.[0]?.targetTolerance || 0) * 100}% - - -</TableHead>
                  <TableHead className="w-[60px] text-lg text-nowrap font-bold text-black border border-r-1 border-l-0 border-t-0">Delta</TableHead>
                  <TableHead className="w-[60px] text-center text-lg text-nowrap font-bold text-black">Scrap</TableHead>
                  <TableHead className="w-[60px] text-center text-lg text-nowrap font-bold text-black">Rework</TableHead>
                  <TableHead className="text-center border border-r-1 border-l-1 border-t-0 border-b-0 text-lg text-nowrap font-bold text-black px-0 gap-0 mx-0">NOOE
                    <div className="flex grid-cols-7 items-center justify-center gap-0 mx-0 px-0">
                    <div className="bg-gray-100 w-[10px] h-[5px] mb-0"/>
                    <div className="bg-[#118DFF] w-[10px] h-[5px] mb-0"/>
                    <div className="bg-[#FF0000] w-[10px] h-[5px] mb-0"/>
                    <div className="bg-[#FF7400] w-[10px] h-[5px] mb-0"/>
                    <div className="bg-[#6A4C93] w-[10px] h-[5px] mb-0"/>
                    <div className="bg-[#FFFF00] w-[10px] h-[5px] mb-0"/>
                    <div className="bg-[#AAAAAA] w-[10px] h-[5px] mb-0"/>
                    </div>
                  </TableHead>
                  <TableHead className="w-[350px] max-w-[350px] text-lg nowrap font-bold text-black">Causes</TableHead>
                  <TableHead className="w-[350px] max-w-[350px] text-lg nowrap font-bold text-black">Comments/Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="pb-0">
                {Array.isArray(hourlyData) && hourlyData?.length === 0 ? (
                  <TableRow className="h-12">
                    <TableCell colSpan={10} className="text-center text-lg text-nowrap  text-black">No data available</TableCell>
                  </TableRow>
                ) : (
                  hourlyData?.map((row, index) => {
                    const now = new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
                    const nowDate = new Date(now);
                    const remainingSeconds = nowDate.getSeconds();
                    const remainingMinutes = nowDate.getMinutes() * 60;
                    const to_datetime = new Date( new Date(row.from_datetime).getTime() - 6 * 60 * 60 * 1000);
                    let textAnimation = 'animate-pulse'
                    var target_show = 0;
                    var target_show_100 = 0;
                    if(to_datetime < nowDate || row.target == 0){
                      console.log('to_datetime < nowDate', to_datetime, nowDate);
                      target_show = Math.floor(row.target_final * (oeeData?.[0]?.targetTolerance || 1));
                      target_show_100 = row.target_final;
                      textAnimation = ''
                    } else {
                      console.log('to_datetime > nowDate', to_datetime, nowDate);
                      textAnimation = 'animate-pulse'
                      target_show = Math.floor((row.target_final * (remainingMinutes + remainingSeconds) / 3600) * (oeeData?.[0]?.targetTolerance || 1));
                      target_show_100 = Math.floor((row.target_final * (remainingMinutes + remainingSeconds) / 3600));
                    }

                    var delta = row.actual - target_show;
                    // if(delta < 0){
                    //   delta = 0;
                    // }
                    return (
                    <TableRow className={`h-[56px] ${index === (hourlyData?.length ?? 0) - 1 ? "border-b border-black" : ""}`} key={row.time}>
                      <TableCell className="h-full text-xl text-nowrap text-black">{row.time}</TableCell>
                      <TableCell className="h-full text-xl text-nowrap text-black">{row.itemNo}</TableCell>
                      <TableCell className={`text-center h-full text-xl text-nowrap text-black border border-r-0 border-l-1 border-t-0 border-b-0 ${textAnimation}`}>{target_show}</TableCell>
                      <TableCell className={`text-center w-[60px] h-full text-xl text-nowrap text-black ${textAnimation} ${row.actual >= target_show ? "text-green-500" : "text-red-500"}`}>{row.actual}</TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell className="relative overflow-hidden h-full">
                            <div className="flex items-center h-full w-full">
                              {(() => {
                                const maxValue = hourlyData?.reduce((max, item) => Math.max(max, item.actual, target_show_100*1.1), 0) || 100;
                                return (
                                  <>
                                    <div
                                      className={`absolute inset-0 h-full rounded ${textAnimation} ${getBarColor(row.actual, row.target, target_show)}`}
                                      style={{
                                        width: `${Math.min((row.actual / maxValue) * 100, 100)}%`, // Ensure accurate scaling
                                        // maxWidth: "260px",
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
                                );
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
                      
                      <TableCell className={`text-xl text-nowrap  text-black ${delta >= 0 ? "text-green-600" : "text-red-600"} border border-r-1 border-b-0 border-l-0`}>{Math.abs(delta).toFixed(0)}</TableCell>
                      <TableCell className="text-center text-xl text-nowrap  text-black">{row.scrap}</TableCell>
                      <TableCell className="text-center text-xl text-nowrap  text-black">{row.rework}</TableCell>
                      <TableCell className="w-[70px] py-0 h-full border border-r-1 border-l-1 border-b-0 border-black-250">
                      {renderNooeIndicators(row.from_datetime)}
                      </TableCell>
                      <TableCell onClick={() => handleCellClick(index, row.hourlyId, 'causes', row.causes, row.problem)} className="w-[350px] max-w-[350px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-2xl overflow-hidden text-ellipsis whitespace-nowrap text-nowrap">
                              {row.problem && row.causes ? row.problem + ' ' + row.causes : row.causes ? row.causes : row.problem ? row.problem : 'N/A'}
                              </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{row.problem && row.causes ? row.problem + ' ' + row.causes : row.causes ? row.causes : row.problem ? row.problem : 'Click to add causes'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell onClick={() => handleCellClick(index, row.hourlyId, 'comments', row.comments, row.action)} className="w-[350px] max-w-[350px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                              <p className="text-2xl overflow-hidden text-ellipsis whitespace-nowrap text-nowrap">
                                {row.action && row.comments ? row.action + ' ' + row.comments : row.comments ? row.comments : row.action ? row.action : 'N/A'}</p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{row.action && row.comments ? row.action + ' ' + row.comments : row.comments ? row.comments : row.action ? row.action : 'Click to add comments'}</p>
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
                      <div className={`text-xl text-nowrap font-bold ${totalActual - totalTarget >=0 ? "text-green-600" : "text-red-600"}`}>{Math.abs(totalActual - totalTarget).toFixed(0)}</div>
                  </TableCell>
                  <TableCell className=" text-nowrap font-bold text-black">
                      <div className="text-xl text-center text-nowrap font-bold text-black">{hourlyData?.reduce((acc, row) => acc + row.scrap, 0) || 0}</div>
                  </TableCell>
                  <TableCell className=" text-nowrap font-bold text-black">
                      <div className="text-xl text-center text-nowrap font-bold text-black">{hourlyData?.reduce((acc, row) => acc + row.rework, 0) || 0}</div>
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
          stateData != undefined && stateData.length > 0 && hourlyData != undefined && hourlyData.length > 0 ? (
          <div className="w-full  rounded-xl shadow-md border-2 border-gray-250">
              <ChangeState data={stateData} isLive={isLiveMode} />
          </div>

          ) : (
            <></>
          )
        //   <iframe
        //   src={`${process.env.NEXT_PUBLIC_GRAFANA_STATE}?orgId=1&var-MchID=${selectedMachine.machineName}&from=${from}&to=${to}&panelId=23&theme=light`}
        //   width="100%" 
        //   height="100"
        // ></iframe>
        ) : (
          <></>
        )}
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
            <Label className="text-sm text-gray-500">{selectedComment.type === 'causes' ? 'Problem' : 'Action'} dari Andon App:</Label>
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
            <DialogDescription className="p-0 m-0">Select PO to attach to this machine</DialogDescription>
            <div className="space-y-2">
              <div>
                <Label htmlFor="machine">Machine</Label>
                <Input id="machine" value={selectedMachine?.machineName} disabled />
              </div>
              <div className="flex flex-col">
              <Label htmlFor="po-number">PO Number</Label>
                <SearchablePOSelect
                    value={selectedPO}  
                    onValueChange={(newValue) => setSelectedPO(newValue)}
                    type='Injection'
                />
              </div>
               <div className="flex flex-col">
              <Label htmlFor="po-number">Material</Label>
                <Input id="po-number" placeholder="Please Select PO First" value={selectedPO?.materialId + " - " + selectedPO?.materialName} disabled />
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
            <DialogDescription className="p-0 m-0">Update cavity for machine {selectedMachine?.machineName}</DialogDescription>
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
                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                    setEditedCVT(value);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCVTUpdate}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Update CVT'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>)}
 
  </div>
  )
}