"use client"

import AndonTrendkDashboard from "@/components/andon-trendk-dashboard"
import { Suspense } from "react"

export default function AndonTrendk() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex justify-between space-y-2">
        <AndonTrendkDashboard />
      </div>
    </Suspense>
  )
}
