"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, Video, Cpu, Play, Square, Trash2, Edit, Pause, Play as PlayIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CameraFeed } from "@/components/uv-scrap/camera-feed"
import { UvScrapModal } from "@/components/uv-scrap/modals"
import { CameraDetailModal } from "@/components/uv-scrap/camera-detail-modal"
import { toast} from "react-hot-toast"


interface Camera {
  id: string
  name: string
  video_source: string
  yaml_file: string
  yaml_file_content: string
  udp_ip: string
  udp_port: number
  device_name: string
  is_active: boolean
  is_paused: boolean
}

interface VideoSource {
  id: string
  name: string
  url: string
}

interface DeviceName {
  id: string
  name: string
  value: string
}

interface Stats {
  [key: string]: {
    total_count: number
  }
}

type ModalType = 'camera' | 'videoSource' | 'deviceName'
type ModalMode = 'add' | 'edit'

interface ModalState {
  open: boolean
  type: ModalType
  mode: ModalMode
  initialData: Camera | VideoSource | DeviceName | null
  id?: string
}

export default function UvScrap() {
  const [camerasVisible, setCamerasVisible] = useState(false)
  const [cameras, setCameras] = useState<Camera[]>([])
  const [videoSources, setVideoSources] = useState<VideoSource[]>([])
  const [deviceNames, setDeviceNames] = useState<DeviceName[]>([])
  const [yamlFiles, setYamlFiles] = useState<{ name: string }[]>([])
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    type: 'camera',
    mode: 'add',
    initialData: null,
    id: undefined,
  })
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)

  useEffect(() => {
    // Connect to Socket.IO
    // const socket: Socket = io(pythonUrl, {
    //   withCredentials: true,
    //   transports: ['websocket', 'polling']
    // })

    // socket.on('stats', (stats: Stats) => {
    //   setCameras((prevCameras) =>
    //     prevCameras.map((camera) => ({
    //       ...camera,
    //       is_active: stats[camera.id]?.total_count > 0,
    //     }))
    //   )
    // })

    // Load initial data
    loadInitialData()
    // return () => {
    //   socket.disconnect()
    // }
  }, [])

//   const pythonUrl = process.env.NEXT_PUBLIC_BACKEND_PYTHON
  const pythonUrl = process.env.NEXT_PUBLIC_BACKEND_URL + "/api/detection"
  const beUrl = process.env.NEXT_PUBLIC_BACKEND_URL + "/api/detection"

  const loadInitialData = async () => {
    try {
      const [camerasRes, sourcesRes, devicesRes, yamlRes] = await toast.promise(
        Promise.all([
          fetch(`${beUrl}/api/cameras`, {
            // credentials: 'include',
            headers: {
              'Content-Type': 'application/json'

            }
          }),
          fetch(`${beUrl}/api/video_sources`, {
            // credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${beUrl}/api/device_names`, {
            // credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${beUrl}/api/yaml`, {
            // credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }),
        ]),
        {
          loading: 'Loading data...',
          success: 'Data loaded successfully!',
          error: 'Failed to load data',
        }
      )

      const camerasData = await camerasRes.json()
      const sourcesData = await sourcesRes.json()
      const devicesData = await devicesRes.json()
      const yamlData = await yamlRes.json()

      setCameras(Object.entries(camerasData.data).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      })))
      setVideoSources(sourcesData.data)
      setDeviceNames(devicesData.data)
      setYamlFiles(yamlData.data)
    } catch (error) {
      toast.error("Failed to load initial data")
    }
  }

  const handleModalSubmit = async (data: any, id?: string) => {
    const { type, mode } = modalState
    let endpoint = `${pythonUrl}/api/${type === 'camera' ? 'cameras' : type === 'videoSource' ? 'video_sources' : 'device_names'}`
    if (mode === 'edit' && id) {
      endpoint += `/${id}`
    }
    const method = mode === 'add' ? 'POST' : 'PUT'

    await toast.promise(
      (async () => {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        //   credentials: 'include'
        })

        const result = await response.json()

        if (result.success) {
          loadInitialData()
        } else {
          throw new Error(result.error)
        }
      })(),
      {
        loading: `${mode === 'add' ? 'Adding' : 'Updating'} ${type}...`,
        success: `${type} ${mode === 'add' ? 'added' : 'updated'} successfully`,
        error: `Failed to ${mode} ${type}`
      }
    )

    setModalState((prev) => ({ ...prev, open: false }))
  }

  const handleDelete = async (type: 'camera' | 'videoSource' | 'deviceName', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    const endpoint = `${pythonUrl}/api/${type === 'camera' ? 'cameras' : type === 'videoSource' ? 'video_sources' : 'device_names'}/${id}`

    try {
      const response = await fetch(endpoint, { 
        method: 'DELETE',
        // credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()

      if (result.success) {
        toast.success(`${type} deleted successfully`)
        loadInitialData()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(`Failed to delete ${type}: ${error}`)
    }
  }

  const handleTogglePause = async (id: string) => {
    const camera = cameras.find((c) => c.id === id)
    if (!camera) return

    try {
      const response = await fetch(`${pythonUrl}/api/controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: id,
          action: camera.is_paused ? 'resume' : 'pause',
        }),
        // credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Camera ${camera.is_paused ? 'resumed' : 'paused'} successfully`)
        loadInitialData()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(`Failed to ${camera.is_paused ? 'resume' : 'pause'} camera: ${error}`)
    }
  }

  return (
    <div className="container w-full p-4 space-y-4">
      <Tabs defaultValue="cameras" className="w-full">
        <TabsList>
          <TabsTrigger value="cameras">
            <Camera className="w-4 h-4 mr-2" />
            Cameras
          </TabsTrigger>
          <TabsTrigger value="video-sources">
            <Video className="w-4 h-4 mr-2" />
            Video Sources
          </TabsTrigger>
          <TabsTrigger value="device-names">
            <Cpu className="w-4 h-4 mr-2" />
            Device Names
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cameras">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Camera Live View</CardTitle>
              <Button onClick={() => setCamerasVisible(!camerasVisible)}>
                {camerasVisible ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Hide All Cameras
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Show All Cameras
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {camerasVisible && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cameras.map((camera) => (
                    <CameraFeed
                      camerasVisible={camerasVisible}
                      key={camera.id}
                      id={camera.id}
                      name={camera.name}
                      status={camera.is_paused ? 'paused' : camera.is_active ? 'online' : 'offline'}
                      onClick={() => setSelectedCamera(camera)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Camera Management</CardTitle>
              <Button onClick={() => setModalState({ open: true, type: 'camera', mode: 'add', initialData: null })}>
                Add Camera
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Video Source</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>UDP IP</TableHead>
                      <TableHead>UDP Port</TableHead>
                      <TableHead>Device Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cameras.map((camera) => (

                      <TableRow key={camera.id} >
                        <TableCell onClick={() => setSelectedCamera(camera)}>{camera.name}</TableCell>
                        <TableCell onClick={() => setSelectedCamera(camera)}>{videoSources.find(source => source.url == camera.video_source)?.name || camera.video_source}</TableCell>
                        <TableCell onClick={() => setSelectedCamera(camera)}>{camera.yaml_file}</TableCell>
                        <TableCell onClick={() => setSelectedCamera(camera)}>{camera.udp_ip}</TableCell>
                        <TableCell onClick={() => setSelectedCamera(camera)}>{camera.udp_port}</TableCell>
                        <TableCell onClick={() => setSelectedCamera(camera)}>{deviceNames.find(device => device.value == camera.device_name)?.name || camera.device_name}</TableCell>
                        <TableCell>
                          <Badge variant={camera.is_active ? "default" : "destructive"}>
                            {camera.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {camera.is_paused && (
                            <Badge variant="secondary" className="ml-2">
                              Paused
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {setModalState({
                              open: true,
                              type: 'camera',
                              mode: 'edit',
                              initialData: camera,
                              id: camera.id,
                            }); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {handleDelete('camera', camera.id); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={camera.is_paused ? "default" : "secondary"}
                            size="sm"
                            onClick={() => {handleTogglePause(camera.id); }}
                          >
                            {camera.is_paused ? (
                              <PlayIcon className="w-4 h-4" />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video-sources">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Video Sources</CardTitle>
              <Button onClick={() => setModalState({ open: true, type: 'videoSource', mode: 'add', initialData: null })}>
                Add Video Source
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videoSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell>{source.id}</TableCell>
                        <TableCell>{source.name}</TableCell>
                        <TableCell>{source.url}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalState({
                              open: true,
                              type: 'videoSource',
                              mode: 'edit',
                              initialData: source,
                              id: source.id,
                            })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete('videoSource', source.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="device-names">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Device Names</CardTitle>
              <Button onClick={() => setModalState({ open: true, type: 'deviceName', mode: 'add', initialData: null })}>
                Add Device Name
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deviceNames.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>{device.id}</TableCell>
                        <TableCell>{device.name}</TableCell>
                        <TableCell>{device.value}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalState({
                              open: true,
                              type: 'deviceName',
                              mode: 'edit',
                              initialData: device,
                              id: device.id,
                            })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete('deviceName', device.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UvScrapModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        type={modalState.type}
        mode={modalState.mode}
        initialData={modalState.initialData}
        onSubmit={(data) => handleModalSubmit(data, modalState.id)}
        videoSources={videoSources}
        deviceNames={deviceNames}
        yamlFiles={yamlFiles}
      />

      <CameraDetailModal
        open={!!selectedCamera}
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
        yamlFiles={yamlFiles}
        defaultYamlFile={selectedCamera?.yaml_file}
        defaultYamlFileContent={selectedCamera?.yaml_file_content}
      />
    </div>
  )
}