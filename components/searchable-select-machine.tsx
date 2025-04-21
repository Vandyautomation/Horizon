import { useState, useEffect } from "react"

import { CaretSortIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check } from "lucide-react"
import { Label } from "./ui/label"

type MachineDetail = {
  machineId: number;
  machineName: string;
  machineTonage: string;
  machineDescription: string;
  machineNumber: string;
  locationId: number;
  locationName: string;
};

export function SearchableMachineSelect({
  value = null,
  onValueChange
}: {
  value: MachineDetail | null
  onValueChange: (value: MachineDetail | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [allMachines, setAllMachines] = useState<MachineDetail[]>([]); // Store all machines
  const [loading, setLoading] = useState(true);
  const [searchMachine, setSearchMachine] = useState('');
  const [filteredMachines, setFilteredMachines] = useState<MachineDetail[]>([]);
  
  useEffect(() => {
    const newMachineList = allMachines.filter(machine => 
      machine.machineDescription.toLowerCase().includes(searchMachine.toLowerCase())
    );
    setFilteredMachines(newMachineList);
  }, [searchMachine, allMachines]); // Update filtered machines when search term or all machines change
  console.log("Filtered Machines: ", filteredMachines);



  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines?type=injection`);
        const data = await response.json();
        setAllMachines(data);
      } catch (error) {
        console.error("Error fetching machine:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMachine();
  }, []);


  // Rest of the component remains the same, but use filteredMachines instead of machineList
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value?.machineDescription || "Select Machine"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command className="">
          <CommandInput 
            placeholder="Search Machine..." 
            className="h-9" 
            value={searchMachine} 
            onValueChange={setSearchMachine} 
          />
          <CommandEmpty>No Machine found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
              <p className="px-4 py-2 text-center text-sm">
                Showing {filteredMachines.length} machines
              </p>
              {loading ? (
                <p className="px-4 py-2 text-center text-sm text-muted-foreground">
                  Loading Machine...
                </p>
              ) : filteredMachines.length === 0 ? (
                <p className="px-4 py-2 text-center text-sm text-muted-foreground">
                  No Machine found.
                </p>
              ) : (
                filteredMachines.map((machine) => (
                  <CommandItem
                    key={machine.machineId}
                    value={machine.machineDescription}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value?.machineDescription ? null : machine);
                      setOpen(false);
                    }}
                  >
                    {machine.machineDescription}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value?.machineDescription === machine.machineDescription ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))
              )}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );  
}
