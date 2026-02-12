import { getOtaEmitter } from "@/lib/mqtt-ota-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  const emitter = getOtaEmitter();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: Record<string, any>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const handleMessage = (event: any) => {
        send(event);
      };

      emitter.on("ota", handleMessage);
      send({ type: "connected" });

      const pingId = setInterval(() => {
        controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
      }, 25000);

      return () => {
        clearInterval(pingId);
        emitter.off("ota", handleMessage);
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
