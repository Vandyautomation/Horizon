"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Filter, Pencil, Plus, Trash2 } from "lucide-react"
import { format, addDays, startOfDay, parseISO, isSameDay, addHours, set } from "date-fns"

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
import useSWR, { mutate } from "swr"
import { Input } from "./ui/input"
import { SearchablePOSelect } from "./searchable-select-po"
import { toast } from "react-hot-toast"
import { SearchableMachineSelect } from "./searchable-select-machine"
import { SearchableTaskCategorySelect } from "./searchable-select-task-category"

// Manufacturing schedule data
type ManufacturingDataItem = {
  uuid: string
  start_at: string
  machine_name: string
  item_name: string
  po_name: string
  UAP: string
  status: "default" | "secondary" | "destructive" | "finished" | "planned" | "outline" | "started" | "cancelled";
  end_at: string
  category: string
}

type MachineDetail = {
  machineId: number;
  machineName: string;
  machineTonage: string;
  machineDescription: string;
  machineNumber: string;
  locationId: number;
  locationName: string;
};
type TaskCategoryDetail = {
  id: number;
  uuid: string;
  name: string;
};


type PoNumber = {
  poNumber: string
  poId: number
  materialId: number
  materialName: string
}



  const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CalendarView() {

const [manufacturingData, setManufacturingData] = useState<ManufacturingDataItem[]>([])
// const [machinelistData, setMachinelistData] = useState<MachineDetail[]>([])
const [selectedPO, setSelectedPO] = useState<PoNumber | null>(null);
const [selectedMachine, setSelectedMachine] = useState<MachineDetail | null>(null);
const [selectedTaskCategory, setSelectedTaskCategory] = useState<TaskCategoryDetail | null>(null);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [mode, setMode] = useState("add");
const [selectedTaskUUID, setSelectedTaskUUID] = useState<string | null>(null);


const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    const day = today.getDay() // 0 = Sunday, 1 = Monday, ...
    // Calculate days to subtract to get to Monday (if today is Sunday, subtract -6)
    const daysToSubtract = day === 0 ? 6 : day - 1
    return startOfDay(addDays(today, -daysToSubtract))
})



// useSWR<ManufacturingDataItem[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/manufacturing-data?date=${format(startDate, "yyyy-MM-dd")}`, fetcher, {
//   onSuccess: (data) => setManufacturingData(data || []),
//   revalidateOnFocus: true,
//   revalidateOnReconnect: true,
// })

useSWR(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/tasks?week_start_at=${format(startDate, "yyyy-MM-dd")}&limit=100&page=1`, fetcher, {
  onSuccess: (data) => {
                const timezoneOffset = new Date().getTimezoneOffset() * 60000;
                const correctedData = data.data.map((item: ManufacturingDataItem) => {
                  if (item.start_at) {
                  const startAt = new Date(item.start_at);
                  startAt.setTime(startAt.getTime() + timezoneOffset);
                  item.start_at = startAt.toISOString();
                  }
                  
                  if (item.end_at) {
                  const endAt = new Date(item.end_at);
                  endAt.setTime(endAt.getTime() + timezoneOffset);
                  item.end_at = endAt.toISOString();
                  }
                  
                  return item;
                });
    setManufacturingData(correctedData || []);
  },
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
})

// useSWR<MachineDetail[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines?type=injection`, fetcher, {
//   onSuccess: (data) => setMachinelistData(data || []),
//   revalidateOnFocus: false,
//   revalidateOnReconnect: false,
// });
  


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
  const hours = Array.from({ length: 24 }, (_, i) => i)

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

  const handleAddTask = () => {
    const dateValue = (document.getElementById("date") as HTMLInputElement)?.value || "";
    // Format the date to ISO string that SQL Server can understand
    const formattedDate = dateValue ? new Date(dateValue).toISOString() : "";
    
    const newTask = {
      pro: selectedPO?.poNumber || "",
      machine_id: selectedMachine?.machineId || "",
      start_at: formattedDate,
      category_id: selectedTaskCategory?.id || "",
    };

    if (!newTask.pro || !newTask.machine_id || !newTask.start_at) {
      toast.error("Please fill in all required fields");
      return;
    }


    if (!newTask.category_id) {
      toast.error("Please select a task category");
      return;
    }
    // Check if the task already exists
    const existingTask = manufacturingData.find((task) => {
      return (
        task.po_name === newTask.pro
      )
    })

    if (existingTask) {
      toast.success("Task with the same PO already exists, will create a new task with the same PO");
    }

    toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to add task");
          }
          setIsDialogOpen(false);
          mutate(() => {
            return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/tasks?week_start_at=${format(startDate, "yyyy-MM-dd")}&limit=100&page=1`)
              .then((res) => res.json())
              .then((data) => {

                const timezoneOffset = new Date().getTimezoneOffset() * 60000;
                const correctedData = data.data.map((item: ManufacturingDataItem) => {
                  if (item.start_at) {
                  const startAt = new Date(item.start_at);
                  startAt.setTime(startAt.getTime() - timezoneOffset);
                  item.start_at = startAt.toISOString();
                  }
                  
                  if (item.end_at) {
                  const endAt = new Date(item.end_at);
                  endAt.setTime(endAt.getTime() - timezoneOffset);
                  item.end_at = endAt.toISOString();
                  }
                  
                  return item;
                });
                
                setManufacturingData(correctedData as ManufacturingDataItem[] || [])
                setSelectedPO(null);
                setSelectedMachine(null);
                setSelectedTaskCategory(null);
              })
          });
        }),
      {
        loading: "Adding task...",
        success: "Task added successfully",
        error: "Failed to add task",
      }
    );
  }

  const handleEditTask = (uuid: string) => {
    if (!uuid) {
      toast.error("Task UUID is required");
      return;
    }
    const dateValue = (document.getElementById("date") as HTMLInputElement)?.value || "";
    // Format the date to ISO string that SQL Server can understand
    const formattedDate = dateValue ? new Date(dateValue).toISOString() : "";
    
    const updatedTask = {
      pro: selectedPO?.poNumber || "",
      machine_id: selectedMachine?.machineId || "",
      start_at: formattedDate,
      category_id: selectedTaskCategory?.id || "",
    };

    if (!updatedTask.pro || !updatedTask.machine_id || !updatedTask.start_at) {
      toast.error("Please fill in all required fields");
      return;
    }


    if (!updatedTask.category_id) {
      toast.error("Please select a task category");
      return;
    }


    toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/tasks/${uuid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to add task");
          }
          setIsDialogOpen(false);
          mutate(() => {
            return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/tasks?week_start_at=${format(startDate, "yyyy-MM-dd")}&limit=100&page=1`)
              .then((res) => res.json())
              .then((data) => {

                const timezoneOffset = new Date().getTimezoneOffset() * 60000;
                const correctedData = data.data.map((item: ManufacturingDataItem) => {
                  if (item.start_at) {
                  const startAt = new Date(item.start_at);
                  startAt.setTime(startAt.getTime() - timezoneOffset);
                  item.start_at = startAt.toISOString();
                  }
                  
                  if (item.end_at) {
                  const endAt = new Date(item.end_at);
                  endAt.setTime(endAt.getTime() - timezoneOffset);
                  item.end_at = endAt.toISOString();
                  }
                  
                  return item;
                });
                
                setManufacturingData(correctedData as ManufacturingDataItem[] || [])
                setSelectedPO(null);
                setSelectedMachine(null);
                setSelectedTaskCategory(null);
              })
          });
        }),
      {
        loading: "Adding task...",
        success: "Task added successfully",
        error: "Failed to add task",
      }
    );
  }


  return (
    <div className=" w-full p-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">SMED Schedule</h1>

          <div className="flex items-center space-x-4">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {setIsDialogOpen(open); setMode("add");}}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{mode === "add" ? "Add New "  : "Edit "} Task</DialogTitle>
                  <DialogDescription>
                    {mode === "add" ? "Create new SMED task in the schedule." : "Edit SMED task in the schedule."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 w-full">
                  <div className="grid grid-cols-4 items-center gap-4 w-full">
                    <Label htmlFor="task-name" className="text-right">
                      PO Name
                    </Label>
                    <div className="col-span-3">
                    <SearchablePOSelect
                                        value={selectedPO}
                                        onValueChange={(newValue) => setSelectedPO(newValue)}
                                        type='Injection'
                                        
                                    />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item" className="text-right">
                      Material Number
                    </Label>
                    <Input
                      id="item-number"
                      type="text"
                      readOnly={true}
                      disabled={true}
                      value={selectedPO?.materialId || ""}
                      placeholder="Based on selected PO Number"
                      className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-description" className="text-right">
                      Material Description
                    </Label>
                    <Input
                      id="item-description"
                      type="text"
                      readOnly={true}
                      disabled={true}
                      value={selectedPO?.materialName || ""}
                      placeholder="Based on selected PO Number"
                      className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>


                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="machine" className="text-right">
                      Machine
                    </Label>
                    <div className="col-span-3">
                    <SearchableMachineSelect
                                        value={selectedMachine}
                                        onValueChange={(newValue) => setSelectedMachine(newValue)}
                                    />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="task-category" className="text-right">
                      Task Category
                    </Label>
                    <div className="col-span-3">
                    <SearchableTaskCategorySelect
                                        value={selectedTaskCategory}
                                        onValueChange={(newValue) => setSelectedTaskCategory(newValue)}
                                    />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="datetime" className="text-right">
                      Date & Time
                    </Label>
                    <input
                      id="date"
                      type="datetime-local"
                      defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                      className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => { mode === "add" ? handleAddTask() : handleEditTask(selectedTaskUUID || "") }}>{mode === "add" ? "Add" : "Update"} task</Button>
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
          <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50 dark:bg-slate-600 border-b sticky top-0 z-10">
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
                    <div className="max-h-[90vh] overflow-y-auto">
                      {filteredData
                        .filter(item => isSameDay(parseISO(item.start_at), day))
                        .sort((a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime())
                        .map((item, idx) => (
                          <div key={idx} className={`p-3 mx-auto mb-2 rounded-md ${getMachineColor(item.machine_name)}`}>
                            <div className="font-medium py-1 flex justify-between">{item.item_name} <div>PO{item.po_name}</div></div>
                            <div className="text-sm py-1 flex justify-between">{item.machine_name}
                            <Badge>{item.category}</Badge>
                            </div>
                            <div className="text-xs flex justify-between pt-1">{format(parseISO(item.start_at), "HH:mm")} - {format(parseISO(item.end_at), "HH:mm")} 
                              <Badge variant={item.status}>{item.status}</Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </DialogContent>
                </Dialog>
                
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Time Labels */}
            <div className="col-span-1 sticky left-0 bg-white dark:bg-slate-800 z-10">
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
                    const itemEndDate = parseISO(item.end_at)
                    const hour = itemDate.getHours()
                    const minute = itemDate.getMinutes()
                    const top = (hour) * 80 + (minute / 60) * 80
                    const duration = (itemEndDate.getTime() - itemDate.getTime()) / (1000 * 60) // Duration in minutes
                    const height = Math.max((duration / 60) * 80, 70) // Convert duration to height in pixels with a minimum height of 20px

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
                                    height: `${height}px`,
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
                                <div className="font-medium truncate">{item.item_name?.split(":")[0]}</div>
                                <div className="font-medium truncate">{item.po_name}</div>
                                <div className="truncate">{item.machine_name}</div>
                                <div className="truncate font-medium">{item.status}</div>

                            </div>
                          </TooltipTrigger>
                          </ContextMenuTrigger>
                           <ContextMenuContent>
                            {/* <ContextMenuItem onClick={() => {
                              setSelectedTaskUUID(item.uuid);
                              setSelectedPO({ poNumber: item.po_name, poId: 0, materialId: 0, materialName: item.item_name });
                              setSelectedMachine({ machineId: 0, machineName: item.machine_name, machineTonage: "", machineDescription: "", machineNumber: "", locationId: 0, locationName: "" });
                              setSelectedTaskCategory({ id: 0, uuid: "", name: item.category });
                              setMode("edit");
                              setIsDialogOpen(true);
                            }}>
                              <Pencil className="h-4 w-4 mr-2 mb-2"/>Edit
                            </ContextMenuItem> */}
                            <ContextMenuItem className="bg-red-600 text-white"
                            onClick={() => {
                              toast.custom((t) => (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm mx-auto">
                                  <h3 className="font-medium mb-2">Confirm Deletion</h3>
                                  <p className="text-sm mb-4">Are you sure you want to delete this task?</p>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => toast.dismiss()}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      onClick={() => {
                                        toast.dismiss();
                                        toast.promise(
                                          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/tasks/${item.uuid}`, {
                                            method: "DELETE",
                                          })
                                            .then((response) => {
                                              if (!response.ok) throw new Error("Failed to delete task");
                                              mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/tasks?week_start_at=${format(startDate, "yyyy-MM-dd")}&limit=100&page=1`);
                                            }),
                                          {
                                            loading: "Deleting task...",
                                            success: "Task deleted successfully",
                                            error: "Failed to delete task"
                                          }
                                        );
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              ))
                            }}
                            ><Trash2 className="h-4 w-4 mr-2"/>Delete</ContextMenuItem>
                        </ContextMenuContent>
                          <TooltipContent className="max-w-sm">
                            <div className="space-y-1">
                              <p className="font-medium">{item.item_name}</p>
                              <p className="text-sm">{item.machine_name}</p>
                              <p className="text-medium">{item.category}</p>
                              <p className="text-xs">{format(itemDate, "HH:mm")} - {format(itemEndDate, "HH:mm")}</p>
                              <p className="text-xs">{item.status}</p>
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
                          <div className="text-sm">{item.status}</div>
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

