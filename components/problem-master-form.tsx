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
import { ArrowUpDown, RefreshCcwIcon, XIcon } from "lucide-react"
import { toast } from "react-hot-toast"

type ProblemGroup = {
    id: string
    name: string
}

type Problem = {
    id: string
    name: string
    problem_group_id: string
    color: string
}

type Todo = {
    id: string
    name: string
    problem_id: string
    pic: string
    is_escalated: boolean
}
type ProblemGroupResponse = {
    data: ProblemGroup[]
    totalPages: number
    totalItems: number
}
type ProblemResponse = {
    data: Problem[]
    totalPages: number
    totalItems: number
}
type TodoResponse = {
    data: Todo[]
    totalPages: number
    totalItems: number
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

    React.useEffect(() => {
        const fetchProblemGroupData = async () => {
            try {
                const response = await fetch(`/be/api/problem-master/problem-group?name=${searchTermProblemGroup}&page=${pageProblemGroup}`)
                const data = await response.json()
                setProblemGroupData(data.data)
                setTotalPagesProblemGroup(data.totalPages)
                setTotalItemsProblemGroup(data.totalItems)
            } catch (error) {
                toast.error('Error fetching problem group data')
                console.error('Error fetching problem group data:', error)
            } finally {
                setLoading(false)
            }
        }
        

        fetchProblemGroupData()
    }, [searchTermProblemGroup, searchDate, pageProblemGroup])

    React.useEffect(() => {
        const fetchProblemData = async () => {
            try {
                const response = await fetch(`/be/api/problem-master/problem?name=${searchTermProblem}&groupId=${groupId}&page=${pageProblem}`)
                const data = await response.json()
                setProblemData(data.data)
                setTotalPagesProblem(data.totalPages)
                setTotalItemsProblem(data.totalItems)
            } catch (error) {
                toast.error('Error fetching problem group data')
                console.error('Error fetching problem group data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProblemData()
    }, [searchTermProblem, groupId, searchDate, pageProblem])

    React.useEffect(() => {
        const fetchTodoData = async () => {
            try {
                const response = await fetch(`/be/api/problem-master/todo?name=${searchTermTodo}&problemId=${problemId}&page=${pageTodo}`)
                const data = await response.json()
                setTodoData(data.data)
                setTotalPagesTodo(data.totalPages)
                setTotalItemsTodo(data.totalItems)
            } catch (error) {
                toast.error('Error fetching todo data')
                console.error('Error fetching todo data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTodoData()
    }, [searchTermTodo, problemId, searchDate, pageTodo])

    

    

    // const filteredData = routingData.filter(
    //     (item) =>
    //         item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //         item.plant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //         item.routingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //         item.workCenter.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    // )

   if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="h-full flex-1 flex-col space-y-2 p-2 md:flex">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Problem Master</h2>
                <p className="text-muted-foreground">
                    Here&apos;s a list of your problem master
                </p>
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Problem Group Section */}
                    <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold mb-3">Problem Groups</h3>
                            <div className="flex items-center justify-between mb-4">
                                <Input
                                    placeholder="Search problem group..."
                                    value={searchTermProblemGroup}
                                    onChange={(e) => {setSearchTermProblemGroup(e.target.value); setPageProblemGroup(1)}}
                                    className="h-9 flex-1 mr-2"
                                />
                                <Button variant="outline" size="sm" onClick={() => {setPageProblemGroup(1); setSearchTermProblemGroup("")}}>
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
                                    Pa?NNge {pageProblemGroup} of {totalPagesProblemGroup}
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
                                    {problemGroupData && problemGroupData.length > 0 ? problemGroupData.map((item) => (
                                        <TableRow 
                                            key={item.id} 
                                            className={`cursor-pointer transition-colors ${
                                                groupId === item.id 
                                                    ? 'bg-blue-100 hover:bg-blue-150' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {setGroupId(item.id); setPageProblem(1)}}
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
                            <h3 className="text-lg font-semibold mb-3">Problems</h3>
                            <div className="flex items-center justify-between mb-4">
                                <Input
                                    placeholder="Search problem..."
                                    value={searchTermProblem}
                                    onChange={(e) => {setSearchTermProblem(e.target.value); setPageProblem(1)}}
                                    className="h-9 flex-1 mr-2"
                                />
                                <Button variant="outline" size="sm" onClick={() => {setPageProblem(1); setSearchTermProblem("")}}>
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {problemData && problemData.length > 0 ? problemData.map((item) => (
                                        <TableRow 
                                            key={item.id} 
                                            className={`cursor-pointer transition-colors ${
                                                problemId === item.id 
                                                    ? 'bg-blue-100 hover:bg-blue-150' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {setProblemId(item.id); setPageTodo(1)}}
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
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
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
                            <h3 className="text-lg font-semibold mb-3">Todos</h3>
                            <div className="flex items-center justify-between mb-4">
                                <Input
                                    placeholder="Search todo..."
                                    value={searchTermTodo}
                                    onChange={(e) => {setSearchTermTodo(e.target.value); setPageTodo(1)}}
                                    className="h-9 flex-1 mr-2"
                                />
                                <Button variant="outline" size="sm" onClick={() => {setPageTodo(1); setSearchTermTodo("")}}>
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
                                    {todoData && todoData.length > 0 ? todoData.map((item) => (
                                        <TableRow 
                                            key={item.id} 
                                            className={`cursor-pointer transition-colors ${
                                                problemId === item.id 
                                                    ? 'bg-blue-100 hover:bg-blue-150' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {setProblemId(item.id); setPageTodo(1)}}
                                        >
                                            <TableCell className="text-center">{item.name}</TableCell>
                                            <TableCell className="text-center">{item.pic}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.is_escalated 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {item.is_escalated ? "Escalated" : "Active"}
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