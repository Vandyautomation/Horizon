"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  type: 'camera' | 'videoSource' | 'deviceName'
  mode: 'add' | 'edit'
  initialData?: any
  videoSources?: { id: string; name: string; url: string }[]
  deviceNames?: { id: string; name: string; value: string; machine_id: string }[]
  yamlFiles?: { name: string }[]
  machines?: { machineId: string; machineName: string, machineDescription: string }[]
}

export function UvScrapModal({
  open,
  onOpenChange,
  onSubmit,
  type,
  mode,
  initialData,
  videoSources,
  deviceNames,
  yamlFiles,
  machines,
}: ModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData.entries())
    onSubmit(data)
  }

  const titles = {
    camera: { add: 'Add Camera', edit: 'Edit Camera' },
    videoSource: { add: 'Add Video Source', edit: 'Edit Video Source' },
    deviceName: { add: 'Add Device Name', edit: 'Edit Device Name' },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[type][mode]}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Add a new' : 'Edit the'} {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'camera' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_source">Video Source</Label>
                <Select name="video_source" defaultValue={videoSources?.find(source => source.url == initialData?.video_source)?.url || initialData?.video_source}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select video source" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoSources?.map((source) => (
                      <SelectItem key={source.id} value={source.url}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yaml_file">YAML File</Label>
                <Select name="yaml_file" defaultValue={initialData?.yaml_file}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select YAML file" />
                  </SelectTrigger>
                  <SelectContent>
                    {yamlFiles?.map((file) => (
                      <SelectItem key={file.name} value={file.name}>
                        {file.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="udp_ip">UDP IP</Label>
                <Input
                  id="udp_ip"
                  name="udp_ip"
                  defaultValue={initialData?.udp_ip || '10.160.50.14'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="udp_port">UDP Port</Label>
                <Input
                  id="udp_port"
                  name="udp_port"
                  type="number"
                  defaultValue={initialData?.udp_port || 1433}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device_name">Device Name</Label>
                <Select name="device_name" defaultValue={deviceNames?.find(device => device.value == initialData?.device_name)?.value || initialData?.device_name}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device name" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceNames?.map((device) => (
                      <SelectItem key={device.id} value={device.value}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {type === 'videoSource' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  name="url"
                  defaultValue={initialData?.url}
                  required
                />
              </div>
            </>
          )}

          {type === 'deviceName' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Topic</Label>
                <Input
                  id="value"
                  name="value"
                  defaultValue={initialData?.value}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="machine_id">Machine</Label>
                <Select name="machine_id" defaultValue={initialData?.machine_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines?.map((machine) => (
                      <SelectItem key={machine.machineName} value={machine.machineName}>
                        {machine.machineDescription}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === 'add' ? 'Add' : 'Update'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 