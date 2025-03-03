"use client"

import { useState, useEffect, Suspense, useMemo } from "react"

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

import { Color, Mesh, MeshStandardMaterial, PCFSoftShadowMap } from 'three';
import { Button } from './ui/button';
import useSWR from 'swr';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';
import { Calculator, Power, Zap } from 'lucide-react';

interface Machine {
  id: string;
  position: any;
  rotation: any;
  MchID: string;
  MchLoc: string;
  MchNumber: string;
  consumption: number;
  status:
    | 'Running'
    | 'PlannedStop'
    | 'Changeover'
    | 'Breakdown'
    | 'OrgDisfunction'
    | 'NonQuality'
    | 'Microstop';
}

interface Building {
  id: number;
  name: string;
  machines: Machine[];
}

const statusColors = {
  Running: '#22c55e', // Green
  PlannedStop: '#9ca3af', // Gray
  Changeover: '#3b82f6', // Blue
  Breakdown: '#ffa500', // Darker orange
  NonQuality: '#ef4444', // Red
  OrgDisfunction: '#a855f7', // Purple
  Microstop: 'yellow', // Yellow
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

function InjectionMoldingMachine({
  machine,
  onClick,
  isSelected,
}: {
  machine: Machine;
  onClick: () => void;
  isSelected: boolean;
}) {
  const { scene } = useGLTF('/admin/assets/3d/inject_new2.glb');
  const clonedScene = useMemo(() => scene?.clone(), [scene]);

  useEffect(() => {
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if ((child as any).isMesh && (child as Mesh).material) {
          const originalColor = new Color(statusColors[machine?.status]);
          // Create a material with emissive properties for better visibility
          (child as any).material = new MeshStandardMaterial({
            ...((child as any).material as any),
            color: originalColor,
            emissive: originalColor.clone().multiplyScalar(0.3),
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
        scale={[0.015, 0.015, 0.015]}
        rotation={[
          machine.rotation[0],
          machine.rotation[1] == 0 ? (3.14 * 3) / 2 : machine.rotation[1] * 0.5,
          machine.rotation[2],
        ]}
      />
      {machine?.status === 'Breakdown' && (
        <mesh position={[0, 0, 0]}>
          <Html position={[0, 4, 0]} center>
            <div className="bg-orange-500 text-white p-0.5 text-sm rounded-full border">
              Breakdown!
            </div>
          </Html>
        </mesh>
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
      {/* <group position={[0, 3.25, 0]} rotation={[0, Math.PI / 3, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.6, 0.1]} />
          <meshStandardMaterial color={statusColors[machine?.status]} />
        </mesh>
        <Text
          position={[0, 0, -0.06]}
          fontSize={0.5}
          fontWeight={'bold'}
          color="black"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI, 0]}
        >
          {machine.id}
        </Text>
      </group> */}
      <Html position={[0, 0, -3]} center>
        <div
          style={{
            backgroundColor: statusColors[machine?.status],
            boxShadow: isSelected ? '0 0 0 3px white' : '0 0 0 1px white',
          }}
          className={`bg-opacity-50 text-white p-1 rounded text-xs text-nowrap ${
            isSelected ? 'font-bold' : ''
          }`}
        >
          {machine.consumption} kWh
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

function YoureHere() {
  return (
    <Html position={[-40, 1, 0]} center>
      <div className="text-center text-sm">
        <div className="bg-primary text-white p-1 rounded-md">You are here</div>
        <div
          className="w-0 h-0 mx-auto"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid var(--primary)',
          }}
        />
      </div>
    </Html>
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
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const key = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/andon/buildings`;
  const { data: buildings, error } = useSWR<Building[]>(key, fetcher, {
    refreshInterval: 5000,
  });
  const router = useRouter();

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null
  );
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  useEffect(() => {
    if (buildings && buildings.length > 0 && !selectedBuilding) {
      setSelectedBuilding(buildings[0]);
      console.log(buildings[0]);
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
                const building = buildings?.find(
                  (b) => b.id.toString() === value
                );
                setSelectedBuilding(building || null);
                setSelectedMachine(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a building" />
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
          <CardTitle className="flex gap-4 justify-between items-center">
            Machines Status
            <div className="flex gap-2">
              <Label>
                OOE <strong>53.3%</strong>
              </Label>
              <Label>
                OEE <strong>53.3%</strong>
              </Label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    <strong>{count}</strong> {status}
                  </span>
                </div>
              );
            })}
            <div className="flex flex-shrink col-span-2 items-center gap-2">
              <span className="text-sm">
                <strong>{selectedBuilding?.machines.length}</strong> Total
                Active Machine
              </span>
            </div>
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
                <span className="font-semibold">Status:</span>
                <span style={{ color: statusColors[selectedMachine?.status] }}>
                  {selectedMachine?.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Energy Consumption:</span>{' '}
                {selectedMachine?.consumption} kWh
              </div>
              <div className="grid grid-cols-1 gap-4">
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
            <directionalLight position={[50, 50, 50]} intensity={2} />{' '}
            <directionalLight position={[-50, 50, 50]} intensity={2} />{' '}
            <directionalLight position={[-50, 0, -50]} intensity={2} />{' '}
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
              ? selectedBuilding.machines.map((machine) => (
                  <InjectionMoldingMachine
                    key={machine?.id}
                    machine={machine}
                    onClick={() => setSelectedMachine(machine)}
                    isSelected={selectedMachine?.id === machine?.id}
                  />
                ))
              : null}
            <YoureHere />
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
      ;
    </div>
  );
}

