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
import { toast } from "react-hot-toast"

type RoutingData = {
    id: string
    material_id: string
    material_name: string
    mrpcn: string | null
    net_weight: number | null
    gross_weight: number | null
    shoot_weight: number | null
    cvt: number
    ct: number
    created_at: string
    scheduler: string
}
type RoutingDataResponse = {
    data: RoutingData[]
    totalPages: number
    totalItems: number
}

export function RoutingDataForm() {
    const [routingData, setRoutingData] = React.useState<RoutingData[]>([])
    const [searchTerm, setSearchTerm] = React.useState("")
    const [searchDate, setSearchDate] = React.useState("")
    const [loading, setLoading] = React.useState(true)
    const [page, setPage] = React.useState(1)
    const [totalPages, setTotalPages] = React.useState(0)
    const [totalItems, setTotalItems] = React.useState(0)

    React.useEffect(() => {
        const fetchRoutingData = async () => {
            try {
                const response = await fetch(`/be/api/routing-data?materialId=${searchTerm}&uploadedAt=${searchDate}&page=${page}`)
                const data = await response.json()
                setRoutingData(data.data)
                setTotalPages(data.totalPages)
                setTotalItems(data.totalItems)
            } catch (error) {
                toast.error('Error fetching routing data')
                console.error('Error fetching routing data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchRoutingData()
    }, [searchTerm, searchDate, page])

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
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Routing Data</h2>
                <p className="text-muted-foreground">
                    Here&apos;s a list of your routing data
                </p>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center space-x-2">
                        <Input
                            placeholder="Search routing data by material id..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 w-[250px] lg:w-[350px]"
                        />
                        <p className="text-sm text-muted-foreground">Search routing data by uploaded at</p>
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
                                <TableHead className="text-center">Material</TableHead>
                                <TableHead className="text-center">Material Name</TableHead>
                                <TableHead className="text-center">MRPCN</TableHead>
                                <TableHead className="text-center">Net Weight</TableHead>
                                <TableHead className="text-center">Gross Weight</TableHead>
                                <TableHead className="text-center">Shoot Weight</TableHead>
                                <TableHead className="text-center">CVT</TableHead>
                                <TableHead className="text-center">CT</TableHead>
                                <TableHead className="text-center">Scheduler</TableHead>
                                <TableHead className="text-center">Uploaded At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {routingData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-center">{item.material_id}</TableCell>
                                    <TableCell className="text-center">{item.material_name}</TableCell>
                                    <TableCell className="text-center">{item.mrpcn}</TableCell>
                                    <TableCell className="text-center">{item.net_weight}</TableCell>
                                    <TableCell className="text-center">{item.gross_weight}</TableCell>
                                    <TableCell className="text-center">{item.shoot_weight}</TableCell>
                                    <TableCell className="text-center">{item.cvt}</TableCell>
                                    <TableCell className="text-center">{item.ct}</TableCell>
                                    <TableCell className="text-center">{item.scheduler}</TableCell>
                                    <TableCell className="text-center">{new Date(item.created_at).toISOString().replace('T', ' ').substring(0, 19)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
} 