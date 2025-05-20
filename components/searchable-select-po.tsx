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
import { Label } from "./ui/label"

type PoNumber = {
  poNumber: string
  poId: number
  materialId: number
  materialName: string
}


export function SearchablePOSelect({
  value = null,
  onValueChange
}: {
  value: PoNumber | null
  onValueChange: (value: PoNumber | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [poNumbers, setPoNumbers] = useState<PoNumber[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchPoNumber, setSearchPoNumber] = useState('');

  useEffect(() => {
    const fetchPo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/coois?poName=${searchPoNumber}`, {
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
          className="w-full justify-between flex"
        >
          {value?.poNumber || 'Select PO Number'}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 h-60 flex">
        <Command className="flex">
          <CommandInput
            placeholder="Search PO number..."
            className="h-9"
            value={searchPoNumber}
            required
            onChangeCapture={handleSearchPoNumberChange}
          />
          <CommandEmpty>No PO number found.</CommandEmpty>
          <ScrollArea className="h-60 flex" type="always">
            <CommandGroup>
              {loading ? (
                <p className="px-4 py-2 text-center text-sm text-muted-foreground">
                  Please input PO number...
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
                      onValueChange(
                        currentValue === value?.poNumber ? null : poNumberObj
                      )
                      setOpen(false)
                    }}
                  >
                    {poNumberObj.poNumber}
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        value?.poNumber === poNumberObj.poNumber
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  )  
}

