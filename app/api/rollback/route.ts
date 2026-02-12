import { NextResponse } from "next/server";
import { publishMqtt } from "@/lib/mqtt-publisher";

export const runtime = "nodejs";

const OTA_URL = "http://10.160.50.14:9999/api/firmware/previous";
const COMMAND_TOPIC = "ems/esp/g/all/cmd";

export async function POST() {
  try {
    await publishMqtt(COMMAND_TOPIC, {
      cmd: "ota",
      url: OTA_URL,
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Rollback failed:", error);
    return NextResponse.json(
      { error: error?.message || "Rollback failed." },
      { status: 500 }
    );
  }
}
