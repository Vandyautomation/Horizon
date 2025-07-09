"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import Image from "next/image";
import albeaLogo from "@/public/albea-white.png"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar"
import { type DateRange } from "react-day-picker"
import mqtt from "mqtt";

import { Button } from './ui/button';
import useSWR from 'swr';
import { Label } from './ui/label';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calculator, CalendarIcon, ChevronDownIcon, Power, TrendingUp, Zap } from 'lucide-react';
import { toast } from "react-hot-toast";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "./ui/table";
import { getMqttClient, closeMqttClient } from '@/lib/mqtt';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import oboe from 'oboe';

interface Trend {
  report_date: string;
  MchID: string;
  mchloc: string;
  mchnumber: string;
  mchdesc: string;
  mchtonage: string;
  mchuap: string;
  green_minutes: number;
  yellow_minutes: number;
  red_minutes: number;
  white_minutes: number;
  purple_minutes: number;
  orange_minutes: number;
  blue_minutes: number;
  grey_minutes: number;
}
const chartConfig: ChartConfig = {
  green_minutes: {
    label: 'Green Minutes',
    color: 'var(--color-desktop)',
  },
  yellow_minutes: {
    label: 'Yellow Minutes',
    color: 'var(--color-desktop)',
  },
  red_minutes: {
    label: 'Red Minutes',
    color: 'var(--color-desktop)',
  },
  white_minutes: {
    label: 'White Minutes',
    color: 'var(--color-desktop)',
  },
  purple_minutes: {
    label: 'Purple Minutes',
    color: 'var(--color-desktop)',
  },
  orange_minutes: {
    label: 'Orange Minutes',
    color: 'var(--color-desktop)',
  },
  blue_minutes: {
    label: 'Blue Minutes',
    color: 'var(--color-desktop)',
  },
  grey_minutes: {
    label: 'Grey Minutes',
    color: 'var(--color-desktop)',
  },
  total_running_machines: {
    label: 'Total Running Machines',
    color: 'var(--color-desktop)',
  },
  total_below_target_machines: {
    label: 'Total Below Target Machines',
    color: 'var(--color-desktop)',
  },
}
export default function AndonTrendDashboard() {

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 7, 1),
    to: new Date(2025, 7, 8),
  })

  const [selectedCard, setSelectedCard] = useState<Trend[] | undefined>(undefined);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 900, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const [tolerance, setTolerance] = useState(30);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [rawAndon, setRawAndon] = useState<Trend[]>([]);


useEffect(() => {
  if (!dateRange) return;
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trend?date_from=${dateRange?.from?.toISOString()}&date_to=${dateRange?.to?.toISOString()}`;

  toast.loading("Fetching large machine data...");

  const stream = oboe(url)
    .node('![*]', (row: any) => {
      // process each row as it comes in
      setRawAndon(prev => [...prev, row]);
    })
    .done(() => {
      toast.dismiss();
      console.log('Stream finished');
    })
    .fail((err: any) => {
      toast.error("Failed to load large dataset");
      toast.dismiss(); // dismiss the toast when the stream fails
    });

  return () => stream.abort();
}, [dateRange]);

const chartData = useMemo(() => {
  if (!rawAndon) return [];
  console.log(rawAndon);
  
  const MINUTES_PER_DAY = 24 * 60; // 1440 minutes
  const threshold = (tolerance / 100) * MINUTES_PER_DAY; // e.g., 70% of 1440 = 1008 minutes
  
  // Group by date to count machines per day
  const groupedByDate = rawAndon.reduce((acc, item) => {
    const date = item.report_date;
    if (!acc[date]) {
      acc[date] = {
        report_date: new Date(date).toISOString(),
        machines: [],
        total_running_machines: 0,
        total_below_target_machines: 0
      };
    }
    
    const greenMinutes = item.green_minutes || 0;
    const isRunning = greenMinutes >= threshold;
    
    acc[date].machines.push({
      MchID: item.MchID,
      mchnumber: item.mchnumber,
      mchdesc: item.mchdesc,
      mchtonage: item.mchtonage,
      mchuap: item.mchuap,
      mchloc: item.mchloc,
      green_minutes: greenMinutes,
      isRunning: isRunning,
      percentage: (greenMinutes / MINUTES_PER_DAY) * 100
    });
    
    if (isRunning) {
      acc[date].total_running_machines++;
    } else {
      acc[date].total_below_target_machines++;
    }
    
    return acc;
  }, {} as Record<string, any>);
  
  return Object.values(groupedByDate);
}, [rawAndon, tolerance]);

// Calculate consistently below target machines
const consistentlyBelowTarget = useMemo(() => {
  if (!rawAndon) return [];
  
  const MINUTES_PER_DAY = 24 * 60;
  const threshold = (tolerance / 100) * MINUTES_PER_DAY;
  
  // Group by machine to check consistency
  const machineStats = rawAndon.reduce((acc, item) => {
    const machineId = item.MchID;
    if (!acc[machineId]) {
      acc[machineId] = {
        MchID: machineId,
        mchnumber: item.mchnumber,
        mchloc: item.mchloc,
        mchdesc: item.mchdesc,
        mchtonage: item.mchtonage,
        mchuap: item.mchuap,
        days: 0,
        belowTargetDays: 0,
        totalGreenMinutes: 0,
        averageGreenMinutes: 0
      };
    }
    
    const greenMinutes = item.green_minutes || 0;
    const isBelowTarget = greenMinutes < threshold;
    
    acc[machineId].days++;
    acc[machineId].totalGreenMinutes += greenMinutes;
    
    if (isBelowTarget) {
      acc[machineId].belowTargetDays++;
    }
    
    return acc;
  }, {} as Record<string, any>);
  
  // Calculate averages and filter consistently below target
  return Object.values(machineStats)
    .map(machine => ({
      ...machine,
      averageGreenMinutes: machine.totalGreenMinutes / machine.days,
      belowTargetPercentage: (machine.belowTargetDays / machine.days) * 100
    }))
    .filter(machine => machine.belowTargetPercentage >= 70) // 70% or more days below target
    .sort((a, b) => b.belowTargetPercentage - a.belowTargetPercentage);
}, [rawAndon, tolerance]);




  return (
    <div className="w-full ">
      <div className="flex items-center justify-between mb-4">
        <Image src={albeaLogo} alt="Albea" width={200} height={100} className="px-3 py-2 flex items-center border border-gray-250 rounded-xl text-gray-700 align-middle bg-white"/>
        <h1 className="text-4xl font-bold mr-4">ANDON TREND DASHBOARD</h1>
        <div>
          <h1 className="text-4xl font-bold mr-4">TECHPACK ASIA</h1>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger className="flex items-center text-nowrap gap-2 border border-gray-250 rounded-lg px-2 py-2">
                  <span className="text-sm">{dateRange?.from?.toLocaleDateString()} - {dateRange?.to?.toLocaleDateString() || 'Select Date Range'}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                  />
                </PopoverContent>
              </Popover>
              <Select defaultValue="30" onValueChange={(value: string) => setTolerance(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder={`Tolerance ${tolerance}%`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </div>
      <div className="p-0 space-y-3">
          {/* Summary Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Running Machines</p>
                  <p className="text-2xl font-bold text-green-600">
                    {chartData.reduce((sum, item) => sum + item.total_running_machines, 0)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Below Target</p>
                  <p className="text-2xl font-bold text-red-600">
                    {chartData.reduce((sum, item) => sum + item.total_below_target_machines, 0)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tolerance</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tolerance}%
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Threshold</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((tolerance / 100) * 24 * 60)} min
                  </p>
                </div>
              </div>
            </Card>
          </div> */}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Running vs Below Target Chart */}
            <Card className="h-auto"> 
              <CardHeader className="pb-2">
                <CardTitle className="text-base">MACHINE PERFORMANCE</CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <div className="h-full">
                  <ChartContainer config={chartConfig}>
                    <BarChart 
                      accessibilityLayer 
                      data={chartData || []}
                      onClick={(data) => {
                        if (data && data.activePayload && data.activePayload[0]) {
                          const dayData = data.activePayload[0].payload;
                          setSelectedDay(selectedDay === dayData.report_date ? null : dayData.report_date);
                        }
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="report_date"
                        tickLine={true}
                        tickMargin={5}
                        axisLine={true}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
                        }}
                      />
                      <ChartTooltip
                        cursor={false}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
                        }}
                        content={<ChartTooltipContent indicator="dashed" 
                        />}
                      />
                      <Bar 
                        dataKey="total_running_machines" 
                        fill="#22c55e" 
                        radius={4}
                        style={{ cursor: 'pointer' }}
                      />
                      <Bar 
                        dataKey="total_below_target_machines" 
                        fill="#ef4444" 
                        radius={4}
                        style={{ cursor: 'pointer' }}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Selected Day Machine Details */}
          {selectedDay ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-center">
                  Machine Details for {new Date(selectedDay).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                  <Button variant="outline" size="sm" onClick={() => setSelectedDay(null)}>
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[440px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Machine ID</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs">Tonage</TableHead>
                        <TableHead className="text-xs">UAP</TableHead>
                        <TableHead className="text-xs">Number</TableHead>
                        <TableHead className="text-xs">Location</TableHead>
                        <TableHead className="text-xs">Green Min</TableHead>
                        <TableHead className="text-xs">%</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chartData
                        .find(day => day.report_date === selectedDay)
                        ?.machines.map((machine: any) => (
                          <TableRow key={machine.MchID + selectedDay}>
                            <TableCell className="text-xs">{machine.MchID}</TableCell>
                            <TableCell className="text-xs">{machine.mchdesc}</TableCell>
                            <TableCell className="text-xs">{machine.mchtonage}</TableCell>
                            <TableCell className="text-xs">{machine.mchuap}</TableCell>
                            <TableCell className="text-xs">{machine.mchnumber}</TableCell>
                            <TableCell className="text-xs">{machine.mchloc}</TableCell>
                            <TableCell className="text-xs">{machine.green_minutes}</TableCell>
                            <TableCell className="text-xs">{machine.percentage.toFixed(1)}%</TableCell>
                            <TableCell>
                              <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                machine.isRunning 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {machine.isRunning ? '✓' : '✗'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : 
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-base">SELECT A DATE TO VIEW MACHINE DETAILS</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-[440px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Machine ID</TableHead>
                      <TableHead className="text-xs">Number</TableHead>
                      <TableHead className="text-xs">Location</TableHead>
                      <TableHead className="text-xs">Green Min</TableHead>
                      <TableHead className="text-xs">%</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground text-xs">
                        Select a date to view machine details
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>}
          </div>

          {/* Consistently Below Target Machines */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">CONSISTENTLY BELOW TARGET MACHINES</CardTitle>
              <CardDescription className="text-xs">
                Machines below target {tolerance}% of the time
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Machine ID</TableHead>
                      <TableHead className="text-xs">Number</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Tonage</TableHead>
                      <TableHead className="text-xs">UAP</TableHead>
                      <TableHead className="text-xs">Location</TableHead>
                      <TableHead className="text-xs">Below Days</TableHead>
                      <TableHead className="text-xs">Below %</TableHead>
                      <TableHead className="text-xs">Avg Min</TableHead>
                      <TableHead className="text-xs">Total Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consistentlyBelowTarget.map((machine: any) => (
                      <TableRow key={machine.MchID}>
                        <TableCell className="text-xs">{machine.MchID}</TableCell>
                        <TableCell className="text-xs">{machine.mchnumber}</TableCell>
                        <TableCell className="text-xs">{machine.mchdesc}</TableCell>
                        <TableCell className="text-xs">{machine.mchtonage}</TableCell>
                        <TableCell className="text-xs">{machine.mchuap}</TableCell>
                        <TableCell className="text-xs">{machine.mchloc}</TableCell>
                        <TableCell className="text-xs">{machine.belowTargetDays}</TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium text-xs">
                            {machine.belowTargetPercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{machine.averageGreenMinutes.toFixed(0)}</TableCell>
                        <TableCell className="text-xs">{machine.days}</TableCell>
                      </TableRow>
                    ))}
                    {consistentlyBelowTarget.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground text-xs">
                          No machines consistently below target
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>



      </div>
  );
}

