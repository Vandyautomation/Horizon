'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronsUpDown,
  Edit,
  MoreHorizontal,
  Plus,
  Trash,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Machine = {
  id: string;
  name: string;
  description: string;
  tonage: string;
  process: string;
  location: string;
  position: string;
  rotation: string;
  uap: string;
  equipment: string;
};
type Equipment = {
  id: string;
  name: string;
  brand: string;
  energyBudget: number;
};

type UAP = {
  name: string;
};

type Location = {
  name: string;
};

export function MachinesForm() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [UAP, setUAP] = useState<UAP[]>([]);
  const [Location, setLocation] = useState<Location[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);

  // const UAP = ['BASIC', 'PREMIUM', 'LEAN', 'UV'];
  // const Location = [
  //   'INJ Bld G',
  //   'INJ Bld H',
  //   'INJ Bld J',
  //   'INJ Bld Q',
  //   'INJ Bld R',
  //   'INJ Bld S',
  //   'K',
  //   'M',
  //   'E',
  //   'SP',
  // ];

  // const Equipments = ['MTC', 'Conveyor', 'Robot', 'HB'];

  // Define columns for TanStack table
  const columns: ColumnDef<Machine>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          MchID
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          MchDesc
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'tonage',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Tonage
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Location
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'process',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Process
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'uap',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          UAP
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'equipment',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Equipments
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'position',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Position
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'rotation',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Rotation
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: 'actions',
      header: ({ column }) => <>Action</>,
      cell: ({ row }) => {
        const machine = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingMachine(machine)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {/* <DropdownMenuSeparator /> */}
                {/* <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setDeletingMachine(machine)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  // Initialize table
  const table = useReactTable({
    data: machines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      columnVisibility: {
        "rotation": false,
        "position": false,
      },
      pagination: {
        pageSize: 10,
      },
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines`,
          {}
        )
        const data = await response.json()
        if (data) {
          const formattedData = data.map((item: any) => ({
            id: item.machineId.toString(),
            name: item.machineName,
            description: item.machineDescription,
            tonage: item.tonage,
            process: item.Process,
            uap: item.uap,
            location: item.locationName,
            position: item.position,
            rotation: item.rotation,
            equipment: item.equipment,
          }))
          setMachines(formattedData)
        } else {
          console.error('Failed to fetch machines:', data.error)
        }
      } catch (error) {
        console.error('Error fetching machines:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/equipments`,
          {}
        )
        const data = await response.json()
        if (data) {
          const formattedData = data.map((item: any) => ({
            id: item.EquipmentID.toString(),
            name: item.Name,
            brand: item.Brand,
            energyBudget: item.EnergyBudget,
          }))
          setEquipments(formattedData)
        } else {
          console.error('Failed to fetch equipments:', data.error)
        }
      } catch (error) {
        console.error('Error fetching equipments:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/locations`,
          {}
        )
        const data = await response.json()
        if (data) {
          const formattedData = data.map((item: any) => ({
            name: item.name,
          }))
          setLocation(formattedData)
        } else {
          console.error('Failed to fetch locations:', data.error)
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/uaps`,
          {}
        )
        const data = await response.json()
        if (data) {
          const formattedData = data.map((item: any) => ({
            name: item.name,
          }))
          setUAP(formattedData)
        } else {
          console.error('Failed to fetch UAPs:', data.error)
        }
      } catch (error) {
        console.error('Error fetching UAPs:', error)
      }
    }
    fetchData()
  }, [])

  const addMachine = (newMachine: Omit<Machine, 'id'>) => {
    const id = (machines.length + 1).toString()
    setMachines([...machines, { ...newMachine, id }])
  }

  const updateMachine = async (updatedMachine: Machine) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines/${updatedMachine.name}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            machineName: updatedMachine.name,
            machineDescription: updatedMachine.description,
            machineTonage: updatedMachine.tonage,
            machineProcess: updatedMachine.process,
            machineUap: updatedMachine.uap,
            machineLocation: updatedMachine.location,
            machinePosition: updatedMachine.position,
            machineRotation: updatedMachine.rotation,
            machineEquipment: updatedMachine.equipment,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update machine')
      } else {
        setMachines(
          machines.map((machine) =>
            machine.id === updatedMachine.id ? updatedMachine : machine
          )
        )
        toast.success('Machine updated successfully')
      }
    } catch (error) {
      console.error('Error updating machine:', error)
      toast.error('Failed to update machine')
    }
  }

  const deleteMachine = (id: string) => {
    setMachines(machines.filter((machine) => machine.id !== id))
  }

  return (
    <div className="h-full flex-1 flex-col space-y-4 p-4 md:flex">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Machines</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your machines
          </p>
        </div>
        <div className="ml-auto px-3 space-x-3">
          <Dialog>
            <DialogTrigger asChild>
              {/* <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button> */}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Machine</DialogTitle>
                <DialogDescription>
                  Enter the details of the new machine here. Click save when
                  you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const newMachine = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    process: formData.get('process') as string,
                    location: formData.get('location') as string,
                    position: formData.get('position') as string,
                    rotation: formData.get('rotation') as string,
                    uap: formData.get('uap') as string,
                    equipment: formData.get('equipment') as string,
                    tonage: formData.get('tonage') as string,
                  }
                  addMachine(newMachine)
                  e.currentTarget.reset()
                  toast.success('Machine created successfully')
                }}
              >
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      MchID
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      MchDesc
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tonage" className="text-right">
                      Tonage
                    </Label>
                    <Input
                      id="tonage"
                      name="tonage"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="process" className="text-right">
                      Process
                    </Label>
                    <Input
                      id="process"
                      name="process"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">
                      Location
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="position" className="text-right">
                      Position
                    </Label>
                    <Input
                      id="position"
                      name="position"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rotation" className="text-right">
                      Rotation
                    </Label>
                    <Input
                      id="rotation"
                      name="rotation"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="uap" className="text-right">
                      UAP
                    </Label>
                    <Input
                      id="uap"
                      name="uap"
                      className="col-span-3"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={() => {
                      DialogTrigger
                    }}
                  >
                    Add machine
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto h-8 lg:flex"
                >
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter(
                    (column) => column.id !== 'actions' && column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="text-center"
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing{' '}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{' '}
            to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} entries
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
        <Dialog
          open={!!deletingMachine}
          onOpenChange={() => setDeletingMachine(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Machine</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this machine?
              </DialogDescription>
            </DialogHeader>
            {deletingMachine && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const deletedMachine = {
                    id: deletingMachine.id,
                  }
                  deleteMachine(deletedMachine.id)
                  setDeletingMachine(null)
                  toast.success('Machine deleted successfully')
                }}
              >
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="delete-name" className="text-right">
                    MchID
                  </Label>
                  <Label htmlFor="delete-name" className="col-span-3">
                    {deletingMachine?.name}
                  </Label>
                </div>
                <DialogFooter>
                  <Button type="submit" variant="destructive">
                    Yes
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      No
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!editingMachine}
          onOpenChange={() => setEditingMachine(null)}
        >
          <DialogContent className="sm:max-w-[850px]">
            <DialogHeader>
              <DialogTitle>Edit Machine</DialogTitle>
              <DialogDescription>
                Make changes to the machine here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            {editingMachine && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const updatedMachine = {
                    id: editingMachine.id,
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    process: formData.get('process') as string,
                    location: editingMachine.location,
                    position: formData.get('position') as string,
                    rotation: editingMachine.position && JSON.parse(editingMachine?.position)[2] === 10 ? '[0, 3.14, 0]' : '[0, 0, 0]',
                    uap: formData.get('uap') as string,
                    equipment: editingMachine.equipment,
                    tonage: formData.get('tonage') as string,
                  }
                  updateMachine(updatedMachine)
                  setEditingMachine(null)
                }}
              >
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="">
                    <div className="grid grid-cols-4 items-center gap-4 pb-4">
                      <Label htmlFor="edit-name" className="text-right">
                        MchID
                      </Label>
                      <Input
                        id="edit-name"
                        name="name"
                        defaultValue={editingMachine.name}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4 pb-4">
                      <Label htmlFor="edit-description" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="edit-description"
                        name="description"
                        defaultValue={editingMachine.description}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4 pb-4">
                      <Label htmlFor="edit-tonage" className="text-right">
                        Tonage
                      </Label>
                      <Input
                        id="edit-tonage"
                        name="tonage"
                        defaultValue={editingMachine.tonage}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4 pb-4">
                      <Label htmlFor="edit-process" className="text-right">
                        Process
                      </Label>
                      <Input
                        id="edit-process"
                        name="process"
                        defaultValue={editingMachine.process}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4 pb-4">
                      <Label htmlFor="edit-location" className="text-right">
                        Location
                      </Label>
                      <Select
                        name="location"
                        value={editingMachine.location}
                        onValueChange={(value) => {
                          setEditingMachine({
                            ...editingMachine,
                            location: value,
                          })
                        }}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                          {Location.map((loc) => (
                            <SelectItem key={loc.name} value={loc.name}>
                              {loc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4 pb-4">
                      <Label htmlFor="edit-uap" className="text-right">
                        UAP
                      </Label>
                      <Select
                        name="uap"
                        value={editingMachine.uap}
                        onValueChange={(value) => {
                          setEditingMachine({
                            ...editingMachine,
                            uap: value,
                          })
                        }}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="UAP" />
                        </SelectTrigger>
                        <SelectContent>
                          {UAP.map((uap) => (
                            <SelectItem key={uap.name} value={uap.name}>
                              {uap.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div
                      className={`grid grid-cols-4 gap-4 pb-4 ${
                        editingMachine.equipment
                          ? 'items-start'
                          : 'items-center'
                      }`}
                    >
                      <Label htmlFor="edit-equipment" className="text-center">
                        Equipments
                      </Label>
                      {(() => {
                        const selectedEquipments = editingMachine.equipment
                          ? editingMachine.equipment.split(',').filter(Boolean)
                          : []

                        return (
                          <div className="col-span-3">
                            <div className="mb-2 flex flex-wrap gap-2">
                              {selectedEquipments.map((eq: string) => (
                                <span
                                  key={eq}
                                  className="flex items-center rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground"
                                >
                                  {eq}
                                  <button
                                    onClick={() => {
                                      const newSelections =
                                        selectedEquipments.filter(
                                          (item: string) => item !== eq
                                        )
                                      setEditingMachine({
                                        ...editingMachine,
                                        equipment: newSelections.join(','),
                                      })
                                    }}
                                    className="ml-1 text-red-500"
                                  >
                                    X
                                  </button>
                                </span>
                              ))}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between"
                                >
                                  {selectedEquipments.length
                                    ? 'Add/Remove Equipments'
                                    : 'Select Equipments'}
                                  <ChevronsUpDown className="ml-2 h-2 w-2 text-primary/50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-48"
                              >
                                <DropdownMenuCheckboxItem
                                  className=""
                                  checked={
                                    selectedEquipments.length ===
                                    equipments.length
                                  }
                                  onSelect={(e) => e.preventDefault()}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setEditingMachine({
                                        ...editingMachine,
                                        equipment: equipments
                                          .map((eq) => eq.name)
                                          .join(','),
                                      })
                                    } else {
                                      setEditingMachine({
                                        ...editingMachine,
                                        equipment: '',
                                      })
                                    }
                                  }}
                                >
                                  Select All
                                </DropdownMenuCheckboxItem>
                                {/* ; */}
                                {equipments.map((eq) => {
                                  const isSelected =
                                    selectedEquipments.includes(eq.name)
                                  return (
                                    <DropdownMenuCheckboxItem
                                      className=""
                                      key={eq.id}
                                      checked={isSelected}
                                      onSelect={(e) => e.preventDefault()}
                                      onCheckedChange={(checked) => {
                                        let newSelections = [
                                          ...selectedEquipments,
                                        ]
                                        if (checked) {
                                          newSelections.push(eq.name)
                                        } else {
                                          newSelections = newSelections.filter(
                                            (item: string) => item !== eq.name
                                          )
                                        }
                                        setEditingMachine({
                                          ...editingMachine,
                                          equipment: newSelections.join(','),
                                        })
                                      }}
                                    >
                                      {eq.name} - {eq.energyBudget || 0} kWh
                                    </DropdownMenuCheckboxItem>
                                  )
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                  <div>
                    <div>
                      <div className="grid grid-cols-4 items-center gap-4 pb-4">
                        <Label
                          htmlFor="edit-position"
                          className="text-right"
                        ></Label>
                        <div className="col-span-3">
                          <div className=" mr-12 text-center">Position</div>
                          <div className="text-sm text-muted-foreground text-center mr-12">
                            Selected position:{' '}
                            {editingMachine.position || 'None'}
                          </div>
                          <div className="grid grid-cols-2 gap-0.5 mb-1 ml-16">
                            {Array.from({ length: 14 }).map((_, colIndex) =>
                              Array.from({ length: 2 }).map((_, rowIndex) => {
                                // Calculate position values
                                // x goes from -35 (left) to +30 (right), middle (col 7) is x=0
                                const x = -(colIndex - 6) * 5
                                // y is always 0
                                const y = 0
                                // z goes from -10 (top) to 0 (bottom row)
                                const z = rowIndex === 0 ? -10 : 10
                                const positionValue = `[${x}, ${y}, ${z}]`
                                const isSelected = 
                                  editingMachine.position === positionValue

                                return (
                                  <button
                                    key={`${rowIndex}-${colIndex}`}
                                    type="button"
                                    className={`h-4 w-4 flex items-center justify-center text-xs border rounded ${
                                      isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                    }`}
                                    onClick={() => {
                                      setEditingMachine({
                                        ...editingMachine,
                                        position: positionValue,
                                      })
                                    }}
                                    title={positionValue}
                                  >
                                    {isSelected ? '✓' : ''}
                                  </button>
                                )
                              })
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2 text-center mr-10">
                            TV Display is here
                          </div>
                        </div>
                        <Input
                          id="edit-position"
                          name="position"
                          value={editingMachine.position || ''}
                          onChange={(e) =>
                            setEditingMachine({
                              ...editingMachine,
                              position: e.target.value,
                              rotation: JSON.parse(e.target.value)[2] === 10 ? '[0, 3.14, 0]' : '[0, 0, 0]' 
                            })
                          }
                          className="hidden"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4 pb-4">
                      <Label htmlFor="edit-rotation" className="text-right">
                        Rotation
                      </Label>
                      <Input
                        id="edit-rotation"
                        name="rotation"
                        disabled
                        defaultValue={editingMachine.rotation}
                        className="col-span-3"
                        value={
                           editingMachine.position && JSON.parse(editingMachine?.position)[2] === 10 ? '[0, 3.14, 0]' : '[0, 0, 0]' 
                        }
                          onSubmit={() =>
                            setEditingMachine({
                              ...editingMachine,
                              rotation: editingMachine.position && JSON.parse(editingMachine?.position)[2] === 10 ? '[0, 3.14, 0]' : '[0, 0, 0]',
                            })
                          }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => DialogTrigger}>
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
