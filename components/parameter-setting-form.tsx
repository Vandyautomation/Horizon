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
import { ArrowUpDown, EditIcon, TrashIcon } from "lucide-react"
import { toast } from "react-hot-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type ParameterSettingData = {
    id: string
    name: string
    value: number
    uom: string
}
type ParameterSettingDataResponse = {
    data: ParameterSettingData[]
    totalPages: number
    totalItems: number
}

export function ParameterSettingForm() {
    const [parameterSettingData, setParameterSettingData] = React.useState<ParameterSettingData[]>([])
    const [searchTerm, setSearchTerm] = React.useState("")
    const [searchDate, setSearchDate] = React.useState("")
    const [loading, setLoading] = React.useState(true)
    const [page, setPage] = React.useState(1)
    const [totalPages, setTotalPages] = React.useState(0)
    const [totalItems, setTotalItems] = React.useState(0)
    const [addData, setAddData] = React.useState<ParameterSettingData>({
        id: "",
        name: "",
        value: 0.0,
        uom: ""
    })
    const [editData, setEditData] = React.useState<ParameterSettingData>({
        id: "",
        name: "",
        value: 0.0,
        uom: ""
    })

    React.useEffect(() => {
        const fetchParameterSettingData = async () => {
            try {
                const response = await fetch(`/be/api/parameter-setting?name=${searchTerm}&page=${page}`)
                const data = await response.json()
                setParameterSettingData(data.data)
                setTotalPages(data.totalPages)
                setTotalItems(data.totalItems)
            } catch (error) {
                toast.error('Error fetching parameter setting data')
                console.error('Error fetching parameter setting data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchParameterSettingData()
    }, [searchTerm, searchDate, page])

    const handleEdit = async (id: string, name: string, value: number, uom: string) => {
        const response = await fetch(`/be/api/parameter-setting/${id}`, {
            method: "PUT",
            body: JSON.stringify({ name, value, uom })
        })
        const data = await response.json()
        setParameterSettingData(data)
    }

    const handleAdd = async (name: string, value: number, uom: string) => {
        const response = await fetch(`/be/api/parameter-setting`, {
            method: "POST",
            body: JSON.stringify({ name, value, uom })
        })
        const data = await response.json()
    }

    const handleDelete = async (id: string) => {
        const response = await fetch(`/be/api/parameter-setting/${id}`, {
            method: "DELETE"
        })
        const data = await response.json()
        setParameterSettingData(data)
    }


   if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between">
                <div>
                <h2 className="text-2xl font-bold tracking-tight">Parameter Setting</h2>
                <p className="text-muted-foreground">
                    Here&apos;s a list of your parameter setting
                </p>
                </div>
                <Dialog>
                    <DialogTrigger>
                        <Button>Add</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Parameter Setting</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-2">
                            <Label>Name</Label>
                            <Input type="text" value={addData.name} onChange={(e) => setAddData({ ...addData, name: e.target.value })} />
                            <Label>Value</Label>
                            <Input type="number" step={0.1} value={addData.value} onChange={(e) => setAddData({ ...addData, value: e.target.value === "" ? 0.0 : Number(e.target.value) })} />
                            <Label>UOM</Label>
                            <Input type="text" value={addData.uom} onChange={(e) => setAddData({ ...addData, uom: e.target.value })} />
                        </div>
                        <Button onClick={() => handleAdd(addData.name, addData.value, addData.uom)}>Save</Button>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center space-x-2">
                        <Input
                            placeholder="Search parameter setting by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 w-[250px] lg:w-[350px]"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</Button>
                        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                        <Button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
                    </div>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Name</TableHead>
                                <TableHead className="text-center">Value</TableHead>
                                <TableHead className="text-center">UOM</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parameterSettingData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-center">{item.name}</TableCell>
                                    <TableCell className="text-center">{item.value}</TableCell>
                                    <TableCell className="text-center">{item.uom}</TableCell>
                                    <TableCell className="text-center flex items-center justify-center gap-2">
                                        <Dialog>
                                            <DialogTrigger>
                                                <Button variant="outline" size="icon" onClick={() => setEditData({ id: item.id, name: item.name, value: item.value, uom: item.uom })}>
                                                    <EditIcon className="w-4 h-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Parameter Setting</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex flex-col gap-2">
                                                    <Label>Name</Label>
                                                    <Input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                                                    <Label>Value</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={editData.value}
                                                        onChange={(e) => setEditData({ ...editData, value: e.target.value === "" ? 0.0 : Number(e.target.value) })}
                                                    />
                                                    <Label>UOM</Label>
                                                    <Input type="text" value={editData.uom} onChange={(e) => setEditData({ ...editData, uom: e.target.value })} />
                                                </div>
                                                <Button onClick={() => handleEdit(item.id, editData.name, editData.value, editData.uom)}>Save</Button>
                                            </DialogContent>
                                        </Dialog>
                                        <Dialog>
                                            <DialogTrigger>
                                                <Button variant="destructive" size="icon">
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Delete Parameter Setting</DialogTitle>
                                                    <DialogDescription>
                                                        Are you sure you want to delete this parameter setting?
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="destructive" onClick={() => handleDelete(item.id)}>
                                                        <TrashIcon className="w-4 h-4" />
                                                        Delete
                                                    </Button>
                                                    <DialogClose>
                                                        <Button variant="outline">Cancel</Button>
                                                    </DialogClose>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
} 