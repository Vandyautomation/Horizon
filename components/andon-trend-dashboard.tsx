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
import { Calculator, CalendarIcon, ChevronDownIcon, Power, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { toast } from "react-hot-toast";
import { Badge } from "./ui/badge";
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
// import * as trendData from '@/api/controllers/trend.json'

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
// useEffect(() => {
//   setRawAndon((trendData as any).default as Trend[])
// }, [])

const chartData = useMemo(() => {
  if (!rawAndon) return [];
  console.log(rawAndon);
  
  const MINUTES_PER_DAY = 24 * 60; // 1440 minutes
  const threshold = (tolerance / 100) * MINUTES_PER_DAY; // e.g., 70% of 1440 = 1008 minutes
  
  // Group by date to count machines per day
  const groupedByDate = rawAndon.reduce((acc, item) => {
    const date = item.report_date as string;
    if (!acc[date]) {
      acc[date] = { 
        report_date: typeof date === 'string' || typeof date === 'number' ? new Date(date).toISOString() : date,
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
      grey_minutes: item.grey_minutes || 0,
      white_minutes: item.white_minutes || 0,
      orange_minutes: item.orange_minutes || 0,
      blue_minutes: item.blue_minutes || 0,
      purple_minutes: item.purple_minutes || 0,
      red_minutes: item.red_minutes || 0,
      yellow_minutes: item.yellow_minutes || 0,
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
        totalGreyMinutes: 0,
        totalWhiteMinutes: 0,
        averageGreenMinutes: 0,
        averageGreyMinutes: 0,
        averageWhiteMinutes: 0,
        belowTargetPercentage: 0
      };
    }
    
    const greenMinutes = item.green_minutes || 0;
    const isBelowTarget = greenMinutes < threshold;
    
    acc[machineId].days++;
    acc[machineId].totalGreenMinutes += greenMinutes;
    acc[machineId].totalGreyMinutes += item.grey_minutes || 0;
    acc[machineId].totalWhiteMinutes += item.white_minutes || 0;
    
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
      averageGreyMinutes: machine.totalGreyMinutes / machine.days,
      averageWhiteMinutes: machine.totalWhiteMinutes / machine.days,
      belowTargetPercentage: (machine.belowTargetDays / machine.days) * 100,
      greyPercentage: (machine.totalGreyMinutes / machine.days) * 100,
      whitePercentage: (machine.totalWhiteMinutes / machine.days) * 100
    }))
    .filter(machine => machine.belowTargetPercentage >= (100-tolerance)) // 70% or more days below target
    .sort((a, b) => b.belowTargetPercentage - a.belowTargetPercentage);
}, [rawAndon, tolerance]);


const consistentlyGrey = useMemo(() => {
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
        totalGreenMinutes: 0,
        totalGreyMinutes: 0,
        totalWhiteMinutes: 0,
        averageGreenMinutes: 0,
        averageGreyMinutes: 0,
        averageWhiteMinutes: 0,
        greyPercentage: 0,
        whitePercentage: 0
      };
    }
    
    const greenMinutes = item.green_minutes || 0;
    const isBelowTarget = greenMinutes < threshold;
    
    acc[machineId].days++;
    acc[machineId].totalGreenMinutes += greenMinutes;
    acc[machineId].totalGreyMinutes += item.grey_minutes || 0;
    acc[machineId].totalWhiteMinutes += item.white_minutes || 0;
    
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
      averageGreyMinutes: machine.totalGreyMinutes / machine.days,
      averageWhiteMinutes: machine.totalWhiteMinutes / machine.days,
      greyPercentage: (machine.totalGreyMinutes / machine.days) * 100,
      whitePercentage: (machine.totalWhiteMinutes / machine.days) * 100
    }))
    .filter(machine => machine.greyPercentage >= (100 - tolerance)) // 70% or more days below target
    .sort((a, b) => b.greyPercentage - a.greyPercentage);
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
                          let date;
                          if (typeof value === 'string' || typeof value === 'number') {
                            date = new Date(value);
                          } else if (value instanceof Date) {
                            date = value;
                          } else {
                            return '';
                          }
                          return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
                        }}
                      />
                      <YAxis 
                        dataKey="total_running_machines" 
                        width={28} 
                        tickMargin={2} 
                        tick={{ fontSize: 11 }} 
                        axisLine={false} 
                        tickLine={false} 
                        className="ml-0 pl-0"
                      />
                      <ChartTooltip
                        cursor={false}
                        labelFormatter={(value) => {
                          let date;
                          if (typeof value === 'string' || typeof value === 'number') {
                            date = new Date(value);
                          } else if (value instanceof Date) {
                            date = value;
                          } else {
                            return '';
                          }
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
                  <div className="flex items-center gap-2">
                    <Label className="text-base">
                      Total Below Target: {chartData.find(day => day.report_date === selectedDay)?.total_below_target_machines}
                    </Label>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDay(null)}>
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              <Table className="w-full/2 flex table-fixed mx-6">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[80px]">Machine ID</TableHead>
                    <TableHead className="text-xs w-[160px]">Description</TableHead>
                    <TableHead className="text-xs w-[80px]">Tonage</TableHead>
                    <TableHead className="text-xs w-[80px]">UAP</TableHead>
                    <TableHead className="text-xs w-[80px]">Number</TableHead>
                    <TableHead className="text-xs w-[100px]">Location</TableHead>
                    <TableHead className="text-xs w-[100px]">Green Min</TableHead>
                    <TableHead className="text-xs w-[60px]">%</TableHead>
                    <TableHead className="text-xs w-[60px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              <CardContent className="pt-0">
                <div className="max-h-[440px] overflow-auto">
                  <Table className="w-full table-fixed">
                    <TableBody>
                      {chartData
                        .find(day => day.report_date === selectedDay)
                        ?.machines
                          .filter((machine: any) => !machine.isRunning)
                          .sort((a: any, b: any) => {
                            if (a.mchloc < b.mchloc) return -1;
                            if (a.mchloc > b.mchloc) return 1;
                            return (a.mchnumber ?? 0) - (b.mchnumber ?? 0);
                          })
                          .map((machine: any) => (
                            <TableRow key={machine.MchID + selectedDay}>
                              <TableCell className="text-xs w-[80px]">{machine.MchID}</TableCell>
                              <TableCell className="text-xs w-[160px]">{machine.mchdesc}</TableCell>
                              <TableCell className="text-xs w-[80px]">{machine.mchtonage}</TableCell>
                              <TableCell className="text-xs w-[80px]">{machine.mchuap}</TableCell>
                              <TableCell className="text-xs w-[80px]">{machine.mchnumber}</TableCell>
                              <TableCell className="text-xs w-[100px]">{machine.mchloc}</TableCell>
                              <TableCell className="text-xs w-[100px]">{machine.green_minutes}</TableCell>
                              <TableCell className="text-xs w-[60px]">{machine.percentage.toFixed(1)}%</TableCell>
                              <TableCell className="w-[80px]">
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
          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Analytics: Most Frequent Non-Green Color
                </CardTitle>
                <CardDescription className="text-xs">
                  Analysis of machine downtime patterns and color frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Validation: Check if data exists
                  if (!chartData || chartData.length === 0) {
                    return (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <div className="text-center">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No data available for analytics</p>
                        </div>
                      </div>
                    );
                  }

                  // Validate that machines have the required color data
                  const hasValidData = chartData.some(day => 
                    day.machines && day.machines.length > 0 && 
                    day.machines.some((machine: any) => 
                      typeof machine.yellow_minutes === 'number' || 
                      typeof machine.red_minutes === 'number'
                    )
                  );

                  if (!hasValidData) {
                    return (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Insufficient color data for analysis</p>
                        </div>
                      </div>
                    );
                  }

                  // Define non-green colors with proper labels and colors
                  const nonGreenColors = [
                    { key: "yellow_minutes", label: "Yellow", color: "yellow", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
                    { key: "red_minutes", label: "Red", color: "red", bgColor: "bg-red-100", textColor: "text-red-800" },
                    { key: "white_minutes", label: "White", color: "gray", bgColor: "bg-gray-100", textColor: "text-gray-800" },
                    { key: "purple_minutes", label: "Purple", color: "purple", bgColor: "bg-purple-100", textColor: "text-purple-800" },
                    { key: "orange_minutes", label: "Orange", color: "orange", bgColor: "bg-orange-100", textColor: "text-orange-800" },
                    { key: "blue_minutes", label: "Blue", color: "blue", bgColor: "bg-blue-100", textColor: "text-blue-800" },
                    { key: "grey_minutes", label: "Grey", color: "gray", bgColor: "bg-gray-100", textColor: "text-gray-800" }
                  ];

                  // Define type for color data
                  type ColorData = {
                    total: number;
                    machines: Record<string, number[]>;
                    label: string;
                    color: string;
                    bgColor: string;
                    textColor: string;
                  };

                  // Aggregate non-green color durations across all days and machines
                  const colorTotals: Record<string, ColorData> = {};

                  nonGreenColors.forEach(color => {
                    colorTotals[color.key] = { 
                      total: 0, 
                      machines: {}, 
                      label: color.label,
                      color: color.color,
                      bgColor: color.bgColor,
                      textColor: color.textColor
                    };
                  });

                  // Calculate totals and collect machine data
                  chartData.forEach((day: any) => {
                    if (!day.machines) return;
                    
                    day.machines.forEach((machine: any) => {
                      nonGreenColors.forEach(color => {
                        const minutes = machine[color.key] || 0;
                        if (typeof minutes === 'number' && minutes > 0) {
                          colorTotals[color.key].total += minutes;
                          if (!colorTotals[color.key].machines[machine.MchID]) {
                            colorTotals[color.key].machines[machine.MchID] = [];
                          }
                          (colorTotals[color.key].machines[machine.MchID] as number[]).push(minutes);
                        }
                      });
                    });
                  });

                  // Find the most frequent (highest total) non-green color
                  let mostColor = "";
                  let mostTotal = 0;
                  let mostColorData: ColorData = {
                    total: 0,
                    machines: {},
                    label: "",
                    color: "",
                    bgColor: "",
                    textColor: ""
                  };

                  Object.entries(colorTotals).forEach(([colorKey, data]) => {
                    if (data.total > mostTotal) {
                      mostColor = colorKey;
                      mostTotal = data.total;
                      mostColorData = data;
                    }
                  });

                  if (!mostColorData) {
                    return (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No non-green color data found</p>
                      </div>
                    );
                  }

                  // Get machines with high average of that color (threshold: 20% of day = 288 minutes)
                  const HIGH_THRESHOLD = 288; // 20% of 1440 minutes
                  const machinesWithHighColor: { 
                    MchID: string, 
                    avg: number, 
                    desc: string, 
                    loc: string, 
                    mchnumber: string,
                    totalDays: number
                  }[] = [];

                  Object.entries(mostColorData!.machines).forEach(([MchID, minutes]) => {
                    const minutesArray = minutes as number[];
                    const avg = minutesArray.reduce((a: number, b: number) => a + b, 0) / minutesArray.length;
                    
                    if (avg > HIGH_THRESHOLD) {
                      // Find machine info from chartData
                      let machineInfo: any = null;
                      for (const day of chartData) {
                        if (!day.machines) continue;
                        machineInfo = day.machines.find((m: any) => m.MchID === MchID);
                        if (machineInfo) break;
                      }
                      
                      machinesWithHighColor.push({
                        MchID,
                        avg,
                        desc: machineInfo?.mchdesc || "Unknown",
                        loc: machineInfo?.mchloc || "Unknown",
                        mchnumber: machineInfo?.mchnumber || "Unknown",
                        totalDays: minutesArray.length
                      });
                    }
                  });

                  // Calculate overall statistics
                  const totalMachineDays = chartData.reduce((sum, day) => sum + (day.machines?.length || 0), 0);
                  const avgColorPerMachineDay = totalMachineDays > 0 ? mostTotal / totalMachineDays : 0;
                  const avgColorPercentage = (avgColorPerMachineDay / 1440) * 100;
                  const isAverageHigh = avgColorPerMachineDay > HIGH_THRESHOLD;

                  return (
                    <div className="space-y-4">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Card className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${mostColorData!.bgColor}`}></div>
                            <div>
                              <p className="text-xs text-muted-foreground">Most Frequent Color</p>
                              <p className="text-lg font-bold">{mostColorData!.label}</p>
                            </div>
                          </div>
                        </Card>
                        
                        <Card className="p-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Total Duration</p>
                            <p className="text-lg font-bold">
                              {(mostTotal / 60).toFixed(1)}h
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {mostTotal.toLocaleString()} minutes
                            </p>
                          </div>
                        </Card>
                        
                        <Card className="p-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Avg per Machine-Day</p>
                            <p className={`text-lg font-bold ${isAverageHigh ? 'text-red-600' : 'text-green-600'}`}>
                              {avgColorPercentage.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {avgColorPerMachineDay.toFixed(1)} min
                            </p>
                          </div>
                        </Card>
                      </div>

                      {/* Analysis Results */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={isAverageHigh ? "destructive" : "secondary"}>
                            {isAverageHigh ? "High Frequency" : "Moderate Frequency"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {mostColorData!.label} appears {isAverageHigh ? "frequently" : "moderately"} across all machines
                          </span>
                        </div>

                        {/* Machines with High Color Usage */}
                        {machinesWithHighColor.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">
                                Machines with High {mostColorData!.label} Usage ({machinesWithHighColor.length})
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                Threshold: {HIGH_THRESHOLD} min/day
                              </Badge>
                            </div>
                            
                            <div className="max-h-64 overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="sticky top-0 bg-background z-10">
                                    <TableHead className="text-xs w-[100px]">Machine ID</TableHead>
                                    <TableHead className="text-xs w-[80px]">Number</TableHead>
                                    <TableHead className="text-xs w-[120px]">Location</TableHead>
                                    <TableHead className="text-xs w-[150px]">Description</TableHead>
                                    <TableHead className="text-xs w-[100px]">Avg {mostColorData!.label}</TableHead>
                                    <TableHead className="text-xs w-[80px]">% of Day</TableHead>
                                    <TableHead className="text-xs w-[80px]">Days</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {machinesWithHighColor
                                    .sort((a, b) => b.avg - a.avg)
                                    .map(machine => (
                                      <TableRow key={machine.MchID}>
                                        <TableCell className="text-xs font-medium">{machine.MchID}</TableCell>
                                        <TableCell className="text-xs">{machine.mchnumber}</TableCell>
                                        <TableCell className="text-xs">{machine.loc}</TableCell>
                                        <TableCell className="text-xs truncate max-w-[150px]" title={machine.desc}>
                                          {machine.desc}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                          {machine.avg.toFixed(1)} min
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          <span className={`px-2 py-1 rounded text-xs ${mostColorData!.bgColor} ${mostColorData!.textColor}`}>
                                            {((machine.avg / 1440) * 100).toFixed(1)}%
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{machine.totalDays}</TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <p className="text-sm">No machines consistently show high {mostColorData!.label} usage</p>
                            <p className="text-xs">(Above {HIGH_THRESHOLD} minutes per day average)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Consistently Below Target Machines */}
          {/* <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-center">
                  CONSISTENTLY BELOW TARGET MACHINES
                  <div className="flex items-center gap-2">
                    <Label className="text-base">
                      Total Machines: {consistentlyBelowTarget.length}
                    </Label>
                </div>
              </CardTitle>
              <Table className="w-[860px] flex table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-background z-10">
                      <TableHead className="text-xs w-[80px]">Machine ID</TableHead>
                      <TableHead className="text-xs w-[200px]">Description</TableHead>
                      <TableHead className="text-xs w-[60px]">Tonage</TableHead>
                      <TableHead className="text-xs w-[60px]">UAP</TableHead>
                      <TableHead className="text-xs w-[60px]">Number</TableHead>
                      <TableHead className="text-xs w-[100px]">Location</TableHead>
                      <TableHead className="text-xs w-[100px]">Below Days</TableHead>
                      <TableHead className="text-xs w-[100px]">Below %</TableHead>
                      <TableHead className="text-xs w-[60px]">Avg Min</TableHead>
                    </TableRow>
                  </TableHeader>
              </Table>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableBody>
                    {[...consistentlyBelowTarget]
                      .sort((a, b) => {
                        if (a.mchloc < b.mchloc) return -1;
                        if (a.mchloc > b.mchloc) return 1;
                        if (a.mchnumber < b.mchnumber) return -1;
                        if (a.mchnumber > b.mchnumber) return 1;
                        return 0;
                      })
                      .map((machine: any) => (
                      <TableRow key={machine.MchID}>
                        <TableCell className="text-xs w-[80px]">{machine.MchID}</TableCell>
                        <TableCell className="text-xs w-[200px]">{machine.mchdesc}</TableCell>
                        <TableCell className="text-xs w-[60px]">{machine.mchtonage}</TableCell>
                        <TableCell className="text-xs w-[60px]">{machine.mchuap}</TableCell>
                        <TableCell className="text-xs w-[60px]">{machine.mchnumber}</TableCell>
                        <TableCell className="text-xs w-[100px]">{machine.mchloc}</TableCell>
                        <TableCell className="text-xs w-[100px]">{machine.belowTargetDays}</TableCell>
                        <TableCell className="text-xs w-[100px]">
                          <span className="text-red-600 font-medium text-xs">
                            {machine.belowTargetPercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-xs w-[60px]">{machine.averageGreenMinutes.toFixed(0)}</TableCell>
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
        <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-center">
                  CONSISTENTLY HIGH GREY MACHINES
                  <div className="flex items-center gap-2">
                    <Label className="text-base">
                      Total Machines: {consistentlyGrey.length}
                    </Label>
                </div>
              </CardTitle>
              <Table className="w-[860px] flex table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-background z-10">
                      <TableHead className="text-xs w-[80px]">Machine ID</TableHead>
                      <TableHead className="text-xs w-[200px]">Description</TableHead>
                      <TableHead className="text-xs w-[60px]">Tonage</TableHead>
                      <TableHead className="text-xs w-[60px]">UAP</TableHead>
                      <TableHead className="text-xs w-[60px]">Number</TableHead>
                      <TableHead className="text-xs w-[100px]">Location</TableHead>
                      <TableHead className="text-xs w-[100px]">Avg Grey Min</TableHead>
                    </TableRow>
                  </TableHeader>
              </Table>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableBody>
                    {[...consistentlyGrey]
                      .sort((a, b) => {
                        if (a.mchloc < b.mchloc) return -1;
                        if (a.mchloc > b.mchloc) return 1;
                        if (a.mchnumber < b.mchnumber) return -1;
                        if (a.mchnumber > b.mchnumber) return 1;
                        return 0;
                      })
                      .map((machine: any) => (
                      <TableRow key={machine.MchID}>
                        <TableCell className="text-xs w-[80px]">{machine.MchID}</TableCell>
                        <TableCell className="text-xs w-[200px]">{machine.mchdesc}</TableCell>
                        <TableCell className="text-xs w-[60px]">{machine.mchtonage}</TableCell>
                        <TableCell className="text-xs w-[60px]">{machine.mchuap}</TableCell>
                        <TableCell className="text-xs w-[60px]">{machine.mchnumber}</TableCell>
                        <TableCell className="text-xs w-[100px]">{machine.mchloc}</TableCell>
                        <TableCell className="text-xs w-[60px]">{machine.averageGreyMinutes.toFixed(0)}</TableCell>
                      </TableRow>
                    ))}
                    {consistentlyGrey.length === 0 && (
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
        </div> */}
        </div>
      </div>
  );
}

