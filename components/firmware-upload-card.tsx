"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

type FirmwareInfo = {
  size: number;
  updatedAt: string;
} | null;

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

async function fetchInfo(url: string): Promise<FirmwareInfo> {
  const res = await fetch(url, { method: "HEAD" });
  if (!res.ok) return null;
  const size = Number(res.headers.get("content-length") || 0);
  const updatedAt = res.headers.get("last-modified") || "";
  return { size, updatedAt };
}

export default function FirmwareUploadCard() {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [latestInfo, setLatestInfo] = useState<FirmwareInfo>(null);
  const [previousInfo, setPreviousInfo] = useState<FirmwareInfo>(null);

  const refreshInfo = async () => {
    const [latest, previous] = await Promise.all([
      fetchInfo("/api/firmware"),
      fetchInfo("/api/firmware/previous"),
    ]);
    setLatestInfo(latest);
    setPreviousInfo(previous);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a firmware .bin file.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const res = await fetch("/api/firmware/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }
      toast.success("Firmware uploaded.");
      setFile(null);
      await refreshInfo();
    } catch (error: any) {
      toast.error(error?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firmware Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="firmware-upload">Firmware (.bin)</Label>
          <Input
            id="firmware-upload"
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
          <Button variant="outline" onClick={refreshInfo} disabled={uploading}>
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
  );
}
