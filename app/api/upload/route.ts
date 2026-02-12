import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const FIRMWARE_DIR = "D:/EMS-OTA/firmware";
const LATEST_PATH = path.join(FIRMWARE_DIR, "latest.bin");
const PREVIOUS_PATH = path.join(FIRMWARE_DIR, "previous.bin");

function getFileFromFormData(formData: FormData): File | null {
  const directFile =
    formData.get("file") ||
    formData.get("firmware") ||
    formData.get("firmware.bin");
  if (directFile instanceof File) return directFile;

  for (const value of formData.values()) {
    if (value instanceof File) {
      return value;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = getFileFromFormData(formData);

    if (!file) {
      return NextResponse.json(
        { error: "No firmware file uploaded." },
        { status: 400 }
      );
    }

    await fs.mkdir(FIRMWARE_DIR, { recursive: true });

    try {
      await fs.access(LATEST_PATH);
      await fs.copyFile(LATEST_PATH, PREVIOUS_PATH);
    } catch {
      // No previous firmware to back up.
    }

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(LATEST_PATH, Buffer.from(arrayBuffer));

    const latestStat = await fs.stat(LATEST_PATH);
    let previousStat = null;
    try {
      previousStat = await fs.stat(PREVIOUS_PATH);
    } catch {
      previousStat = null;
    }

    return NextResponse.json({
      ok: true,
      latest: {
        size: latestStat.size,
        updatedAt: latestStat.mtime.toISOString(),
      },
      previous: previousStat
        ? {
            size: previousStat.size,
            updatedAt: previousStat.mtime.toISOString(),
          }
        : null,
    });
  } catch (error: any) {
    console.error("Firmware upload failed:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed." },
      { status: 500 }
    );
  }
}
