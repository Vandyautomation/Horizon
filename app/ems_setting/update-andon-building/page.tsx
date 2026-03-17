"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type CmdCode = "50101" | "50102" | "50103" | "50104";

type LastAction = {
  cmd: CmdCode;
  topic: string;
  payload: Record<string, string>;
  sentAt: string;
};

type StreamResponse = {
  type: "response" | "scan" | "raw" | "connected";
  topic?: string;
  buildingId?: string;
  deviceId?: string;
  channel?: "resp" | "ip" | "mac" | "status" | "other";
  payload?: Record<string, unknown>;
  receivedAt?: number;
};

type ResponseLog = {
  id: string;
  type: "response" | "raw";
  topic: string;
  buildingId: string;
  deviceId: string;
  payload: Record<string, unknown>;
  channel: "resp" | "ip" | "mac" | "status" | "other";
  receivedAt: number;
};

type ScannedDevice = {
  id: string;
  buildingId: string;
  deviceId: string;
  hasIp: boolean;
  hasMac: boolean;
  ip?: string;
  mac?: string;
  status?: string;
  lastSeen: number;
};

const defaultState = {
  currentBuilding: "r",
  currentDevice: "17",
  nextBuilding: "",
  nextDevice: "",
};

function sanitizeId(value: string) {
  return value.trim().slice(0, 9);
}

export default function UpdateAndonBuildingPage() {
  const [currentBuilding, setCurrentBuilding] = useState(defaultState.currentBuilding);
  const [currentDevice, setCurrentDevice] = useState(defaultState.currentDevice);
  const [nextBuilding, setNextBuilding] = useState(defaultState.nextBuilding);
  const [nextDevice, setNextDevice] = useState(defaultState.nextDevice);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [connected, setConnected] = useState(false);
  const [responses, setResponses] = useState<ResponseLog[]>([]);
  const [scannedDevices, setScannedDevices] = useState<Record<string, ScannedDevice>>({});

  const targetTopic = useMemo(
    () => `esp/cmd/${currentBuilding || "-"}/${currentDevice || "-"}`,
    [currentBuilding, currentDevice]
  );

  useEffect(() => {
    const eventSource = new EventSource("/api/update-andon-building/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as StreamResponse;
      if (data.type === "connected") {
        setConnected(true);
        return;
      }

      const topic = data.topic || "";
      const buildingId = data.buildingId || "";
      const deviceId = data.deviceId || "";
      if (!topic || !buildingId || !deviceId) return;

      const payload =
        data.payload && typeof data.payload === "object" ? data.payload : {};
      const receivedAt = data.receivedAt || Date.now();

      if (data.type === "response" || data.type === "raw") {
        setResponses((prev) => {
          const resolvedBuildingId = buildingId || "-";
          const resolvedDeviceId = deviceId || "-";
          const next: ResponseLog[] = [
            {
              id: `${receivedAt}-${topic}`,
              type: data.type,
              topic,
              buildingId: resolvedBuildingId,
              deviceId: resolvedDeviceId,
              payload,
              channel: data.channel || "other",
              receivedAt,
            },
            ...prev,
          ];
          return next.slice(0, 30);
        });
      }

      if (data.type === "scan") {
        const key = `${buildingId}-${deviceId}`;
        const rawValue = String(payload.value || "").trim();

        setScannedDevices((prev) => {
          const existing = prev[key] || {
            id: key,
            buildingId,
            deviceId,
            hasIp: false,
            hasMac: false,
            lastSeen: receivedAt,
          };

          const next: ScannedDevice = {
            ...existing,
            buildingId,
            deviceId,
            lastSeen: receivedAt,
          };

          if (data.channel === "ip") {
            next.hasIp = rawValue.length > 0;
            next.ip = rawValue;
          } else if (data.channel === "mac") {
            next.hasMac = rawValue.length > 0;
            next.mac = rawValue;
          } else if (data.channel === "status") {
            next.status = rawValue;
          }

          return { ...prev, [key]: next };
        });
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, []);

  const scannedList = useMemo(
    () =>
      Object.values(scannedDevices).sort((a, b) =>
        a.id.localeCompare(b.id, "en", { numeric: true })
      ),
    [scannedDevices]
  );

  const handleSend = async (cmd: CmdCode) => {
    const buildingId = sanitizeId(currentBuilding);
    const deviceId = sanitizeId(currentDevice);

    if (!buildingId || !deviceId) {
      toast.error("Current building and device are required.");
      return;
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload: Record<string, string> = { cmd, requestId };

    if (cmd === "50102") {
      const newBuilding = sanitizeId(nextBuilding);
      const newDevice = sanitizeId(nextDevice);
      if (!newBuilding || !newDevice) {
        toast.error("New building and new device are required.");
        return;
      }
      payload.building = newBuilding;
      payload.device = newDevice;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/update-andon-building/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingId,
          deviceId,
          cmd,
          requestId,
          building: payload.building,
          device: payload.device,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send command.");
      }

      setLastAction({
        cmd,
        topic: data.topic,
        payload: data.payload,
        sentAt: new Date().toLocaleString(),
      });
      toast.success(`Command ${cmd} sent.`);

      // 50102 changes identity, update target in UI right away.
      if (cmd === "50102" && payload.building && payload.device) {
        setCurrentBuilding(payload.building);
        setCurrentDevice(payload.device);
        setNextBuilding("");
        setNextDevice("");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send command.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 p-2">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Update Andon Building</h2>
        <p className="text-sm text-muted-foreground">
          Send config command 50101-50104 to ESP device, with identity update via 50102.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Device Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="current-building">Current Building</Label>
            <Input
              id="current-building"
              value={currentBuilding}
              onChange={(e) => setCurrentBuilding(sanitizeId(e.target.value))}
              placeholder="r"
              maxLength={9}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current-device">Current Device</Label>
            <Input
              id="current-device"
              value={currentDevice}
              onChange={(e) => setCurrentDevice(sanitizeId(e.target.value))}
              placeholder="17"
              maxLength={9}
            />
          </div>
          <div className="space-y-2">
            <Label>Target Command Topic</Label>
            <div className="rounded-md border bg-muted p-2 text-sm">{targetTopic}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MQTT Response Listener</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            SSE status:{" "}
            <span className={connected ? "font-medium text-green-600" : "font-medium text-red-600"}>
              {connected ? "Connected" : "Disconnected"}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Listening wildcard topic: <code>esp/#</code> (all ESP traffic).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Scan (IP/MAC)</CardTitle>
        </CardHeader>
        <CardContent>
          {scannedList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scan data yet. Once device publishes to /ip or /mac, it will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {scannedList.map((device) => (
                <div key={device.id} className="rounded-md border p-3 text-sm">
                  <p>
                    <span className="font-medium">Device:</span> {device.buildingId}/{device.deviceId}
                  </p>
                  <p>
                    <span className="font-medium">IP:</span> {device.hasIp ? device.ip : "Not found"}
                  </p>
                  <p>
                    <span className="font-medium">MAC:</span> {device.hasMac ? device.mac : "Not found"}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span> {device.status || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Last Seen:</span>{" "}
                    {new Date(device.lastSeen).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Command</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            <Button onClick={() => handleSend("50101")} disabled={loading}>
              50101 Get ID
            </Button>
            <Button onClick={() => handleSend("50103")} disabled={loading} variant="secondary">
              50103 Restart
            </Button>
            <Button onClick={() => handleSend("50104")} disabled={loading} variant="secondary">
              50104 Network
            </Button>
          </div>
          <Separator />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="new-building">New Building</Label>
              <Input
                id="new-building"
                value={nextBuilding}
                onChange={(e) => setNextBuilding(sanitizeId(e.target.value))}
                placeholder="new building"
                maxLength={9}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-device">New Device</Label>
              <Input
                id="new-device"
                value={nextDevice}
                onChange={(e) => setNextDevice(sanitizeId(e.target.value))}
                placeholder="new device"
                maxLength={9}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => handleSend("50102")} disabled={loading} className="w-full">
                50102 Update Building/Device
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last Sent Command</CardTitle>
        </CardHeader>
        <CardContent>
          {!lastAction ? (
            <p className="text-sm text-muted-foreground">No command has been sent yet.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Command:</span> {lastAction.cmd}
              </p>
              <p>
                <span className="font-medium">Topic:</span> {lastAction.topic}
              </p>
              <p>
                <span className="font-medium">Sent At:</span> {lastAction.sentAt}
              </p>
              <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs">
                {JSON.stringify(lastAction.payload, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incoming MQTT Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No MQTT responses received yet.</p>
          ) : (
            <div className="space-y-3">
              {responses.map((item) => (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <p>
                    <span className="font-medium">From:</span> {item.buildingId}/{item.deviceId}
                  </p>
                  <p>
                    <span className="font-medium">Type:</span> {item.type} ({item.channel})
                  </p>
                  <p>
                    <span className="font-medium">Topic:</span> {item.topic}
                  </p>
                  <p>
                    <span className="font-medium">Received:</span>{" "}
                    {new Date(item.receivedAt).toLocaleString()}
                  </p>
                  <pre className="mt-2 overflow-auto rounded-md bg-muted p-2 text-xs">
                    {JSON.stringify(item.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
