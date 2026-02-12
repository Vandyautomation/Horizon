import mqtt from "mqtt";
import { EventEmitter } from "events";

type OtaEvent = {
  type: "ota" | "status";
  buildingId: string;
  deviceId: string;
  payload: Record<string, any>;
};

const emitter = new EventEmitter();
let client: mqtt.MqttClient | null = null;

function connectMqtt() {
  if (client) return;
  const url = process.env.MQTT_URL || process.env.NEXT_PUBLIC_MQTT_WS;
  if (!url) {
    throw new Error("MQTT URL is not configured.");
  }

  client = mqtt.connect(url);

  client.on("connect", () => {
    client?.subscribe("ems/esp/+/+/ota/status");
    client?.subscribe("ems/esp/+/+/status");
  });

  client.on("message", (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const parts = topic.split("/");
      const buildingId = parts[2] || "";
      const deviceId = parts[3] || payload.device || "";
      if (!buildingId || !deviceId) return;

      const type = topic.includes("/ota/status") ? "ota" : "status";
      emitter.emit("ota", {
        type,
        buildingId,
        deviceId,
        payload,
      } satisfies OtaEvent);
    } catch (error) {
      console.error("MQTT OTA stream parse error:", error);
    }
  });
}

export function getOtaEmitter() {
  connectMqtt();
  return emitter;
}
