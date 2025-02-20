"use client"

import ShopfloorDashboard from "@/components/shopfloor-dashboard"
import { Suspense } from "react"


export default function Andon() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      
      <ShopfloorDashboard />
    </div>
    </Suspense>
  )
}
