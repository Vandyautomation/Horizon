"use client"


import ShopfloorUvDashboard from "@/components/shopfloor-uv-dashboard"
import { Suspense } from "react"


export default function AndonUv() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      
      <ShopfloorUvDashboard />
    </div>
    </Suspense>
  )
}
