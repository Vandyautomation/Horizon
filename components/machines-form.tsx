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
  process: string;
  location: string;
  position: string;
  rotation: string;
  uap: string;
};

export function MachinesForm() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);

  const UAP = ['BASIC', 'PREMIUM', 'LEAN', 'UV'];
  const Location = [
    'INJ Bld G',
    'INJ Bld H',
    'INJ Bld J',
    'INJ Bld Q',
    'INJ Bld R',
    'INJ Bld S',
    'K',
    'M',
    'E',
    'SP',
  ];

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
        const machine = row.original;
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setDeletingMachine(machine)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

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
      pagination: {
        pageSize: 10,
      },
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/machines`,
          {}
        );
        const data = await response.json();
        if (data) {
          const formattedData = data.map((item: any) => ({
            id: item.machineId.toString(),
            name: item.machineName,
            description: item.machineDescription,
            process: item.Process,
            uap: item.uap,
            location: item.locationName,
            position: item.position,
            rotation: item.rotation,
          }));
          setMachines(formattedData);
        } else {
          console.error('Failed to fetch machines:', data.error);
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
      }
    };

    fetchData();
  }, []);

  const addMachine = (newMachine: Omit<Machine, 'id'>) => {
    const id = (machines.length + 1).toString();
    setMachines([...machines, { ...newMachine, id }]);
  };

  const updateMachine = (updatedMachine: Machine) => {
    setMachines(
      machines.map((machine) =>
        machine.id === updatedMachine.id ? updatedMachine : machine
      )
    );
  };

  const deleteMachine = (id: string) => {
    setMachines(machines.filter((machine) => machine.id !== id));
  };

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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
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
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newMachine = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    process: formData.get('process') as string,
                    location: formData.get('location') as string,
                    position: formData.get('position') as string,
                    rotation: formData.get('rotation') as string,
                    uap: formData.get('uap') as string,
                  };
                  addMachine(newMachine);
                  e.currentTarget.reset();
                  toast.success('Machine created successfully');
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
                  <DialogClose asChild>
                    <Button type="submit">Save changes</Button>
                  </DialogClose>
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
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
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
                  e.preventDefault();
                  const deletedMachine = {
                    id: deletingMachine.id,
                  };
                  deleteMachine(deletedMachine.id);
                  setDeletingMachine(null);
                  toast.success('Machine deleted successfully');
                }}
              >
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="delete-name" className="text-right">
                    Name
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
          <DialogContent className="sm:max-w-[425px]">
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
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updatedMachine = {
                    id: editingMachine.id,
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    process: formData.get('process') as string,
                    location: formData.get('location') as string,
                    position: formData.get('position') as string,
                    rotation: formData.get('rotation') as string,
                    uap: formData.get('uap') as string,
                  };
                  updateMachine(updatedMachine);
                  setEditingMachine(null);
                  toast.success('Machine edited successfully');
                }}
              >
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingMachine.name}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
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
                  <div className="grid grid-cols-4 items-center gap-4">
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-location" className="text-right">
                      Location
                    </Label>
                    <Select
                      value={editingMachine.location}
                      onValueChange={(value) => {
                        setEditingMachine({
                          ...editingMachine,
                          location: value,
                        });
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        {Location.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-uap" className="text-right">
                      UAP
                    </Label>
                    <Select
                      value={editingMachine.uap}
                      onValueChange={(value) => {
                        setEditingMachine({
                          ...editingMachine,
                          uap: value,
                        });
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="UAP" />
                      </SelectTrigger>
                      <SelectContent>
                        {UAP.map((uap) => (
                          <SelectItem key={uap} value={uap}>
                            {uap}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-position" className="text-right">
                      Position
                    </Label>
                    <Input
                      id="edit-position"
                      name="position"
                      defaultValue={editingMachine.position}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-rotation" className="text-right">
                      Rotation
                    </Label>
                    <Input
                      id="edit-rotation"
                      name="rotation"
                      defaultValue={editingMachine.rotation}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="submit">Save changes</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
