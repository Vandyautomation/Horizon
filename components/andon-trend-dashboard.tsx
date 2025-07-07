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
interface Machine {
  id: string;
  position: any;
  rotation: any;
  MchID: string;
  MchDesc: string;
  MchLoc: string;
  MchNumber: string;
  Tonage: string;
  consumption: number;
  cycletime: number;
  target_cycletime: number;
  cavity: number;
  target_cavity: number;
  oee: number;
  ooe: number;
  timestamp: string; // ISO string UTC or ''
  status:
    | 'GREEN'
    | 'WHITE'
    | 'BLUE'
    | 'ORANGE'
    | 'PURPLE'
    | 'RED'
    | 'YELLOW'
    | 'GREY';
}

interface Building {
  id: number;
  name: string;
  oee: number;
  ooe: number;
  machines: Machine[];
}

interface Andon {
  ID: number;
  MchID: string;
  MchNumber: number;
  MchLoc: string;
  AdjustedStatusDate: string;
  Color: string;
}

const statusLabels = {
  GREEN: "Running",
  WHITE: "Planned Stop",
  BLUE: "Changeover",
  ORANGE: "Breakdown",
  RED: "Non Quality",
  PURPLE: "Org Dysfunction",
  YELLOW: "Micro Stop",
  GREY: "Unclassified",
};

const statusColors = {
  GREEN: "#22c55e",
  WHITE: "#9ca3af",
  BLUE: "#3b82f6",
  ORANGE: "#ffa500",
  RED: "#ef4444",
  PURPLE: "#a855f7",
  YELLOW: "yellow",
  GREY: "#6b7280",
};

// Group machines by building code (MchLoc)
function groupByBuilding(machines: Machine[]) {
  return machines.reduce((acc: Record<string, Machine[]>, machine: Machine) => {
    const loc = machine.MchLoc || 'Unknown';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(machine);
    return acc;
  }, {});
}

// Count statuses for a group of machines
function countStatuses(machines: Machine[]) {
  const statusTypes = ['GREEN', 'WHITE', 'BLUE', 'ORANGE', 'RED', 'PURPLE', 'YELLOW', 'GREY'];
  const counts: Record<string, number> = {};
  statusTypes.forEach(status => counts[status] = 0);
  machines.forEach(m => {
    if (counts[m.status] !== undefined) counts[m.status]++;
  });
  return counts;
}

const chartConfig = {
  GREEN: {
    label: "GREEN",
    color: "var(--chart-1)",
  },
  WHITE: {
    label: "WHITE",
    color: "var(--chart-2)",
  },
  BLUE: {
    label: "BLUE",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export default function AndonTrendDashboard() {
  const [buildings, setBuildings] = useState<Building[] | undefined>(undefined);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [, setMqttClient] = useState<ReturnType<typeof mqtt.connect> | null>(null);
  const [refreshTime, setRefreshTime] = useState('')
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 9),
    to: new Date(2025, 5, 26),
  })

  const [selectedCard, setSelectedCard] = useState<Building | undefined>(undefined);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 900, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });



  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return; // Don't start drag if clicking resize handle
    }
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      if (resizeDirection?.includes('e')) {
        newWidth = Math.max(400, resizeStart.width + deltaX);
      }
      if (resizeDirection?.includes('w')) {
        const newWidth = Math.max(400, resizeStart.width - deltaX);
        setPosition(prev => ({ ...prev, x: position.x + (resizeStart.width - newWidth) }));
      }
      if (resizeDirection?.includes('s')) {
        newHeight = Math.max(300, resizeStart.height - deltaY);
      }
      if (resizeDirection?.includes('n')) {
        const newHeight = Math.max(300, resizeStart.height + deltaY);
        setPosition(prev => ({ ...prev, y: position.y + (resizeStart.height - newHeight) }));
      }

      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, resizeDirection]);

  // Add useEffect for escape key handling
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedCard) {
        setSelectedCard(undefined);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedCard]);




  const key = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/state/all?date_from=${dateRange?.from?.toISOString()}&date_to=${dateRange?.to?.toISOString()}`;
  const { data: rawAndon, error } = useSWR<Andon[]>(
    key, 
    async (url) => {
      const promise = fetch(url).then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      });
      
      toast.promise(promise, {
        loading: 'Refreshing machine status database...',
        error: 'Failed to load andon data'
      });

      setRefreshTime(new Date().toLocaleTimeString())
      
      return promise;
    },
    {
      refreshInterval: 90000,
    }
  );

  const chartData = rawAndon?.map(item => ({
    AdjustedStatusDate: item.AdjustedStatusDate,
    Color: item.Color,
    MchID: item.MchID,
  }));


  return (
    <div className="w-full h-full ">
      <div className="flex items-center justify-between">
        <Image src={albeaLogo} alt="Albea" width={200} height={100} className="px-3 py-2 flex items-center border border-gray-250 rounded-xl text-gray-700 align-middle bg-white"/>
        <h1 className="text-4xl font-bold mr-4">ANDON OVERALL DASHBOARD</h1>
        <div>
        <h1 className="text-4xl font-bold mr-4">TECHPACK ASIA</h1>
        <Popover>
          <PopoverTrigger className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 cursor-pointer" />
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


        </div>
        </div>
        <div className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>ANDON TREND</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart accessibilityLayer data={rawAndon || []}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="AdjustedStatusDate"
                    tickLine={true}
                    tickMargin={10}
                    axisLine={true}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <Bar dataKey="Color" fill="var(--color-desktop)" radius={4} />
                  <Bar dataKey="MchID" fill="var(--color-mobile)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

        </div>

          {selectedCard && (
        <Card 
          className="absolute w-[700px] h-[500px] z-20 overflow-scroll"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            width: `${size.width}px`,
            height: `${size.height}px`,
            left: '1rem',
            bottom: '1rem'
          }}
        >
          <CardHeader 
            className="sticky top-0 bg-white z-10 p-4 border-b pb-0"
            onMouseDown={handleMouseDown}
          >
            <CardTitle className="flex justify-between items-center cursor-move mb-4">
              {selectedCard.machines.length > 0 && new Set(selectedCard.machines.map(m => m.MchLoc)).size > 1 ? (
                <>All Buildings - Status {statusLabels[selectedCard.machines[0].status as keyof typeof statusLabels]} ({selectedCard.machines.length} machines)</>
              ) : (
                <>{selectedCard.name} Status {statusLabels[selectedCard.machines[0].status as keyof typeof statusLabels]} ({selectedCard.machines.length} machines)</>
              )}
              <Button
                variant="default"
                onClick={() => setSelectedCard(undefined)}
              >
                <strong>X</strong>
              </Button>
            </CardTitle>
            <Table className="p-0">
              <TableHeader className="p-0">
                <TableRow>
                  <TableHead className="w-[200px]">Machine</TableHead>
                  <TableHead className="w-[100px]">Mch Number</TableHead>
                  <TableHead className="w-[100px]">Mch Loc</TableHead>
                  <TableHead className="w-[100px]">MchTonage</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[180px]">Last Status Changed</TableHead>
                  <TableHead className="w-[100px]">Countboard</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 gap-4">
              {/* Resize handles */}
              <div className="resize-handle absolute top-0 right-0 w-2 h-2 cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, 'e')} />
              <div className="resize-handle absolute bottom-0 right-0 w-2 h-2 cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, 'se')} />
              <div className="resize-handle absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
              <div className="resize-handle absolute top-0 left-0 w-2 h-2 cursor-nw-resize" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
              <div className="resize-handle absolute top-0 left-1/2 w-2 h-2 cursor-n-resize" onMouseDown={(e) => handleResizeStart(e, 'n')} />
              <div className="resize-handle absolute bottom-0 left-1/2 w-2 h-2 cursor-s-resize" onMouseDown={(e) => handleResizeStart(e, 's')} />
              <div className="resize-handle absolute top-1/2 left-0 w-2 h-2 cursor-w-resize" onMouseDown={(e) => handleResizeStart(e, 'w')} />
              <div className="resize-handle absolute top-1/2 right-0 w-2 h-2 cursor-e-resize" onMouseDown={(e) => handleResizeStart(e, 'e')} />
              <Table>
                <TableBody>
                  {selectedCard.machines.map(machine => {
                    return (
                      <TableRow key={machine.MchID}>
                        <TableCell className="w-[200px]">{machine.MchDesc}</TableCell>
                        <TableCell className="w-[100px]">{machine.MchNumber}</TableCell>
                        <TableCell className="w-[100px]">{machine.MchLoc}</TableCell>
                        <TableCell className="w-[100px]">{machine.Tonage}</TableCell>
                        <TableCell className="w-[120px]" style={{ color: statusColors[machine.status as keyof typeof statusColors] }}>
                          {statusLabels[machine.status as keyof typeof statusLabels]}
                        </TableCell>
                        <TableCell className="w-[180px]">
                          {machine.timestamp !== ''
                            ? (() => {
                                const timestamp = new Date(machine.timestamp);
                                const now = new Date();
                                const diffMs = now.getTime() - timestamp.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffHours = Math.floor(diffMins / 60);
                                const diffDays = Math.floor(diffHours / 24);
                                
                                if (diffMins < 60) {
                                  return `${diffMins} minutes ago`;
                                } else if (diffHours < 24) {
                                  const remainingMins = diffMins % 60;
                                  return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${remainingMins > 0 ? remainingMins + ' minutes' : ''} ago`;
                                } else if (diffDays < 30) {
                                  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                } else if (machine.timestamp === '1970-01-01T00:00:00.000Z') {
                                  return 'Never';
                                }
                                else {
                                  return timestamp.toLocaleString();
                                }
                              })()
                            : <span className="text-muted-foreground italic"> {">"} {(() => {
                                const targetDate = new Date('2025-05-26T12:15:00');
                                const now = new Date();
                                const diffMs = now.getTime() - targetDate.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffHours = Math.floor(diffMins / 60);
                                const diffDays = Math.floor(diffHours / 24);
                                
                                if (diffMins < 60) {
                                  return `${diffMins} minutes`;
                                } else if (diffHours < 24) {
                                  const remainingMins = diffMins % 60;
                                  return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${remainingMins > 0 ? remainingMins + ' minutes' : ''}`;
                                } else {
                                  return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                                }
                              })()} ago</span>}
                        </TableCell>
                        <TableCell className="w-[100px]">
                          <Button
                            onClick={() => {
                              window.open(
                                `/admin/countboard/?machineNumber=${machine.MchNumber}&location=${machine.MchLoc}`,
                                '_blank'
                              );
                            }}
                          >
                            <Calculator />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      </div>
  );
}

