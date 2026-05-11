"use client"
import CountboardDashboardAssm from "@/components/countboard-dashboard-assembly"
import { Suspense } from "react"

export default function CountboardAssembly() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      <CountboardDashboardAssm />
    </div>
    </Suspense>
  )
}
