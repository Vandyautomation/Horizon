"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useRef } from "react"

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

  const [imageData, setImageData] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchingRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevObjectUrlRef = useRef<string | null>(null);

  // Function to fetch a new frame
  const fetchNewFrame = async () => {
    if (fetchingRef.current || !camerasVisible) return;
    
    // If there's an ongoing fetch, abort it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this fetch
    abortControllerRef.current = new AbortController();
    fetchingRef.current = true;
    
    try {
      const timestamp = Date.now();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/frame/${id}?timestamp=${timestamp}`, 
        { signal: abortControllerRef.current.signal }
        );
      
      if (!response.ok) throw new Error('Failed to fetch camera frame');
      
      const blob = await response.blob();
      
      // Revoke previous object URL before creating a new one
      if (prevObjectUrlRef.current) {
        URL.revokeObjectURL(prevObjectUrlRef.current);
      }
      
      const objectUrl = URL.createObjectURL(blob);
      prevObjectUrlRef.current = objectUrl;
      setImageData(objectUrl);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching camera frame:', error);
      }
    } finally {
      fetchingRef.current = false;
    }
  };

  // Setup the fetch interval when camerasVisible changes
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Abort any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear the image when not visible
    if (!camerasVisible) {
      setImageData(null);
      
      // Also revoke any existing object URL
      if (prevObjectUrlRef.current) {
        URL.revokeObjectURL(prevObjectUrlRef.current);
        prevObjectUrlRef.current = null;
      }
      return;
    }
    
    // Initially fetch a frame
    fetchNewFrame();
    
    // Set up interval for subsequent fetches - consider 100ms (10fps) for better performance
    intervalRef.current = setInterval(fetchNewFrame, 100);
    
    // Cleanup on unmount or when camerasVisible changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clean up any object URLs to prevent memory leaks
      if (prevObjectUrlRef.current) {
        URL.revokeObjectURL(prevObjectUrlRef.current);
        prevObjectUrlRef.current = null;
      }
    };
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
          {imageData ? (
            <img
              src={imageData}
              alt={`Camera ${name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              Loading...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 