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
import { useSearchParams } from 'next/navigation'

import Image from 'next/image'
import {  Paperclip, RefreshCw } from "lucide-react"
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CountboardDashboard() {
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


  const getShiftStartTimestamp = () => {
    const now = new Date();
    const hour = now.getHours();

    let shiftStartHour;
    if (hour >= 6 && hour < 14) {
      // Shift starting at 6 AM
      shiftStartHour = 6;
    } else if (hour >= 14 && hour < 22) {
      // Shift starting at 2 PM
      shiftStartHour = 14;
    } else {
      // Shift starting at 10 PM (previous day if before midnight)
      shiftStartHour = 22;
      if (hour < 6) {
        now.setDate(now.getDate() - 1); // Move to the previous day
      }
    }

    // Set the time to the start of the shift
    now.setHours(shiftStartHour, 0, 0, 0);
    return now.getTime();
  };

  const from = getShiftStartTimestamp();


  

  const { data: machines, error, isValidating } = useSWR<MachineDetail[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  useEffect(() => {
    setIsLoading(isValidating);
  }, [isValidating]);

  const refetchMachine = async () => {
    setIsLoading(true);
    try {
      await mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines`);
    } finally {
      setIsLoading(false);
    }
  };

  const hourlyDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/hourly/${selectedMachine.machineName}`
    : null;

  const { data: hourlyData } = useSWR<HourlyData[]>(hourlyDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });
  const refetchHourlyData = useCallback(() => mutate(hourlyDataKey), [hourlyDataKey]);

  const oeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/oee/${selectedMachine.machineName}`
    : null;

  const { data: oeeData } = useSWR<OoeData[]>(oeeDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });

  const refetchOeeData = () => mutate(oeeDataKey);

  const noeeDataKey = selectedMachine?.machineName
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/noee/${selectedMachine.machineName}`
    : null;

  const { data: noeeData } = useSWR<NooeData[]>(noeeDataKey, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: Number(selectedRefreshRate),
  });

  const refetchNoeeData = () => mutate(noeeDataKey);

  const taskDataKey = selectedMachine?.machineDescription
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/tasks/${selectedMachine.machineDescription}`
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

  const uniqueLocations = Array.from(new Set(machines?.map(machine => machine.locationName)));
  const filteredMachines = machines?.filter(machine => machine.locationName === selectedLocation);

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    setSelectedMachineNumber('');
    setSelectedMachine(null);
  };

  const handleMachineNumberChange = (value: string) => {
    setSelectedMachineNumber(value);
    const selected = filteredMachines?.find(machine => machine.machineNumber === value);
    setSelectedMachine(selected || null);
    refetchHourlyData();
    refetchOeeData();
    refetchTaskData();
    refetchNoeeData();
    setCurrentCVT(taskData?.[0]?.actual_cvt ?? 0)
  };

  const handleRefreshRateChange = (value: string) => {
    setRefreshRate(value);
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

  const getCvtColor = (actual_cvt: number | null, target_cvt: number | null) => {
    if (actual_cvt === null || target_cvt === null || actual_cvt >= target_cvt) return 'text-green-500';
    return 'text-red-500';
  };

  const getCtColor = (actual_ct: number | null, target_ct: number | null) => {
    if (actual_ct === null || target_ct === null || actual_ct <= target_ct) return 'text-green-500';
    return 'text-red-500';
  };

  const searchParams = useSearchParams()
  const queryMachineNumber = searchParams.get('machineNumber') || '1';
  const queryLocation = searchParams.get('location') || 'INJ Bld G';
  const queryRefreshRate = searchParams.get('refresh') || '5000';


  useEffect(() => {
    if (queryLocation) {
      setSelectedLocation(queryLocation);
      console.log(`machine location : ${queryLocation}`);
    }
  }, [queryLocation]);

  useEffect(() => {
    if (queryMachineNumber) {
      setSelectedMachineNumber(queryMachineNumber);
      const selected = machines?.find(
        machine => machine.machineNumber === queryMachineNumber
      );
      setSelectedMachine(selected || null);
      console.log(`machine number : ${queryMachineNumber}`);
      console.log(`selected machine :`, selected);
    }
  }, [queryMachineNumber, machines]);

  useEffect(() => {
    if (queryRefreshRate) {
      setRefreshRate(queryRefreshRate);
      console.log(`refreshRate : ${queryRefreshRate}`);
    }
  }, [queryRefreshRate]);

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
      <div className="flex flex-col gap-0.5">
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


  return (
    <div className="p-4 space-y-4 w-full">
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <Label className=" px-3 py-2 flex items-center border border-gray-250 rounded-md align-middle">
          Loading ...
        </Label>
        ) : (
          <Select value={selectedLocation} onValueChange={handleLocationChange} onOpenChange={() => {refetchMachine()}}>
            <SelectTrigger className="w-[130px]">
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
          <SelectTrigger className="w-[80px]">
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
      </div>
      {selectedMachine === null && isLoading == false ? (
        <div className="text-center">Please select machine...</div>
      ) : (
      <div className="flex gap-2 md:grid-cols-2 lg:grid-cols-4 text-center h-24">
        <Image src={albeaLogo} alt="Albea" width={200} height={100} className="px-3 py-2 flex items-center border border-gray-250 rounded-xl text-gray-700 align-middle"/>
        <Card className="p-0">
          <CardHeader className="py-2 text-sm font-medium">Production Status</CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-600">{taskData?.[0]?.produced_qty}</div>
              <div className="text-sm text-muted-foreground">Actual</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{taskData?.[0]?.required_qty}</div>
              <div className="text-sm text-muted-foreground">Target</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{(taskData?.[0]?.required_qty || 0) - (taskData?.[0]?.required_qty || 0)}</div>
              <div className="text-sm text-muted-foreground">Gap</div>
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => setIsCVTDialogOpen(true)}>
          <CardHeader className="py-2 text-sm font-medium">Cavities</CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <div className={`text-2xl font-bold ${getCvtColor(taskData?.[0]?.actual_cvt ?? 0, taskData?.[0]?.target_cvt ?? 0)}`}>{taskData?.[0]?.actual_cvt ?? 0}</div>
              <div className="text-sm text-muted-foreground">Actual</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{taskData?.[0]?.target_cvt}</div>
              <div className="text-sm text-muted-foreground">Target</div>
            </div>
          </CardContent>
        </Card>

        <Card>
         <CardHeader className="py-2 text-sm font-medium">Cycle Time</CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <div className={`text-2xl font-bold ${getCtColor(taskData?.[0]?.actual_ct ?? 0, taskData?.[0]?.target_ct ?? 0)}`}>{taskData?.[0]?.actual_ct}s</div>
              <div className="text-sm text-muted-foreground">Actual</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{taskData?.[0]?.target_ct}s</div>
              <div className="text-sm text-muted-foreground">Target</div>
            </div>
          </CardContent>
        </Card>

        <Card>
         <CardHeader className="py-2 text-sm font-medium text-red-500">Non O.O.E</CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div>
              <div className="text-2xl font-bold text-red-500">{(oeeData?.[0]?.breakdownperc || 0) * 100}%</div>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="py-2 text-sm font-medium">Performance Metrics</CardHeader>
          <CardContent className="grid grid-cols-6 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-600">{(oeeData?.[0]?.ooe || 0) * 100}%</div>
              <div className="text-sm text-muted-foreground">OK</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{oeeData?.[0]?.red.toFixed(2) || 0}</div>
              <div className="text-sm text-muted-foreground">NQ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{oeeData?.[0]?.yellow.toFixed(2) || 0}</div>
              <div className="text-sm text-muted-foreground">SD</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{oeeData?.[0]?.white.toFixed(2) || 0}</div>
              <div className="text-sm text-muted-foreground">PS</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{oeeData?.[0]?.blue.toFixed(2) || 0}</div>
              <div className="text-sm text-muted-foreground">C/O</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{oeeData?.[0]?.purple.toFixed(2) || 0}</div>
              <div className="text-sm text-muted-foreground">OP</div>
            </div>
          </CardContent>
        </Card>
      </div> 
      )} 
      {selectedMachine === null ? (
        null
      ) : (
      <div className="p-0 w-full space-y-4 justify-between flex flex-col">
      <TooltipProvider>
      <Card className="w-full">
          <CardHeader className="py-2 text-sm font-medium">Hourly Details</CardHeader>
          <CardContent>
            <div className="w-full flex overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Time</TableHead>
                  <TableHead className="w-[60px]">ItemNo</TableHead>
                  <TableHead className="w-[60px]">Target</TableHead>
                  <TableHead className="w-[250px] text-center">Actual Qty</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>SCRAP</TableHead>
                  <TableHead>RWK</TableHead>
                  <TableHead>NOOE</TableHead>
                  <TableHead>Causes</TableHead>
                  <TableHead>Comments/Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hourlyData?.map((row, index) => (
                  <TableRow key={row.time}>
                    <TableCell>{row.time}</TableCell>
                    <TableCell>{row.itemNo}</TableCell>
                    <TableCell className="text-center">{row.target}</TableCell>
                    <TableCell className="relative overflow-hidden">
                    <div className="flex items-center h-8 w-full">
                        {/* Actual progress bar */}
                        <div
                        className={`absolute inset-0 h-full rounded ${getBarColor(row.actual, row.target, row.target_tolerance)}`}
                        style={{
                            width: `${Math.min((row.actual / (row.target + 50)) * 100, 100)}%`, // Limit to 100%
                            maxWidth: "250px",
                        }}
                        />

                        {/* Target marker */}
                        <div
                        className="absolute inset-0  h-full w-px bg-green-600"
                        style={{
                            left: `${Math.min((row.target / (row.target + 50)) * 100, 100)}%`, // Limit to 100%
                        }}
                        />

                        {/* Threshold marker */}
                        <div
                        className="absolute inset-0 h-full w-px bg-yellow-500"
                        style={{
                            left: `${Math.min(((row.target_tolerance) / (row.target + 50)) * 100, 100)}%`, // Limit to 100%
                        }}
                        />

                        {/* Actual value text */}
                        <span className="relative z-10 ml-2">{row.actual}</span>
                    </div>
                    </TableCell>

                    <TableCell className={row.delta >= 0 ? "text-green-600" : "text-red-600"}>{row.delta}</TableCell>
                    <TableCell>{row.scrap}</TableCell>
                    <TableCell>{row.rework}</TableCell>
                    <TableCell className="w-24 py-0">
                    {renderNooeIndicators(row.hourlyId)}
                    </TableCell>
                    <TableCell onClick={() => handleCellClick(index, row.hourlyId, 'causes', row.causes)}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{row.causes || 'N/A'}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{row.causes ? 'Click to edit causes' : 'Click to add causes'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell onClick={() => handleCellClick(index, row.hourlyId, 'comments', row.comments)}>
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
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
        </TooltipProvider>

        <div className="flex gap-2">
          <Button onClick={() => setIsPODialogOpen(true)} variant="default">
            <Paperclip className="w-4 h-4 mr-2"  />
            Attach PO
          </Button>
          <Button onClick={() => setIsCVTDialogOpen(true)} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Update CVT
          </Button>
        </div>
        <div>
        {selectedMachine?.machineName ? (
        <iframe
          src={`https://techpack-iot.dzuliot.my.id/d-solo/downuptime-postgres/down-and-up-time-postgres?orgId=1&var-MchID=${selectedMachine.machineName}&from=${from}&to=now&panelId=23&theme=light`}
          width="100%" 
          height="150"
        ></iframe>
        ) : (
          <></>
        )}
        </div>
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