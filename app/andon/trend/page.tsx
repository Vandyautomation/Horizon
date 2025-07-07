"use client"

import AndonTrendDashboard from "@/components/andon-trend-dashboard"
import { Suspense } from "react"


export default function AndonTrend() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      
      <AndonTrendDashboard />
    </div>
    </Suspense>
  )
}
