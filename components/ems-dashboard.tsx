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

import Image from 'next/image'
import {  CalendarIcon, FilePlus2, Pencil, RefreshCw, SprayCan } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useState, useEffect, useCallback } from "react"
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
import { ResponsiveContainer, XAxis, YAxis, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"



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
  itemNo: string;
  itemDesc: string;
  target: number;
  target_tolerance: number;
  actual: number;
  delta: number;
  scrap: number;
  rework: number;
  causes: string;
  comments: string;
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
  fromTime: Date;
  blue: boolean | null;
  orange: boolean | null;
  purple: boolean | null;
  grey: boolean | null;
  yellow: boolean | null;
  white: boolean | null;
  red: boolean | null;
};

const refreshRateList = [
  '5000','15000','30000','60000'
]

const fiveMinutes = Array.from({length: 12}, (_, i) => ({time: `${(i * 5).toString().padStart(2, '0')}:00`}))

const energyData = [
  { hour: "00:00", consumption: 240 },
  { hour: "01:00", consumption: 200 },
  { hour: "02:00", consumption: 180 },
  { hour: "03:00", consumption: 160 },
  { hour: "04:00", consumption: 150 },
  { hour: "05:00", consumption: 170 },
  { hour: "06:00", consumption: 220 },
  { hour: "07:00", consumption: 300 },
  { hour: "08:00", consumption: 350 },
  { hour: "09:00", consumption: 380 },
  { hour: "10:00", consumption: 400 },
  { hour: "11:00", consumption: 420 },
  { hour: "12:00", consumption: 450 },
  { hour: "13:00", consumption: 430 },
  { hour: "14:00", consumption: 410 },
  { hour: "15:00", consumption: 400 },
  { hour: "16:00", consumption: 390 },
  { hour: "17:00", consumption: 420 },
  { hour: "18:00", consumption: 460 },
  { hour: "19:00", consumption: 480 },
  { hour: "20:00", consumption: 450 },
  { hour: "21:00", consumption: 400 },
  { hour: "22:00", consumption: 350 },
  { hour: "23:00", consumption: 300 },
]

const shiftList = ['1','2','3']

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmsDashboard() {
  const [selectedMachine, setSelectedMachine] = useState<MachineDetail | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState({ index: -1, hourlyId: -1, type: '', content: '' });
  const [currentCVT, setCurrentCVT] = useState<number | 0>(0);
  const [isPODialogOpen, setIsPODialogOpen] = useState(false);
  const [isCVTDialogOpen, setIsCVTDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState('');
  const [editedCVT, setEditedCVT] = useState(currentCVT);
  const [selectedRefreshRate, setRefreshRate] = useState('5000');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState('');
  const [isLoadingRefresh, setIsLoadingRefresh] = useState(false); 
  const [isLiveMode, setIsLiveMode] = useState(true); 

  const pathname = usePathname()
  const router = useRouter()


  const { data: machines, error, isValidating } = useSWR<MachineDetail[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines?type=injection`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  useEffect(() => {
    setIsLoading(isValidating);
  }, [isValidating]);


  const hourlyDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/hourly/${selectedMachine.machineName}?type=injection${
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

  
  const noeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/noee/${selectedMachine.machineName}${
      !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
      ?  `?date=${new URLSearchParams(window.location.search).get('date')}`
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
      refetchNoeeData()
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



  const handleRefreshButton = async () => {
    setIsLoadingRefresh(true);
    try {
      await Promise.all([
        refetchHourlyData(),
        refetchNoeeData()
      ]);
    } finally {
      setIsLoadingRefresh(false);
    }
  }


  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams);

  let queryMachineNumber = searchParams.get('machineNumber') || '';
  let queryLocation = searchParams.get('location') || '';
  let queryRefreshRate = searchParams.get('refresh') || '';
  let queryLiveMode = searchParams.get('isLiveMode') || '' ;
  const queryDate = searchParams.get('date') || '' ;
  const queryShift = searchParams.get('shift') || '' ;



  if (queryMachineNumber == '') {
    queryMachineNumber = '5';
    params.set('machineNumber', '5');
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

  useEffect(() => {
    if (queryLocation) {
      setSelectedLocation(queryLocation);
      console.log(`machine location from query : ${queryLocation}`);
    }
  }, [queryLocation]);

  useEffect(() => {
    if (queryMachineNumber) {
      setSelectedMachineNumber(queryMachineNumber);
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


  if (error) return <ErrorState message="Error loading machines. Please try again later." />;

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

  const colorMap = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    grey: 'bg-gray-500',
    yellow: 'bg-yellow-500',
    white: 'bg-white border border-gray-300',
    red: 'bg-red-500',
  };







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
          </>
        )}



      </div>
      {selectedMachine === null && isLoading == false ? (
        <div className="text-center">Please select machine...</div>
      ) : (
      <></>
      )} 
      
      {/* Energy Chart */}
      <Card>
      {/* <CardHeader>
        <CardTitle>Hourly Energy Consumption</CardTitle>
      </CardHeader> */}
      <CardContent className="py-0">
        <ChartContainer
          config={{
            consumption: {
              label: "Energy Consumption",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="400px">
            <BarChart
              data={energyData}
              layout="horizontal"
              barSize={Math.max(100 / energyData.length, 40)} // Dynamic bar sizing
              barGap={0}
              barCategoryGap={0}
              margin={{ top: 10, right: 5, bottom: -22, left: -5 }}
            >
              <XAxis 
                dataKey="hour"  
                tickLine={true} 
                axisLine={true} 
                tick={{ fontSize: 14 }} 
                interval={0} // Ensures all 24 hours show
              />
              <YAxis
                tickLine={true}
                axisLine={true}
                tick={{ fontSize: 14 }}
                tickFormatter={(value) => `${value} kWh`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="consumption" fill="var(--color-consumption)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
    {selectedMachine === null ? (
      <div className="text-center">Please select machine...</div>
      ) : (
      <div className="p-0 w-full space-y-4 justify-between flex flex-col">
      <TooltipProvider>
      <Card className="w-full">
          <CardContent>
            <div className="w-full flex overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-4 p-0">
                  <TableCell className="w-10 text-center">Time</TableCell>
                  {[...Array(24)].map((_, hour) => (
                    <TableCell className="w-10 h-4" key={hour}>{`${hour < 10 ? '0' : ''}${hour}`}:00</TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {fiveMinutes.map((nooe, rowIndex) => (
                  <TableRow key={rowIndex} className="h-4 p-0">
                    <TableCell className="h-4 w-8 text-center p-0" >{nooe.time}</TableCell>
                    {[...Array(24)].map((_, hour) => {
                      const nooeForHour = noeeData?.find(n => new Date(n.fromTime).toISOString().split('T')[0].slice(0, 10) === nooe.time && new Date(n.fromTime).getHours() === hour);
                      const activeColor = nooeForHour
                        ? Object.keys(colorMap).find(color => nooeForHour[color as keyof typeof nooeForHour] === true)
                        : null;

                      return (
                        <TableCell key={hour} className="w-8 h-8 p-0 pl-2  text-center items-center justify-center">
                          <div
                            className={`w-8 h-8 items-center justify-center p-0 m-0 ${
                              activeColor ? colorMap[activeColor as keyof typeof colorMap] : 'bg-green-500'
                            }`}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
        </TooltipProvider>
      </div>)}
  </div>
  )
}