"use client"
import type React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SidebarInset, SidebarProvider } from "./ui/sidebar"
import SidebarLeft from "./sidebar-left"
import PageHeader from "./page-header"
import { Suspense } from "react"

function LayoutContentWithParams({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const hideUI = searchParams.get('hideUI') === 'true'

    const handleMenuClick = (component:string) => {
        router.push(`/${component}`);
      };

    return (
        <SidebarProvider>
        {!hideUI && <SidebarLeft onMenuClick={handleMenuClick}/>}
        <SidebarInset>
        {!hideUI && <PageHeader onMenuClick={handleMenuClick} currentPage={pathname}/>}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-2">{children}</main>
        </SidebarInset>
    </SidebarProvider>
    )
}

export default function LayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        }>
            <LayoutContentWithParams>{children}</LayoutContentWithParams>
        </Suspense>
    )
}