"use client";
import { useEffect, useState, useCallback } from "react";
import { PlayCircle, PauseCircle, ArrowLeftCircle, CheckCircle2, CircleIcon } from "lucide-react";
import { Separator } from "./ui/separator";
import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "./ui/label";
import { Decimal } from "decimal.js";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import mqtt from "mqtt";
import LoadingState from "./ui/loading-state";
import ErrorState from "./ui/error-state";

interface ScaleRunProps {
  taskId: number;
  scaleAsset: string
  onBack: () => void;
}

type TaskDetail = {
  taskId: number;
  poNumber: string;
  status: string;
  materialNumber: string;
  createdDate: Date;
  scaleAsset: string;
  totalConsumption: Decimal;
  currentMeasurement: Decimal;
  totalCurrentRuntime: number;
};

const refreshIntervalms = 5000;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ScaleRun({ taskId, scaleAsset, onBack }: ScaleRunProps) {
  const { data: tasks, error, isLoading } = useSWR<TaskDetail[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/tasks/${taskId}`, fetcher, 
    { refreshInterval: refreshIntervalms });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [, setMqttClient] = useState<ReturnType<typeof mqtt.connect> | null>(null);
  const [currentMeasurement, setCurrentMeasurement] = useState(new Decimal(0));

  // Initialize MQTT client on mount
  useEffect(() => {
    const client = mqtt.connect(`${process.env.NEXT_PUBLIC_MQTT_WS}`);
    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      client.subscribe(`esp/uv/scale/${scaleAsset}`);
    });
    client.on("message", (topic, message) => {
      
      setCurrentMeasurement(new Decimal(message.toString()));
    });
    setMqttClient(client);

    return () => {
      client.end();
      console.log("Disconnected to MQTT broker");

      setMqttClient(null);
    };
  }, [scaleAsset]);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setIsPlaying(tasks[0].status === "RUN");
      setIsComplete(tasks[0].status === "COMPLETE");
    }
  }, [tasks]);

  const handleStatusTask = useCallback(
    async (status: string) => {
      const endpoint = status === "RUN" ? "start-task" : status === "PAUSE" ? "pause-task" : "stop-task";

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId }),
        });

        if (!response.ok) {
          // Attempt to extract the server's error message
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to ${status.toLowerCase()} task`;
  
          throw new Error(errorMessage);
        }

        await mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scales/tasks/${taskId}`);
        setIsPlaying(status === "RUN");
        setIsComplete(status === "COMPLETE");
        toast.success(`${status} task successfully!`);
      } catch (error) {
        // toast.error(`Failed to ${status.toLowerCase()} task.`);
        toast.error((error as Error).message);

        console.error(`Failed to ${status.toLowerCase()} task:`, error);
      }
    },
    [taskId]
  );

  if (isLoading) return <LoadingState message="Loading task..." />
  if (error) return <ErrorState message="Error loading task. Please try again later." />

  const timeColor = isComplete ? "text-blue-300" : isPlaying ? "text-green-400" : "text-yellow-500";

  return (
    <div className="w-full mt-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <ArrowLeftCircle 
            onClick={onBack} 
            className="hover:bg-slate-500 rounded-full bg-grey-100 text-slate-300" 
            size={48} 
          />
        </div>
        
        <div className="flex items-center justify-center space-x-4">
          {isPlaying ? (
            <PauseCircle
              onClick={() => handleStatusTask("PAUSE")}
              className="hover:bg-orange-500 rounded-full text-orange-400"
              size={48}
            />
          ) : (
            <PlayCircle
              onClick={() => handleStatusTask("RUN")}
              className="hover:bg-green-500 rounded-full text-green-400"
              size={48}
            />
          )}

          <CheckCircle2
            onClick={() => handleStatusTask("COMPLETE")}
            className="hover:bg-blue-500 rounded-full text-blue-400"
            size={48}
          />
        </div>
        <div className="flex flex-col text-right">
          <Label className="text-lg font-semibold">{tasks && tasks[0]?.poNumber}</Label>
          <Label className="font-semibold">{tasks && tasks[0]?.materialNumber}</Label>
          <Label className="font-medium">{tasks && tasks[0]?.scaleAsset}</Label>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col items-center justify-center w-full mt-5">
        <div className="flex flex-col items-center justify-center gap-4">
          <Card className="w-64 h-29">
            <CardDescription className="p-2 text-center">Total consumption</CardDescription>
            <CardContent className="flex items-center justify-center p-0">
              <span className={`text-4xl font-semibold ${timeColor}`}>{tasks && tasks[0]?.totalConsumption.toFixed(2).toString()}</span>
              <p className="ml-2">gr</p>
            </CardContent>
            <CardFooter className="text-xs text-center m-0 p-2 justify-center text-gray-500">Total consumption refresh every {refreshIntervalms/1000} s</CardFooter>
          </Card>

          <Card className="w-48 h-24">
            <CardDescription className="flex items-center p-2 justify-center gap-1">
              <CircleIcon className="text-red-500 bg-red-500 rounded-full" size={14} />
              <span className="text-gray-300">Live scale measurement</span>
            </CardDescription>
            <CardContent className="flex items-center justify-center">
              <span className={`text-3xl font-sans ${timeColor}`}>{currentMeasurement.toFixed(2)}</span>
              <p className="ml-2">gr</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
