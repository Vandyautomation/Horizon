"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface CameraFeedProps {
  id: string
  name: string
  status: 'online' | 'offline' | 'paused',
  onClick: () => void,
  camerasVisible: boolean
}

export function CameraFeed({ id, name, status, onClick, camerasVisible }: CameraFeedProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    paused: 'bg-yellow-500'
  }

  const [imgSrc, setImgSrc] = useState(`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/video_feed/${id}`);

  useEffect(() => {
    if (!camerasVisible) {
      return () => {
        // Cleanup logic to stop fetching the feed
      };
    }
  }, [camerasVisible]);

  useEffect(() => {
    if (!camerasVisible) return;

    const interval = setInterval(() => {
      setImgSrc(`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/video_feed/${id}?t=${Date.now()}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [camerasVisible, id]);

  if (!camerasVisible) return null;

  return (
    <Card className="relative overflow-hidden" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{name}</CardTitle>
        <Badge className={statusColors[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video">
          <img
            src={imgSrc}
            alt={`Camera ${name}`}
            className="w-full h-full object-cover"
          />
        </div>
      </CardContent>
    </Card>
  )
} 