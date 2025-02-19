"use client"

import { useEffect,useState } from "react" 

import { toast } from "sonner"

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
    Edit,
    MoreHorizontal,
    Plus,
    Trash,
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


  type User = {
    id: string
    username: string
    firstName: string
    lastName: string
    role: string
    process: string
    group: string
    location: string
  }
    
    // const initialUsers: User[] = [
    //     { id: "1", name: "John Doe", email: "john@example.com", role: "Admin" },
    //     { id: "2", name: "Jane Smith", email: "jane@example.com", role: "User" },
    //     { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "Editor" },
    // ]

    export function UsersForm() {
    const [users, setUsers] = useState<User[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deletingUser, setDeletingUser] = useState<User| null>(null)

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`, {
              // credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
              setUsers(data.data); // Assuming `data.data` is an array of users
            } else {
              console.error("Failed to fetch users:", data.message);
            }
          } catch (error) {
            console.error("Error fetching users:", error);
          }
        };
    
        fetchData();
      }, []);

    const filteredUsers = users.filter(
        (user) =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.location.toLowerCase().includes(searchTerm.toLowerCase()) 

    )

    const addUser = (newUser: Omit<User, "id">) => {
        const id = (users.length + 1).toString()
        setUsers([...users, { ...newUser, id }])
    }

    const updateUser = (updatedUser: User) => {
        setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
    }

    const deleteUser = (id: string) => {
        setUsers(users.filter((user) => user.id !== id))
    }
  return (    
  <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
    <div>
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">
                Here&apos;s a list of your users
            </p>
        </div>
              <div className="ml-auto px-3 space-x-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Enter the details of the new user here. Click save when you&apos;re done.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      const newUser = {
                        name: formData.get('name') as string,
                        email: formData.get('email') as string,
                        role: formData.get('role') as string,
                        username: formData.get('username') as string,
                        firstName: formData.get('firstName') as string,
                        lastName: formData.get('lastName') as string,
                        process: formData.get('process') as string,
                        group: formData.get('group') as string,
                        location: formData.get('location') as string,
                      }
                      addUser(newUser)
                      e.currentTarget.reset()
                      toast.success("User created successfully")

                    }}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="firstName" className="text-right">
                            First Name
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">
                            Email
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="role" className="text-right">
                            Role
                          </Label>
                          <Input
                            id="role"
                            name="role"
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center space-x-2">
                  <Input
                    placeholder="Filter users..."
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
                        Email
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked>Role</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Process</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.firstName}</TableCell>
                        <TableCell>{user.lastName}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.process}</TableCell>
                        <TableCell>{user.group}</TableCell>
                        <TableCell>{user.location}</TableCell>
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
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit/>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingUser(user)}
                              >
                                <Trash/>
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
    <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
    <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user?
            </DialogDescription>
          </DialogHeader>
          {deletingUser && (
          <form onSubmit={(e) => {
              e.preventDefault()
              const deletedUser = {
                id: deletingUser.id,
              }
              deleteUser(deletedUser.id)
              setDeletingUser(null)
              toast.success("User deleted successfully")

            }}><div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="delete-name" className="text-right">
              Name
            </Label>
            <Label htmlFor="delete-name" className="col-span-3">
              {deletingUser?.username}
            </Label>
            
          </div>
          <DialogFooter>
                <Button type="submit" variant="destructive" >
                    Yes</Button>
                <DialogClose asChild>
            <Button type="button" variant="secondary">
              No
            </Button>
          </DialogClose>
              </DialogFooter>
          </form>)}

              </DialogContent>
    </Dialog>
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user here. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const updatedUser = {
                id: editingUser.id,
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: formData.get('role') as string,
                username: formData.get('username') as string,
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                process: formData.get('process') as string,
                location: formData.get('location') as string,
                group: formData.get('group') as string,

              }
              updateUser(updatedUser)
              setEditingUser(null)
              toast.success("User edited successfully")

            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingUser.firstName}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingUser.username}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Role
                  </Label>
                  <Input
                    id="edit-role"
                    name="role"
                    defaultValue={editingUser.role}
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
              )
}