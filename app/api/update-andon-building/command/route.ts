import { NextResponse } from "next/server";
import { publishMqtt } from "@/lib/mqtt-publisher";

export const runtime = "nodejs";

type SupportedCmd = "50101" | "50102" | "50103" | "50104";

type CommandBody = {
  buildingId?: string;
  deviceId?: string;
  cmd?: SupportedCmd;
  requestId?: string;
  building?: string;
  device?: string;
};

const SUPPORTED_COMMANDS: SupportedCmd[] = ["50101", "50102", "50103", "50104"];

function isSafeId(value: string) {
  return /^[A-Za-z0-9_-]{1,9}$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CommandBody;
    const buildingId = String(body.buildingId || "").trim();
    const deviceId = String(body.deviceId || "").trim();
    const cmd = body.cmd;
    const requestId = String(body.requestId || "").trim();

    if (!buildingId || !deviceId) {
      throw new Error("buildingId and deviceId are required.");
    }
    if (!isSafeId(buildingId) || !isSafeId(deviceId)) {
      throw new Error("buildingId/deviceId contain invalid characters.");
    }
    if (!cmd || !SUPPORTED_COMMANDS.includes(cmd)) {
      throw new Error("Unsupported command.");
    }

    const payload: Record<string, string> = {
      cmd,
      requestId: requestId || crypto.randomUUID(),
    };

    if (cmd === "50102") {
      const newBuilding = String(body.building || "").trim();
      const newDevice = String(body.device || "").trim();
      if (!newBuilding || !newDevice) {
        throw new Error("building and device are required for 50102.");
      }
      if (!isSafeId(newBuilding) || !isSafeId(newDevice)) {
        throw new Error("New building/device contain invalid characters.");
      }
      payload.building = newBuilding;
      payload.device = newDevice;
    }

    const topic = `esp/cmd/${buildingId}/${deviceId}`;
    await publishMqtt(topic, payload);

    return NextResponse.json({
      status: "ok",
      topic,
      payload,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Command failed.";
    console.error("Update Andon Building command failed:", error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
