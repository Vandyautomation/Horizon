"use client"

import CountboardDashboardUvManagement from "@/components/countboard-dashboard-uv-management"
import { Suspense } from "react"

export default function CountboardUvManagement() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      <CountboardDashboardUvManagement />
    </div>
    </Suspense>
  )
}
