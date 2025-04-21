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

type TaskCategoryDetail = {
  id: number;
  uuid: string;
  name: string;
};

export function SearchableTaskCategorySelect({
  value = null,
  onValueChange
}: {
  value: TaskCategoryDetail | null
  onValueChange: (value: TaskCategoryDetail | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [allTaskCategories, setAllTaskCategories] = useState<TaskCategoryDetail[]>([]); // Store all machines
  const [loading, setLoading] = useState(true);
  const [searchRole, setSearchRole] = useState('');
  const [filteredTaskCategories, setFilteredTaskCategories] = useState<TaskCategoryDetail[]>([]);
  
  useEffect(() => {
    const newTaskCategoryList = allTaskCategories.filter(task_category => 
      task_category.name.toLowerCase().includes(searchRole.toLowerCase())
    );
    setFilteredTaskCategories(newTaskCategoryList);
  }, [searchRole, allTaskCategories]); // Update filtered machines when search term or all machines change
  console.log("Filtered Task Categories: ", filteredTaskCategories);



  useEffect(() => {
    const fetchTaskCategory = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/task_categories`);
        const data = await response.json();
        setAllTaskCategories(data.data);
      } catch (error) {
        console.error("Error fetching role:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTaskCategory();
  }, []);


  // Rest of the component remains the same, but use filteredTaskCategories instead of machineList
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value?.name || "Select TaskCategory"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command className="">
          <CommandInput 
            placeholder="Search Task Category..." 
            className="h-9" 
            value={searchRole} 
            onValueChange={setSearchRole} 
          />
          <CommandEmpty>No Task Category found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
              {loading ? (
                <p className="px-4 py-2 text-center text-sm text-muted-foreground">
                  Loading Task Categories...
                </p>
              ) : filteredTaskCategories.length === 0 ? (
                <p className="px-4 py-2 text-center text-sm text-muted-foreground">
                  No Task Category found.
                </p>
              ) : (
                filteredTaskCategories.map((task_category) => (
                  <CommandItem
                    key={task_category.id}
                    value={task_category.name}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value?.name ? null : task_category);
                      setOpen(false);
                    }}
                  >
                    {task_category.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value?.name === task_category.name ? "opacity-100" : "opacity-0"
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
