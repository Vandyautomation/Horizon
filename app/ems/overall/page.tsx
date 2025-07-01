"use client"

import EmsDashboardOverall from "@/components/ems-dashboard-overall"
import { Suspense } from "react"


export default function Ems() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      
      <EmsDashboardOverall />
    </div>
    </Suspense>
  )
}
