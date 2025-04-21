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

type RoleDetail = {
  id: number;
  name: string;
  display_name: string;
};

export function SearchableRoleSelect({
  value = null,
  onValueChange
}: {
  value: RoleDetail | null
  onValueChange: (value: RoleDetail | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [allRoles, setAllRoles] = useState<RoleDetail[]>([]); // Store all machines
  const [loading, setLoading] = useState(true);
  const [searchRole, setSearchRole] = useState('');
  const [filteredRoles, setFilteredRoles] = useState<RoleDetail[]>([]);
  
  useEffect(() => {
    const newRoleList = allRoles.filter(role => 
      role.display_name.toLowerCase().includes(searchRole.toLowerCase())
    );
    setFilteredRoles(newRoleList);
  }, [searchRole, allRoles]); // Update filtered machines when search term or all machines change
  console.log("Filtered Roles: ", filteredRoles);



  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/roles`);
        const data = await response.json();
        setAllRoles(data);
      } catch (error) {
        console.error("Error fetching role:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);


  // Rest of the component remains the same, but use filteredRoles instead of machineList
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value?.display_name || "Select Role"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command className="">
          <CommandInput 
            placeholder="Search Role..." 
            className="h-9" 
            value={searchRole} 
            onValueChange={setSearchRole} 
          />
          <CommandEmpty>No Role found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
              <p className="px-4 py-2 text-center text-sm">
                Showing {filteredRoles.length} machines
              </p>
              {loading ? (
                <p className="px-4 py-2 text-center text-sm text-muted-foreground">
                  Loading Role...
                </p>
              ) : filteredRoles.length === 0 ? (
                <p className="px-4 py-2 text-center text-sm text-muted-foreground">
                  No Role found.
                </p>
              ) : (
                filteredRoles.map((role) => (
                  <CommandItem
                    key={role.id}
                    value={role.display_name}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value?.display_name ? null : role);
                      setOpen(false);
                    }}
                  >
                    {role.display_name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value?.display_name === role.display_name ? "opacity-100" : "opacity-0"
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
