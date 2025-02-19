"use client"
import { Button } from "@/components/ui/button"
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
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSearchParams, useRouter, usePathname } from 'next/navigation'


import {  CalendarIcon, RefreshCw } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useState, useEffect } from "react"

import { TooltipProvider } from "./ui/tooltip"
import { Label } from "./ui/label"

import useSWR, { mutate } from "swr"
import ErrorState from "./ui/error-state"

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
  green: boolean | null;

};

type EnergyData = {
  hour: string;
  consumption: number;
};

type EnergyStatusData = {
  StatusLightBefore: string;
  TotalEnergyUsed: number;
  DurationHours: number;
}

const refreshRateList = [
  '5000','15000','30000','60000'
]

const fiveMinutes = Array.from({length: 12}, (_, i) => ({time: `${(i * 5).toString().padStart(2, '0')}:00`}))


const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmsDashboard() {
  const [selectedMachine, setSelectedMachine] = useState<MachineDetail | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>('');
  const [selectedRefreshRate, setRefreshRate] = useState('5000');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  
  const noeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/noee/${selectedMachine.machineName}${
      !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
      ?  `?date=${new URLSearchParams(window.location.search).get('date')}&ems=true`
          : '?ems=true'
    }`
    : null;

  const { data: noeeData } = useSWR<NooeData[]>(noeeDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });

  const processedNoeeData = noeeData?.map(nooe => ({
    ...nooe,
    blue: nooe.blue ? true : false,
    orange: nooe.orange ? true : false,
    purple: nooe.purple ? true : false,
    grey: nooe.grey ? true : false,
    yellow: nooe.yellow ? true : false,
    white: nooe.white ? true : false,
    red: nooe.red ? true : false,
    green: nooe.green ? true : false,
  }));

  const refetchNoeeData = () => mutate(noeeDataKey);
  const energyDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/energy/${selectedMachine.machineName}${
        !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
          ? `?date=${new URLSearchParams(window.location.search).get('date')}`
          : ''
      }`
    : null;

  const { data: rawEnergyData } = useSWR<EnergyData[]>(energyDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });

  const energyData = Array.from({ length: 24 }, (_, hour) => {
    const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
    const existingData = rawEnergyData?.find(data => data.hour === formattedHour);
    return {
      hour: formattedHour,
      consumption: existingData?.consumption || 0,
    };
  });

  const refetchEnergyData = () => mutate(energyDataKey);

  const energyStatusDataKey = selectedMachine?.machineName
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/energy/status/${selectedMachine.machineName}${
      !isLiveMode && new URLSearchParams(window.location.search).get('date') !== null
        ? `?date=${new URLSearchParams(window.location.search).get('date')}`
        : ''
    }`
  : null;

  const { data: energyStatusData } = useSWR<EnergyStatusData[]>(energyStatusDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });

  const energyGreen = energyStatusData?.find(status => status.StatusLightBefore === 'GREEN') 
  const energyYellow = energyStatusData?.find(status => status.StatusLightBefore === 'YELLOW') 
  const energyPurple = energyStatusData?.find(status => status.StatusLightBefore === 'PURPLE') 
  const energyRed = energyStatusData?.find(status => status.StatusLightBefore === 'RED') 
  const energyOrange = energyStatusData?.find(status => status.StatusLightBefore === 'ORANGE') 
  const energyBlue = energyStatusData?.find(status => status.StatusLightBefore === 'BLUE') 
  const energyWhite = energyStatusData?.find(status => status.StatusLightBefore === 'WHITE')
  const totalLoss = (energyYellow?.TotalEnergyUsed || 0) + (energyPurple?.TotalEnergyUsed  || 0) + (energyRed?.TotalEnergyUsed || 0) + (energyOrange?.TotalEnergyUsed || 0) + (energyBlue?.TotalEnergyUsed || 0) + (energyWhite?.TotalEnergyUsed || 0)

  
  const refetchEnergyStatusData = () => mutate(energyStatusDataKey);

  

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
      refetchNoeeData(),
      refetchEnergyData(),
      refetchEnergyStatusData()
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
    } else if (isLiveMode == true){
      setRefreshRate('30000')
      params.set("refresh", '30000');
      params.set("date", selectedDate.toISOString().split('T')[0]);
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
        refetchNoeeData(),
        refetchEnergyData(),
        refetchEnergyStatusData()
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

    }
  }, [queryLocation]);

  useEffect(() => {
    if (queryMachineNumber) {
      setSelectedMachineNumber(queryMachineNumber);
      const selected = filteredMachines?.find(machine => machine.machineNumber == queryMachineNumber);
      setSelectedMachine(selected || null);
    }
  }, [queryMachineNumber, machines, filteredMachines]);

  useEffect(() => {
    if (queryRefreshRate) {
      setRefreshRate(queryRefreshRate);
    }
  }, [queryRefreshRate]);

  useEffect(() => {
    if (queryLiveMode){
      if(queryLiveMode == 'true'){
        setIsLiveMode(true);
      } else if (queryLiveMode == 'false'){
        setIsLiveMode(false);
      }
    }
  }, [queryLiveMode]);

  useEffect(() => {
    if (queryDate) {
      setSelectedDate(new Date(new Date(queryDate).getTime() + 1000 * 60 * 60 * 24));
    }
  }, [queryDate]);


  if (error) return <ErrorState message="Error loading machines. Please try again later." />;

  const colorMap = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    grey: 'bg-gray-500',
    yellow: 'bg-yellow-500',
    white: 'bg-white border border-gray-300',
    red: 'bg-red-500',
    green: 'bg-green-500'
  };







  return (
    <div className="p-0 space-y-2 max-w-[1800px] overflow-x-hidden">
      <div className="flex flex-wrap gap-2 pt-0">
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
      <div className="w-auto grid grid-cols-2 gap-2 mb-0 pb-0">
      <div className="w-full overflow-x-auto gap-2 border-r-2 rounded-r-xl">  
      {Array.isArray(energyData) && energyData.length === 0 ? (
        <div className="text-center">
          No energy data available for the selected machine.
          </div>
      ) : (
        
        <Card className="w-screen mb-2">
      <CardHeader>
        <CardTitle>Hourly Energy Consumption</CardTitle>
      </CardHeader>
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
              barSize={Math.max(100 / 24, 40)} // Dynamic bar sizing
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
      )}
      
    {selectedMachine === null  || !Array.isArray(processedNoeeData) ?  (
      <div className="text-center">Please select machine (or wait a moment)...</div>
      ) : (
      <div className="p-0 w-full space-y-4 justify-between flex flex-col">
      <TooltipProvider>
      <Card className="w-screen py-0">
          <CardContent className="py-0">
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
                  <TableRow key={rowIndex} className="h-4 p-0" >
                    <TableCell className="h-4 w-8 text-center p-0" >{nooe.time}</TableCell>
                    {[...Array(24)].map((_, hour) => {
                        
                        const date = new Date();
                        const offsetMinutes = date.getTimezoneOffset();
                        const nooeForHour = processedNoeeData?.find(n => {
                          const fromTime = new Date(n.fromTime);
                          fromTime.setMinutes(fromTime.getMinutes() + offsetMinutes);
                          return fromTime.toISOString().split('T')[1].slice(3, 8) === nooe.time && fromTime.getHours() === hour;
                        });
                      const activeColor = nooeForHour
                        ? Object.keys(colorMap).find(color => nooeForHour[color as keyof typeof nooeForHour] === true)
                        : null;
                        
                        // console.log(`noeeData ${JSON.stringify(noeeData)}`)

                        // processedNoeeData.forEach(n => {
                        // console.log(`noeeDataFromTime ${new Date(n.fromTime).toISOString().split('T')[1].slice(3, 8)}`)
                        // console.log(`nooe time ${nooe.time}`)
                        // console.log(`nooehour ${new Date(n.fromTime).getHours()}`)
                        // console.log(`table hour ${hour}`)
                        // });

                        // console.log(`nooeForHour ${nooeForHour}`)
                        // console.log(`activeColor ${activeColor}`)                        
                      return (
                        <TableCell key={hour} className="w-8 h-8 p-0 pl-2  text-center items-center justify-center">
                          <div
                            className={`w-10 h-8 items-center justify-center p-0 m-0 ${
                              activeColor ? colorMap[activeColor as keyof typeof colorMap] : 'bg-transparent'
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
  <div>
  <div className="w-full overflow-x-auto border-r-2 rounded-r-xl">
    <Card id="total-loss">
      <CardHeader className="font-bold text-center py-2">Total Loss</CardHeader>
      <CardContent className="text-center p-x-2 flex items-center justify-center py-0">
        <Label className="flex text-center align-center items-baseline text-6xl text-red-500 font-bold">
          {(totalLoss).toFixed(2)} <p className="text-base p-4">kWh</p>
        </Label>
        </CardContent>
    </Card>
    <div className="grid grid-cols-4 pt-2 gap-2">
      <Card id="orange">
        <CardHeader className="font-bold p-2">Breakdown</CardHeader>
        <CardContent className="text-center p-x-2 py-0">
          <Label className="flex items-baseline text-3xl text-orange-500 font-bold">
            {(energyOrange?.TotalEnergyUsed || 0).toFixed(2)} <p className="text-base p-4">kWh</p>
          </Label>
          </CardContent>
      </Card>
      <Card id="purple">
        <CardHeader className="font-bold p-2">Org. Disfunction</CardHeader>
        <CardContent className="text-center p-x-2 py-0">
          <Label className="flex items-baseline text-3xl text-purple-500 font-bold">
            {(energyPurple?.TotalEnergyUsed || 0).toFixed(2)} <p className="text-base p-4">kWh</p>
          </Label>
          </CardContent>
      </Card>
      <Card id="yellow">
        <CardHeader className="font-bold p-2">Micro stop</CardHeader>
        <CardContent className="text-center p-x-2 py-0">
          <Label className="flex items-baseline text-3xl text-yellow-500 font-bold">
            {(energyYellow?.TotalEnergyUsed || 0).toFixed(2)} <p className="text-base p-4">kWh</p>
          </Label>
          </CardContent>
      </Card>
      <Card id="blue">
        <CardHeader className="font-bold p-2">Changeover</CardHeader>
        <CardContent className="text-center p-x-2 py-0">
          <Label className="flex items-baseline text-3xl text-blue-500 font-bold">
            {(energyBlue?.TotalEnergyUsed || 0).toFixed(2)} <p className="text-base p-4">kWh</p>
          </Label>
          </CardContent>
      </Card>
      <Card id="white">
        <CardHeader className="font-bold p-2">Planned Stoppage</CardHeader>
        <CardContent className="text-center p-x-2 py-0">
          <Label className="flex items-baseline text-3xl text-gray-500 font-bold">
            {(energyWhite?.TotalEnergyUsed|| 0).toFixed(2)} <p className="text-base p-4">kWh</p>
          </Label>
          </CardContent>
      </Card>
      <Card id="red">
        <CardHeader className="font-bold p-2">Non Quality</CardHeader>
        <CardContent className="text-center p-x-2 py-0">
          <Label className="flex items-baseline text-3xl text-red-500 font-bold">
            {(energyRed?.TotalEnergyUsed || 0).toFixed(2)} <p className="text-base p-4">kWh</p>
          </Label>
          </CardContent>
      </Card>
      <div className="col-span-2">
        <Card id="green">
          <CardHeader className="font-bold p-2 text-center">Running</CardHeader>
          <CardContent className="text-center p-x-2 flex items-center justify-center py-0">
            <Label className="flex  items-baseline text-3xl text-green-500 font-bold">
            {(energyGreen?.TotalEnergyUsed || 0).toFixed(2)} <p className="text-base p-4">kWh</p>
            </Label>
          </CardContent>
        </Card>
      </div>
      </div>
      <div id="equipment" className="grid grid-cols-4 gap-2 mt-4">
        <div className="col-span-4 items-center text-center">
          <Label className="text-center font-bold text-lg items-center">Equipment Monitoring (On Progress) </Label>
        </div>
      <Card id="mtc">
          <CardHeader className="font-bold p-2 text-center">MTC</CardHeader>
          <CardContent className="text-center p-x-2 flex items-center justify-center bg-green-600 rounded-b-md">
           <Label className="text-white text-center justify-center align-center pt-4 font-bold">Connected</Label>
          </CardContent>
        </Card>
        <Card id="conveyor">
          <CardHeader className="font-bold p-2 text-center">Conveyor</CardHeader>
          <CardContent className="text-center p-x-2 flex items-center justify-center bg-green-600 rounded-b-md">
           <Label className="text-white text-center justify-center align-center pt-4 font-bold">Connected</Label>
          </CardContent>
        </Card>
        <Card id="crusher">
          <CardHeader className="font-bold p-2 text-center">Crusher</CardHeader>
          <CardContent className="text-center p-x-2 flex items-center justify-center bg-green-600 rounded-b-md">
           <Label className="text-white text-center justify-center align-center pt-4 font-bold">Connected</Label>
          </CardContent>
        </Card>
        <Card id="masterbatch_feeder">
          <CardHeader className="font-bold p-2 text-center">Master Batch Feeder</CardHeader>
          <CardContent className="text-center p-x-2 flex items-center justify-center bg-red-600 rounded-b-md">
           <Label className="text-white text-center justify-center align-center pt-4 font-bold">Disconnected</Label>
          </CardContent>
        </Card>
        <Card id="hot_runner">
          <CardHeader className="font-bold p-2 text-center">Hot Runner</CardHeader>
          <CardContent className="text-center p-x-2 flex items-center justify-center bg-red-600 rounded-b-md">
           <Label className="text-white text-center justify-center align-center pt-4 font-bold">Disconnected</Label>
          </CardContent>
        </Card>
        <Card id="hopper">
          <CardHeader className="font-bold p-2 text-center">Hopper</CardHeader>
          <CardContent className="text-center p-x-2 flex items-center justify-center bg-red-600 rounded-b-md">
           <Label className="text-white text-center justify-center align-center pt-4 font-bold">Disconnected</Label>
          </CardContent>
        </Card>
        <Card id="chiller">
          <CardHeader className="font-bold p-2 text-center">Chiller</CardHeader>
          <CardContent className="text-center p-x-2 flex items-center justify-center bg-red-600 rounded-b-md">
           <Label className="text-white text-center justify-center align-center pt-4 font-bold">Disconnected</Label>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  </div>
  </div>
  )
  
}
