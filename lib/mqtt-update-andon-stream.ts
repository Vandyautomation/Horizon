import mqtt from "mqtt";
import { EventEmitter } from "events";

type UpdateAndonEvent = {
  type: "response" | "scan" | "raw";
  topic: string;
  buildingId: string;
  deviceId: string;
  payload: Record<string, unknown>;
  channel: "resp" | "ip" | "mac" | "status" | "other";
  receivedAt: number;
};

const emitter = new EventEmitter();
let client: mqtt.MqttClient | null = null;

function tryParseJson(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return { raw };
  } catch {
    return { raw };
  }
}

function connectMqtt() {
  if (client) return;

  const url = process.env.MQTT_URL || process.env.NEXT_PUBLIC_MQTT_WS;
  if (!url) {
    throw new Error("MQTT URL is not configured.");
  }

  client = mqtt.connect(url);

  client.on("connect", () => {
    client?.subscribe("esp/#");
  });

  client.on("message", (topic, message) => {
    const parts = topic.split("/");
    if (parts.length < 2) return;
    if (parts[0] !== "esp") return;

    const raw = message.toString();
    const payload = tryParseJson(raw);

    // esp/resp/{building}/{device}
    if (parts[1] === "resp") {
      const buildingId = parts[2] || "";
      const deviceId = parts[3] || "";
      if (!buildingId || !deviceId) {
        const rawEvent: UpdateAndonEvent = {
          type: "raw",
          topic,
          buildingId: "",
          deviceId: "",
          payload: { ...payload, value: raw },
          channel: "other",
          receivedAt: Date.now(),
        };
        emitter.emit("event", rawEvent);
        return;
      }

      const event: UpdateAndonEvent = {
        type: "response",
        topic,
        buildingId,
        deviceId,
        payload,
        channel: "resp",
        receivedAt: Date.now(),
      };

      emitter.emit("event", event);
      return;
    }

    // esp/{building}/{device}/{ip|mac|status}
    const buildingId = parts[1] || "";
    const deviceId = parts[2] || "";
    const channelRaw = parts[3] || "";
    if (!buildingId || !deviceId) {
      const rawEvent: UpdateAndonEvent = {
        type: "raw",
        topic,
        buildingId: "",
        deviceId: "",
        payload: { ...payload, value: raw },
        channel: "other",
        receivedAt: Date.now(),
      };
      emitter.emit("event", rawEvent);
      return;
    }
    if (channelRaw !== "ip" && channelRaw !== "mac" && channelRaw !== "status") {
      const rawEvent: UpdateAndonEvent = {
        type: "raw",
        topic,
        buildingId,
        deviceId,
        payload: { ...payload, value: raw },
        channel: "other",
        receivedAt: Date.now(),
      };
      emitter.emit("event", rawEvent);
      return;
    }

    const event: UpdateAndonEvent = {
      type: "scan",
      topic,
      buildingId,
      deviceId,
      payload: { ...payload, value: raw },
      channel: channelRaw,
      receivedAt: Date.now(),
    };

    emitter.emit("event", event);
  });

  client.on("error", (error) => {
    console.error("MQTT update andon stream error:", error);
  });
}

export function getUpdateAndonEmitter() {
  connectMqtt();
  return emitter;
}
