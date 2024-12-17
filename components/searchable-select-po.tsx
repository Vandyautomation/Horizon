"use client"

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

type PoNumber = {
  poNumber: string
  poId: number
}


export function SearchablePOSelect({
  value = "", // Provide a default empty string to avoid undefined issues
  onValueChange
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [poNumbers, setPoNumbers] = useState<PoNumber[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchPoNumber, setSearchPoNumber] = useState('');

  useEffect(() => {
    const fetchPo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/coois?poName=${searchPoNumber}`, {
          credentials: "include",
        });
        const data = await response.json();
        setPoNumbers(data);
      } catch (error) {
        console.error("Error fetching PO:", error);
      } finally {
        setLoading(false);
      }
    };

    if (searchPoNumber) {
      fetchPo();
    }
  }, [searchPoNumber]);

  const handleSearchPoNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPoNumber(event.currentTarget.value);
  }

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
      <PopoverContent className="p-0">
        <Command className="">
          <CommandInput placeholder="Search PO number..." className="h-9" value={searchPoNumber} onChangeCapture={handleSearchPoNumberChange} />
          <CommandEmpty>No PO number found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-60" type="always">
              {loading ? (
                <p className="px-4 py-2 text-center text-sm text-muted-foreground">
                  Loading PO numbers...
                </p>
              ) : poNumbers.length === 0 ? (
                <p className="px-4 py-2 text-center text-sm text-muted-foreground">
                  No PO number found.
                </p>
              ) : (
                poNumbers.map((poNumberObj) => (
                  <CommandItem
                    key={poNumberObj.poId}
                    value={poNumberObj.poNumber}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {poNumberObj.poNumber}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === poNumberObj.poNumber ? "opacity-100" : "opacity-0"
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

