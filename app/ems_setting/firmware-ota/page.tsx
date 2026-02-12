"use client"

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import FirmwareUploadCard from "@/components/firmware-upload-card";
import DeviceSelectList from "@/components/device-select-list";
import DeployButton from "@/components/deploy-button";
import OtaProgressTable from "@/components/ota-progress-table";
import { toast } from "react-hot-toast";

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

type StreamMessage = {
  type: "ota" | "status" | "connected";
  buildingId?: string;
  deviceId?: string;
  payload?: Record<string, any>;
};

const OFFLINE_AFTER_MS = 2 * 60 * 1000;

export default function FirmwareOtaPage() {
  const [devices, setDevices] = useState<Record<string, DeviceStatus>>({});
  const [deployTarget, setDeployTarget] = useState<
    "single" | "multi" | "building"
  >("single");
  const [selectedBuilding, setSelectedBuilding] = useState("g");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/firmware/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as StreamMessage;
      if (data.type === "connected") return;

      const buildingId = data.buildingId || "g";
      const deviceId = data.deviceId || "";
      if (!deviceId) return;

      setDevices((prev) => {
        const key = `${buildingId}-${deviceId}`;
        const existing = prev[key] || {
          id: key,
          buildingId,
          deviceId,
          lastSeen: Date.now(),
          status: "online",
        };

        const payload = data.payload || {};
        const next: DeviceStatus = {
          ...existing,
          buildingId,
          deviceId,
          lastSeen: Date.now(),
        };

        if (typeof payload.fwVersion === "string") {
          next.fwVersion = payload.fwVersion;
        }
        if (typeof payload.rssi === "number") {
          next.rssi = payload.rssi;
        }

        if (data.type === "ota") {
          const step = payload.step || "";
          const progress = payload.progress;
          if (typeof progress === "number") {
            next.progress = progress;
            if (progress >= 100) {
              next.status = "ota_success_ack";
            } else {
              next.status = "ota_progress";
            }
          } else if (step === "downloading") {
            next.status = "ota_downloading";
          } else if (step === "failed") {
            next.status = "ota_failed";
          } else {
            next.status = "ota_progress";
          }
        }

        if (data.type === "status" && payload.status === "online") {
          next.status = "online";
        }

        return { ...prev, [key]: next };
      });
    };

    eventSource.onerror = () => {
      toast.error("SSE connection lost. Retrying...");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const deviceList = useMemo(
    () =>
      Object.values(devices)
        .map((device) => {
          const isOffline = now - device.lastSeen > OFFLINE_AFTER_MS;
          return {
            ...device,
            status: isOffline ? "offline" : device.status,
          };
        })
        .sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true })),
    [devices, now]
  );

  const buildingOptions = useMemo(() => {
    const set = new Set<string>();
    deviceList.forEach((device) => set.add(device.buildingId));
    if (set.size === 0) set.add("g");
    return Array.from(set);
  }, [deviceList]);

  const deviceOptions = useMemo(
    () =>
      deviceList.map((device) => ({
        id: device.id,
        label: `${device.buildingId}/${device.deviceId}`,
        buildingId: device.buildingId,
        deviceId: device.deviceId,
      })),
    [deviceList]
  );

  const handleDeploy = async () => {
    if (deployTarget === "single" && !selectedDevice) {
      toast.error("Select a device first.");
      return;
    }
    if (deployTarget === "multi" && selectedDevices.length === 0) {
      toast.error("Select at least one device.");
      return;
    }

    const payload: {
      target: "single" | "multi" | "building";
      buildingId?: string;
      deviceId?: string;
      deviceIds?: string[];
    } = { target: deployTarget };

    if (deployTarget === "single") {
      const selected = deviceOptions.find((device) => device.id === selectedDevice);
      payload.buildingId = selected?.buildingId || selectedBuilding;
      payload.deviceId = selected?.deviceId || selectedDevice;
    }

    if (deployTarget === "multi") {
      payload.buildingId = selectedBuilding;
      payload.deviceIds = selectedDevices.map((id) => {
        const selected = deviceOptions.find((device) => device.id === id);
        return selected?.deviceId || id;
      });
    }

    if (deployTarget === "building") {
      payload.buildingId = selectedBuilding;
    }

    setDeploying(true);
    try {
      const res = await fetch("/api/firmware/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Deploy failed");
      }
      if (deployTarget === "single") {
        const selected = deviceOptions.find((device) => device.id === selectedDevice);
        if (selected) {
          setDevices((prev) => ({
            ...prev,
            [selected.id]: {
              ...prev[selected.id],
              status: "ota_requested",
            },
          }));
        }
      } else if (deployTarget === "multi") {
        setDevices((prev) => {
          const updated = { ...prev };
          selectedDevices.forEach((deviceKey) => {
            if (updated[deviceKey]) {
              updated[deviceKey] = {
                ...updated[deviceKey],
                status: "ota_requested",
              };
            }
          });
          return updated;
        });
      } else if (deployTarget === "building") {
        setDevices((prev) => {
          const updated = { ...prev };
          Object.values(updated).forEach((device) => {
            if (device.buildingId === selectedBuilding) {
              updated[device.id] = { ...device, status: "ota_requested" };
            }
          });
          return updated;
        });
      }

      toast.success("Deploy request sent.");
    } catch (error: any) {
      toast.error(error?.message || "Deploy failed.");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 p-2">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Firmware OTA</h2>
        <p className="text-sm text-muted-foreground">
          Upload firmware and deploy OTA updates to ESP32 devices.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <FirmwareUploadCard />
        <Card>
          <CardHeader>
            <CardTitle>Deploy Target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <Label>Update Target</Label>
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
                  value="multi"
                  checked={deployTarget === "multi"}
                  onChange={() => setDeployTarget("multi")}
                />
                Multiple Devices
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deployTarget"
                  value="building"
                  checked={deployTarget === "building"}
                  onChange={() => setDeployTarget("building")}
                />
                Update All Building
              </label>
            </div>

            <DeviceSelectList
              mode={deployTarget}
              deviceOptions={deviceOptions}
              buildingOptions={buildingOptions}
              selectedBuilding={selectedBuilding}
              onBuildingChange={setSelectedBuilding}
              selectedDevice={selectedDevice}
              onDeviceChange={setSelectedDevice}
              selectedDevices={selectedDevices}
              onMultiChange={setSelectedDevices}
            />

            <DeployButton loading={deploying} onDeploy={handleDeploy} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OTA Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <OtaProgressTable devices={deviceList} />
        </CardContent>
      </Card>
    </div>
  );
}
