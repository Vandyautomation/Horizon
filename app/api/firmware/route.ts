import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const FIRMWARE_DIR = "D:/EMS-OTA/firmware";
const LATEST_PATH = path.join(FIRMWARE_DIR, "latest.bin");

async function getFileStat() {
  return fs.stat(LATEST_PATH);
}

export async function HEAD() {
  try {
    const stat = await getFileStat();
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Length": stat.size.toString(),
        "Last-Modified": stat.mtime.toUTCString(),
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

export async function GET() {
  try {
    const data = await fs.readFile(LATEST_PATH);
    const stat = await getFileStat();
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="latest.bin"',
        "Content-Length": stat.size.toString(),
        "Last-Modified": stat.mtime.toUTCString(),
      },
    });
  } catch {
    return new Response("Firmware not found.", { status: 404 });
  }
}
