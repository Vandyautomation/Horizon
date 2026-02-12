"use client"

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DeviceStatus = {
  id: string;
  buildingId: string;
  deviceId: string;
  fwVersion?: string;
  rssi?: number;
  lastSeen: number;
  progress?: number;
  status: string;
};

type OtaProgressTableProps = {
  devices: DeviceStatus[];
};

function getBadge(status: string) {
  if (status === "online") return <Badge variant="ok">online</Badge>;
  if (status === "ota_requested") return <Badge>requested</Badge>;
  if (status === "ota_downloading") return <Badge variant="started">downloading</Badge>;
  if (status === "ota_progress") return <Badge variant="started">updating</Badge>;
  if (status === "ota_success_ack") return <Badge className="bg-green-700">success</Badge>;
  if (status === "ota_failed") return <Badge variant="destructive">failed</Badge>;
  if (status === "offline") return <Badge variant="destructive">offline</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function OtaProgressTable({ devices }: OtaProgressTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>FW Version</TableHead>
          <TableHead>Last Seen</TableHead>
          <TableHead>Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-sm">
              Waiting for device updates...
            </TableCell>
          </TableRow>
        ) : (
          devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell className="font-medium">
                {device.buildingId}/{device.deviceId}
              </TableCell>
              <TableCell>{getBadge(device.status)}</TableCell>
              <TableCell>{device.fwVersion ?? "-"}</TableCell>
              <TableCell>{new Date(device.lastSeen).toLocaleString()}</TableCell>
              <TableCell className="min-w-[180px]">
                {typeof device.progress === "number" ? (
                  <div className="flex flex-col gap-1">
                    <Progress value={device.progress} />
                    <span className="text-xs text-muted-foreground">
                      {device.progress}%
                    </span>
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
