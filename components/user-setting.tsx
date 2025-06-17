"use client"

import * as React from "react"
import { User } from "lucide-react"


import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useRouter, usePathname } from 'next/navigation'
import { useState } from "react"

export function UserSetting() {

  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('user') || '';
    }
    return '';
  });


  const handleLogout = () => {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
    localStorage.clear();

    window.dispatchEvent(new CustomEvent("storage"))
    const pathName = window.location.pathname
    const params = window.location.search || '' 
    window.location.href = `/admin/login?redirect=${pathName}${params || ''}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={user  ? "default" : "outline"} size="icon" className="items-center justify-center align-middle mb-2">
        {
          user  ? <p className="text-xs items-center justify-center align-middle">{user.charAt(0).toUpperCase()}</p> :  <User/> 
        }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          Setting
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLogout()} >
        {user ? "Logout" : "Login"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
