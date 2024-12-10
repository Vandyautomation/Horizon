"use client"
import CountboardDashboard from "@/components/countboard-dashboard"
import { Suspense } from "react"

export default function Countboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      <CountboardDashboard />
    </div>
    </Suspense>
  )
}
