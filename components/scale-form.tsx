"use client"

import useSWR, { mutate } from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, PlusCircle, Search } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScaleRun } from "./scale-run"
import { Decimal } from "decimal.js"
import ErrorState from "./ui/error-state"
import LoadingState from "./ui/loading-state"
import { toast } from "sonner"

// API fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

type Task = {
  taskId: number
  poNumber: string
  materialNumber: string
  status: string
  totalConsumption: Decimal
  createdDate: Date
  scaleAsset: string
  scaleAssetId: number
}

type PoNumber = {
    poNumbers : string
}

type ScaleAssets = {
    scaleAssetsName : string
    scaleAssetId : number
}

type NewTasks = {
    poNumber : PoNumber["poNumbers"]
    scaleAssetId : ScaleAssets["scaleAssetId"]
}

export default function ScaleForm() {
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<DateRange | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<number>(-1)

  const [selectedPO, setSelectedPO] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<string | "">("")

  // Fetch tasks using SWR
  const { data: tasks, error, isLoading } = useSWR<Task[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/tasks`, fetcher,  { refreshInterval: 5000 })


  // Fetch available PO numbers for the select
  const { data: poNumbers } = useSWR<PoNumber[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/po-numbers`, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  // Fetch available scale assets for the select
  const { data: scaleAssets } = useSWR<ScaleAssets[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/scale-assets`, fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
  const refetchTasks = () => mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/tasks`);

  const refetchPONumbers = () => mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/po-numbers`);
  const refetchScaleAssets = () => mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/scale-assets`);

  const handleCreateTask = async () => {
    if (newTask.poNumber && newTask.scaleAssetId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            poNumber: newTask.poNumber,
            scaleAssetId: newTask.scaleAssetId,
          }),
        })

        if (!response.ok) {
          // Attempt to extract the server's error message
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to create task`;
  
          throw new Error(errorMessage);
        }
        // Revalidate the tasks data
        await mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/tasks`)
        setIsDialogOpen(false)
        setNewTask({ poNumber: "", scaleAssetId: -1 })
        toast.success(`Task created successfully!`);
      } catch (error) {
        toast.error((error as Error).message);
        console.error('Failed to create task:', error)
      }
    }
  }

  const [newTask, setNewTask] = useState<NewTasks>({
    poNumber: "",
    scaleAssetId: -1,
  })

  if (isLoading) return <LoadingState message="Loading tasks..." />
  if (error) return <ErrorState message="Error loading tasks. Please try again later." />

  // Filter tasks based on search term and date range
  const filteredTasks = tasks?.filter(task =>
    (task.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.materialNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!date?.from || new Date(task.createdDate) >= date.from) &&
    (!date?.to || new Date(task.createdDate) <= date.to)
  ) || []

  const handleCardClick = (scaleAsset: string, taskId: number, poNumber: string) => {
    setSelectedAsset(scaleAsset)
    setSelectedTaskId(taskId)
    setSelectedPO(poNumber)
  }

  return (
    <div className="container mx-auto p-4">
      {selectedPO ? (
        <ScaleRun taskId={selectedTaskId} scaleAsset={selectedAsset} onBack={() => {refetchTasks(); setSelectedPO(null)}} />
      ) : (
        <>
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search PO or Material Number"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {refetchPONumbers(); refetchScaleAssets()}} className="w-full md:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    Select PO number & Scale that you want to create
                </DialogDescription>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="poNumber" className="text-left">
                      PO Number
                    </Label>
                    <Select  onValueChange={(value) => setNewTask({ ...newTask, poNumber: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue  placeholder="Select PO Number" />
                      </SelectTrigger>
                      <SelectContent>
                        {poNumbers?.map((po) => (
                          <SelectItem key={po.poNumbers} value={po.poNumbers}>
                            {po.poNumbers}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="scaleAsset" className="text-left">
                      Scale Asset
                    </Label>
                    <Select onValueChange={(value) => setNewTask({ ...newTask, scaleAssetId: Number(value) })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select Scale Asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {scaleAssets?.map((asset) => (
                          <SelectItem key={asset.scaleAssetsName} value={String(asset.scaleAssetId)}>
                            {asset.scaleAssetsName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateTask}>Create Task</Button>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <Card key={task.taskId} className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={() => handleCardClick(task.scaleAsset, task.taskId, task.poNumber)}>
                <CardHeader className="pb-0">
                  <CardTitle>{task.poNumber}</CardTitle>
                  <CardDescription>{task.materialNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-1">
                    <Badge
                      className={task.status === "RUN" ? "bg-green-400" : task.status === "COMPLETE" ? "bg-blue-400" : ""}
                      variant={task.status === "RUN" ? "outline" : task.status === "PAUSE" ? "destructive" : task.status === "NEW" ? "default" : "destructive"}
                    >
                      {task.status}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium">Total Consumption</p>
                      <p className="text-2xl font-bold">{task.totalConsumption.toFixed(2).toString()} gr</p>
                      <p className="text-sm font-medium">{task.scaleAsset}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Created: {format(new Date(task.createdDate), "MMM dd, yyyy")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}