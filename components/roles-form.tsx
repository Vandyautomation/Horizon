"use client"

import * as React from "react"

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    ArrowUpDown,
    MoreHorizontal,
    Plus,
  } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { useEffect } from "react"
import { toast } from "react-hot-toast"

  type Roles = {
    id: string
    name: string
    display_name: string
  }
  
  // const initialUsers: Roles[] = [
  //   { id: "1", name: "SPV Production", type: "Supervisor" },
  //   { id: "2", name: "Mechanic", type: "Staff" },
  //   { id: "3", name: "Material", type: "Staff" },
  // ]

export function RolesForm() {
  const [roles, setRoles] = React.useState<Roles[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [editingRole, setEditingRole] = React.useState<Roles | null>(null)
  const [deletingRole, setDeletingRole] = React.useState<Roles| null>(null)

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/roles`, {
              // credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
              setRoles(data.data); // Assuming `data.data` is an array of roles
            } else {
              console.error("Failed to fetch roles:", data.message);  
            }
          } catch (error) {
            console.error("Error fetching roles:", error);
          }
        };
    
        fetchData();
      }, []);

    const filteredRoles = roles.filter(
        (role) =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.display_name.toLowerCase().includes(searchTerm.toLowerCase())

    )

  const addRole = async (newRole: Omit<Roles, "id">) => {
    await toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      }).then(async (response) => {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to add role');
        setRoles([...roles, data.data]);
        return data;
      }),
      {
        loading: 'Adding role...',
        success: 'Role added successfully!',
        error: (err) => `Failed: ${err.message}`,
      }
    );
  }

  const updateRole = async (updatedRole: Roles) => {
    await toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/roles/${updatedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRole),
      }).then(async (response) => {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to update role');
        setRoles(roles.map((role) => (role.id === updatedRole.id ? data.data : role)));
        return data;
      }),
      {
        loading: 'Updating role...',
        success: 'Role updated successfully!',
        error: (err) => `Failed: ${err.message}`,
      }
    );
  }

  const deleteRole = async (id: string) => {
    await toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/roles/${id}`, {
        method: 'DELETE',
      }).then(async (response) => {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to delete role');
        setRoles(roles.filter((role) => role.id !== id));
        return data;
      }),
      {
        loading: 'Deleting role...',
        success: 'Role deleted successfully!',
        error: (err) => `Failed: ${err.message}`,
      }
    );
  }
  return (    
  <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
    <div>
        <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
            <p className="text-muted-foreground">
                Here&apos;s a list of your roles
            </p>
        </div>
              <div className="ml-auto px-3 space-x-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Roles
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Roles</DialogTitle>
                      <DialogDescription>
                        Enter the details of the new roles here. Click save when you&apos;re done.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      const newRole = {
                        name: formData.get('name') as string,
                        display_name: formData.get('display_name') as string,
                      }
                      addRole(newRole)
                      e.currentTarget.reset()
                    }}>
                      <div className="grid gap-4 py-4">
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
                          <Label htmlFor="display_name" className="text-right">
                            Display Name
                          </Label>
                          <Input
                            id="display_name"
                            name="display_name"
                            className="col-span-3"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save changes</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center space-x-2">
                  <Input
                    placeholder="Filter roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 w-[150px] lg:w-[250px]"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-[300px]">Name</TableHead>
                      <TableHead className="text-center">Display Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="text-center font-medium">{role.name}</TableCell>
                        <TableCell className="text-center">{role.display_name}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingRole(role)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>View details</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingRole(role)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
    <Dialog open={!!deletingRole} onOpenChange={() => setDeletingRole(null)}>
    <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user?
            </DialogDescription>
          </DialogHeader>
          {deletingRole && (
          <form onSubmit={(e) => {
              e.preventDefault()
              const deletedRole = {
                id: deletingRole.id,
              }
              deleteRole(deletedRole.id)
              setDeletingRole(null)
            }}><div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="delete-name" className="text-right">
              Name
            </Label>
            <Label htmlFor="delete-name" className="col-span-3">
              {deletingRole?.name}
            </Label>
            
          </div>
          <DialogFooter>
                <Button type="submit" variant="default">Delete</Button>
                <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
              </DialogFooter>
          </form>)}

              </DialogContent>
    </Dialog>
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user here. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          {editingRole && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const updatedRole = {
                id: editingRole.id,
                name: formData.get('name') as string,
                display_name: formData.get('display_name') as string,
              }
              updateRole(updatedRole)
              setEditingRole(null)
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingRole.name}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-display_name" className="text-right">
                    Display Name
                  </Label>
                  <Input
                    id="edit-display_name"
                    name="display_name"
                    type="text"
                    defaultValue={editingRole.display_name}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
              </div>
              </div>
              )
}