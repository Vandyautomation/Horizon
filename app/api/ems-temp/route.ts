import { NextResponse } from "next/server";

export async function GET() {
  const candidates = [
    "http://dmksrv02:443/ems/api/temp",
  ];

  let lastError = "Failed to fetch temperature";

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        lastError = `Upstream HTTP ${res.status}`;
        continue;
      }
      const json = await res.json();
      return NextResponse.json(json, { status: 200 });
    } catch (error) {
      lastError = (error as Error).message || lastError;
    }
  }

  return NextResponse.json(
    { status: "error", message: lastError },
    { status: 502 },
  );
}

