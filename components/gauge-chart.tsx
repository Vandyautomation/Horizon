"use client"

import { useEffect, useRef } from "react"

interface GaugeChartProps {
  value: number
  label: string
  color?: string
}

export function GaugeChart({ value, label, color = "#3b82f6" }: GaugeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set up the gauge properties
    const centerX = canvas.width / 2
    const centerY = canvas.height * 0.65
    const radius = Math.min(canvas.width, canvas.height) * 0.4

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw the gauge background
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, 0)
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 15
    ctx.stroke()

    // Draw the value arc
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + (value / 100) * Math.PI)
    ctx.strokeStyle = color
    ctx.lineWidth = 15
    ctx.stroke()

    // Draw the value text
    ctx.fillStyle = "#000000"
    ctx.font = "bold 24px Inter"
    ctx.textAlign = "center"
    ctx.fillText(`${value}%`, centerX, centerY)

    // Draw the label
    ctx.fillStyle = "#6b7280"
    ctx.font = "14px Inter"
    ctx.textAlign = "center"
    ctx.fillText(label, centerX, centerY + 25)
  }, [value, label, color])

  return <canvas ref={canvasRef} width={200} height={150} className="w-full" />
}

