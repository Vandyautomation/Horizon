"use client"

import { useState, useEffect, Suspense, useMemo } from "react"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Html, useGLTF } from "@react-three/drei"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Progress } from "./ui/progress"

import { Color, Mesh, MeshStandardMaterial, PCFSoftShadowMap, Vector3 } from "three"
import { Button } from "./ui/button"
import useSWR from 'swr';
import { Label } from "./ui/label"

interface Machine {
  id: string
  position: any
  rotation: any
  status: "Running" | "PlannedStop" | "Changeover" | "Breakdown" | "OrgDisfunction"  | "NonQuality" | "Microstop"
}

interface Building {
  id: number
  name: string
  machines: Machine[]
}

const statusColors = {
  Running: "#22c55e", // Green
  PlannedStop: "#9ca3af", // Gray
  Changeover: "#3b82f6", // Blue
  Breakdown: "#ffa500", // Darker orange
  NonQuality: "#ef4444", // Red
  OrgDisfunction: "#a855f7", // Purple
  Microstop: "yellow", // Yellow
}

function Wall({
  position,
  rotation,
  size,
}: { position: [number, number, number]; rotation?: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#94a3b8" />
    </mesh>
  )
}

function InjectionMoldingMachine({
  machine,
  onClick,
  isSelected,
}: { machine: Machine; onClick: () => void; isSelected: boolean }) {
  const { scene } = useGLTF("/admin/assets/3d/inject_new2.glb");
  const clonedScene = useMemo(() => scene?.clone(), [scene]);

  useEffect(() => {
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if ((child as any).isMesh && (child as Mesh).material) {
          (child as any).material = new MeshStandardMaterial({ 
            ...((child as any).material as any), 
            color: new Color(statusColors[machine?.status]) 
          });
        }
      });
    }
  }, [clonedScene, machine?.status]);

  return (
    <group position={machine.position} onClick={onClick}>
      <primitive object={clonedScene} scale={[0.015, 0.015, 0.015]} rotation={[machine.rotation[0] , machine.rotation[1] == 0 ? (3.14 * 3)/ 2 : machine.rotation[1] * (0.5), machine.rotation[2]]} />
      {machine?.status ==='Breakdown' && (
        <mesh position={[0, 5.5, 0]}>
          <Html position={[0, 0, 0]} center>
            <div className="bg-orange-500 text-white p-1 rounded-full">!!!</div>
          </Html>
        </mesh>
      )}
      <Html position={[0, 3, 0]} center>
        <div style={{ backgroundColor: statusColors[machine?.status] }} className="bg-opacity-50 text-white p-2 rounded">{machine.id}</div>
      </Html>
    </group>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[80, 30]} />
      <meshStandardMaterial color="#e2e8f0" />
    </mesh>
  )
}

function FloorMiddle() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
      <planeGeometry args={[80, 10]} />
      <meshStandardMaterial color="grey" />
    </mesh>
  )
}

function FloorRoad() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-42.5, 0.1, 0]}>
      <planeGeometry args={[5, 30]} />
      <meshStandardMaterial color="grey" />
    </mesh>
  )
}

export default function ShopfloorDashboard() {
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const key = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/andon/buildings`
  const { data: buildings, error } = useSWR<Building[]>(key, fetcher, {
    refreshInterval: 5000,
  });

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  
  // const buildings: Building[] = [
  //   {
  //     id: 1,
  //     name: "INJ Bld G",
  //     machines: [
  //       {
  //         id: "1",
  //         position: [
  //           -35, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Running"
  //       },
  //       {
  //         id: "2",
  //         position: [
  //           -30, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "3",
  //         position: [
  //           -25, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Changeover"
  //       },
  //       {
  //         id: "4",
  //         position: [
  //           -20, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Running"
  //       },

  //       {
  //         id: "5",
  //         position: [
  //           -15, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Running"
  //       },
  //       { 
  //         id: "6", 
  //         position: [
  //           -10, 0, -10
  //         ], 
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Breakdown"
  //       },
  //       {
  //         id: "7",
  //         position: [
  //           -5, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Running"
  //       },
  //       {
  //         id: "8",
  //         position: [
  //           0, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Changeover"
  //       },

  //       {
  //         id: "9",
  //         position: [
  //           5, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Running"
  //       },
  //       {
  //         id: "10",
  //         position: [
  //           10, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Running"
  //       },
  //       {
  //         id: "11",
  //         position: [
  //           15, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "PlannedStop"
  //       },
  //       {
  //         id: "12",
  //         position: [
  //           20, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "13",
  //         position: [
  //           25, 0, -10
  //         ],
  //         rotation: [0, Math.PI/1, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "14",
  //         position: [
  //           30, 0, -10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "15",
  //         position: [
  //           30, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "16",
  //         position: [
  //           25, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "17",
  //         position: [
  //           20, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "18",
  //         position: [
  //           15, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "19",
  //         position: [
  //           10, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "20",
  //         position: [
  //           5, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "21",
  //         position: [
  //           0, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "22",
  //         position: [
  //           -5, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "23",
  //         position: [
  //           -10, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "24",
  //         position: [
  //           -15, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "25",
  //         position: [
  //           -20, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "26",
  //         position: [
  //           -25, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "27",
  //         position: [
  //           -30, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //       {
  //         id: "28",
  //         position: [
  //           -35, 0, 10
  //         ],
  //         rotation: [0, 0, 0],
  //         status: "Running" 
  //       },
  //     ],
  //   },
  //   // Add more buildings if needed
  // ]

  useEffect(() => {
    if (buildings && buildings.length > 0 && !selectedBuilding) {
      setSelectedBuilding(buildings[0]);
      console.log(buildings[0])
    }
  }, [buildings, selectedBuilding]);

  // if (error) return <div>Failed to load</div>;
  // if (!buildings) return <div>Loading...</div>;
  // if (!selectedBuilding) return <div>No Selected Building...</div>;

  return (
    <div className="w-full h-[850px] ">
      <div className="grid grid-cols-3 gap-4 mb-2">
        <Card className="absolute top-24 left-6 z-10">
          <CardContent className="pb-2 pt-2 px-2">
            <Select
              value={selectedBuilding?.id.toString() || ''}
              onValueChange={(value) => {
                const building = buildings?.find((b) => b.id.toString() === value)
                setSelectedBuilding(building || null)
                setSelectedMachine(null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a building" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(buildings) && buildings?.map((building) => (
                  <SelectItem key={building.id} value={building.id.toString()}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        {/* <Card className="absolute top-24 right-6 z-10">
          <CardHeader>
            <CardTitle>Overall Equipment Effectiveness (OEE)</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(selectedBuilding?.machines) && selectedBuilding && (
              <div className="text-center">
                <p className="font-semibold">Total Average OEE</p>
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>
      <Card className="absolute top-24 right-6 w-[500px] z-10">
        <CardHeader className="flex">
          <CardTitle className="flex gap-4 justify-between items-center">Machines Status
            <div className="flex gap-2">
              <Label>OOE <strong>53.3%</strong></Label>
              <Label>OEE <strong>53.3%</strong></Label>
              </div>
            </CardTitle>  
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(statusColors).map(([status, color]) => {
              const count = selectedBuilding?.machines.filter(machine => machine.status === status).length
              return (
                <div key={status} className="flex flex-shrink items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm"><strong>{count}</strong> {status}</span>
                </div>
              )
            })}
                <div className="flex flex-shrink col-span-2 items-center gap-2">
                  <span className="text-sm"><strong>{selectedBuilding?.machines.length}</strong> Total Active Machine</span>
                </div>
          </div>
        </CardContent>
      </Card>
      {Array.isArray(selectedBuilding?.machines) && selectedMachine && (
        <Card className="absolute bottom-4 right-4 w-[400px] z-10">
          <CardHeader>
            <CardTitle>Machine {selectedMachine.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Status:</span>
                <span style={{ color: statusColors[selectedMachine?.status] }}>{selectedMachine?.status}</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Button onClick={() => setSelectedMachine(null)} >Reset Selection</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: "100%", width: "100%" }}>
      <Canvas 
          camera={{ position: [-39.8, 23.2, -56], fov: 40 }} 
          shadows
          onCreated={({ gl }) => {
            gl.setClearColor("#808080");
            gl.toneMappingExposure = 1.2; // Lower exposure for better balance
            gl.shadowMap.enabled = false;
            gl.shadowMap.type = PCFSoftShadowMap; // Softer shadows
          }}
        >
          <Suspense fallback={null}>
            {/* Ambient Light - Higher Intensity */}
            <ambientLight intensity={5} />

            {/* Hemisphere Light - Soft natural lighting */}
            {/* Directional Light - Reduced intensity and softer shadows */}
          <directionalLight position={[0, 100, 0]} intensity={2} /> {/* Top Light */}
          <directionalLight position={[0, -100, 0]} intensity={2} /> {/* Bottom Light */}
          <directionalLight position={[100, 0, 0]} intensity={2} /> {/* Right Side Light */}
          <directionalLight position={[-100, 0, 0]} intensity={2} /> {/* Left Side Light */}
          <directionalLight position={[50, 50, 50]} intensity={2} /> {/* Right Side Light */}
          <directionalLight position={[-50, 50, 50]} intensity={2} /> {/* Left Side Light */}

          <directionalLight position={[-50, 0, -50]} intensity={2} /> {/* Left Side Light */}


           

            <Floor />
            <FloorMiddle />
            <FloorRoad />
            <Wall position={[0, 5, 15]} size={[80, 10, 0.5]} />
            <Wall position={[40, 5, 0]} rotation={[0, Math.PI / 2, 0]} size={[30, 10, 0.5]} />

            {Array.isArray(selectedBuilding?.machines) 
              ? selectedBuilding.machines.map((machine) => (
                  <InjectionMoldingMachine
                    key={machine?.id}
                    machine={machine}
                    onClick={() => setSelectedMachine(machine)}
                    isSelected={selectedMachine?.id === machine?.id}
                  />
                ))
              : null}

            <OrbitControls target={[0, 0, 0]} />
          </Suspense>
        </Canvas>


      </div>
    </div>
  )
}

