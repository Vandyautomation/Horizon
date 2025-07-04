"use client"

import * as React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, FilterIcon, PencilIcon, PlusIcon, RefreshCcwIcon, TrashIcon, XIcon } from "lucide-react"
import { toast } from "react-hot-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type ProblemGroup = {
    id: string
    name: string
}

type Problem = {
    id: string
    name: string
    problem_group_id: string
    color: string
    process: string
}

type Todo = {
    id: string
    name: string
    problem_id: string
    pic: string
    is_escalated: boolean
}

type ProblemDataWhole = {
    problem_group: ProblemGroup
    problem: Problem
    todo: Todo
}

export function ProblemMasterForm() {
    const [problemGroupData, setProblemGroupData] = React.useState<ProblemGroup[]>([])
    const [problemData, setProblemData] = React.useState<Problem[]>([])
    const [todoData, setTodoData] = React.useState<Todo[]>([])
    const [searchTermProblemGroup, setSearchTermProblemGroup] = React.useState("")
    const [searchTermProblem, setSearchTermProblem] = React.useState("")
    const [searchTermTodo, setSearchTermTodo] = React.useState("")
    const [searchDate, setSearchDate] = React.useState("")
    const [loading, setLoading] = React.useState(true)
    const [pageProblemGroup, setPageProblemGroup] = React.useState(1)
    const [pageProblem, setPageProblem] = React.useState(1)
    const [pageTodo, setPageTodo] = React.useState(1)
    const [totalPagesProblemGroup, setTotalPagesProblemGroup] = React.useState(0)
    const [totalItemsProblemGroup, setTotalItemsProblemGroup] = React.useState(0)
    const [totalPagesProblem, setTotalPagesProblem] = React.useState(0)
    const [totalItemsProblem, setTotalItemsProblem] = React.useState(0)
    const [totalPagesTodo, setTotalPagesTodo] = React.useState(0)
    const [totalItemsTodo, setTotalItemsTodo] = React.useState(0)
    const [groupId, setGroupId] = React.useState("")
    const [problemId, setProblemId] = React.useState("")
    const [todoId, setTodoId] = React.useState("")
    const [loadingProblem, setLoadingProblem] = React.useState(false)
    const [loadingTodo, setLoadingTodo] = React.useState(false)
    const [loadingProblemGroup, setLoadingProblemGroup] = React.useState(false)
    const [editData, setEditData] = React.useState<ProblemDataWhole | null>(null)
    const [addData, setAddData] = React.useState<ProblemDataWhole | null>(null)

    const [addProblemGroupData, setAddProblemGroupData] = React.useState<ProblemGroup | null>(null)
    const [addProblemData, setAddProblemData] = React.useState<Problem | null>(null)
    const [addTodoData, setAddTodoData] = React.useState<Todo | null>(null)

    const [editProblemGroupData, setEditProblemGroupData] = React.useState<ProblemGroup | null>(null)
    const [editProblemData, setEditProblemData] = React.useState<Problem | null>(null)
    const [editTodoData, setEditTodoData] = React.useState<Todo | null>(null)

    const [trigger, setTrigger] = React.useState(false)
    const [filter, setFilter] = React.useState("")
    const [userData, setUserData] = React.useState<any>(null)
    const [picFilter, setPicFilter] = React.useState("")
    const router = useRouter()

    const checkUser = async () => {
      const user = localStorage.getItem("user");
      if (user) {
        try {
          const userData = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/check`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          const userDataJson = await userData.json();
          setUserData(userDataJson.data.payload.user);
          if (userDataJson.data.payload.user.role_name !== "admin" && userDataJson.data.payload.user.role_name !== "master_data_admin") {
            toast.error("You are not authorized to access this page")
            router.push("/")
          }
        } catch (error) {
          console.error("Error checking user:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
        toast.error("You are not logged in")
        router.push("/")
      }
      return null;
    }

    useEffect(() => {
      checkUser();
    }, []);


    React.useEffect(() => {
        const fetchProblemGroupData = async () => {
            try {
                setLoadingProblemGroup(true)
                const response = await fetch(`/be/api/problem-master/problem-group?name=${searchTermProblemGroup}&page=${pageProblemGroup}&pic=${picFilter}`)
                const data = await response.json()
                setProblemGroupData(data.data)
                setTotalPagesProblemGroup(data.totalPages)
                setTotalItemsProblemGroup(data.totalItems)
            } catch (error) {
                toast.error('Error fetching problem group data')
                console.error('Error fetching problem group data:', error)
            } finally {
                setLoadingProblemGroup(false)
            }
        }
        

        fetchProblemGroupData()
    }, [searchTermProblemGroup, searchDate, pageProblemGroup, picFilter])

    React.useEffect(() => {
        const fetchProblemData = async () => {
            try {
                setLoadingProblem(true)
                const response = await fetch(`/be/api/problem-master/problem?name=${searchTermProblem}&groupId=${groupId}&page=${pageProblem}&filter=${filter}&pic=${picFilter}`)
                const data = await response.json()
                setProblemData(data.data)
                setTotalPagesProblem(data.totalPages)
                setTotalItemsProblem(data.totalItems)
            } catch (error) {
                toast.error('Error fetching problem group data')
                console.error('Error fetching problem group data:', error)
            } finally {
                setLoadingProblem(false)
            }
        }

        fetchProblemData()
    }, [searchTermProblem, trigger, searchDate, pageProblem, filter, picFilter])

    React.useEffect(() => {
        const fetchTodoData = async () => {
            try {
                setLoadingTodo(true)
                const response = await fetch(`/be/api/problem-master/todo?name=${searchTermTodo}&problemId=${problemId}&page=${pageTodo}&pic=${picFilter}`)
                const data = await response.json()
                setTodoData(data.data)
                setTotalPagesTodo(data.totalPages)
                setTotalItemsTodo(data.totalItems)
            } catch (error) {
                toast.error('Error fetching todo data')
                console.error('Error fetching todo data:', error)
            } finally {
                setLoadingTodo(false)
            }
        }

        fetchTodoData()
    }, [searchTermTodo, problemId, searchDate, pageTodo, picFilter])

    const handleDeleteTodo = async () => {
        try {
            const response = await fetch(`/be/api/problem-master/todo/${todoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const data = await response.json()
            if (response.ok) {
                toast.success(data.message)
                setTodoId("")
                setPageTodo(1)
                window.location.reload()
            } else {
                toast.error('Error deleting todo')
            }
        } catch (error) {
            toast.error('Error deleting todo')
            console.error('Error deleting todo:', error)
        }
    }

    const handleEditTodo = async () => {
        if (!editData?.todo.name?.trim()) {
            toast.error('Todo name is required')
            return
        }
        if (!editData?.problem.id) {
            toast.error('Problem is required')
            return
        }
        if (!editData?.todo.pic) {
            toast.error('PIC is required')
            return
        }
        
        try {
            const response = await fetch(`/be/api/problem-master/todo/${todoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: editData.todo.name.trim(),
                    problem_id: editData.problem.id,
                    pic: editData.todo.pic,
                    is_escalated: editData.todo.is_escalated
                })
            })
            const data = await response.json()
            if (response.ok) {
                toast.success(data.message)
                setTodoId("")
                setPageTodo(1)
                window.location.reload()
            } else {
                toast.error(data.message || 'Error editing todo')
            }
        } catch (error) {
            toast.error('Error editing todo')
            console.error('Error editing todo:', error)
        }
    }

    const handleAddTodo = async () => {
        if (!addData?.todo.name?.trim()) {
            toast.error('Todo name is required')
            return
        }
        if (!addData?.problem.id) {
            toast.error('Problem is required')
            return
        }
        if (!addData?.todo.pic) {
            toast.error('PIC is required')
            return
        }
        
        try {
            const response = await fetch(`/be/api/problem-master/todo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: addData.todo.name.trim(),
                    problem_id: addData.problem.id,
                    pic: addData.todo.pic,
                    is_escalated: addData.todo.is_escalated
                })
            })
            const data = await response.json()
            if (response.ok) {
                toast.success(data.message || "Successfully added todo")
                setAddData(null)
                window.location.reload()
            } else {
                toast.error(data.message || 'Error adding todo')
            }
        } catch (error) {
            toast.error('Error adding todo')
            console.error('Error adding todo:', error)
        }
    }

    // Problem Group CRUD functions
    const handleAddProblemGroup = async () => {
        if (!addProblemGroupData?.name?.trim()) {
            toast.error('Problem group name is required')
            return
        }
        
        try {
            const response = await fetch(`/be/api/problem-master/problem-group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: addProblemGroupData.name.trim() })
            })
            const data = await response.json()
            if (response.ok) {
                toast.success(data.message)
                setAddProblemGroupData(null)
                setPageProblemGroup(1)
                window.location.reload()
            } else {
                toast.error(data.message || 'Error adding problem group')
            }
        } catch (error) {
            toast.error('Error adding problem group')
            console.error('Error adding problem group:', error)
        }
    }

    const handleEditProblemGroup = async () => {
        if (!editProblemGroupData?.name?.trim()) {
            toast.error('Problem group name is required')
            return
        }
        
        try {
            const response = await fetch(`/be/api/problem-master/problem-group/${editProblemGroupData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: editProblemGroupData.name.trim() })
            })
            const data = await response.json()
            if (response.ok) {
                toast.success(data.message)
                setEditProblemGroupData(null)
                setGroupId("")
                setPageProblemGroup(1)
                window.location.reload()
            } else {
                toast.error(data.message || 'Error editing problem group')
            }
        } catch (error) {
            toast.error('Error editing problem group')
            console.error('Error editing problem group:', error)
        }
    }

    const handleDeleteProblemGroup = async () => {
        try {
            const response = await fetch(`/be/api/problem-master/problem-group/${groupId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const data = await response.json()
            if (response.ok) {
                toast.success(data.message || 'Problem group deleted successfully')
                setGroupId("")
                setPageProblemGroup(1)
                window.location.reload()
            } else {
                toast.error(data.error || 'Error deleting problem group')
            }
        } catch (error) {
            toast.error('Error deleting problem group')
            console.error('Error deleting problem group:', error)
        }
    }

    // Problem CRUD functions
    const handleAddProblem = async () => {
        if (!addProblemData?.name?.trim()) {
            toast.error('Problem name is required')
            return
        }
        if (!addProblemData?.process?.trim()) {
            toast.error('Process is required')
            return
        }
        if (!addProblemData?.problem_group_id) {
            toast.error('Problem group is required')
            return
        }
        
        try {
            const response = await fetch(`/be/api/problem-master/problem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: addProblemData.name.trim(),
                    problem_group_id: addProblemData.problem_group_id,
                    color: addProblemData.color,
                    process: addProblemData.process.trim()
                })
            })
            const data = await response.json()
            if (response.ok) {
                toast.success(data.message || "Successfully added problem")
                setAddProblemData(null)
                setPageProblem(1)
                window.location.reload()
            } else {
                toast.error(data.message || 'Error adding problem')
            }
        } catch (error) {
            toast.error('Error adding problem')
            console.error('Error adding problem:', error)
        }
    }

    const handleEditProblem = async () => {
        if (!editProblemData?.name?.trim()) {
            toast.error('Problem name is required')
            return
        }
        if (!editProblemData?.process?.trim()) {
            toast.error('Process is required')
            return
        }
        if (!editProblemData?.problem_group_id) {
            toast.error('Problem group is required')
            return
        }
        
        try {
            const response = await fetch(`/be/api/problem-master/problem/${editProblemData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: editProblemData.name.trim(),
                    problem_group_id: editProblemData.problem_group_id,
                    color: editProblemData.color,
                    process: editProblemData.process.trim()
                })
            })
            const data = await response.json()
            if (response.ok) {
                toast.success(data.message)
                setEditProblemData(null)
                setProblemId("")
                setPageProblem(1)
                window.location.reload()
            } else {
                toast.error(data.message || 'Error editing problem')
            }
        } catch (error) {
            toast.error('Error editing problem')
            console.error('Error editing problem:', error)
        }
    }

    const handleDeleteProblem = async () => {
        try {
            const response = await fetch(`/be/api/problem-master/problem/${problemId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const data = await response.json()
            if (response.ok) {
                toast.success(data.message)
                setProblemId("")
                setPageProblem(1)
                window.location.reload()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Error deleting problem')
            console.error('Error deleting problem:', error)
        }
    }

    const handleFilter = (value: string) => {
        if (value === "All") {
            setFilter("")
        } else {
            setFilter(value)
        }
    }

   if (loadingProblemGroup) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="h-full flex-1 flex-col space-y-2 p-2 md:flex">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Problem Master</h2>
                    <p className="text-muted-foreground">
                        Manage problem groups, problems, and todos
                    </p>
                </div>
                <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    disabled={loadingProblemGroup || loadingProblem || loadingTodo}
                >
                    <RefreshCcwIcon className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
                <Label className="text-md font-medium text-primary text-nowrap">Simulasi PIC :</Label>
                <Select value={picFilter} onValueChange={(value) => {setPicFilter(value)}}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select PIC" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">ALL</SelectItem>
                        <SelectItem value="SPV PRODUCTION">SPV PRODUCTION</SelectItem>
                        <SelectItem value="MEKANIK">MEKANIK</SelectItem>
                        <SelectItem value="OPERATOR BAHAN">OPERATOR BAHAN</SelectItem>
                        <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                        <SelectItem value="MOLD">MOLD</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>
            <div className="space-y-6">
                {/* Summary Cards */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Problem Groups</p>
                                <p className="text-2xl font-bold">{problemGroupData.length}</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 text-sm font-medium">PG</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Problems</p>
                                <p className="text-2xl font-bold">{problemData.length}</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-orange-600 text-sm font-medium">P</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Todos</p>
                                <p className="text-2xl font-bold">{todoData.length}</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-green-600 text-sm font-medium">T</span>
                            </div>
                        </div>
                    </div>
                </div> */}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Problem Group Section */}
                    <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold mb-3">Problem Groups</h3>
                                                            <div className="flex items-center gap-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button onClick={() => {
                                            setAddProblemGroupData({
                                                id: "",
                                                name: ""
                                            })
                                        }}>
                                            <PlusIcon className="w-4 h-4" />
                                            Add
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Problem Group</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Name</Label>
                                                <Input 
                                                    value={addProblemGroupData?.name || ""} 
                                                    onChange={(e) => {
                                                        setAddProblemGroupData({
                                                            ...addProblemGroupData!,
                                                            name: e.target.value
                                                        })
                                                    }}
                                                    placeholder="Enter problem group name"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="default" size="lg" onClick={handleAddProblemGroup}>
                                                Save
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                {groupId && (
                                    <>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="default" size="sm" onClick={() => {
                                                setEditProblemGroupData({
                                                    id: groupId,
                                                    name: problemGroupData.find((item) => item.id == groupId)?.name!
                                                })
                                            }}>
                                                <PencilIcon className="w-4 h-4" />
                                                Edit
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Problem Group</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label>Name</Label>
                                                    <Input 
                                                        value={editProblemGroupData?.name || ""} 
                                                        onChange={(e) => {
                                                            setEditProblemGroupData({
                                                                ...editProblemGroupData!,
                                                                name: e.target.value
                                                            })
                                                        }}
                                                        placeholder="Enter problem group name"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="default" size="lg" onClick={handleEditProblemGroup}>
                                                    Save
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <TrashIcon className="w-4 h-4" />
                                                Delete
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Delete Problem Group</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label>Are you sure you want to delete this problem group?</Label>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="destructive" size="lg" onClick={handleDeleteProblemGroup}>
                                                    Delete
                                                </Button>
                                                <Button variant="outline" size="lg" onClick={() => {setGroupId(""); setPageProblemGroup(1)}}>
                                                    Cancel
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    </>
                                )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <Input
                                    placeholder="Search problem group..."
                                    value={searchTermProblemGroup}
                                    onChange={(e) => {setSearchTermProblemGroup(e.target.value); setPageProblemGroup(1); setTodoId(""); setGroupId("")}}
                                    className="h-9 flex-1 mr-2"
                                />
                                <Button variant="outline" size="sm" onClick={() => {setPageProblemGroup(1); setSearchTermProblemGroup(""); setTodoId(""); setGroupId("")}}>
                                    <XIcon className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setPageProblemGroup(pageProblemGroup - 1)} 
                                    disabled={pageProblemGroup === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-muted-foreground">
                                    Page {pageProblemGroup} of {totalPagesProblemGroup}
                                </span>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setPageProblemGroup(pageProblemGroup + 1)} 
                                    disabled={pageProblemGroup === totalPagesProblemGroup}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        <div className="p-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center font-medium">Name</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingProblemGroup ? (
                                        <TableRow>
                                            <TableCell colSpan={1} className="text-center text-muted-foreground py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : problemGroupData && problemGroupData.length > 0 ? problemGroupData.map((item) => (
                                        <TableRow 
                                            key={item.id} 
                                            className={`cursor-pointer transition-colors ${
                                                groupId === item.id 
                                                    ? 'bg-blue-100 hover:bg-blue-150' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {setGroupId(item.id); setPageProblem(1); setTodoId(""); setTrigger(!trigger)}}
                                        >
                                            <TableCell className="text-center">{item.name}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={1} className="text-center text-muted-foreground py-8">
                                                No data found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Problem Section */}
                    <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold mb-3">Problems</h3>
                                <div className="flex items-center gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button onClick={() => {
                                                setAddProblemData({
                                                    id: "",
                                                    name: "",
                                                    problem_group_id: groupId || "",
                                                    color: "",
                                                    process: ""
                                                })
                                            }}>
                                                <PlusIcon className="w-4 h-4" />
                                                Add
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add Problem</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label>Name</Label>
                                                    <Input 
                                                        value={addProblemData?.name || ""} 
                                                        onChange={(e) => {
                                                            setAddProblemData({
                                                                ...addProblemData!,
                                                                name: e.target.value
                                                            })
                                                        }}
                                                        placeholder="Enter problem name"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Problem Group</Label>
                                                    <Select value={addProblemData?.problem_group_id} onValueChange={(value) => {
                                                        setAddProblemData({
                                                            ...addProblemData!,
                                                            problem_group_id: value
                                                        })
                                                    }}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select color" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {problemGroupData.map((item) => (
                                                                <SelectItem key={item.id} value={item.id}> {item.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Color</Label>
                                                    <Select value={addProblemData?.color} onValueChange={(value) => {
                                                        setAddProblemData({
                                                            ...addProblemData!,
                                                            color: value
                                                        })
                                                    }}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select color" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ORANGE"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFA500" }}></div>
                                                                    ORANGE
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="WHITE"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFFFFF" }}></div>
                                                                    WHITE
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="RED"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FF0000" }}></div>
                                                                    RED
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="BLUE"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0000FF" }}></div>
                                                                    BLUE
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="GREEN"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#008000" }}></div>
                                                                    GREEN
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="PURPLE"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#800080" }}></div>
                                                                    PURPLE
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="YELLOW"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFFF00" }}></div>
                                                                    YELLOW
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Process</Label>
                                                    <Select value={addProblemData?.process} onValueChange={(value) => {
                                                        setAddProblemData({
                                                            ...addProblemData!,
                                                            process: value
                                                        })
                                                    }}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select process" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="INJECTION">INJECTION</SelectItem>
                                                            <SelectItem value="UV">UV</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="default" size="lg" onClick={handleAddProblem}>
                                                    Save
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    {problemId && (
                                        <>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="default" size="sm" onClick={() => {
                                                    setEditProblemData({
                                                        id: problemId,
                                                        name: problemData.find((item) => item.id == problemId)?.name!,
                                                        problem_group_id: problemData.find((item) => item.id == problemId)?.problem_group_id!,
                                                        color: problemData.find((item) => item.id == problemId)?.color!,
                                                        process: problemData.find((item) => item.id == problemId)?.process!
                                                    })
                                                }}>
                                                    <PencilIcon className="w-4 h-4" />
                                                    Edit
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Problem</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Name</Label>
                                                        <Input 
                                                            value={editProblemData?.name || ""} 
                                                            onChange={(e) => {
                                                                setEditProblemData({
                                                                    ...editProblemData!,
                                                                    name: e.target.value
                                                                })
                                                            }}
                                                            placeholder="Enter problem name"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Problem Group</Label>
                                                        <Select value={editProblemData?.problem_group_id} onValueChange={(value) => {
                                                            setEditProblemData({
                                                                ...editProblemData!,
                                                                problem_group_id: value
                                                            })
                                                        }}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select problem group" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {problemGroupData.map((item) => (
                                                                    <SelectItem key={item.id} value={item.id}> {item.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Process</Label>
                                                        <Select value={editProblemData?.process} onValueChange={(value) => {
                                                            setEditProblemData({
                                                                ...editProblemData!,
                                                                process: value
                                                            })
                                                        }}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select process" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="INJECTION">INJECTION</SelectItem>
                                                                <SelectItem value="UV">UV</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Color</Label>
                                                        <Select value={editProblemData?.color} onValueChange={(value) => {
                                                            setEditProblemData({
                                                                ...editProblemData!,
                                                                color: value
                                                            })
                                                        }}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select color" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="ORANGE"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFA500" }}></div>
                                                                    ORANGE
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="WHITE"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFFFFF" }}></div>
                                                                    WHITE
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="RED"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FF0000" }}></div>
                                                                    RED
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="BLUE"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0000FF" }}></div>
                                                                    BLUE
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="GREEN"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#008000" }}></div>
                                                                    GREEN
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="PURPLE"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#800080" }}></div>
                                                                    PURPLE
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="YELLOW"> <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFFF00" }}></div>
                                                                    YELLOW
                                                                </div>
                                                            </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="default" size="lg" onClick={handleEditProblem}>
                                                        Save
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <TrashIcon className="w-4 h-4" />
                                                    Delete
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Delete Problem</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Are you sure you want to delete this problem?</Label>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="destructive" size="lg" onClick={handleDeleteProblem}>
                                                        Delete
                                                    </Button>
                                                    <Button variant="outline" size="lg" onClick={() => {setProblemId(""); setPageProblem(1)}}>
                                                        Cancel
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <Input
                                    placeholder="Search problem..."
                                    value={searchTermProblem}
                                    onChange={(e) => {setSearchTermProblem(e.target.value); setPageProblem(1); setTodoId("")}}
                                    className="h-9 flex-1 mr-2"
                                />
                                <Button variant="outline" size="sm" onClick={() => {setPageProblem(1); setSearchTermProblem(""); setTodoId(""); setProblemId(""); setGroupId("")}}>
                                    <XIcon className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setPageProblem(pageProblem - 1)} 
                                    disabled={pageProblem === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-muted-foreground">
                                    Page {pageProblem} of {totalPagesProblem}
                                </span>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setPageProblem(pageProblem + 1)} 
                                    disabled={pageProblem === totalPagesProblem}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        <div className="p-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center font-medium">Name</TableHead>
                                        <TableHead className="text-center font-medium">Color</TableHead>
                                        <TableHead className="text-center font-medium">
                                                Process
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="ml-1">
                                                            <FilterIcon className="w-1 h-1" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent>
                                                        <Select value={filter} onValueChange={(value) => {handleFilter(value)}}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select process" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="All">All</SelectItem>
                                                                <SelectItem value="INJECTION">INJECTION</SelectItem>
                                                                <SelectItem value="UV">UV</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingProblem ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : problemData && problemData.length > 0 ? problemData.map((item) => (
                                        <TableRow 
                                            key={item.id} 
                                            className={`cursor-pointer transition-colors ${
                                                problemId === item.id 
                                                    ? 'bg-blue-100 hover:bg-blue-150' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {setProblemId(item.id); setPageTodo(1); setTodoId(""); setGroupId(item.problem_group_id)}}
                                        >
                                            <TableCell className="text-center">{item.name}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center">
                                                    <div 
                                                        className="w-4 h-4 rounded-full mr-2" 
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    {item.color}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{item.process}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                No data found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Todo Section */}
                    <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold mb-3">Todos</h3>
                                <div className="flex items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default"  onClick={() => {
                                setAddData({
                                    problem_group: {id: groupId || "", name: problemGroupData.find((item) => item.id === groupId)?.name || ""},
                                    problem: {id: problemId||"", name: problemData.find((item) => item.id === problemId)?.name || "", problem_group_id: groupId || "", color: problemData.find((item) => item.id === problemId)?.color || "", process: problemData.find((item) => item.id === problemId)?.process || ""},
                                    todo: {id: "", name: "", problem_id: "", pic: "", is_escalated: false}
                                })
                            }}>
                                <PlusIcon className="w-4 h-4" />
                                Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Problem Group</Label>
                                    <Select value={addData?.problem_group.id}
                                        onValueChange={(value) => {
                                            setAddData({
                                                ...addData!,
                                                problem_group: problemGroupData.find((item) => item.id === value)!,
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select problem group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {problemGroupData.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Problem</Label>
                                    <Select value={addData?.problem.id}
                                        onValueChange={(value) => {
                                            setAddData({
                                                ...addData!,
                                                problem: problemData.find((item) => item.id == value)!,
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select problem" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {problemData.filter((item) => item.problem_group_id == addData?.problem_group.id).map((item) => (
                                                <SelectItem key={item.id} value={item.id}>{item.name} ({item.color} - {item.process})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Todo Name</Label>
                                    <Input 
                                        value={addData?.todo.name || ""} 
                                        onChange={(e) => {
                                            setAddData({
                                                ...addData!,
                                                todo: {
                                                    ...addData?.todo!,
                                                    name: e.target.value,   
                                                    problem_id: addData?.problem.id!,
                                                    pic: addData?.todo.pic!,
                                                    is_escalated: addData?.todo.is_escalated!
                                                }
                                            })
                                        }}
                                        placeholder="Enter todo name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status Escalated</Label>
                                    <Select value={addData?.todo.is_escalated ? "true" : "false"}
                                        onValueChange={(value) => {
                                            setAddData({
                                                ...addData!,
                                                todo: {
                                                    ...addData?.todo!,
                                                    is_escalated: value === "true"
                                                }
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="false" className="text-red-500">Non-Escalated</SelectItem>
                                            <SelectItem value="true" className="text-green-500">Escalated</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>PIC</Label>
                                    <Select value={addData?.todo.pic}
                                        onValueChange={(value) => {
                                            setAddData({
                                                ...addData!,
                                                todo: {
                                                    ...addData?.todo!,
                                                    pic: value
                                                }
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select PIC" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MEKANIK">MEKANIK</SelectItem>
                                            <SelectItem value="OPERATOR BAHAN">OPERATOR BAHAN</SelectItem>
                                            <SelectItem value="SPV PRODUKSI">SPV PRODUKSI</SelectItem>
                                            {addData?.todo.is_escalated && (
                                                <>
                                                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                                                    <SelectItem value="MOLD">MOLD</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                            </div>
                            <DialogFooter>
                                <Button variant="default" size="lg" onClick={() => {handleAddTodo()}}>
                                    Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    {todoId && (
                        <>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default" onClick={() => {
                                setEditData({
                                    problem_group: problemGroupData.find((item) => item.id === problemData.find((item) => item.id === todoData.find((item) => item.id === todoId)?.problem_id)?.problem_group_id)!,
                                    problem: problemData.find((item) => item.id == todoData.find((item) => item.id == todoId)?.problem_id)!,
                                    todo: todoData.find((item) => item.id == todoId)!
                                })
                            }}>
                                <PencilIcon className="w-4 h-4" />
                                Edit
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Problem & Todo</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Problem Group</Label>
                                    <Select value={editData?.problem_group.id}
                                        onValueChange={(value) => {
                                            setEditData({
                                                ...editData!,
                                                problem_group: problemGroupData.find((item) => item.id === value)!,
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select problem group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {problemGroupData.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Problem</Label>
                                    <Select value={editData?.problem.id}
                                        onValueChange={(value) => {
                                            setEditData({
                                                ...editData!,
                                                problem: problemData.find((item) => item.id === value)!,
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select problem" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {problemData.filter((item) => item.problem_group_id == editData?.problem_group.id).map((item) => (
                                                <SelectItem key={item.id} value={item.id}>{item.name} ({item.color} - {item.process})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Todo Name</Label>
                                    <Input 
                                        value={editData?.todo.name || ""} 
                                        onChange={(e) => {
                                            setEditData({
                                                ...editData!,
                                                todo: {
                                                    ...editData?.todo!,
                                                    name: e.target.value,
                                                    problem_id: editData?.problem.id!,
                                                    pic: editData?.todo.pic!,
                                                    is_escalated: editData?.todo.is_escalated!
                                                }
                                            })
                                        }}
                                        placeholder="Enter todo name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status Escalated</Label>
                                    <Select value={editData?.todo.is_escalated ? "true" : "false"}
                                        onValueChange={(value) => {
                                            setEditData({
                                                ...editData!,
                                                todo: {
                                                    ...editData?.todo!,
                                                    is_escalated: value === "true"
                                                }
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="false" className="text-red-500">Non-Escalated</SelectItem>
                                            <SelectItem value="true" className="text-green-500">Escalated</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>PIC</Label>
                                    <Select value={editData?.todo.pic}
                                        onValueChange={(value) => {
                                            setEditData({
                                                ...editData!,
                                                todo: {
                                                    ...editData?.todo!,
                                                    pic: value
                                                }
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select PIC" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MEKANIK">MEKANIK</SelectItem>
                                            <SelectItem value="OPERATOR BAHAN">OPERATOR BAHAN</SelectItem>
                                            <SelectItem value="SPV PRODUKSI">SPV PRODUKSI</SelectItem>
                                            {editData?.todo.is_escalated && (
                                                <>
                                                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                                                    <SelectItem value="MOLD">MOLD</SelectItem>
                                                </>
                                            )}
                                            
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                               
                            </div>
                            <DialogFooter>
                                <Button variant="default" size="lg" onClick={() => {handleEditTodo()}}> 
                                    Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive" >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Problem & Todo</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Are you sure you want to delete this problem & todo?</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="destructive" size="lg" onClick={() => {setTodoId(""); setPageTodo(1); handleDeleteTodo()}}>
                                    Delete
                                </Button>
                                <Button variant="outline" size="lg" onClick={() => {setTodoId(""); setPageTodo(1)}}>
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    </>
                    )}
                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <Input
                                    placeholder="Search todo..."
                                    value={searchTermTodo}
                                    onChange={(e) => {setSearchTermTodo(e.target.value); setPageTodo(1); setTodoId("")}}
                                    className="h-9 flex-1 mr-2"
                                />
                                <Button variant="outline" size="sm" onClick={() => {setPageTodo(1); setSearchTermTodo(""); setTodoId(""); setProblemId(""); setGroupId("")}}>
                                    <XIcon className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setPageTodo(pageTodo - 1)} 
                                    disabled={pageTodo === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-muted-foreground">
                                    Page {pageTodo} of {totalPagesTodo}
                                </span>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setPageTodo(pageTodo + 1)} 
                                    disabled={pageTodo === totalPagesTodo}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        <div className="p-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center font-medium">Name</TableHead>
                                        <TableHead className="text-center font-medium">PIC</TableHead>
                                        <TableHead className="text-center font-medium">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingTodo ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : todoData && todoData.length > 0 ? todoData.map((item) => (
                                        <TableRow 
                                            key={item.id} 
                                            className={`cursor-pointer transition-colors ${
                                                todoId === item.id 
                                                    ? 'bg-blue-100 hover:bg-blue-150' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {setTodoId(item.id); setPageTodo(1); setProblemId(item.problem_id); setGroupId(problemData.find((problem) => problem.id == item.problem_id)?.problem_group_id!)}}
                                        >
                                            <TableCell className="text-center">{item.name}</TableCell>
                                            <TableCell className="text-center">{item.pic}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.is_escalated 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {item.is_escalated ? "Escalated" : "NonEscalated"}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                No data found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 