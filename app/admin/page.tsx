"use client"

import { useEffect, useState } from "react"


export default function AdminUI() {
      const [user, setUser] = useState('');
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
    <h1 className="text-xl pt-2 tracking-tight">Select Menu on the Sidebar</h1>

    <p className="text-muted-foreground pt-2">
        developed by Albea IT 
    </p>
    </div>
    </div>
  )
}