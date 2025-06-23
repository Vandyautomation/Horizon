"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import albeaLogo from "@/public/albea-white.png"
import Image from "next/image";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Html,
  useGLTF,
  Text,
  CameraControls,
} from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import mqtt from "mqtt";

import { Color, Mesh, MeshStandardMaterial, PCFSoftShadowMap } from 'three';
import { Button } from './ui/button';
import useSWR from 'swr';
import { Label } from './ui/label';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calculator, LayoutGrid, Power, Zap } from 'lucide-react';
import { toast } from "react-hot-toast";
import { getMqttClient, closeMqttClient } from '@/lib/mqtt';

interface Machine {
  id: string;
  position: any;
  rotation: any;
  MchID: string;
  MchLoc: string;
  MchNumber: string;
  consumption: number;
  cycletime: number;
  target_cycletime: number;
  cavity: number;
  target_cavity: number;
  oee: number;
  ooe: number;
  status:
    | 'GREEN'
    | 'WHITE'
    | 'BLUE'
    | 'ORANGE'
    | 'PURPLE'
    | 'RED'
    | 'YELLOW'
    | 'GREY';
}

interface Building {
  id: number;
  name: string;
  oee: number;
  ooe: number;
  machines: Machine[];
}

interface Andon {
  MchID: string;
  MchNumber: number;
  MchLoc: string;
  StatusLight: string;
}

const statusColors = {
  GREEN: '#22c55e', // Green
  WHITE: '#F5F5F5', // gray-100
  BLUE: '#3b82f6', // Blue
  ORANGE: '#ffa500', // Darker orange
  RED: '#ef4444', // Red
  PURPLE: '#a855f7', // Purple
  YELLOW: 'yellow', // Yellow
  GREY: '#6b7280', // Grey
};

function Wall({
  position,
  rotation,
  size,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#94a3b8" />
    </mesh>
  );
}
// function InjectionMoldingMachine({
//   machine,
//   onClick,
//   isSelected,
// }: {
//   machine: Machine;
//   onClick: () => void;
//   isSelected: boolean;
// }) {
//   const { scene } = useGLTF('/admin/assets/3d/inject_new2.glb');

//   const clonedScene = useMemo(() => scene?.clone(), [scene]);

//   useEffect(() => {
//     if (clonedScene) {
//       clonedScene.traverse((child) => {
//         if ((child as any).isMesh && (child as Mesh).material) {
//           const originalColor = new Color(statusColors[machine?.status]);
//           // Create a new material instance rather than modifying the existing one
//           const newMaterial = new MeshStandardMaterial({
//             ...((child as any).material as any),
//             color: originalColor,
//             emissive: originalColor.clone().multiplyScalar(0.3),
//             metalness: 0.9,
//             roughness: 0.3,
//             flatShading: false, // Ensure smooth shading
//             transparent: false,
//             opacity: 1.0,
//             wireframe: false,
//           });
          
          
//           // Assign the new material to the mesh
//           (child as Mesh).material = newMaterial;
//           (child as Mesh).castShadow = true;
//           (child as Mesh).receiveShadow = true;
//         }
//       });
//     }
//     // return clonedScene;
//     }, [clonedScene, machine?.status, machine?.id]);

// //  const clonedScene = useMemo(() => {
//   //   const cloned = scene?.clone();
//   //   if (cloned) {
//   //     cloned.traverse((child) => {
//   //       if ((child as any).isMesh && (child as Mesh).material) {
//   //         const originalColor = new Color(statusColors[machine?.status]);
//   //         // Create a new material instance rather than modifying the existing one
//   //         const newMaterial = new MeshStandardMaterial({
//   //           ...((child as any).material as any),
//   //           color: originalColor,
//   //           emissive: originalColor.clone().multiplyScalar(0.3),
//   //           metalness: 0.9,
//   //           roughness: 0.3,
//   //           flatShading: false, // Ensure smooth shading
//   //           transparent: false,
//   //           opacity: 1.0,
//   //           wireframe: false,
//   //         });
          
          
//   //         // Assign the new material to the mesh
//   //         (child as Mesh).material = newMaterial;
//   //         (child as Mesh).castShadow = true;
//   //         (child as Mesh).receiveShadow = true;
//   //       }
//   //     });
//   //   }
//   //   return cloned;
//   // }, [scene, machine?.status, machine?.id]); // Add machine.id as dependency to ensure unique instance

//   return (
//     <group position={machine.position} onClick={onClick}>
//       <primitive
//         object={clonedScene}
//         scale={[0.015, 0.015, 0.015]}
//         rotation={[
//           machine.rotation[0],
//           machine.rotation[1] == 0 ? (3.14 * 3) / 2 : machine.rotation[1] * 0.5,
//           machine.rotation[2],
//         ]}
//       />
//       {machine?.status === 'Breakdown' && (
//         <mesh position={[0, 0, 0]}>
//           <Html position={[0, 4, 0]} center>
//             <div className="bg-orange-500 text-white p-1 text-sm rounded-full border">
//               Breakdown!!!
//             </div>
//           </Html>
//         </mesh>
//       )}
//       <Html position={[0, 3, 0]} center>
//         <div
//           style={{
//             backgroundColor: statusColors[machine?.status],
//             boxShadow: isSelected ? '0 0 0 3px white' : '0 0 0 1px white',
//           }}
//           className={`bg-opacity-50 text-white p-1 rounded ${
//             isSelected ? 'font-bold' : ''
//           }`}
//         >
//           {machine.id}
//         </div>
//       </Html>
//       <Html position={[0, 0, -3]} center>
//         <div
//           style={{
//             backgroundColor: 'black',
//             boxShadow: isSelected ? '0 0 0 3px white' : '0 0 0 1px white',
//           }}
//           className={`bg-opacity-50 text-white p-1 rounded text-xs text-nowrap ${
//             isSelected ? 'font-bold' : ''
//           }`}
//         >
//           {machine.consumption} kWh
//         </div>
//       </Html>
//     </group>
//   );
// }

function InjectionMoldingMachine({
  machine,
  onClick,
  isSelected,
}: {
  machine: Machine;
  onClick: () => void;
  isSelected: boolean;
}) {
  const { scene } = useGLTF('/admin/assets/3d/inject-color.glb');
  const clonedScene = useMemo(() => scene?.clone(), [scene]);

  useEffect(() => {
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if ((child as any).isMesh && (child as Mesh).material) {
          const originalColor = new Color(statusColors[machine?.status]);
          // Create a material with emissive properties for better visibility
          (child as any).material = new MeshStandardMaterial({
            ...((child as any).material as any),
            // color: originalColor,
            // emissive: originalColor.clone().multiplyScalar(0.3),
            metalness: 0.9,
            roughness: 0.3,
          });
        }
      });
    }
  }, [clonedScene, machine?.status]);

  return (
    <group position={machine.position} onClick={onClick}>
      <primitive
        object={clonedScene}
        scale={[2, 2, 2]}
        rotation={[
          machine.rotation[0],
          machine.rotation[1] == 0 ? (3.14 * 3) / 2 : machine.rotation[1] * 0.5,
          machine.rotation[2],
        ]}
      />
      {machine?.status === 'ORANGE' && (
          <Html position={[0, 5, 0]} center>
            <div className="bg-orange-500 text-white p-1 text-sm border animate-pulse">
              Breakdown!!!
            </div>
          </Html>
      )}
      <Html position={[0, 3, 0]} center>
        <div
          style={{
            backgroundColor: statusColors[machine?.status],
            boxShadow: isSelected ? '0 0 0 3px white' : '0 0 0 1px white',
          }}
          className={`bg-opacity-50 text-white p-1 rounded ${
            isSelected ? 'font-bold' : ''
          }`}
        >
          {machine.id}
        </div>
      </Html>
      <Html position={[0, 0, -3]} center>
        <div
          style={{
            backgroundColor: 'gray',
            boxShadow: isSelected ? '0 0 0 3px white' : '0 0 0 1px white',
          }}
          className={`bg-opacity-50 text-white p-1 rounded text-xs text-nowrap ${
            isSelected ? 'font-bold' : ''
          }`}
        >
          ⚡️{machine.consumption} { machine.consumption != null ? 'kWh': '-'}
        </div>
      </Html>
      <Html position={[0, 4.7, 0]} center>
        <div
          style={{
            backgroundColor: 'black',
            boxShadow: isSelected ? '0 0 0 3px white' : '0 0 0 1px white',
          }}
          className={`bg-opacity-50 ${machine.cycletime > machine.target_cycletime ? 'text-red-400' : 'text-white'} p-1 rounded text-xs text-nowrap ${
            isSelected ? 'font-bold' : ''
          }`}
        >
          🕑{machine.cycletime} { machine.cycletime != null ? 's': '-'}
          <p className={`text-xs flex items-center text-white pt-1`}><LayoutGrid className="w-4 h-4" /> 
            <p className={`${machine.cavity < machine.target_cavity ? 'text-red-400' : machine.cavity > machine.target_cavity ? 'text-green-400' : 'text-white'}`}>{machine.cavity}</p>
            /{machine.target_cavity}</p>
        </div>
      </Html>
      {/* <group position={[0, 3, -3]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.2, 0.6, 0.1]} />
          <meshStandardMaterial color={statusColors[machine?.status]} />
        </mesh>
        <Text
          position={[0, 0, -0.06]}
          fontSize={0.3}
          color="black"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI, 0]}
        >
          ⚡️123.32 kWh
        </Text>
      </group> */}
    </group>
  );
}

function YoureHere({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF('/admin/assets/3d/human.glb');
  const clonedScene = useMemo(() => scene?.clone(), [scene]);
  return (
    <primitive
        object={clonedScene}
        position={position}
        rotation={rotation || [0, 0, 0]}
        scale={[2, 2, 2]}
      />
  );
}

function CameraLogger() {
  const { camera } = useThree();
  const [position, setPosition] = useState({ x: '0', y: '0', z: '0' });

  useFrame(() => {
    setPosition({
      x: camera.position.x.toFixed(2),
      y: camera.position.y.toFixed(2),
      z: camera.position.z.toFixed(2),
    });
  });

  return (
    <Html position={[0, 0, 0]} center>
      <div className="absolute top-4 left-4 z-10 bg-black/70 text-white p-2 rounded text-xs">
        Camera Position
      </div>
      <div className="absolute top-4 right-4 z-10 bg-black/70 text-white p-2 rounded text-xs">
        rotation x: {camera.rotation.x.toFixed(2)}, y:{' '}
        {camera.rotation.y.toFixed(2)}, z: {camera.rotation.z.toFixed(2)}
      </div>
      {/* <div className="absolute bottom-4 right-4 z-10 bg-black/70 text-white p-2 rounded text-xs">
        fov: {camera.fov.toFixed(2)}
      </div> */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/70 text-white p-2 rounded text-xs">
        x: {position.x}, y: {position.y}, z: {position.z}
      </div>
      <div className="absolute bottom-8 -left-8 z-10 bg-black/70 text-white p-2 rounded text-xs">
        zoom: {camera.zoom}
      </div>
    </Html>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[80, 30]} />
      <meshStandardMaterial color="#e2e8f0" />
    </mesh>
  );
}

function FloorMiddle() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
      <planeGeometry args={[80, 10]} />
      <meshStandardMaterial color="grey" />
    </mesh>
  );
}

function FloorRoad() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-42.5, 0.1, 0]}>
      <planeGeometry args={[5, 30]} />
      <meshStandardMaterial color="grey" />
    </mesh>
  );
}

export default function ShopfloorDashboard() {
  const [buildings, setBuildings] = useState<Building[] | undefined>(undefined);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [, setMqttClient] = useState<ReturnType<typeof mqtt.connect> | null>(null);
  const [refreshTime, setRefreshTime] = useState('')
  const [startHour, setStartHour] = useState(0);
  const [loading, setLoading] = useState(false);

  const [andon, setAndon] = useState<Andon[] | null>(null);

    useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 6 && hour < 14) {
      setStartHour(6);
    } else if (hour >= 14 && hour < 22) {
      setStartHour(14);
    } else {
      setStartHour(22);
    }
  }, []);

    useEffect(() => {
      const client = getMqttClient();
      client.subscribe(`uns/andon`);
      
      client.on("message", (topic, message) => {
        try {
          const messageData = JSON.parse(message.toString());
          setAndon(messageData);

          setBuildings((prevBuildings) => {
            if (!prevBuildings) return prevBuildings;

            const updatedBuildings = prevBuildings.map((building) => {
              const updatedMachines = building.machines.map((machine) => {
                if (machine.MchID === messageData.MchID) {
                  return {
                    ...machine,
                    status: messageData.StatusLight,
                  };
                }
                return machine;
              });

              return {
                ...building,
                machines: updatedMachines,
              };
            });

            return updatedBuildings;
          });
        } catch (error) {
          console.error("Error parsing MQTT message:", error);
        }
      });

      setMqttClient(client);

      return () => {
        client.unsubscribe(`uns/andon`);
        setMqttClient(null);
      };
    }, []);

  // const fetcher = (url: string) => fetch(url).then((res) => res.json());
  // const key = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/andon/buildings`;
  // const { data: rawBuildings, error, isLoading } = useSWR<Building[]>(key, fetcher, {
  //   refreshInterval: 5000,
  // });
  
  const key = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/andon/buildings/injection`;
  const { data: rawBuildings, error } = useSWR<Building[]>(
    key, 
    async (url) => {
      const promise = fetch(url).then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      });
      
      toast.promise(promise, {
        loading: 'Refreshing cycle and energy...',
        error: 'Failed to load buildings'
      });

      setRefreshTime(new Date().toLocaleTimeString())
      
      return promise;
    },
    {
      refreshInterval: 30000,
    }
  );

  // // Log fetch results
  // useEffect(() => {
  //   if (error) {
  //     console.error("Error fetching buildings data:", error);
  //   } else if (rawBuildings) {
  //     console.log("Buildings data fetched:", rawBuildings);
  //   }
  // }, [rawBuildings, error]);

  // Filter out machines with null positions and update state
  useEffect(() => {
      if (!rawBuildings || !Array.isArray(rawBuildings) ||!rawBuildings.length) return;
      
      const filteredBuildings = rawBuildings.map(building => {
        // First filter out machines without positions
        const updatedMachines = building.machines
        .filter(machine => machine.position != null)
        .map(machine => {
          // If we have andon data for this machine, update its status
          if (andon) {
            const matchingAndon = andon.find(a => a.MchID === machine.MchID);
            if (matchingAndon) {
              // Cast the status to a valid Machine status type if it matches one of the allowed values
              const statusLight = matchingAndon.StatusLight as Machine['status'];
              return {
                ...machine,
                status: statusLight
              };
            }
          }
          return machine;
        });
        
        return {
        ...building,
        machines: updatedMachines,
        };
      });
  
      // console.log(`filtered buildings: ${JSON.stringify(filteredBuildings)}`)
      
      setBuildings(filteredBuildings as Building[]);
      setRefreshTime(new Date().toLocaleTimeString())

    
    // Only update selectedBuilding if it exists but don't include it in the dependency array
    if (selectedBuilding) {
      const updatedSelectedBuilding = filteredBuildings.find(building => building.id === selectedBuilding.id) || null;
      
      // Only set if there's an actual change to prevent infinite loops
      if (JSON.stringify(updatedSelectedBuilding) !== JSON.stringify(selectedBuilding)) {
        setSelectedMachine(null); // Reset selected machine when building updates
        setSelectedBuilding(updatedSelectedBuilding);
        // console.log("Selected building updated:", updatedSelectedBuilding);
      }
    }
  }, [rawBuildings]); // Remove selectedBuilding from dependencies


  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  let queryLocation = searchParams.get('building') || '';
    if (queryLocation == '') {
    queryLocation = 'INJ Bld G';
    params.set('building', 'INJ Bld G');
  }

  useEffect(() => {
    if (queryLocation && buildings && Array.isArray(buildings) && queryLocation !== selectedBuilding?.name) {
      setLoading(true);
      const foundBuilding = buildings.find(building => building.name === queryLocation);
      if (foundBuilding) {
        router.push(`${pathname}?${params.toString()}`);
        setSelectedBuilding(foundBuilding);
        
      }
    }
    setLoading(false);
  }, [queryLocation, buildings]);

  // console.log(`data andon : ${JSON.stringify(andon)}`);

  // if (error) return <div>Failed to load</div>;
  // if (!buildings) return <div>Loading...</div>;
  // if (!selectedBuilding) return <div>No Selected Building...</div>;

  return (
    <div className="w-full h-[875px] p-0 m-0">
      <div className="grid grid-cols-3 gap-2 m-0">
        <Card className="absolute top-[70px] left-6 z-10">
          <CardContent className="pb-2 pt-2 px-2">
            <Image src={albeaLogo} alt="Albea" width={200} height={100} className="px-3 py-2 flex items-center border border-gray-250 rounded-xl text-gray-700 align-middle"/>
            <Select
              value={selectedBuilding?.id.toString() || ''}
              onValueChange={(value) => {
              const building = buildings?.find(
                (b) => b.id.toString() === value
              );
              const buildingName = building?.name || '';
              params.set('building', buildingName);
              setLoading(true);
              router.push(`${pathname}?${params.toString()}`);
              setSelectedMachine(null);
              }}
              disabled={loading}
            >
              <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading..." : "Select a building"} />
              </SelectTrigger>
              <SelectContent>
              {Array.isArray(buildings) &&
                buildings?.map((building) => (
                <SelectItem
                  key={building.id}
                  value={building.id.toString()}
                >
                  {building.name}
                </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loading && <div className="text-sm text-muted-foreground mt-2">Loading building data...</div>}

            {selectedBuilding?.machines.length == 0 && <Label>Please define the machine position in this <a href="/admin/machines" className="text-blue-500">link</a></Label>}
          </CardContent>
        </Card>
        <Card className="absolute top-[70px] left-1/2 -translate-x-1/2 z-10">
          <CardHeader>
            <CardTitle className="text-3xl">IMM BUILDING {selectedBuilding?.name.split(' ')[2]}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card className="absolute top-[70px] right-6 w-[500px] z-10 p-0">
        <CardHeader className="flex pb-2 pt-2">
          <CardTitle className="flex justify-between items-center pb-0 mb-0">
            <div className="flex gap-x-8 ">
              <Label className="text-lg">
                OOE <strong>{((selectedBuilding?.ooe || 0)* 100).toFixed(2)}%</strong>
              </Label>
              <Label className="text-lg">
                OEE <strong>{((selectedBuilding?.oee || 0)* 100).toFixed(2)}%</strong>
              </Label>
            </div>
            <div>
              <Label>
                Data is from {startHour}:00 to now
              </Label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 mt-0">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(statusColors).map(([status, color]) => {
              const count = selectedBuilding?.machines.filter(
                (machine) => machine.status === status
              ).length;
              return (
                <div
                  key={status}
                  className="flex flex-shrink items-center gap-2"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm">
                    <strong>{count}</strong>  {status === 'GREEN' ? 'Running' :
                     status === 'WHITE' ? 'PlannedStop' :
                     status === 'BLUE' ? 'Changeover' :
                     status === 'ORANGE' ? 'Breakdown' :
                     status === 'RED' ? 'NonQuality' :
                     status === 'PURPLE' ? 'OrgDisfunction' :
                     status === 'YELLOW' ? 'Microstop' :
                     status === 'GREY' ? 'Unclassified' :
                     status}
                  </span>
                </div>
              );
            })}
            <div className="flex flex-shrink items-center gap-2">
              <span className="text-sm">
                <strong>{selectedBuilding?.machines.length}</strong> Total
              </span>
            </div>
            <Label className="text-xs">
                last refresh at{' '}
                {refreshTime}
              </Label>
          </div>
        </CardContent>
      </Card>
      {Array.isArray(selectedBuilding?.machines) && selectedMachine && (
        <Card className="absolute bottom-4 left-4 w-[350px] z-20">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Machine {selectedMachine.MchID}
              <Button
                variant="default"
                onClick={() => setSelectedMachine(null)}
              >
                <strong>X</strong>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Status</span>
                <span style={{ color: statusColors[selectedMachine?.status] }}>
                  {selectedMachine?.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Energy</span>{' '}
                {selectedMachine?.consumption} kWh
              </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Cycle Time</span>{' '}
                  <div>
                  <span className={selectedMachine?.cycletime <= selectedMachine?.target_cycletime ? "text-green-500" : "text-red-500"}>
                    {selectedMachine?.cycletime}
                  </span> / {selectedMachine?.target_cycletime} s
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Cavity</span>{' '}
                  <div>
                  <span className={selectedMachine?.cavity >= selectedMachine?.target_cavity ? "text-green-500" : "text-red-500"}>
                    {selectedMachine?.cavity}
                  </span> / {selectedMachine?.target_cavity}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                <span className="font-semibold">OEE & OOE</span>{' '}
                  {((selectedMachine?.oee || 0) * 100).toFixed(2)}% & {((selectedMachine?.ooe || 0) * 100).toFixed(2)}%
                </div>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    window.open(
                      `/admin/countboard/?machineNumber=${selectedMachine?.MchNumber}&location=${selectedMachine?.MchLoc}`,
                      '_blank'
                    );
                  }}
                >
                  <Calculator />
                  Countboard
                </Button>

                <Button
                  onClick={() => {
                    window.open(
                      `/admin/ems/?machineNumber=${selectedMachine?.MchNumber}&location=${selectedMachine?.MchLoc}`,
                      '_blank'
                    );
                  }}
                >
                  <Zap />
                  EMS
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ height: '100%', width: '100%' }}
      >
        <Canvas
          camera={{
            position: [-72.23, 39.67, -83.28],
            fov: 20,
            rotation: [-2.69, -0.6, -2.88],
          }}
          shadows
          onCreated={({ gl }) => {
            gl.setClearColor('#808080');
            gl.toneMappingExposure = 1.2; // Lower exposure for better balance
            gl.shadowMap.enabled = false;
            gl.shadowMap.type = PCFSoftShadowMap; // Softer shadows
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={5} />
            <directionalLight position={[0, 100, 0]} intensity={2} />{' '}
            <directionalLight position={[0, -100, 0]} intensity={2} />{' '}
            <directionalLight position={[100, 0, 0]} intensity={2} />{' '}
            <directionalLight position={[-100, 0, 0]} intensity={2} />{' '}
            <directionalLight position={[50, 50, 50]} intensity={2} castShadow/>{' '}
            <directionalLight position={[-50, 50, 50]} intensity={2} />{' '}
            <directionalLight position={[-50, 0, -50]} intensity={2} />{' '}
              <spotLight
              position={[0, 50, 0]}
              angle={0.3}
              penumbra={1}
              intensity={2}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
  
            <Floor />
            <FloorMiddle />
            <FloorRoad />
            <Wall position={[0, 5, 15]} size={[80, 10, 0.5]} />
            <Wall
              position={[40, 5, 0]}
              rotation={[0, Math.PI / 2, 0]}
              size={[30, 10, 0.5]}
            />
            {Array.isArray(selectedBuilding?.machines)
              ? selectedBuilding?.machines.map((machine) => (
                  <InjectionMoldingMachine
                    key={machine?.id}
                    machine={machine}
                    onClick={() => setSelectedMachine(machine)}
                    isSelected={selectedMachine?.id === machine?.id}
                  />
                ))
              : null}
            <YoureHere position={[-40,0,0]} rotation={[0, Math.PI/2, 0]}/>
            {/* <CameraLogger /> */}
            <OrbitControls
              target={[0, 0, 10]}
              makeDefault
              enableDamping={true}
              enableZoom={true}
              minDistance={10}
              maxDistance={200}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

