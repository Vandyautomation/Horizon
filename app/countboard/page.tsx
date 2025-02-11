"use client"
import CountboardDashboard from "@/components/countboard-dashboard"
import { Button } from "@/components/ui/button"
import { Suspense, use } from "react"
import { useRouter } from "next/navigation"
import { SprayCan } from "lucide-react"

export default function Countboard() {
  const router = useRouter();
  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex justify-between space-y-2">
      
      <CountboardDashboard />
    </div>
    </Suspense>
  )
}
