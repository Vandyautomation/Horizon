"use client"

import EmsDashboard from "@/components/ems-dashboard"
import { Suspense } from "react"


export default function Ems() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      
      <EmsDashboard />
    </div>
    </Suspense>
  )
}
