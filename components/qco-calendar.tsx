"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react"
import { format, addDays, startOfDay, parseISO, isSameDay, addHours } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "./ui/badge"
import useSWR from "swr"

// Manufacturing schedule data
type ManufacturingDataItem = {
  start_at: string
  machine_name: string
  item_name: string
  po_name: string
  UAP: string
}



  const fetcher = (url: string) => fetch(url).then((res) => res.json())
export default function CalendarView() {



const [manufacturingData, setManufacturingData] = useState<ManufacturingDataItem[]>([])
const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    const day = today.getDay() // 0 = Sunday, 1 = Monday, ...
    // Calculate days to subtract to get to Monday (if today is Sunday, subtract -6)
    const daysToSubtract = day === 0 ? 6 : day - 1
    return startOfDay(addDays(today, -daysToSubtract))
})

useSWR<ManufacturingDataItem[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/manufacturing-data?date=${format(startDate, "yyyy-MM-dd")}`, fetcher, {
  onSuccess: (data) => setManufacturingData(data || []),
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
})


// Extract unique machine types for filtering
const getMachineTypes = () => {
  const machineTypes = new Set()
  manufacturingData.forEach((item) => {
    const machineType = item.machine_name.split(" ")[1] // Extract the type (BPR, PRE, LEA)
    machineTypes.add(machineType)
  })
  return Array.from(machineTypes)
}

// Extract unique machine brands for filtering
const getMachineBrands = () => {
  const machineBrands = new Set()
  manufacturingData.forEach((item) => {
    const parts = item.machine_name.split(" ")
    if (parts.length >= 3) {
      machineBrands.add(parts[2]) // Extract the brand (MITSUBISHI, BORCHE, JSW, etc.)
    }
  })
  return Array.from(machineBrands)
}

// Get color based on machine name
const getMachineColor = (machineName: any) => {
  if (machineName.includes("BPR")) return "bg-blue-100 border-blue-300 hover:bg-blue-200"
  if (machineName.includes("PRE")) return "bg-green-100 border-green-300 hover:bg-green-200"
  if (machineName.includes("LEA")) return "bg-purple-100 border-purple-300 hover:bg-purple-200"
  return "bg-gray-100 border-gray-300 hover:bg-gray-200"
}

// Get text color based on machine name
const getMachineTextColor = (machineName: any) => {
  if (machineName.includes("BPR")) return "text-blue-800"
  if (machineName.includes("PRE")) return "text-green-800"
  if (machineName.includes("LEA")) return "text-purple-800"

  return "text-gray-800"
}
  // Find the earliest and latest dates in the data
  const dates = manufacturingData.map((item) => parseISO(item.start_at))
  const earliestDate = dates.reduce((a, b) => (a < b ? a : b), dates[0])
  const latestDate = dates.reduce((a, b) => (a > b ? a : b), dates[0])

  // Set initial view to start from the earliest date in the data


  // Filters
  const [filters, setFilters] = useState({
    machineTypes: getMachineTypes().reduce<Record<string, boolean>>((acc, type) => ({ ...acc, [type as string]: true }), {}),
    machineBrands: getMachineBrands().reduce<Record<string, boolean>>((acc, brand) => ({ ...acc, [brand as string]: true }), {}),
  })

  // Inside your component
useEffect(() => {
  if (manufacturingData.length > 0) {
    setFilters({
      machineTypes: getMachineTypes().reduce<Record<string, boolean>>(
        (acc, type) => ({ ...acc, [type as string]: true }),
        {}
      ),
      machineBrands: getMachineBrands().reduce<Record<string, boolean>>(
        (acc, brand) => ({ ...acc, [brand as string]: true }),
        {}
      ),
    })
  }
}, [manufacturingData])


  // Generate days for the calendar view (7 days)
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

  // Hours for the day view (6:00 to 23:00)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6)

  // Filter data based on selected filters
  const filteredData = manufacturingData.filter((item) => {
    const machineType = item.machine_name.split(" ")[1]
    const parts = item.machine_name.split(" ")
    const machineBrand = parts.length >= 3 ? parts[2] : ""

    return filters.machineTypes[machineType] //&& filters.machineBrands[machineBrand]
    // return manufacturingData
  })

  // Navigate to previous week
  const previousWeek = () => {
    setStartDate((prevDate) => addDays(prevDate, -7))
  }

  // Navigate to next week
  const nextWeek = () => {
    setStartDate((prevDate) => addDays(prevDate, 7))
  }

  // Toggle machine type filter
  const toggleMachineType = (type: any) => {
    setFilters((prev) => ({
      ...prev,
      machineTypes: {
        ...prev.machineTypes,
        [type]: !prev.machineTypes[type],
      },
    }))
  }

  // Toggle machine brand filter
  // const toggleMachineBrand = (brand: any) => {
  //   setFilters((prev) => ({
  //     ...prev,
  //     machineBrands: {
  //       ...prev.machineBrands,
  //       [brand]: !prev.machineBrands[brand],
  //     },
  //   }))
  // }

  return (
    <div className=" w-full p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">SMED Schedule</h1>

          <div className="flex items-center space-x-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>
                    Create a new SMED task in the schedule.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="task-name" className="text-right">
                      Task Name
                    </Label>
                    <input
                      id="task-name"
                      className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="machine" className="text-right">
                      Machine
                    </Label>
                    <select
                      id="machine"
                      className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                    >
                      {manufacturingData.map((item, index) => (
                        <option key={index} value={item.machine_name}>
                          {item.machine_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Date & Time
                    </Label>
                    <input
                      id="date"
                      type="datetime-local"
                      className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>


            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>

                  <div className="flex flex-wrap gap-2">
                {Object.entries(filters.machineTypes)
                    .filter(([_, isSelected]) => isSelected)
                    .map(([type]) => (
                        <Badge key={type} variant="outline" className="text-sm">
                            {type}
                        </Badge>
                    ))}
            </div>
                </Button>
                
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Machine Types</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getMachineTypes().map((type: any) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={filters.machineTypes[type]}
                            onCheckedChange={() => toggleMachineType(type)}
                          />
                          <Label htmlFor={`type-${type}`}>{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* <div className="space-y-2">
                    <h4 className="font-medium">Machine Brands</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getMachineBrands().map((brand: any) => (
                        <div key={brand} className="flex items-center space-x-2">
                          <Checkbox
                            id={`brand-${brand}`}
                            checked={filters.machineBrands[brand]}
                            onCheckedChange={() => toggleMachineBrand(brand)}
                          />
                          <Label htmlFor={`brand-${brand}`}>{brand}</Label>
                        </div>
                      ))}
                    </div>
                  </div> */}
                </div>
              </PopoverContent>
            </Popover>

            

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={previousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-primary">
                {format(startDate, "MMM d")} - {format(addDays(startDate, 6), "MMM d, yyyy")}
              </span>
              <Button variant="outline" size="icon" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="flex flex-wrap gap-3 mb-2">
          <div className="text-sm font-medium">Machine Legend:</div>
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">BASIC</div>
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-800">PREMIUM</div>
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">LEAN</div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50 dark:bg-slate-600 border-b">
            <div className="p-2 border-r"></div>
            {days.map((day, index) => (
              <div
                key={index}
                className={`p-2 text-center font-medium border-r ${isSameDay(day, new Date()) ? "bg-blue-50 dark:bg-blue-900" : "dark:bg-slate-600"}`}
              >
                <p className="text-primary">{format(day, "EEE")}</p>
                <p className="text-primary">{format(day, "MMM d")}</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-1">
                      {filteredData.filter(item => isSameDay(parseISO(item.start_at), day)).length} tasks
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tasks for {format(day, "MMMM d, yyyy")}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                      {filteredData
                        .filter(item => isSameDay(parseISO(item.start_at), day))
                        .sort((a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime())
                        .map((item, idx) => (
                          <div key={idx} className={`p-3 mb-2 rounded-md ${getMachineColor(item.machine_name)}`}>
                            <div className="font-medium">{item.item_name}</div>
                            <div className="text-sm">{item.machine_name}</div>
                            <div className="text-xs">{format(parseISO(item.start_at), "HH:mm")}</div>
                          </div>
                        ))}
                    </div>
                  </DialogContent>
                </Dialog>
                
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Time Labels */}
            <div className="col-span-1">
              {hours.map((hour) => (
                <div key={hour} className="h-20 border-b border-r p-1 text-xs text-right pr-2">
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Days */}
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="col-span-1 relative">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={`h-20 border-b border-r ${isSameDay(day, new Date()) ? "bg-blue-50/30" : ""}`}
                  ></div>
                ))}

                {/* Events */}
                {filteredData
                  .filter((item) => {
                    const itemDate = parseISO(item.start_at)
                    return isSameDay(itemDate, day)
                  })
                  .map((item, index) => {
                    const itemDate = parseISO(item.start_at)
                    const hour = itemDate.getHours()
                    const minute = itemDate.getMinutes()
                    const top = (hour - 6) * 80 + (minute / 60) * 80

                    return (
                      <TooltipProvider key={index}>
                        <Tooltip>
                            <ContextMenu>
                                <ContextMenuTrigger asChild>
                          <TooltipTrigger asChild>
                            <div
                                className={`absolute left-0 right-0 mx-1 p-1 text-xs border rounded-md cursor-pointer ${getMachineColor(item.machine_name)} ${getMachineTextColor(item.machine_name)}`}
                                style={{
                                    top: `${top}px`,
                                    height: "70px",
                                    width: (() => {
                                        // Find overlapping events (same day and time range overlap)
                                        const overlaps = filteredData.filter(other => {
                                            const otherDate = parseISO(other.start_at);
                                            return isSameDay(otherDate, itemDate) && 
                                                         Math.abs(otherDate.getHours() - itemDate.getHours()) < 1 &&
                                                         other !== item;
                                        });
                                        
                                        if (overlaps.length === 0) return "calc(100% - 8px)";
                                        
                                        // Calculate position in the overlapping group
                                        const position = overlaps.findIndex(e => 
                                            e.machine_name.localeCompare(item.machine_name) > 0
                                        ) + 1;
                                        
                                        // Width based on number of overlapping events
                                        const width = 100 / (overlaps.length + 1);
                                        
                                        // Left position based on index in overlapping group
                                        const left = width * position;
                                        
                                        return `calc(${width}% - 8px)`;
                                    })(),
                                    left: (() => {
                                        const overlaps = filteredData.filter(other => {
                                            const otherDate = parseISO(other.start_at);
                                            return isSameDay(otherDate, itemDate) && 
                                                         Math.abs(otherDate.getHours() - itemDate.getHours()) < 1 &&
                                                         other !== item;
                                        });
                                        
                                        if (overlaps.length === 0) return "4px";
                                        
                                        const position = overlaps.findIndex(e => 
                                            e.machine_name.localeCompare(item.machine_name) > 0
                                        ) + 1;
                                        
                                        const width = 100 / (overlaps.length + 1);
                                        const left = width * position;
                                        
                                        return `calc(${left}% + 4px)`;
                                    })(),
                                }}
                            >
                                <div className="font-medium truncate">{item.item_name.split(":")[0]}</div>
                                <div className="truncate">{item.machine_name}</div>
                            </div>
                          </TooltipTrigger>
                          </ContextMenuTrigger>
                           <ContextMenuContent>
                            <ContextMenuItem>Edit</ContextMenuItem>
                            {/* <ContextMenuItem>Delete</ContextMenuItem> */}
                        </ContextMenuContent>
                          <TooltipContent className="max-w-sm">
                            <div className="space-y-1">
                              <p className="font-medium">{item.item_name}</p>
                              <p className="text-sm">{item.machine_name}</p>
                              <p className="text-xs">{format(itemDate, "MMM d, yyyy HH:mm")}</p>
                            </div>
                          </TooltipContent>
                          </ContextMenu>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>

        {/* List View for Mobile */}
        <div className="md:hidden mt-4">
          <h2 className="text-lg font-medium mb-2">Schedule List</h2>
          <div className="space-y-2">
            {days.map((day, dayIndex) => {
              const dayEvents = filteredData.filter((item) => {
                const itemDate = parseISO(item.start_at)
                return isSameDay(itemDate, day)
              })

              if (dayEvents.length === 0) return null

              return (
                <Card key={dayIndex} className="overflow-hidden">
                  <div className="bg-gray-50 p-2 font-medium border-b">{format(day, "EEEE, MMMM d, yyyy")}</div>
                  <div className="divide-y">
                    {dayEvents
                      .sort((a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime())
                      .map((item, index) => (
                        <div key={index} className={`p-3 ${getMachineColor(item.machine_name)}`}>
                          <div className="font-medium">{item.item_name}</div>
                          <div className="text-sm">{item.machine_name}</div>
                          <div className="text-xs">{format(parseISO(item.start_at), "HH:mm")}</div>
                        </div>
                      ))}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

