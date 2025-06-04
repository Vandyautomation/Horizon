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
import { ArrowUpDown } from "lucide-react"
import {toast} from "react-hot-toast"

type CooisData = {
    
    id: string
    so_name: string
    po_name: string
    op_no: string
    type: string
    material_id: string
    material_name: string
    required_qty: number
    produced_qty: number
    scrap_qty: number | null
    is_deleted: boolean | null
    uploaded_at: string
    modified_at: string
}
type CooisDataResponse = {
    data: CooisData[]
    totalPages: number
    totalItems: number
}

export function CooisDataForm() {
    const [cooisData, setCooisData] = React.useState<CooisData[]>([])
    const [searchTerm, setSearchTerm] = React.useState("")
    const [searchDate, setSearchDate] = React.useState("")
    const [loading, setLoading] = React.useState(true)
    const [page, setPage] = React.useState(1)
    const [totalPages, setTotalPages] = React.useState(0)
    const [totalItems, setTotalItems] = React.useState(0)

    React.useEffect(() => {
        const fetchCooisData = async () => {
            try {
                const response = await fetch(`/be/api/coois-data?poName=${searchTerm}&uploadedAt=${searchDate}&page=${page}`)
                const data = await response.json()
                setCooisData(data.data)
                setTotalPages(data.totalPages)
                setTotalItems(data.totalItems)
            } catch (error) {
                toast.error('Error fetching COOIS data')
                console.error('Error fetching COOIS data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCooisData()
    }, [searchTerm, searchDate, page])

    // const filteredData = cooisData.filter(
    //     (item) =>
    //         item.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //         item.materialName.toLowerCase().includes(searchTerm.toLowerCase())
    // )

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">COOIS Data</h2>
                <p className="text-muted-foreground">
                    Here&apos;s a list of your COOIS data
                </p>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center space-x-2">
                        <Input
                            placeholder="Search COOIS data by PO Number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 w-[250px] lg:w-[350px]"
                        />
                        <p className="text-sm text-muted-foreground">Search COOIS data by uploaded at</p>
                        <Input
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="h-8 w-[150px] lg:w-[150px]"
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
                                <TableHead className="text-center">SO Number</TableHead>
                                <TableHead className="text-center">PO Number</TableHead>
                                <TableHead className="text-center">OP Number</TableHead>
                                <TableHead className="text-center">Type</TableHead>
                                <TableHead className="text-center">Material ID</TableHead>
                                <TableHead className="text-center">Material Name</TableHead>
                                <TableHead className="text-center">Required Qty</TableHead>
                                <TableHead className="text-center">Produced Qty</TableHead>
                                <TableHead className="text-center">Scrap Qty</TableHead>
                                <TableHead className="text-center">Uploaded At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cooisData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-center">{item.so_name}</TableCell>
                                    <TableCell className="text-center">{item.po_name}</TableCell>
                                    <TableCell className="text-center">{item.op_no}</TableCell>
                                    <TableCell className="text-center">{item.type}</TableCell>
                                    <TableCell className="text-center">{item.material_id}</TableCell>
                                    <TableCell className="text-center">{item.material_name}</TableCell>
                                    <TableCell className="text-center">{item.required_qty}</TableCell>
                                    <TableCell className="text-center">{item.produced_qty}</TableCell>
                                    <TableCell className="text-center">{item.scrap_qty}</TableCell>
                                    <TableCell className="text-center">{new Date(item.uploaded_at).toISOString().replace('T', ' ').substring(0, 19)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
} 