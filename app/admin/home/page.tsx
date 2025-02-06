'use client'
import { useEffect, useState } from "react";

export default function Landing() {
    const [user, setUser] = useState({ firstName: '', lastName: '' });
    useEffect(() => {
        // Retrieve user data from local storage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData) {
          setUser(userData);
        }
      }, []);

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome {user.firstName} {user.lastName} !</h2>
            <p className="text-muted-foreground pt-2">
                developed by Albea Indonesia 
            </p>
            </div>
            </div>
            
    )
}