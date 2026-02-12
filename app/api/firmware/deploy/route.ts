import { NextResponse } from "next/server";
import { publishMqtt } from "@/lib/mqtt-publisher";

export const runtime = "nodejs";

const OTA_URL = "http://10.160.50.14:9999/api/firmware";

type DeployBody = {
  target: "single" | "multi" | "building";
  buildingId?: string;
  deviceId?: string;
  deviceIds?: string[];
};

function resolveTargetTopics(body: DeployBody) {
  if (body.target === "single") {
    if (!body.buildingId || !body.deviceId) {
      throw new Error("buildingId and deviceId are required for single deploy.");
    }
    return [`ems/esp/${body.buildingId}/${body.deviceId}/cmd`];
  }

  if (body.target === "multi") {
    if (!body.buildingId || !body.deviceIds?.length) {
      throw new Error("buildingId and deviceIds are required for multi deploy.");
    }
    return body.deviceIds.map(
      (deviceId) => `ems/esp/${body.buildingId}/${deviceId}/cmd`
    );
  }

  if (body.target === "building") {
    if (!body.buildingId) {
      throw new Error("buildingId is required for building deploy.");
    }
    return [`ems/esp/${body.buildingId}/all/cmd`];
  }

  throw new Error("Invalid deploy target.");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DeployBody;
    const topics = resolveTargetTopics(body);
    for (const topic of topics) {
      await publishMqtt(topic, {
        cmd: "ota",
        url: OTA_URL,
      });
    }
    return NextResponse.json({ status: "ok", deployedTo: topics });
  } catch (error: any) {
    console.error("Deploy failed:", error);
    return NextResponse.json(
      { error: error?.message || "Deploy failed." },
      { status: 500 }
    );
  }
}
