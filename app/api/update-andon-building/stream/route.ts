import { getUpdateAndonEmitter } from "@/lib/mqtt-update-andon-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StreamEvent = {
  type: "response" | "scan" | "raw" | "connected";
  topic?: string;
  buildingId?: string;
  deviceId?: string;
  channel?: "resp" | "ip" | "mac" | "status" | "other";
  payload?: Record<string, unknown>;
  receivedAt?: number;
};

export async function GET() {
  const encoder = new TextEncoder();
  const emitter = getUpdateAndonEmitter();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const handleResponse = (event: StreamEvent) => {
        send(event);
      };

      emitter.on("event", handleResponse);
      send({ type: "connected" });

      const pingId = setInterval(() => {
        controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
      }, 25000);

      return () => {
        clearInterval(pingId);
        emitter.off("event", handleResponse);
        controller.close();
      };
    },
    cancel() {
      return;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
