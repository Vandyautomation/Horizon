"use client"

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmsSettingPage() {
  return (
    <div className="flex h-full flex-col gap-6 p-2">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">EMS Setting</h2>
        <p className="text-sm text-muted-foreground">
          Select a section to manage devices and OTA operations.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/ems_setting/device-management" className="block">
          <Card className="h-full hover:border-primary/60">
            <CardHeader>
              <CardTitle className="text-base">Device Management</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage device inventory and assignments.
            </CardContent>
          </Card>
        </Link>
        <Link href="/ems_setting/ota" className="block">
          <Card className="h-full hover:border-primary/60">
            <CardHeader>
              <CardTitle className="text-base">OTA Fleet Update</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Monitor fleet status and deploy firmware updates.
            </CardContent>
          </Card>
        </Link>
        <Link href="/ems_setting/network-health" className="block">
          <Card className="h-full hover:border-primary/60">
            <CardHeader>
              <CardTitle className="text-base">Network Health</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Review connectivity and signal quality trends.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
