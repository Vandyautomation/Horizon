"use client"
import { Button } from "@/components/ui/button"
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
import { CalendarIcon, Paperclip, RefreshCw } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { SearchablePOSelect } from "./searchable-select-po"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"



const THRESHOLD_1 = 100; // First threshold
const THRESHOLD_2_PERCENTAGE = 0.98; // 98% of target

const samplePONumbers = Array.from({ length: 20 }, (_, i) => `PO-${(1000 + i).toString().padStart(4, '0')}`)

export default function CountboardDashboard() {
  const hourlyData = [
    { time: "14:00", itemNo: "1263810", target: 123, actual: 26, delta: -97, scrap: 0, rework: 0, causes: 'Machine startup delay', comments: 'Adjusted parameters' },
    { time: "15:00", itemNo: "1263810", target: 148, actual: 82, delta: -66, scrap: 0, rework: 0, causes: 'Material shortage', comments: 'Restocked supplies' },
    { time: "16:00", itemNo: "1263810", target: 148, actual: 46, delta: -102, scrap: 0, rework: 0, causes: 'Unexpected downtime', comments: 'Maintenance check scheduled' },
    { time: "17:00", itemNo: "1263810", target: 148, actual: 101, delta: -47, scrap: 0, rework: 0, causes: '', comments: '' },
    { time: "18:00", itemNo: "1263810", target: 148, actual: 145, delta: -3, scrap: 0, rework: 0, causes: '', comments: 'Production rate improved' },
    { time: "19:00", itemNo: "1263810", target: 148, actual: 150, delta: 2, scrap: 0, rework: 0, causes: '', comments: 'Exceeded target' },
    { time: "20:00", itemNo: "", target: 0, actual: 0, delta: 0, scrap: 0, rework: 0, causes: '', comments: '' },
    { time: "21:00", itemNo: "", target: 0, actual: 0, delta: 0, scrap: 0, rework: 0, causes: '', comments: '' },
  ]

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState({ index: -1, type: '', content: '' })
  const [currentMachine, setCurrentMachine] = useState("INJ BPR 04 JSW 220T")
  const [currentCVT, setCurrentCVT] = useState(1)
  const [isPODialogOpen, setIsPODialogOpen] = useState(false)
  const [isCVTDialogOpen, setIsCVTDialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState("")
  const [editedCVT, setEditedCVT] = useState(currentCVT)


  const handleCellClick = (index: number, type: 'causes' | 'comments', content: string) => {
    setSelectedComment({ index, type, content })
    setIsDialogOpen(true)
  }

  const handleCommentSave = () => {
    // Here you would typically update your data source
    console.log('Saving comment:', selectedComment)
    setIsDialogOpen(false)
  }

  const getBarColor = (actual: number, target: number) => {
    if (actual >= target) return 'bg-green-500';
    if (actual >= target * THRESHOLD_2_PERCENTAGE) return 'bg-green-500';
    return 'bg-red-500';
  }

  const handlePOAttach = () => {
    console.log('Attaching PO:', selectedPO, 'to machine:', currentMachine)
    setIsPODialogOpen(false)
  }

  const handleCVTUpdate = () => {
    setCurrentCVT(editedCVT)
    console.log('Updated CVT to:', editedCVT)
    setIsCVTDialogOpen(false)
  }

  const [date, setDate] = useState<DateRange | undefined>()

  return (
    <div className="p-4 space-y-4 w-full">
      <div className="flex flex-wrap gap-2">

        <Select defaultValue="INJ Bld G">
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INJ Bld G">INJ Bld G</SelectItem>
            <SelectItem value="INJ Bld H">INJ Bld H</SelectItem>

          </SelectContent>
        </Select>

        <Select defaultValue="4" >
          <SelectTrigger className="w-[60px]">
            <SelectValue placeholder="MchNumber"  />
          </SelectTrigger>
          <SelectContent >
            <SelectItem  value="4">4</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="INJ BPR 04 JSW 220T">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Machine Name" />
          </SelectTrigger>
          <SelectContent >
            <SelectItem value="INJ BPR 04 JSW 220T">INJ BPR 04 JSW 220T</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="2">
          <SelectTrigger className="w-[60px]">
            <SelectValue placeholder="Shift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
          </SelectContent>
        </Select>

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
                    <span>Shift Selector</span>
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
      </div>

      <div className="flex gap-2 md:grid-cols-2 lg:grid-cols-4 text-center h-24">
        <Card className="p-0">
          <CardHeader className="py-2 text-sm font-medium">Production Status</CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-600">344</div>
              <div className="text-sm text-muted-foreground">Actual</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">721</div>
              <div className="text-sm text-muted-foreground">Target</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">-377</div>
              <div className="text-sm text-muted-foreground">Gap</div>
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => setIsCVTDialogOpen(true)}>
          <CardHeader className="py-2 text-sm font-medium">Cavities</CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">4</div>
              <div className="text-sm text-muted-foreground">Actual</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4</div>
              <div className="text-sm text-muted-foreground">Target</div>
            </div>
          </CardContent>
        </Card>

        <Card>
         <CardHeader className="py-2 text-sm font-medium">Cycle Time</CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">34.4s</div>
              <div className="text-sm text-muted-foreground">Actual</div>
            </div>
            <div>
              <div className="text-2xl font-bold">34.4s</div>
              <div className="text-sm text-muted-foreground">Target</div>
            </div>
          </CardContent>
        </Card>

        <Card>
         <CardHeader className="py-2 text-sm font-medium text-red-500">Non O.O.E</CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div>
              <div className="text-2xl font-bold text-red-500">14.9%</div>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="py-2 text-sm font-medium">Performance Metrics</CardHeader>
          <CardContent className="grid grid-cols-6 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-600">85.1%</div>
              <div className="text-sm text-muted-foreground">OK</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">0.0</div>
              <div className="text-sm text-muted-foreground">NQ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">0.1</div>
              <div className="text-sm text-muted-foreground">SD</div>
            </div>
            <div>
              <div className="text-2xl font-bold">1.0</div>
              <div className="text-sm text-muted-foreground">PS</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">0.0</div>
              <div className="text-sm text-muted-foreground">C/O</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">0.2</div>
              <div className="text-sm text-muted-foreground">OP</div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                {hourlyData.map((row, index) => (
                  <TableRow key={row.time}>
                    <TableCell>{row.time}</TableCell>
                    <TableCell>{row.itemNo}</TableCell>
                    <TableCell className="text-center">{row.target}</TableCell>
                    <TableCell className="relative overflow-hidden">
                    <div className="flex items-center h-8 w-full">


                        {/* Actual progress bar */}
                        <div
                        className={`absolute inset-0 h-full rounded ${getBarColor(row.actual, row.target)}`}
                        style={{
                            width: `${Math.min((row.actual / 150) * 100, 100)}%`, // Limit to 100%
                            maxWidth: "250px",
                        }}
                        />

                        {/* Target marker */}
                        <div
                        className="absolute inset-0  h-full w-px bg-green-500"
                        style={{
                            left: `${Math.min((row.target / 150) * 100, 100)}%`, // Limit to 100%
                        }}
                        />

                        {/* Threshold marker */}
                        <div
                        className="absolute inset-0 h-full w-px bg-yellow-500"
                        style={{
                            left: `${Math.min(((row.target * THRESHOLD_2_PERCENTAGE) / 150) * 100, 100)}%`, // Limit to 100%
                        }}
                        />

                        {/* Actual value text */}
                        <span className="relative z-10 ml-2">{row.actual}</span>
                    </div>
                    </TableCell>

                    <TableCell className={row.delta >= 0 ? "text-green-600" : "text-red-600"}>{row.delta}</TableCell>
                    <TableCell>{row.scrap}</TableCell>
                    <TableCell>{row.rework}</TableCell>
                    <TableCell className="w-24">
                      {row.time === "14:00" && (
                        <div className="flex flex-col gap-0.5">
                          <div className="w-1 h-1 bg-red-500" />
                          <div className="w-1 h-1 bg-red-500" />
                          <div className="w-1 h-1 bg-red-500" />
                          <div className="w-1 h-1 bg-red-500" />
                          <div className="w-1 h-1 bg-red-500" />
                          <div className="w-1 h-1 bg-red-500" />
                        </div>
                      )}
                      {row.time === "15:00" && (
                        <div className="flex flex-col gap-0.5">
                          <div className="w-1 h-1 ml-2 bg-purple-500" />
                          <div className="w-1 h-1 ml-2 bg-purple-500" />
                          <div className="w-1 h-1 ml-2 bg-purple-500" />
                          <div className="w-1 h-1 ml-2 bg-purple-500" />
                          <div className="w-1 h-1 ml-2 bg-purple-500" />
                          <div className="w-1 h-1 ml-2 bg-purple-500" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={() => handleCellClick(index, 'causes', row.causes)}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{row.causes || 'N/A'}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{row.causes ? 'Click to edit causes' : 'Click to add causes'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell onClick={() => handleCellClick(index, 'comments', row.comments)}>
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
                <Input id="machine" value={currentMachine} readOnly />
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
            <DialogDescription className="p-0 m-0">Update cavity of this machine</DialogDescription>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-cvt">Current CVT</Label>
                <Input id="current-cvt" value={currentCVT} readOnly />
              </div>
              <div>
                <Label htmlFor="new-cvt">New CVT</Label>
                <Input
                  id="new-cvt"
                  type="number"
                  value={editedCVT}
                  onChange={(e) => setEditedCVT(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCVTUpdate}>Update CVT</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}