"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useRef, useState, useEffect } from "react"
import yaml from "js-yaml"
import { toast } from "react-hot-toast"
import { Pencil, Trash } from "lucide-react"

interface Area {
  id: string
  points: [number, number][]
}

interface CameraDetailModalProps {
  open: boolean
  camera: any // Use Camera type if available
  onClose: () => void
  yamlFiles: { name: string; content?: Area[] }[]
  defaultYamlFile: string | undefined
  defaultYamlFileContent: string | undefined
}

export function CameraDetailModal({ open, camera, onClose, yamlFiles, defaultYamlFile, defaultYamlFileContent }: CameraDetailModalProps) {
  const [selectedYaml, setSelectedYaml] = useState<string | null | undefined>(defaultYamlFile || null)
  const [areas, setAreas] = useState<Area[]>([])
  const [drawing, setDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([])
  const [newAreaId, setNewAreaId] = useState("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const [saving, setSaving] = useState(false)
  const [editingAreaIdx, setEditingAreaIdx] = useState<number | null>(null)
  const [editingAreaId, setEditingAreaId] = useState("")
  const [editingPoints, setEditingPoints] = useState<[number, number][]>([])
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)

  const pythonUrl = process.env.NEXT_PUBLIC_BACKEND_PYTHON

  // Load areas from default YAML file
  useEffect(() => {
    if (defaultYamlFile) {
      if (defaultYamlFileContent) {
        const parsed = yaml.load(defaultYamlFileContent)
        setAreas(Array.isArray(parsed) ? parsed : [])
        setSelectedYaml(defaultYamlFile)
      } else {
        setAreas([])
      }
    }
  }, [defaultYamlFile, yamlFiles])

  // Load areas from selected YAML file
  useEffect(() => {
    if (!selectedYaml) {
      setAreas([])
      return
    }
    
    // Find the file object
    const file = yamlFiles.find(f => f.name === selectedYaml)
    if (file && file.content) {
      setAreas(file.content)
    } else if (file && !file.content) {
      setSaving(true)
      // Fetch and parse YAML content if not already loaded
      fetch(`${pythonUrl}/api/yaml/${selectedYaml}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          try {
            const parsed = yaml.load(data.content)
            setAreas(Array.isArray(parsed) ? parsed : [])
          } catch {
            setAreas([])
          }
        })
        .finally(() => setSaving(false))
        .catch(() => setAreas([]))
    } else {
      setAreas([])
    }
  }, [selectedYaml, yamlFiles])

  useEffect(() => {
    if (draggingIdx === null) return;

    const handleMove = (e: MouseEvent) => {
      // Find the overlay div
      const overlay = document.getElementById('area-overlay');
      if (!overlay) return;
      const rect = overlay.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setEditingPoints(points =>
        points.map((pt, idx) => idx === draggingIdx ? [x, y] : pt)
      );
    };

    const handleUp = (e: MouseEvent) => {
      // Final update
      const overlay = document.getElementById('area-overlay');
      if (!overlay) return;
      const rect = overlay.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setEditingPoints(points =>
        points.map((pt, idx) => idx === draggingIdx ? [x, y] : pt)
      );
      setDraggingIdx(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [draggingIdx]);

  if (!camera) return null

  // Drawing logic: click to add points, double click or button to finish
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!drawing) return
    const rect = (e.target as HTMLDivElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentPoints(prev => [...prev, [x, y]])
  }

  const handleFinishPolygon = () => {
    if (currentPoints.length < 3 || !newAreaId) return
    setAreas(prev => [...prev, { id: newAreaId, points: currentPoints }])
    setCurrentPoints([])
    setNewAreaId("")
    setDrawing(false)
  }

  const handleStartDrawing = () => {
    setDrawing(true)
    setCurrentPoints([])
    setNewAreaId("")
  }

  const handleCreateNewYaml = () => {
    setSelectedYaml(null)
    setAreas([])
    setIsCreatingNew(true)
  }

  const handleSave = async () => {
    if (!camera) return
    if (!selectedYaml && !isCreatingNew) {
      toast.error("Please select or create a YAML file")
      return
    }
    if ((isCreatingNew && !selectedYaml) || (isCreatingNew && !areas.length)) {
      toast.error("Please provide a YAML file name and at least one area")
      return
    }
    setSaving(true)
    const yamlName = selectedYaml || prompt("Enter new YAML file name (e.g. areas.yaml):")
    if (!yamlName) {
      setSaving(false)
      return
    }

    const savePromise = async () => {
      const yamlContent = yaml.dump(
        areas.map(a => ({
          id: a.id,
          points: a.points.map(([x, y]) => [Math.round(x), Math.round(y)])
        })),
        { lineWidth: -1 }
      )
      // 1. Save YAML file
      const action = isCreatingNew ? "add" : "update"
      const yamlRes = await fetch(`${pythonUrl}/api/yaml`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          name: yamlName,
          content: yamlContent
        })
      })
      const yamlResult = await yamlRes.json()
      if (!yamlResult.success) throw new Error(yamlResult.error || "Failed to save YAML")
      // 2. Update camera
      const camRes = await fetch(`${pythonUrl}/api/cameras/${camera.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...camera,
          yaml_file: yamlName
        })
      })
      const camResult = await camRes.json()
      if (!camResult.success) throw new Error(camResult.error || "Failed to update camera")
    }

    toast.promise(
      savePromise().then(() => onClose()),
      {
        loading: "Saving... (this may take a while)",
        success: "Areas and camera updated!",
        error: (e) => e.message || "Save failed"
      }
    ).finally(() => setSaving(false))
  }

  // Render polygons as SVG overlays
  const renderPolygons = () => (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" width="100%" height="100%">
      {areas.map((area, idx) => {
        const points = editingAreaIdx === idx ? editingPoints : area.points;
        return (
          <polygon
            key={area.id}
            points={points.map(p => p.join(",")).join(" ")}
            fill="rgba(59,130,246,0.3)" // blue-500/30
            stroke="#2563eb" // blue-600
            strokeWidth={2}
          >
            <title>{area.id}</title>
          </polygon>
        );
      })}
      {currentPoints.length > 1 && (
        <polyline
          points={currentPoints.map(p => p.join(",")).join(" ")}
          fill="rgba(59,130,246,0.2)"
          stroke="#2563eb"
          strokeWidth={2}
        />
      )}
    </svg>
  )

  // Edit area name
  const handleEditArea = (idx: number) => {
    setEditingAreaIdx(idx)
    setEditingAreaId(areas[idx].id)
    setEditingPoints([...areas[idx].points])
  }
  const handleSaveEditArea = (idx: number) => {
    setAreas(prev => prev.map((a, i) => i === idx ? { ...a, id: editingAreaId } : a))
    setEditingAreaIdx(null)
    setEditingAreaId("")
  }
  const handleDeleteArea = (idx: number) => {
    setAreas(prev => prev.filter((_, i) => i !== idx))
    if (editingAreaIdx === idx) {
      setEditingAreaIdx(null)
      setEditingAreaId("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{camera.name} - Area Management</DialogTitle>
        </DialogHeader>
        <div className="mb-4 flex items-center gap-2">
          { isCreatingNew ? <Input
            className="w-64"
            placeholder="YAML file name (e.g. areas.yaml)"
            value={selectedYaml || ""}
            onChange={e => setSelectedYaml(e.target.value)}
          /> : <Select
            value={selectedYaml || ""}
            onValueChange={val => {
              setSelectedYaml(val)
              setIsCreatingNew(false)
            }}
            disabled={isCreatingNew}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select YAML file" />
            </SelectTrigger>
            <SelectContent>
              {yamlFiles.map(f => (
                <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>}
          <Button size="sm" variant="outline" onClick={!isCreatingNew ? handleCreateNewYaml : () => {setIsCreatingNew(false); setSelectedYaml(defaultYamlFile)}} disabled={isCreatingNew ? saving : false}>
            {!isCreatingNew ? "Create New YAML" : "Cancel"}
          </Button>
        </div>
        <div className="relative w-[640px] aspect-video bg-black select-none">
          <img
            ref={imgRef}
            src={`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/video_feed/${camera.id}`}
            alt={camera.name}
            height={360}
            width={640}
            className="object-cover"
            draggable={false}
          />
          <div
            id="area-overlay"
            className="absolute top-0 left-0 w-full h-full cursor-crosshair"
            style={{ pointerEvents: (drawing || editingAreaIdx !== null) ? 'auto' : 'none' }}
            onClick={handleCanvasClick}
          >
            {renderPolygons()}
            {/* Draw current points as small circles */}
            {currentPoints.map(([x, y], idx) => (
              <div
                key={idx}
                className="absolute bg-blue-500 rounded-full"
                style={{ left: x - 4, top: y - 4, width: 8, height: 8 }}
              />
            ))}
            {editingAreaIdx !== null && editingPoints.map(([x, y], pIdx) => (
              <div
                key={pIdx}
                className="absolute bg-red-500 rounded-full border border-white"
                style={{ left: x - 6, top: y - 6, width: 12, height: 12, cursor: 'pointer', zIndex: 10 }}
                onMouseDown={e => {
                  e.stopPropagation()
                  setDraggingIdx(pIdx)
                }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {drawing ? (
            <>
              <Input
                placeholder="Area Name (e.g. Area 1)"
                value={newAreaId}
                onChange={e => setNewAreaId(e.target.value)}
                className="w-64"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleFinishPolygon} disabled={currentPoints.length < 3 || !newAreaId}>
                  Finish Area
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setDrawing(false); setCurrentPoints([]); setNewAreaId("") }}>Cancel</Button>
              </div>
              <div className="text-xs text-muted-foreground">Click to add points. Minimum 3 points. Double click or use Finish to complete.</div>
            </>
          ) : (
            
            <Button size="sm" onClick={handleStartDrawing} disabled={saving}>
              Draw New Area
            </Button>
            
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 h-[150px] overflow-y-scroll scrollbar-visible scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <div className="font-semibold">Areas: {areas.length} (Scroll Down)</div>
          {areas.map((area, idx) => (
            <div key={area.id} className="flex items-center gap-2">
              {editingAreaIdx === idx ? (
                <>
                  <Input
                    className="w-32"
                    value={editingAreaId}
                    onChange={e => setEditingAreaId(e.target.value)}
                  />
                  <Button size="sm" onClick={() => {
                    setAreas(prev => prev.map((a, i) => i === editingAreaIdx ? { ...a, id: editingAreaId, points: editingPoints } : a))
                    setEditingAreaIdx(null)
                    setEditingAreaId("")
                    setEditingPoints([])
                  }}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingAreaIdx(null)
                    setEditingAreaId("")
                    setEditingPoints([])
                  }}>Cancel</Button>
                </>
              ) : (
                <>
                  <span className="text-sm font-mono">{area.id}</span>
                  <span className="text-xs text-muted-foreground">({area.points.length} points)</span>
                  <Button size="icon" variant="ghost" onClick={() => handleEditArea(idx)} title="Edit area name">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteArea(idx)} title="Delete area">
                    <Trash className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 