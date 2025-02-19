"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calculator, Database, SprayCan, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"


export default function AdminUI() {
      const [user, setUser] = useState('');
      const router = useRouter()
      useEffect(() => {
          // Retrieve user data from local storage
          const userData = localStorage.getItem('user') || ''
          if (userData) {
            setUser(userData);
          }
        }, []);
  

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
    <div>
    <h2 className="text-2xl font-bold tracking-tight">Welcome {user}!</h2>
    <h3>Which menu do you want to go? <em>{user ? null : '(login to get more access)'}</em></h3>
    <div className="grid grid-cols-5 py-4 gap-4">
    <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer" onClick={() => {router.push("/countboard")}}>
        <CardContent
            className="text-center pt-6"
        >
            <Label style={{   cursor:"pointer", fontFamily:"sans-serif", fontWeight:"bold"}}
            className="flex items-center justify-center gap-4"><Calculator/>Countboard</Label>
        </CardContent>
    </Card>
    <Card className="flex items-center justify-center  hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer" onClick={() => {router.push("/countboard/uv")}}>
        <CardContent
            className="text-center pt-6"
        >
            <Label style={{   cursor:"pointer", fontFamily:"sans-serif", fontWeight:"bold"}}
            className="flex items-center justify-center gap-4"><SprayCan/>Countboard UV</Label>
        </CardContent>
    </Card>
    <Card className="flex items-center justify-center  hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer" onClick={() => {router.push("/ems")}}>
        <CardContent
            className="text-center pt-6"
        >
            <Label style={{   cursor:"pointer", fontFamily:"sans-serif", fontWeight:"bold"}}
            className="flex items-center justify-center gap-4"><Zap/>EMS</Label>
        </CardContent>
    </Card>
    {!user ? null :  <Card className="flex items-center justify-center  hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer" onClick={() => {router.push("/master-data")}}>
        <CardContent
            className="text-center pt-6"
        >
            <Label style={{   cursor:"pointer", fontFamily:"sans-serif", fontWeight:"bold"}}
            className="flex items-center justify-center gap-4"><Database/>Master Data</Label>
        </CardContent>
    </Card>}
    </div>

    </div>
    <p className="text-muted-foreground pt-2 fixed bottom-4 left-1/2 transform -translate-x-1/2 cursor-pointer" onClick={() => window.open("https://dzulfikar.com", "_blank")}>
        developed by <strong>Albea IT</strong>
    </p>
    </div>
  )
}