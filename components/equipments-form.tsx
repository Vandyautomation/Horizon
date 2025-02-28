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

type Equipment = {
  id: string;
  name: string;
  brand: string;
  energyBudget: number;
};

export function EquipmentsForm() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null
  );
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(
    null
  );

  // Define columns for TanStack table
  const columns: ColumnDef<Equipment>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          EquipmentID
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'brand',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Brand
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'energyBudget',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          EnergyBudget
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
                <DropdownMenuItem onClick={() => setEditingEquipment(machine)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setDeletingEquipment(machine)}
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
    data: equipments,
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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/equipments`,
          {}
        );
        const data = await response.json();
        if (data) {
          const formattedData = data.map((item: any) => ({
            id: item.EquipmentID.toString(),
            name: item.Name,
            brand: item.Brand,
            energyBudget: item.EnergyBudget,
          }));
          setEquipments(formattedData);
        } else {
          console.error('Failed to fetch equipments:', data.error);
        }
      } catch (error) {
        console.error('Error fetching equipments:', error);
      }
    };

    fetchData();
  }, []);

  const addEquipment = (newEquipment: Omit<Equipment, 'id'>) => {
    const id = (equipments.length + 1).toString();
    setEquipments([...equipments, { ...newEquipment, id }]);
  };

  const updateEquipment = (updatedEquipment: Equipment) => {
    setEquipments(
      equipments.map((machine) =>
        machine.id === updatedEquipment.id ? updatedEquipment : machine
      )
    );
  };

  const deleteEquipment = (id: string) => {
    setEquipments(equipments.filter((machine) => machine.id !== id));
  };

  return (
    <div className="h-full flex-1 flex-col space-y-4 p-4 md:flex">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipments</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your equipments
          </p>
        </div>
        <div className="ml-auto px-3 space-x-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
                <DialogDescription>
                  Enter the details of the new machine here. Click save when
                  you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newEquipment = {
                    id: formData.get('id') as string,
                    name: formData.get('name') as string,
                    brand: formData.get('brand') as string,
                    energyBudget: (formData.get('energyBudget') || 0) as number,
                  };
                  addEquipment(newEquipment);
                  e.currentTarget.reset();
                  toast.success('Equipment created successfully');
                }}
              >
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      EquipmentID
                    </Label>
                    <Input id="id" name="id" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="energyBudget" className="text-right">
                      EnergyBudget
                    </Label>
                    <Input
                      id="energyBudget"
                      name="energyBudget"
                      className="col-span-3"
                      type="number"
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
          open={!!deletingEquipment}
          onOpenChange={() => setDeletingEquipment(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Equipment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this machine?
              </DialogDescription>
            </DialogHeader>
            {deletingEquipment && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const deletedEquipment = {
                    id: deletingEquipment.id,
                  };
                  deleteEquipment(deletedEquipment.id);
                  setDeletingEquipment(null);
                  toast.success('Equipment deleted successfully');
                }}
              >
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="delete-name" className="text-right">
                    Name
                  </Label>
                  <Label htmlFor="delete-name" className="col-span-3">
                    {deletingEquipment?.name}
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
          open={!!editingEquipment}
          onOpenChange={() => setEditingEquipment(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Equipment</DialogTitle>
              <DialogDescription>
                Make changes to the machine here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            {editingEquipment && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updatedEquipment = {
                    id: editingEquipment.id,
                    name: formData.get('name') as string,
                    brand: formData.get('brand') as string,
                    energyBudget: (formData.get('energyBudget') || 0) as number,
                  };
                  updateEquipment(updatedEquipment);
                  setEditingEquipment(null);
                  toast.success('Equipment edited successfully');
                }}
              >
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      EquipmentID
                    </Label>
                    <Input id="id" name="id" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="energyBudget" className="text-right">
                      EnergyBudget
                    </Label>
                    <Input
                      id="energyBudget"
                      name="energyBudget"
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
