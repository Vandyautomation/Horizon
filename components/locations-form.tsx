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

  type Roles = {
    id: string
    name: string
    type: string
  }
  
  const initialUsers: Roles[] = [
    { id: "1", name: "INJ Bld G", type: "BASIC" },
    { id: "2", name: "INJ Bld H", type: "BASIC" },
    { id: "3", name: "INJ Bld J", type: "PREMIUM" },
  ]

export function LocationsForm() {
  const [roles, setRoles] = React.useState<Roles[]>(initialUsers)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [editingRole, setEditingRole] = React.useState<Roles | null>(null)
  const [deletingRole, setDeletingRole] = React.useState<Roles| null>(null)

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.type.toLowerCase().includes(searchTerm.toLowerCase()) 
  )

  const addRole = (newRole: Omit<Roles, "id">) => {
    const id = (roles.length + 1).toString()
    setRoles([...roles, { ...newRole, id }])
  }

  const updateRole = (updatedRole: Roles) => {
    setRoles(roles.map((role) => (role.id === updatedRole.id ? updatedRole : role)));
  };
  

  const deleteRole = (id: string) => {
    setRoles(roles.filter((role) => role.id !== id))
  }
  return (    
  <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
    <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Locations</h2>
            <p className="text-muted-foreground">
                Here&apos;s a list of your locations
            </p>
        </div>
              <div className="ml-auto px-3 space-x-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Locations
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
                        type: formData.get('type') as string,
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
                          <Label htmlFor="type" className="text-right">
                            UAP
                          </Label>
                          <Input
                            id="type"
                            name="type"
                            type="type"
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="ml-auto h-8 lg:flex">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem checked>
                        Name
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked>
                        UAP
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-[300px]">Name</TableHead>
                      <TableHead className="text-center">UAP</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="text-center font-medium">{role.name}</TableCell>
                        <TableCell className="text-center">{role.type}</TableCell>
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
                type: formData.get('type') as string,
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
                  <Label htmlFor="edit-type" className="text-right">
                    UAP
                  </Label>
                  <Input
                    id="edit-type"
                    name="type"
                    type="type"
                    defaultValue={editingRole.type}
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