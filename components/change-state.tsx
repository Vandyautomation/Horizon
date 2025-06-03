"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"

interface StateChange {
  ID: string
  Color: string
  AdjustedStatusDate: string
}

interface TooltipInfo {
  from: StateChange
  to: StateChange
  duration: string
  x: number
  y: number
}

interface ChangeStateProps {
  data: StateChange[] | undefined
}

export default function ChangeState({ data }: ChangeStateProps) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  // Sort data by date
  const sortedData = [...(data || [])].sort(
    (a, b) => new Date(a.AdjustedStatusDate).getTime() - new Date(b.AdjustedStatusDate).getTime()
  )
  const calculateShiftStartTime = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 14) {
      return new Date(date.setHours(6, 0, 0, 0));
    } else if (hour >= 14 && hour < 22) {
      return new Date(date.setHours(14, 0, 0, 0));
    } else {
      return new Date(date.setHours(22, 0, 0, 0));
    }
  };
  const calculateShiftEndTime = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 14) {
      return new Date(date.setHours(14, 0, 0, 0));
    } else if (hour >= 14 && hour < 22) {
      return new Date(date.setHours(22, 0, 0, 0));
    } else {
      return new Date(date.setHours(6, 0, 0, 0));
    }
  }

  const startTime = calculateShiftStartTime(new Date(sortedData[0].AdjustedStatusDate));
  const endTime = calculateShiftEndTime(new Date(sortedData[sortedData.length - 1].AdjustedStatusDate));
  const totalDuration = endTime.getTime() - startTime.getTime()

  const getColorClass = (color: string) => {
    switch (color) {
      case "GREEN":
        return "bg-green-500"
      case "ORANGE":
        return "bg-orange-500"
      case "YELLOW":
        return "bg-yellow-500"
      case "PURPLE":
        return "bg-purple-500"
      case "BLUE":
        return "bg-blue-500"
      case "WHITE":
        return "bg-white"
      case "RED":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getColorTextClass = (color: string) => {
    switch (color) {
      case "GREEN":
        return "text-green-500"
      case "ORANGE":
        return "text-orange-500"
      case "YELLOW":
        return "text-yellow-500"
      case "PURPLE":
        return "text-purple-500"
      case "BLUE":
        return "text-blue-500"
      case "WHITE":
        return "text-primary"
      case "RED":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const calculateDuration = (from: Date, to: Date) => {
    const diff = to.getTime() - from.getTime()
    const minutes = Math.floor(diff / 1000 / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      const mins = minutes % 60
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }

    return `${minutes} minutes`
  }

  const handleMouseMove = (e: React.MouseEvent, change: StateChange, nextChange: StateChange) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = rect.top + window.scrollY

    setTooltip({
      from: change,
      to: nextChange,
      duration: calculateDuration(new Date(change.AdjustedStatusDate), new Date(nextChange.AdjustedStatusDate)),
      x,
      y,
    })
  }

  const segments = sortedData.map((change, index) => {
    const nextChange = sortedData[index + 1]
    if (!nextChange) return null

    const start = new Date(change.AdjustedStatusDate)
    const end = new Date(nextChange.AdjustedStatusDate)
    const segmentWidth = ((end.getTime() - start.getTime()) / totalDuration) * 100

    return (
      <div
        key={change.ID}
        className={`h-full ${getColorClass(change.Color)} relative `}
        style={{ width: `${segmentWidth*2}%` }}
        onMouseMove={(e) => handleMouseMove(e, change, nextChange)}
        onMouseLeave={() => setTooltip(null)}
      >
      </div>
    )
  })

  return (
    <div className="w-full mx-auto py-2 px-4">
      <div className="space-y-2">
        <div className="relative">
          <div className="h-12 flex w-full">{segments}</div>

          {tooltip && (
            <div
              className="fixed bg-white border rounded-lg shadow-lg p-3 z-10 transition-transform duration-150 ease-out"
              style={{
                left: `${tooltip.x}px`,
                bottom: `90px`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="space-y-1 text-sm">
                <p className={`${getColorTextClass(tooltip.from.Color)}`}>{tooltip.from.Color}</p>
                <p>
                  <span className="font-medium">From: </span>
                  {format(new Date(new Date(parseISO(tooltip.from.AdjustedStatusDate)).getTime() - 7 * 60 * 60 * 1000), "HH:mm:ss")}
                </p>
                <p>
                  <span className="font-medium">To: </span>
                  {format(new Date(new Date(parseISO(tooltip.to.AdjustedStatusDate)).getTime() - 7 * 60 * 60 * 1000), "HH:mm:ss")}
                </p>
                <p>
                  <span className="font-medium">Duration: </span>
                  {tooltip.duration}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-2 text-lg text-gray-600">
            {Array.from({ length: 17 }).map((_, i) => {
              const time = new Date(startTime)
              time.setMinutes(time.getMinutes() + i * 30)
              return <span key={i}>{format(time, "HH:mm")}</span>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

