"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import Image from "next/image";
import albeaLogo from "@/public/albea-white.png"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import mqtt from "mqtt";

import { Button } from './ui/button';
import useSWR from 'swr';
import { Label } from './ui/label';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calculator, Power, Zap } from 'lucide-react';
import { toast } from "react-hot-toast";

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
    | 'YELLOW';
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

const statusLabels = {
  GREEN: "Running",
  WHITE: "Planned Stop",
  BLUE: "Changeover",
  ORANGE: "Breakdown",
  RED: "Non Quality",
  PURPLE: "Org Dysfunction",
  YELLOW: "Micro Stop",
};

const statusColors = {
  GREEN: "#22c55e",
  WHITE: "#9ca3af",
  BLUE: "#3b82f6",
  ORANGE: "#ffa500",
  RED: "#ef4444",
  PURPLE: "#a855f7",
  YELLOW: "yellow",
};

// Group machines by building code (MchLoc)
function groupByBuilding(machines: Machine[]) {
  return machines.reduce((acc: Record<string, Machine[]>, machine: Machine) => {
    const loc = machine.MchLoc || 'Unknown';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(machine);
    return acc;
  }, {});
}

// Count statuses for a group of machines
function countStatuses(machines: Machine[]) {
  const statusTypes = ['GREEN', 'WHITE', 'BLUE', 'ORANGE', 'RED', 'PURPLE', 'YELLOW'];
  const counts: Record<string, number> = {};
  statusTypes.forEach(status => counts[status] = 0);
  machines.forEach(m => {
    if (counts[m.status] !== undefined) counts[m.status]++;
  });
  return counts;
}

export default function AndonOverallDashboard() {
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
      const client = mqtt.connect(`${process.env.NEXT_PUBLIC_MQTT_WS}`);
      client.on("connect", () => {
        console.log("Connected to MQTT broker");
        client.subscribe(`uns/andon`);
      });
      client.on("message", (topic, message) => {
        try {
          const messageData = JSON.parse(message.toString());
          // console.log(`new message:${messageData}`);
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
        console.log(`updated building from mqtt : ${JSON.stringify(buildings)}`)

      setMqttClient(client);
  
      return () => {
        client.end();
        console.log("Disconnected to MQTT broker");
  
        setMqttClient(null);
      };
    }, []);

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
  

      
      setBuildings(filteredBuildings as Building[]);
      setRefreshTime(new Date().toLocaleTimeString())

    
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

  // console.log(`buildings: ${JSON.stringify(buildings)}`)
  

  return (
    <div className="w-full h-full ">
        <div className="p-4">
          {/* <Image src={albeaLogo} alt="Albea" width={200} height={100} className="px-3 py-2 flex items-center border border-gray-250 rounded-xl text-gray-700 align-middle"/> */}
          {/* ALL Machines Summary Card */}
          <div className="mb-4">
            
            <div className="grid grid-cols-10 gap-2 mt-2">
               <Card className="bg-gray-800 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">ALL</span>
                  <span className="text-4xl font-bold">
                    {buildings?.reduce((acc, building) => acc + building.machines.length, 0) || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
              <Card className="bg-orange-500 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-sm">Breakdown</div>
                  <div className="text-3xl font-bold">
                    {buildings?.reduce((acc, building) => 
                      acc + building.machines.filter(m => m.status === 'ORANGE').length, 0) || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-600 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-sm">Running</div>
                  <div className="text-3xl font-bold">
                    {buildings?.reduce((acc, building) => 
                      acc + building.machines.filter(m => m.status === 'GREEN').length, 0) || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-100">
                <CardContent className="p-4 text-center">
                  <div className="text-sm">Planned Stop</div>
                  <div className="text-3xl font-bold">
                    {buildings?.reduce((acc, building) => 
                      acc + building.machines.filter(m => m.status === 'WHITE').length, 0) || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-500 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-sm">Org Dysfuncti...</div>
                  <div className="text-3xl font-bold">
                    {buildings?.reduce((acc, building) => 
                      acc + building.machines.filter(m => m.status === 'PURPLE').length, 0) || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-500 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-sm">SMED</div>
                  <div className="text-3xl font-bold">
                    {buildings?.reduce((acc, building) => 
                      acc + building.machines.filter(m => m.status === 'BLUE').length, 0) || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-400 text-black">
                <CardContent className="p-4 text-center">
                  <div className="text-sm">Micro Stop</div>
                  <div className="text-3xl font-bold">
                    {buildings?.reduce((acc, building) => 
                      acc + building.machines.filter(m => m.status === 'YELLOW').length, 0) || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-red-500 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-sm">Non Scrap</div>
                  <div className="text-3xl font-bold">
                    {buildings?.reduce((acc, building) => 
                      acc + building.machines.filter(m => m.status === 'RED').length, 0) || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-cyan-500 text-white">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm">OEE</div>
                          <div className="text-3xl font-bold">{buildings?.length ? ((buildings.reduce((acc, building) => acc + building.oee, 0) || 0) / buildings.length * 100).toFixed(2) : '0'}%</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-cyan-600 text-white">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm">OOE</div>
                          <div className="text-3xl font-bold">{buildings?.length ? ((buildings.reduce((acc, building) => acc + building.ooe, 0) || 0) / buildings.length * 100).toFixed(2) : '0'}%</div>
                        </CardContent>
                      </Card>
            </div>
          </div>
          
          {/* Building Cards */}
          {buildings?.map(building => {
            // Group machines by location (MchLoc)
            const locationGroups = groupByBuilding(building.machines);
            
            return Object.entries(locationGroups).map(([location, machines]) => {
              const counts = countStatuses(machines);
              
              return (
                <div className="mb-2" key={`${building.id}-${location}`}>
                  <div className="grid grid-cols-10 gap-2 mt-2">
                    <Card className="bg-gray-800 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-l font-bold">{location}</span>
                        <span className="text-2xl font-bold">{machines.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                    <Card className="bg-orange-500 text-white">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm">Breakdown</div>
                        <div className="text-3xl font-bold">{counts['ORANGE'] || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-600 text-white">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm">Running</div>
                        <div className="text-3xl font-bold">{counts['GREEN'] || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm">Planned Stop</div>
                        <div className="text-3xl font-bold">{counts['WHITE'] || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-500 text-white">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm">Org Dysfuncti...</div>
                        <div className="text-3xl font-bold">{counts['PURPLE'] || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-blue-500 text-white">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm">SMED</div>
                        <div className="text-3xl font-bold">{counts['BLUE'] || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-yellow-400 text-black">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm">Micro Stop</div>
                        <div className="text-3xl font-bold">{counts['YELLOW'] || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-red-500 text-white">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm">Non Scrap</div>
                        <div className="text-3xl font-bold">{counts['RED'] || 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-cyan-500 text-white">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm">OEE</div>
                          <div className="text-3xl font-bold">{((building.oee || 0) * 100).toFixed(2)}%</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-cyan-600 text-white">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm">OOE</div>
                          <div className="text-3xl font-bold">{((building.ooe || 0) * 100).toFixed(2)}%</div>
                        </CardContent>
                      </Card>
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>
  );
}

