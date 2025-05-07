"use client"

import type React from "react"

import { useState } from "react"
import * as XLSX from "xlsx" 
import { Upload, FileSpreadsheet, AlertCircle, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "react-hot-toast"
import { Progress } from "@/components/ui/progress"

export default function CooisUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
      setError(null)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setSelectedFile(event.dataTransfer.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (selectedFile) {
      setLoading(true)
      setError(null)
      setProgress(50)
      try {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const workbook = XLSX.read(event.target?.result as string, { type: "array" })
            const worksheet = workbook.Sheets[workbook.SheetNames[workbook.SheetNames.length-1]]
            const data = XLSX.utils.sheet_to_json(worksheet, { range: "B2:J10000", header: 1, raw: true })
            setData(data)
            // console.log(JSON.stringify(data[0]))
            // console.log(data.slice(0,10))

          } catch (error) {
            setError(`Error processing the file. Please make sure it's a valid Excel file., ${error}`,  )
          } finally {
            setLoading(false)
            setProgress(100)
            setProgress(0)

          }
        }
        reader.readAsArrayBuffer(selectedFile)
      } catch (error) {
        setError(`Error reading the file. Please try again., ${error}`)
        setLoading(false)
        setProgress(0)
      }
    } else {
      setError("Please select a file to upload.")
    }
  }

  const handleSyncDb = async () => {

    if(data){
        setLoading(true)
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/coois`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          if (response.ok) {
            toast.success('Data sukses disinkronisasi')
            setLoading(false)
          } else {
            toast.error('Gagal sinkronisasi')
            setLoading(false)
          }
        } catch (error: any) {
          toast.error(`Gagal sinkronisasi data ${error.message}`)
          setLoading(false)
        }
    }
  }

  return (
    <div className="p-4 w-full mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="">Excel File Upload COOIS</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <p className="">Perhatikan hal-hal berikut sebelum upload :</p>
                    <p className="">1. Pastikan data sudah benar, yaitu COOIS</p>
                    <p className="">2. Pastikan data komplit, hindari data kosong</p>
                    <p className="">3. Sheet yang dipilih adalah sheet yang paling terakhir</p>
                    <p className="">4. Kolom yang dipilih adalah B2:J10000</p>
                    <p className="">5. Data yang wajib ada : PO, PN, PRODUK, ORDER, HASIL</p>
                    <p className="flex">6. Download contoh file COOIS : <><a href="/admin/contoh_coois.xlsx" download className="text-secondary-foreground underline flex items-center">Contoh COOIS <Download size={16}/></a></></p>
                </div>
                <div
                    className="col-span-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload')?.click()}
                >
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Drag and drop your Excel file here, or click to select</p>
                    <Input type="file" onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" id="file-upload" />
                    <label htmlFor="file-upload">
                    <Button variant="outline" className="mt-4">
                        Select File
                    </Button>
                    </label>
                </div>
          </div>
          
          {selectedFile && 
            <div className="flex mt-2">
            <p className=" text-sm text-gray-500">Selected file:</p>
            <p className="ml-2 text-sm text-primary font-bold"> {selectedFile.name}</p>
            <p className="ml-2 text-sm" style={{color: selectedFile.name.toLowerCase().includes("coois") ? "green" : "red"}}>
              {selectedFile.name.toLowerCase().includes("coois") ? "OK" : "Warning ! This file name seems incorrect, please recheck before upload!"}
            </p>
        </div>}
          <div className="mt-4">
           
           <Progress value={progress} />
            <Button onClick={handleUpload} className="mt-2 w-full" disabled={!selectedFile || loading}>
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
            <CardTitle>Uploaded Data (Shown first 50 rows)</CardTitle>
            <Button onClick={() => handleSyncDb()}><RefreshCw className={loading ? 'animate-spin' : '' }/>Syncronize to DB</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                  {Array.from({ length: data[0].length }, (_, index) => (
                    <TableHead key={index} className="border border-gray-300 bg-gray-100 dark:bg-gray-800 min-w-[50px] text-center">
                        {data[0][index] == null || data[0][index]?.trim() === "" ? (
                        <span className="text-red-500">empty</span>
                        ) : (
                        `${data[0][index]}`
                        )}
                    </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                {data.slice(1, 51).map((row: any[], rowIndex: number) => (
                        <TableRow key={rowIndex}>
                            {Array.from({ length: data[0].length }, (_, cellIndex) => (
                            <TableCell key={cellIndex} className="border border-gray-300 text-center">
                                {row[cellIndex] == null  ? (
                                <span className="text-gray-500">empty</span>
                                ) : (
                                row[cellIndex]
                                )}
                            </TableCell>
                            ))}
                        </TableRow>
                        ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

