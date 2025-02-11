"use client"
import CountboardDashboardUv from "@/components/countboard-dashboard-uv"
import { Suspense } from "react"

export default function CountboardUv() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      <CountboardDashboardUv />
    </div>
    </Suspense>
  )
}
