"use client"

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DeviceOption = {
  id: string;
  label: string;
  buildingId: string;
  deviceId: string;
};

type DeviceSelectListProps = {
  mode: "single" | "multi" | "building";
  deviceOptions: DeviceOption[];
  buildingOptions: string[];
  selectedBuilding: string;
  onBuildingChange: (value: string) => void;
  selectedDevice: string;
  onDeviceChange: (value: string) => void;
  selectedDevices: string[];
  onMultiChange: (value: string[]) => void;
};

export default function DeviceSelectList({
  mode,
  deviceOptions,
  buildingOptions,
  selectedBuilding,
  onBuildingChange,
  selectedDevice,
  onDeviceChange,
  selectedDevices,
  onMultiChange,
}: DeviceSelectListProps) {
  const filteredDevices = deviceOptions.filter(
    (device) => device.buildingId === selectedBuilding
  );

  if (mode === "building") {
    return (
      <div className="grid gap-2">
        <Label>Select Building</Label>
        <Select value={selectedBuilding} onValueChange={onBuildingChange}>
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
    );
  }

  if (mode === "single") {
    return (
      <div className="grid gap-2">
        <Label>Select Device</Label>
        <Select value={selectedDevice} onValueChange={onDeviceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Device" />
          </SelectTrigger>
          <SelectContent>
            {filteredDevices.map((device) => (
              <SelectItem key={device.id} value={device.id}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label>Select Building</Label>
      <Select value={selectedBuilding} onValueChange={onBuildingChange}>
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
      <div className="rounded-md border p-3">
        <div className="flex flex-wrap gap-4">
          {filteredDevices.map((device) => (
            <label key={device.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedDevices.includes(device.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onMultiChange([...selectedDevices, device.id]);
                    return;
                  }
                  onMultiChange(
                    selectedDevices.filter((value) => value !== device.id)
                  );
                }}
              />
              {device.label}
            </label>
          ))}
          {filteredDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No devices detected for this building.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
