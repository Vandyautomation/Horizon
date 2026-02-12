"use client"

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMqttClient } from "@/lib/mqtt";
import { toast } from "react-hot-toast";

type DeviceState = {
  id: string;
  fwVersion?: string;
  rssi?: number;
  lastSeen: number;
  progress?: number;
  isUpdating?: boolean;
};

type FirmwareInfo = {
  size: number;
  updatedAt: string;
} | null;

const OFFLINE_AFTER_MS = 2 * 60 * 1000;

function formatBytes(bytes?: number) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function formatTimestamp(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function EmsOtaDashboard() {
  const [devices, setDevices] = useState<Record<string, DeviceState>>({});
  const [now, setNow] = useState(() => Date.now());
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [latestInfo, setLatestInfo] = useState<FirmwareInfo>(null);
  const [previousInfo, setPreviousInfo] = useState<FirmwareInfo>(null);
  const [deploying, setDeploying] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [deployTarget, setDeployTarget] = useState<
    "single" | "building" | "global"
  >("building");
  const [selectedBuilding, setSelectedBuilding] = useState("g");
  const [selectedDevice, setSelectedDevice] = useState("");

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const client = getMqttClient();
    const topics = ["ems/esp/g/+/status", "ems/esp/g/+/ota/status"];
    client.subscribe(topics);

    const handleMessage = (topic: string, payload: any) => {
      const text = payload.toString();
      let data: Record<string, any> | null = null;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error("MQTT payload parse error:", error);
        return;
      }

      const parts = topic.split("/");
      const topicDevice = parts.length >= 5 ? parts[3] : undefined;
      const deviceId = data.device || topicDevice;
      if (!deviceId) return;

      setDevices((prev) => {
        const existing = prev[deviceId] ?? {
          id: deviceId,
          lastSeen: Date.now(),
        };
        const next: DeviceState = {
          ...existing,
          lastSeen: Date.now(),
        };

        if (typeof data.fwVersion === "string") {
          next.fwVersion = data.fwVersion;
        }
        if (typeof data.rssi === "number") {
          next.rssi = data.rssi;
        }
        if (typeof data?.wifi?.rssi === "number") {
          next.rssi = data.wifi.rssi;
        }

        if (data.type === "ota_progress") {
          next.isUpdating = true;
          if (typeof data.progress === "number") {
            next.progress = data.progress;
            if (data.progress >= 100) {
              next.isUpdating = false;
            }
          }
        }

        if (data.status === "online") {
          next.isUpdating = false;
        }

        return { ...prev, [deviceId]: next };
      });
    };

    client.on("message", handleMessage);

    return () => {
      client.off("message", handleMessage);
      client.unsubscribe(topics);
    };
  }, []);

  const deviceList = useMemo(
    () =>
      Object.values(devices).sort((a, b) =>
        a.id.localeCompare(b.id, "en", { numeric: true })
      ),
    [devices]
  );

  const buildingOptions = useMemo(() => {
    const set = new Set<string>();
    deviceList.forEach((device) => {
      const parts = device.id.split("-");
      const building = parts.length >= 2 ? parts[1] : "";
      if (building) {
        set.add(building);
      }
    });
    if (set.size === 0) {
      set.add("g");
    }
    return Array.from(set);
  }, [deviceList]);

  const deviceOptions = useMemo(() => {
    return deviceList.map((device) => {
      const parts = device.id.split("-");
      const building = parts.length >= 2 ? parts[1] : "";
      const suffix = parts.length >= 3 ? parts.slice(2).join("-") : device.id;
      return {
        id: device.id,
        building: building || "g",
        suffix,
        label: `${building || "g"}/${suffix}`,
      };
    });
  }, [deviceList]);

  const summary = useMemo(() => {
    let total = 0;
    let online = 0;
    let offline = 0;
    let updating = 0;
    let warning = 0;

    deviceList.forEach((device) => {
      total += 1;
      const isOffline = now - device.lastSeen > OFFLINE_AFTER_MS;
      if (isOffline) {
        offline += 1;
        return;
      }
      online += 1;
      if (device.isUpdating) {
        updating += 1;
      }
      if (typeof device.rssi === "number" && device.rssi < -75) {
        warning += 1;
      }
    });

    return { total, online, offline, updating, warning };
  }, [deviceList, now]);

  const getStatusLabel = (device: DeviceState) => {
    const isOffline = now - device.lastSeen > OFFLINE_AFTER_MS;
    if (isOffline) return "offline";
    if (device.isUpdating) return "updating";
    if (typeof device.rssi === "number" && device.rssi < -75) return "weak";
    return "online";
  };

  const getStatusBadge = (status: string) => {
    if (status === "online") {
      return <Badge variant="ok">online</Badge>;
    }
    if (status === "updating") {
      return <Badge variant="started">updating</Badge>;
    }
    if (status === "weak") {
      return (
        <Badge className="border-transparent bg-yellow-500 text-black">
          weak
        </Badge>
      );
    }
    return <Badge variant="destructive">offline</Badge>;
  };

  const loadFirmwareInfo = async () => {
    const fetchInfo = async (url: string): Promise<FirmwareInfo> => {
      const res = await fetch(url, { method: "HEAD" });
      if (!res.ok) return null;
      const size = Number(res.headers.get("content-length") || 0);
      const updatedAt = res.headers.get("last-modified") || "";
      return { size, updatedAt };
    };

    const [latest, previous] = await Promise.all([
      fetchInfo("/api/firmware"),
      fetchInfo("/api/firmware/previous"),
    ]);
    setLatestInfo(latest);
    setPreviousInfo(previous);
  };

  useEffect(() => {
    loadFirmwareInfo().catch((error) => {
      console.error("Failed to load firmware info:", error);
    });
  }, []);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a firmware .bin file.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }
      toast.success("Firmware uploaded.");
      setFile(null);
      await loadFirmwareInfo();
    } catch (error: any) {
      toast.error(error?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      if (deployTarget === "single" && !selectedDevice) {
        throw new Error("Select a device target first.");
      }
      if (deployTarget === "building" && !selectedBuilding) {
        throw new Error("Select a building target first.");
      }

      const payload: {
        target: "single" | "building" | "global";
        buildingId?: string;
        deviceId?: string;
      } = {
        target: deployTarget,
      };

      if (deployTarget === "single") {
        const matched = deviceOptions.find((item) => item.id === selectedDevice);
        payload.buildingId = matched?.building || selectedBuilding;
        payload.deviceId = matched?.suffix || selectedDevice;
      } else if (deployTarget === "building") {
        payload.buildingId = selectedBuilding;
      }

      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Deploy failed");
      }
      toast.success(`Deploy sent: ${data?.deployedTo || "unknown target"}`);
    } catch (error: any) {
      toast.error(error?.message || "Deploy failed");
    } finally {
      setDeploying(false);
    }
  };

  const handleRollback = async () => {
    setRollingBack(true);
    try {
      const res = await fetch("/api/rollback", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Rollback failed");
      }
      toast.success("Rollback command sent.");
    } catch (error: any) {
      toast.error(error?.message || "Rollback failed");
    } finally {
      setRollingBack(false);
    }
  };

  const handleRestart = (deviceId: string) => {
    try {
      const client = getMqttClient();
      client.publish(
        `ems/esp/g/${deviceId}/cmd`,
        JSON.stringify({ cmd: "restart" })
      );
      toast.success(`Restart sent to ${deviceId}`);
    } catch (error) {
      toast.error("Failed to send restart command.");
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 p-2">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          OTA Fleet Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitor ESP32 fleet status and deploy firmware updates for Building G.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-muted-foreground">
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary.total}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-muted-foreground">
              Online / Offline
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary.online} / {summary.offline}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-muted-foreground">
              Updating
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary.updating}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-muted-foreground">
              RSSI Warning
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary.warning}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Firmware Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="firmware">Firmware (.bin)</Label>
              <Input
                id="firmware"
                type="file"
                accept=".bin"
                onChange={(event) =>
                  setFile(event.target.files ? event.target.files[0] : null)
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Firmware"}
              </Button>
              <Button
                variant="outline"
                onClick={loadFirmwareInfo}
                disabled={uploading}
              >
                Refresh Info
              </Button>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex flex-wrap justify-between gap-2">
                <span>Latest: latest.bin</span>
                <span>
                  {latestInfo
                    ? `${formatBytes(latestInfo.size)} | ${formatTimestamp(
                        latestInfo.updatedAt
                      )}`
                    : "Not available"}
                </span>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <span>Previous: previous.bin</span>
                <span>
                  {previousInfo
                    ? `${formatBytes(previousInfo.size)} | ${formatTimestamp(
                        previousInfo.updatedAt
                      )}`
                    : "Not available"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deploy Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Update Target</Label>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deployTarget"
                    value="single"
                    checked={deployTarget === "single"}
                    onChange={() => setDeployTarget("single")}
                  />
                  Single Device
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deployTarget"
                    value="building"
                    checked={deployTarget === "building"}
                    onChange={() => setDeployTarget("building")}
                  />
                  All Building Devices
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deployTarget"
                    value="global"
                    checked={deployTarget === "global"}
                    onChange={() => setDeployTarget("global")}
                  />
                  Global Deployment
                </label>
              </div>
            </div>

            {deployTarget === "single" ? (
              <div className="grid gap-2">
                <Label>Select Device</Label>
                <Select
                  value={selectedDevice}
                  onValueChange={setSelectedDevice}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Device" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceOptions.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {deployTarget === "building" ? (
              <div className="grid gap-2">
                <Label>Select Building</Label>
                <Select
                  value={selectedBuilding}
                  onValueChange={setSelectedBuilding}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildingOptions.map((building) => (
                      <SelectItem key={building} value={building}>
                        {building}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <Button onClick={handleDeploy} disabled={deploying}>
              {deploying ? "Deploying..." : "Deploy OTA Firmware"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRollback}
              disabled={rollingBack}
            >
              {rollingBack ? "Rolling back..." : "Rollback Previous"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Commands are broadcast to ems/esp/g/all/cmd.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>RSSI</TableHead>
                <TableHead>FW Version</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deviceList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm">
                    Waiting for device updates...
                  </TableCell>
                </TableRow>
              ) : (
                deviceList.map((device) => {
                  const status = getStatusLabel(device);
                  const isOffline = status === "offline";
                  const progressValue =
                    typeof device.progress === "number"
                      ? device.progress
                      : undefined;
                  return (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        {device.id}
                      </TableCell>
                      <TableCell>{getStatusBadge(status)}</TableCell>
                      <TableCell>
                        {typeof device.rssi === "number"
                          ? `${device.rssi} dBm`
                          : "-"}
                      </TableCell>
                      <TableCell>{device.fwVersion ?? "-"}</TableCell>
                      <TableCell>
                        {new Date(device.lastSeen).toLocaleString()}
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        {progressValue !== undefined ? (
                          <div className="flex flex-col gap-1">
                            <Progress value={progressValue} />
                            <span className="text-xs text-muted-foreground">
                              {progressValue}%
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isOffline}
                          onClick={() => handleRestart(device.id)}
                        >
                          Restart
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
