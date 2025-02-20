"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"


export default function MasterData() {
    const router = useRouter()

  

  return (
    <div className="h-1/2 grid grid-cols-3 p-4 gap-4 ">
    <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer" onClick={() => {router.push("/master-data/coois")}}>
        <CardContent
            className="text-center"
        >
            <Label style={{  fontSize:"1.5rem", cursor:"pointer", fontFamily:"sans-serif", fontWeight:"bold"}}>UPLOAD COOIS</Label>
        </CardContent>
    </Card>
   
    <Card className="flex items-center justify-center  hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer" onClick={() => {router.push("/master-data/routing")}}>
        <CardContent
            className="text-center"
        >
            <Label style={{  fontSize:"1.5rem", cursor:"pointer", fontFamily:"sans-serif", fontWeight:"bold"}}>UPLOAD ROUTING</Label>
        </CardContent>
    </Card>
    </div>
  )
}