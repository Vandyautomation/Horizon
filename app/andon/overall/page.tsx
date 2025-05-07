"use client"


import AndonOverallDashboard from "@/components/andon-overall-dashboard"
import { Suspense } from "react"


export default function AndonOverall() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      
      <AndonOverallDashboard />
    </div>
    </Suspense>
  )
}
