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
  data: StateChange[]
}

export default function ChangeState({ data }: ChangeStateProps) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  // Sort data by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.AdjustedStatusDate).getTime() - new Date(b.AdjustedStatusDate).getTime()
  )

  const startTime = new Date(sortedData[0].AdjustedStatusDate)
  const endTime = new Date(sortedData[sortedData.length - 1].AdjustedStatusDate)
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
        return "text-white"
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
    const y = rect.bottom + window.scrollY

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
        className={`h-full ${getColorClass(change.Color)} relative`}
        style={{ width: `${segmentWidth}%` }}
        onMouseMove={(e) => handleMouseMove(e, change, nextChange)}
        onMouseLeave={() => setTooltip(null)}
      />
    )
  })

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Change State</h2>

        <div className="relative">
          <div className="h-8 flex">{segments}</div>

          {tooltip && (
            <div
              className="fixed bg-white border rounded-lg shadow-lg p-3 z-10 transition-transform duration-150 ease-out"
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y}px`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="space-y-1 text-sm">
                <p className={`${getColorTextClass(tooltip.from.Color)}`}>{tooltip.from.Color}</p>
                <p>
                  <span className="font-medium">From: </span>
                  {format(parseISO(tooltip.from.AdjustedStatusDate), "dd/MM/yyyy HH:mm:ss")}
                </p>
                <p>
                  <span className="font-medium">To: </span>
                  {format(parseISO(tooltip.to.AdjustedStatusDate), "dd/MM/yyyy HH:mm:ss")}
                </p>
                <p>
                  <span className="font-medium">Duration: </span>
                  {tooltip.duration}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-2 text-sm text-gray-600">
            {Array.from({ length: 8 }).map((_, i) => {
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

