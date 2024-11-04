"use client"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import Users from "./users/page"
import SidebarLeft from "@/components/sidebar-left"
import PageHeader from "@/components/page-header"
import Roles from "./users/roles/page"
import { useState } from "react"
import Landing from "./home/page"
import Locations from "./users/locations/page"
import ScaleForm from "@/components/scale-form"
import Countboard from "../countboard/page"

export default function AdminUI() {
  
  const [activeComponent, setActiveComponent] = useState("home");

  // Function to handle menu item clicks
  const handleMenuClick = (component:string) => {
    setActiveComponent(component);
  };

  return (
    <SidebarProvider>
        <SidebarLeft onMenuClick={handleMenuClick}/>
        <SidebarInset>
        <PageHeader onMenuClick={handleMenuClick} currentPage={activeComponent} />
        {activeComponent === "home" && <Landing />}
        {activeComponent === "users" && <Users />}
        {activeComponent === "roles" && <Roles />}
        {activeComponent === "locations" && <Locations />}
        {activeComponent === "scale" && <ScaleForm />}
        {activeComponent === "countboard" && <Countboard />}


        </SidebarInset>
    </SidebarProvider>
  )
}