import mqtt from 'mqtt';
import { toast } from 'react-hot-toast';

let client: ReturnType<typeof mqtt.connect> | null = null;

export function getMqttClient() {
    if (!client) {
        client = mqtt.connect(`${process.env.NEXT_PUBLIC_MQTT_WS}`);

        client.on('error', (error) => {
            console.error("MQTT error:", error);
            toast.error("MQTT error: " + error);
            toast.promise(
                new Promise((resolve, reject) => {
                    client?.reconnect();
                    resolve(true);
                }),
                {
                    loading: 'Reconnecting to MQTT broker',
                    error: 'Failed to reconnect to MQTT broker',
                    success: 'Reconnected to MQTT broker',
                }
            );
        });

        client.on('close', () => {
            console.log("MQTT closed");
            toast.error("MQTT closed");
        });

        client.on("connect", () => {
            console.log("Connected to MQTT broker");
        });
    }
    return client;
}

export function closeMqttClient() {
    if (client) {
        client.end();
        client = null;
        console.log("Disconnected from MQTT broker");
    }
} 