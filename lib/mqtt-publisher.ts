import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_URL || process.env.NEXT_PUBLIC_MQTT_WS;

export async function publishMqtt(topic: string, payload: Record<string, any>) {
  return new Promise<void>((resolve, reject) => {
    if (!MQTT_URL) {
      reject(new Error("MQTT URL is not configured."));
      return;
    }

    const client = mqtt.connect(MQTT_URL, { reconnectPeriod: 0 });
    const timeoutId = setTimeout(() => {
      client.end(true);
      reject(new Error("MQTT publish timeout."));
    }, 5000);

    client.on("connect", () => {
      client.publish(topic, JSON.stringify(payload), { qos: 0 }, (error) => {
        clearTimeout(timeoutId);
        client.end(true);
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    client.on("error", (error) => {
      clearTimeout(timeoutId);
      client.end(true);
      reject(error);
    });
  });
}
