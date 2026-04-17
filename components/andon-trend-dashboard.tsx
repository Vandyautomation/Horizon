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
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import oboe from 'oboe';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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

interface WeeklyTrend {
  week: string;
  MchNumber: string;
  MchLoc: string;
  MchDesc: string;
  MchTon: string;
  UAP: string;
  OEE: number;
  OOE: number;
  NonOOE: number;
  PlannedStoppage: number;
  Breakdown: number;
  MicroStop: number;
  NonQuality: number;
  OrgDisfunction: number;
  SMED: number;
  Other: number;

}

interface HourlyTrend {
  MchID: string;
  MchNumber: string;
  MchLoc: string;
  MchDesc: string;
  MchTon: string;
  UAP: string;
  StatusLight: string;
  HourStart: string;
  DurationMinutes: number;
  DurationHour: number;
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
  Breakdown: {
    label: 'Breakdown',
    color: 'var(--color-desktop)',
  },
  PlannedStoppage: {
    label: 'Planned Stoppage',
    color: 'var(--color-desktop)',
  },
  MicroStop: {
    label: 'Micro Stop',
    color: 'var(--color-desktop)',
  },
  NonQuality: {
    label: 'Non Quality', 
    color: 'var(--color-desktop)',
  },
  OrgDisfunction: {
    label: 'Org Disfunction',
    color: 'var(--color-desktop)',
  },
  SMED: {
    label: 'SMED',
    color: 'var(--color-desktop)',
  },
  Other: {
    label: 'Unclassified',
    color: 'var(--color-desktop)',
  },
  green: {
    label: 'Green',
    color: 'var(--color-desktop)',
  },
  yellow: {
    label: 'Yellow',
    color: 'var(--color-desktop)',
  },
  red: {
    label: 'Red',
    color: 'var(--color-desktop)',
  },
  orange: {
    label: 'Orange',
    color: 'var(--color-desktop)',
  },
  purple: {
    label: 'Purple',
    color: 'var(--color-desktop)',
  },
  blue: {
    label: 'Blue',
    color: 'var(--color-desktop)',
  },
  white: {
    label: 'White',
    color: 'var(--color-desktop)',
  },
  grey: {
    label: 'Grey',
    color: 'var(--color-desktop)',
  }
}
export default function AndonTrendDashboard() {

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
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
  const [weeklyAndon, setWeeklyAndon] = useState<WeeklyTrend[]>([]);
  const [hourlyAndon, setHourlyAndon] = useState<HourlyTrend[]>([]);
  const [uap, setUap] = useState('ALL');
  const [selectedTabs, setSelectedTabs] = useState('weekly');
  const [selectedWeeklyDetail, setSelectedWeeklyDetail] = useState<{ week: string, color: string } | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  const fetchWeeklyAndon = async () => {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trend/weekly?date_from=${dateRange?.from?.toISOString().replace('T', ' ').replace('Z', '').substring(0, 10)}&date_to=${dateRange?.to?.toISOString().replace('T', ' ').replace('Z', '').substring(0, 10 )}&uap=${uap}`;
    const response = await fetch(url);
    const data = await response.json();
    if(data.length > 0) {
      setWeeklyAndon(data);
    } else {
      setWeeklyAndon([]);
    }
  }

  const fetchHourlyAndon = async () => {
    setSelectedHour(null);
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trend/hourly?date_from=${dateRange?.from?.toISOString().replace('T', ' ').replace('Z', '').substring(0, 10)}&date_to=${dateRange?.to?.toISOString().replace('T', ' ').replace('Z', '').substring(0, 10 )}&uap=${uap}`;
    const response = await fetch(url);
    const data = await response.json();
    if (Array.isArray(data)) {
      setHourlyAndon(data);
    } else {
      setHourlyAndon([]);
    }
  }

useEffect(() => {
  if (!dateRange) return;
  if (selectedTabs != 'weekly') return;
  fetchWeeklyAndon();
}, [dateRange, uap, selectedTabs]);

useEffect(() => {
  if (!dateRange) return;
  if (selectedTabs !== 'hourly') return;
  fetchHourlyAndon();
}, [dateRange, uap, selectedTabs]);

const weeklyChartData = useMemo(() => {
  // Group by week
  const weekMap: Record<string, any> = {};
  weeklyAndon.forEach(item => {
    if (!weekMap[item.week]) {
      weekMap[item.week] = {
        week: item.week,
        Breakdown: 0,
        PlannedStoppage: 0,
        MicroStop: 0,
        NonQuality: 0,
        OrgDisfunction: 0,
        SMED: 0,
        Unclassified: 0,
        machines: [],
      };
    }
    // Sum up each color
    weekMap[item.week].Breakdown += item.Breakdown;
    weekMap[item.week].PlannedStoppage += item.PlannedStoppage;
    weekMap[item.week].MicroStop += item.MicroStop;
    weekMap[item.week].NonQuality += item.NonQuality;
    weekMap[item.week].OrgDisfunction += item.OrgDisfunction;
    weekMap[item.week].SMED += item.SMED;
    weekMap[item.week].Unclassified += item.Other;
    weekMap[item.week].machines.push(item);
  });
  return Object.values(weekMap);
}, [weeklyAndon]);

const hourlyChartData = useMemo(() => {
  const statusKeyMap: Record<string, string> = {
    GREEN: 'green',
    YELLOW: 'yellow',
    RED: 'red',
    ORANGE: 'orange',
    PURPLE: 'purple',
    BLUE: 'blue',
    WHITE: 'white',
    GREY: 'grey',
  };

  const grouped: Record<string, any> = {};

  hourlyAndon.forEach((item) => {
    const hourKey = new Date(item.HourStart).toISOString();
    if (!grouped[hourKey]) {
      grouped[hourKey] = {
        hour_start: hourKey,
        green: 0,
        yellow: 0,
        red: 0,
        orange: 0,
        purple: 0,
        blue: 0,
        white: 0,
        grey: 0,
        machineCount: 0,
        _machineSet: new Set<string>(),
      };
    }

    const key = statusKeyMap[item.StatusLight];
    if (!key) return;

    grouped[hourKey][key] += Number(item.DurationMinutes || 0);
    grouped[hourKey]._machineSet.add(item.MchID);
  });

  return Object.values(grouped)
    .map((item: any) => ({
      ...item,
      machineCount: item._machineSet.size,
    }))
    .sort((a: any, b: any) => new Date(a.hour_start).getTime() - new Date(b.hour_start).getTime());
}, [hourlyAndon]);

const selectedHourlyRows = useMemo(() => {
  if (!selectedHour) return [];
  return hourlyAndon
    .filter((item) => new Date(item.HourStart).toISOString() === selectedHour)
    .sort((a, b) => Number(b.DurationMinutes) - Number(a.DurationMinutes));
}, [hourlyAndon, selectedHour]);


useEffect(() => {
  if (!dateRange) return;
  if (selectedTabs != 'daily') return;
  setRawAndon([]);
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/trend?date_from=${dateRange?.from?.toISOString().replace('T', ' ').replace('Z', '').substring(0, 10)}&date_to=${dateRange?.to?.toISOString().replace('T', ' ').replace('Z', '').substring(0, 10)}`;

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
}, [dateRange, selectedTabs]);
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
        <div className="flex flex-col items-center justify-center flex-1">
          <h1 className="text-4xl font-bold mb-2 text-center">ANDON TREND DASHBOARD</h1>
          {/* Tabs header only, tabs content is below and shares the same value */}
          <Tabs value={selectedTabs} className="w-full flex flex-col items-center" id="andon-tabs">
            <TabsList className="flex items-center justify-center mb-0">
              <TabsTrigger value="daily" onClick={() => setSelectedTabs('daily')}>Daily</TabsTrigger>
              <TabsTrigger value="hourly" onClick={() => setSelectedTabs('hourly')}>Hourly</TabsTrigger>
              <TabsTrigger value="weekly" onClick={() => setSelectedTabs('weekly')}>Weekly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div>
          <h1 className="text-4xl font-bold mr-4">TECHPACK ASIA</h1>
          <div className="w-full flex justify-center">
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger className="flex items-center text-nowrap gap-2 border border-gray-250 rounded-lg px-2 py-2">
                  <span className="text-sm">{dateRange?.from?.toLocaleDateString()} - {dateRange?.to?.toLocaleDateString() || 'Select Date Range'}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="range"
                    // Limit the selectable date range to a maximum of 14 days
                    disabled={(date) => {
                      if (!dateRange?.from) return false;
                      const from = dateRange.from;
                      // If selecting a "to" date, ensure it's within 14 days of "from"
                      const maxRange = 13 * 24 * 60 * 60 * 1000; // 13 days in ms (from + 13 = 14 days inclusive)
                      return Math.abs(date.getTime() - from.getTime()) > maxRange;
                    }}
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
        <Tabs value={selectedTabs} className="w-full" id="andon-tabs">
            
            <TabsContent value="daily">
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
                    </TabsContent>
                    <TabsContent value="hourly">
                      <div className="w-full space-y-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                              HOURLY STATUS TREND
                              <div className="w-48">
                                <Select value={uap} onValueChange={(value) => setUap(value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select UAP" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ALL">ALL</SelectItem>
                                    <SelectItem value="BASIC">BASIC</SelectItem>
                                    <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                                    <SelectItem value="LEAN">LEAN</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Click a bar to view machine details at that hour
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer config={chartConfig} className="h-[280px] w-full">
                              <BarChart
                                accessibilityLayer
                                data={hourlyChartData}
                                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                                onClick={(data) => {
                                  if (data && data.activePayload && data.activePayload[0]) {
                                    const hourData = data.activePayload[0].payload;
                                    setSelectedHour(selectedHour === hourData.hour_start ? null : hourData.hour_start);
                                  }
                                }}
                              >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                  dataKey="hour_start"
                                  tickLine={true}
                                  axisLine={true}
                                  minTickGap={24}
                                  tickFormatter={(value) => {
                                    const dt = new Date(value);
                                    return dt.toLocaleString('en-US', {
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      hour12: false,
                                    });
                                  }}
                                />
                                <YAxis />
                                <ChartTooltip
                                  content={<ChartTooltipContent indicator="dashed" />}
                                  labelFormatter={(value) => {
                                    const dt = new Date(value);
                                    return dt.toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false,
                                    });
                                  }}
                                />
                                <Legend />
                                <Bar dataKey="green" stackId="status" fill="#22c55e" />
                                <Bar dataKey="yellow" stackId="status" fill="#eab308" />
                                <Bar dataKey="red" stackId="status" fill="#ef4444" />
                                <Bar dataKey="orange" stackId="status" fill="#f97316" />
                                <Bar dataKey="purple" stackId="status" fill="#a855f7" />
                                <Bar dataKey="blue" stackId="status" fill="#3b82f6" />
                                <Bar dataKey="white" stackId="status" fill="#d1d5db" />
                                <Bar dataKey="grey" stackId="status" fill="#6b7280" />
                              </BarChart>
                            </ChartContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                              {selectedHour
                                ? `DETAIL ${new Date(selectedHour).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  })}`
                                : 'SELECT AN HOUR TO VIEW DETAILS'}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="max-h-[340px] overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Machine ID</TableHead>
                                    <TableHead className="text-xs">Number</TableHead>
                                    <TableHead className="text-xs">Location</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs text-right">Duration (min)</TableHead>
                                    <TableHead className="text-xs text-right">Duration (hour)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedHour && selectedHourlyRows.length > 0 ? (
                                    selectedHourlyRows.map((row) => (
                                      <TableRow key={`${row.MchID}-${row.StatusLight}-${row.HourStart}`}>
                                        <TableCell className="text-xs">{row.MchID}</TableCell>
                                        <TableCell className="text-xs">{row.MchNumber}</TableCell>
                                        <TableCell className="text-xs">{row.MchLoc}</TableCell>
                                        <TableCell className="text-xs">{row.StatusLight}</TableCell>
                                        <TableCell className="text-xs text-right">{Number(row.DurationMinutes).toFixed(2)}</TableCell>
                                        <TableCell className="text-xs text-right">{Number(row.DurationHour).toFixed(4)}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={6} className="text-center text-muted-foreground text-xs">
                                        Select an hour from chart to view machine-by-status details
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    <TabsContent value="weekly">
                      <div className="w-full">
                        <Card>
                          <CardContent>
                            <div className="flex justify-end mb-4 w-48 mt-4">
                              <Select onValueChange={(value) => setUap(value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select UAP" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ALL">ALL</SelectItem>
                                  <SelectItem value="BASIC">BASIC</SelectItem>
                                  <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                                  <SelectItem value="LEAN">LEAN</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="mt-6">
                              {/* Chart */}
                              <ChartContainer
                                config={chartConfig}
                                className="h-[250px] w-full aspect-auto"
                              >

                              <BarChart
                                accessibilityLayer
                                data={weeklyChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                barCategoryGap={80}
                              >
                                <CartesianGrid strokeDasharray="3 3" strokeLinecap="butt" />
                                <XAxis dataKey="week" tickFormatter={(value) => {
                                  return value.split(' ')[0];
                                }} />
                                <YAxis />
                                <ChartTooltip
                                      cursor={true}
                                      content={<ChartTooltipContent indicator="dashed" />}
                                      formatter={(value, name, item, index, payload) => {
                                        return <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                          <span>{(item.value as number).toFixed(1)+'%'}</span>
                                        </div>
                                      }}
                                      />
                                <Legend />
                                <Bar dataKey="Breakdown" fill="#f59e42" className="cursor-pointer" onClick={(data, index) => setSelectedWeeklyDetail({ week: data.week, color: 'Breakdown' })} />
                                <Bar dataKey="PlannedStoppage" fill="#d1d5db" className="cursor-pointer" onClick={(data, index) => setSelectedWeeklyDetail({ week: data.week, color: 'PlannedStoppage' })}/>
                                <Bar dataKey="MicroStop" fill="#fde047" className="cursor-pointer" onClick={(data, index) => setSelectedWeeklyDetail({ week: data.week, color: 'MicroStop' })}/>
                                <Bar dataKey="NonQuality" fill="#f43f5e" className="cursor-pointer" onClick={(data, index) => setSelectedWeeklyDetail({ week: data.week, color: 'NonQuality' })}/>
                                <Bar dataKey="OrgDisfunction" fill="#a78bfa" className="cursor-pointer" onClick={(data, index) => setSelectedWeeklyDetail({ week: data.week, color: 'OrgDisfunction' })}/>
                                <Bar dataKey="SMED" fill="#38bdf8" className="cursor-pointer" onClick={(data, index) => setSelectedWeeklyDetail({ week: data.week, color: 'SMED' })}/>
                                <Bar dataKey="Unclassified" fill="#6b7280" className="cursor-pointer" onClick={(data, index) => setSelectedWeeklyDetail({ week: data.week, color: 'Other' })}/>
                              </BarChart>
                              </ChartContainer>
                            </div>
                            {/* Machine List */}
                            {selectedWeeklyDetail && (
                              <Card className="mt-4">
                                <CardHeader>
                                  <CardTitle>
                                    Machines for {selectedWeeklyDetail.color === 'Other' ? 'Unclassified' : selectedWeeklyDetail.color} in week {selectedWeeklyDetail.week}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px] overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Machine Number</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Tonage</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>UAP</TableHead>
                                        <TableHead>{selectedWeeklyDetail.color === 'Other' ? 'Unclassified' : selectedWeeklyDetail.color} %</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {weeklyAndon
                                        .filter(
                                          m =>
                                            m.week === selectedWeeklyDetail.week &&
                                            Number(m[selectedWeeklyDetail.color as keyof WeeklyTrend]) > 0
                                        )
                                        .sort((a, b) => {
                                          if(a[selectedWeeklyDetail.color as keyof WeeklyTrend] < b[selectedWeeklyDetail.color as keyof WeeklyTrend]) return 1;
                                          if(a[selectedWeeklyDetail.color as keyof WeeklyTrend] > b[selectedWeeklyDetail.color as keyof WeeklyTrend]) return -1;
                                          if(a.MchLoc < b.MchLoc) return -1;
                                          if(a.MchLoc > b.MchLoc) return 1;
                                          if(a.MchNumber < b.MchNumber) return -1;
                                          if(a.MchNumber > b.MchNumber) return 1;
                                          return 0;
                                        })
                                        .map(m => (
                                          <TableRow key={m.MchNumber+m.MchLoc+ selectedWeeklyDetail.week + selectedWeeklyDetail.color}>
                                            <TableCell>{m.MchNumber}</TableCell>
                                            <TableCell>{m.MchDesc}</TableCell>
                                            <TableCell>{m.MchTon}</TableCell>
                                            <TableCell>{m.MchLoc}</TableCell>
                                            <TableCell>{m.UAP}</TableCell>
                                            <TableCell>
                                              {((m[selectedWeeklyDetail.color as keyof WeeklyTrend] as number) * 100).toFixed(1)}%
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      }
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                    </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}

