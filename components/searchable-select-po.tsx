"use client"

import * as React from "react"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check } from "lucide-react"

// Sample data for PO numbers
const samplePONumbers = Array.from(
  { length: 50 },
  (_, i) => `PO-${(1000 + i).toString().padStart(4, '0')}`
)

export function SearchablePOSelect({
    value = "", // Provide a default empty string to avoid undefined issues
    onValueChange
  }: {
    value: string
    onValueChange: (value: string) => void
  }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select PO Number"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className=" p-0">
        <Command className="">
          <CommandInput placeholder="Search PO number..." className="h-9" />
               <CommandEmpty>No PO number found.</CommandEmpty>
                <CommandGroup className="overflow-y-auto">
                  <CommandList className="h-max overflow-y-auto">
                 <ScrollArea className="h-60" type="always" >
                    {samplePONumbers.map((poNumber) => (
                    <CommandItem
                    key={poNumber}
                    value={poNumber}
                    onSelect={(currentValue) => {
                        onValueChange(currentValue === value ? "" : currentValue)
                        setOpen(false)
                    }}
                    >
                    {poNumber}
                    <Check
                        className={cn(
                        "ml-auto h-4 w-4",
                        value === poNumber ? "opacity-100" : "opacity-0"
                        )}
                    />
                    </CommandItem>
                ))}
                 </ScrollArea>
                  </CommandList>

                </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
