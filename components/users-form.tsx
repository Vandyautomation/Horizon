"use client"

import { useEffect,useState } from "react" 

import { toast } from "react-hot-toast"

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
    User,
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

  import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { StringHeaderIdentifier } from "@tanstack/react-table"



  // type User = {
  //   id: string
  //   username: string
  //   firstName: string
  //   lastName: string
  //   role: string
  //   process: string
  //   group: string
  //   location: string
  // }

  type User = {
    id: number
    UserRFID: string
    UserName: string
    UserUAP: string
    role_id: number
    role_name: string
    role_display_name: string
    UserGroup: string
    UserLoc: string
    UserDept: string
  }

    type Roles = {
    id: string
    name: string
    display_name: string
  }


    
    // const initialUsers: User[] = [
    //     { id: "1", name: "John Doe", email: "john@example.com", role: "Admin" },
    //     { id: "2", name: "Jane Smith", email: "jane@example.com", role: "User" },
    //     { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "Editor" },
    // ]

    export function UsersForm() {
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<Roles[]>([])

    const [searchTerm, setSearchTerm] = useState("")
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deletingUser, setDeletingUser] = useState<User| null>(null)

    const router = useRouter()
    const groups = [
        { id: "A", name: "A" },
        { id: "B", name: "B" },
        { id: "C", name: "C" },
        { id: "D", name: "D" },
      ]
      const locations = [
        { id: "INJ Bld G", name: "INJ Bld G" },
        { id: "INJ Bld H", name: "INJ Bld H" },
        { id: "INJ Bld J", name: "INJ Bld J" },
        { id: "INJ Bld Q", name: "INJ Bld Q" },
        { id: "INJ Bld R", name: "INJ Bld R" },
        { id: "INJ Bld S", name: "INJ Bld S" },
      ]

      const uap = [
        { id: "BASIC", name: "BASIC" },
        { id: "PREMIUM", name: "PREMIUM" },
        { id: "LEAN", name: "LEAN" },
        { id: "UV", name: "UV" },
      ]

      const  userDept = [
        { id: "SPV Production", name: "SPV Production" },
        { id: "Mechanic", name: "Mechanic" },
        { id: "OperatorBahan", name: "OperatorBahan" },
      ]

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
    
    useEffect(() => {
        fetchData();
      }, []);

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

    const filteredUsers = users.filter(
        (user) =>
        user.UserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.UserRFID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.UserGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.UserLoc.toLowerCase().includes(searchTerm.toLowerCase()) 

    )

    const addUser = async (newUser: Omit<User, "id" | "role_name" | "role_display_name">) => {
      return await toast.promise(
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || 'Failed to add user');
          fetchData()
        }),
        {
          loading: 'Creating new user...',
          success: 'User created successfully',
          error: (err) => `Error: ${err.message}`
        }
      );
    }

    const updateUser = async (updatedUser: User) => {
      return await toast.promise(
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${updatedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser)
        })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || 'Failed to update user');
          fetchData()
        }),
        {
          loading: 'Updating user...',
          success: 'User updated successfully',
          error: (err) => `Error: ${err.message}`
        }
      );
    }

    const deleteUser = async (id: number) => {
      return await toast.promise(
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${id}`, {
          method: 'DELETE'
        })
        .then(async (response) => {
          const result = await response.json();
          
          if (!response.ok) throw new Error(result.message || 'Failed to delete user');

          fetchData()
        }),
        {
          loading: 'Deleting user...',
          success: 'User deleted successfully',
          error: (err) => `Error: ${err.message}`
        }
      );
    }
  return (    
  <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">
                Here&apos;s a list of your users. Showing {filteredUsers.length} of {users.length} users.
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
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Enter the details of the new user here. Click save when you&apos;re done.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      // check password and confirm password
                      const password = formData.get('password') as string
                      const confirmPassword = formData.get('confirm-password') as string
                      if (password !== confirmPassword) {
                        toast.error("Password and Confirm Password do not match")
                        return
                      }
                      const newUser = {
                        UserName: formData.get('name') as string,
                        UserRFID: formData.get('nik') as string,
                        UserUAP: formData.get('uap') as string,
                        role_id: Number(formData.get('role')),
                        UserGroup: formData.get('group') as string,
                        UserLoc: formData.get('location') as string,
                        UserDept: formData.get('andon-role') as string,
                        password: formData.get('password') as string,
                      }
                      addUser(newUser)
                      e.currentTarget.reset()

                    }}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            User Name
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="nik" className="text-right">
                            NIK
                          </Label>
                          <Input
                            id="nik"
                            name="nik"
                            type="text"
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="password" className="text-right">
                            Password
                          </Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="confirm-password" className="text-right">
                            Confirm Password
                          </Label>
                          <Input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="role" className="text-right">
                            QCO Role
                          </Label>
                          <select
                            id="role"
                            name="role"
                            className="col-span-3 border rounded-md p-2"
                            required
                          >
                            <option value="">Select a role</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.display_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="andon-role" className="text-right">
                            Andon Role
                          </Label>
                          <select
                            id="andon-role"
                            name="andon-role"
                            className="col-span-3 border rounded-md p-2"
                            required
                          >
                            <option value="">Select a role</option>
                            {userDept.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="uap" className="text-right">
                            UAP
                          </Label>
                          <select
                            id="uap"
                            name="uap"
                            className="col-span-3 border rounded-md p-2"
                            required
                          >
                            <option value="">Select a UAP</option>
                            {uap.map((uap) => (
                              <option key={uap.id} value={uap.name}>
                                {uap.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="group" className="text-right">
                            Group
                          </Label>
                          <select
                            id="group"
                            name="group"
                            className="col-span-3 border rounded-md p-2"
                            required
                          >
                            <option value="">Select a group</option>
                            
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="location" className="text-right">
                            Location
                          </Label>
                          <Select
                            name="location"
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((loc) => (
                                <SelectItem key={loc.name} value={loc.name}>
                                  {loc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Add user</Button>
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
                    placeholder="Filter users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 w-[150px] lg:w-[250px]"
                  />
                  <Button onClick={() => setSearchTerm('')}>Clear</Button>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Name</TableHead>
                      <TableHead>NIK</TableHead>
                      <TableHead>Andon Role</TableHead>
                      <TableHead>QCO Role</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.UserName}</TableCell>
                        <TableCell>{user.UserRFID}</TableCell>
                        <TableCell>{user.UserDept}</TableCell>
                        <TableCell>{user.role_display_name}</TableCell>
                        <TableCell>{user.UserGroup}</TableCell>
                        <TableCell>{user.UserLoc}</TableCell>
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

            }}><div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="delete-name" className="text-right">
              Name
            </Label>
            <Label htmlFor="delete-name" className="col-span-3">
              {deletingUser?.UserName}
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
        <DialogContent className="sm:max-w-[600px]">
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
              const updatedUser: User = {
                id: editingUser.id,
                UserRFID: editingUser.UserRFID,
                UserName: editingUser.UserName,
                UserUAP: editingUser.UserUAP,
                role_id: editingUser.role_id,
                role_display_name: editingUser.role_display_name,
                role_name: editingUser.role_name,
                UserGroup: editingUser.UserGroup,
                UserLoc: editingUser.UserLoc,
                UserDept: editingUser.UserDept,
              }
              updateUser(updatedUser)
              setEditingUser(null)
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingUser.UserName}
                    value={editingUser.UserName}
                    onChange={(e) => setEditingUser({ ...editingUser, UserName: e.target.value })}
                    type="text"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    NIK
                  </Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="text"
                    defaultValue={editingUser.UserRFID}
                    value={editingUser.UserRFID}
                    onChange={(e) => setEditingUser({ ...editingUser, UserRFID: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Role
                  </Label>
                  <select
                    id="edit-role"
                    name="role"
                    defaultValue={editingUser.role_id}
                    value={editingUser.role_id}
                    onChange={(e) => setEditingUser({ ...editingUser, role_id: Number(e.target.value) })}
                    className="col-span-3 border rounded-md p-2"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-andon-role" className="text-right">
                    Andon Role
                  </Label>
                  <select
                    id="edit-andon-role"
                    name="andon-role"
                    defaultValue={editingUser.UserDept}
                    value={editingUser.UserDept}
                    onChange={(e) => setEditingUser({ ...editingUser, UserDept: e.target.value })}
                    className="col-span-3 border rounded-md p-2"
                  >
                    <option value="">Select a role</option>
                    {userDept.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-uap" className="text-right">
                    UAP
                  </Label>
                  <select
                    id="edit-uap"
                    name="uap"
                    defaultValue={editingUser.UserUAP}
                    value={editingUser.UserUAP}
                    onChange={(e) => setEditingUser({ ...editingUser, UserUAP: e.target.value })}
                    className="col-span-3 border rounded-md p-2"
                  >
                    <option value="">Select a UAP</option>
                    {uap.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-group" className="text-right">
                    Group
                  </Label>
                  <select
                    id="edit-group"
                    name="group"
                    defaultValue={editingUser.UserGroup}
                    value={editingUser.UserGroup}
                    onChange={(e) => setEditingUser({ ...editingUser, UserGroup: e.target.value })}
                    className="col-span-3 border rounded-md p-2"
                  >
                    <option value="">Select a group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-location" className="text-right">
                    Location
                  </Label>
                  <Select 
                    name="location"
                    value={editingUser.UserLoc}
                    onValueChange={(value) => setEditingUser({ ...editingUser, UserLoc: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.name} value={loc.name}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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