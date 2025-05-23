"use client"

import type React from "react"

import { useState, useCallback } from "react"
import * as XLSX from "xlsx" 
import { Upload, FileSpreadsheet, AlertCircle, Download, icons, RefreshCcw, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "react-hot-toast"
import { Progress } from "@/components/ui/progress"

export default function RoutingUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB limit

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      return false
    }
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Please upload a valid Excel file (.xlsx or .xls)")
      return false
    }
    return true
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        setError(null)
      } else {
        setSelectedFile(null)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        setError(null)
      } else {
        setSelectedFile(null)
      }
    }
  }

  const processExcelChunk = useCallback((chunk: ArrayBuffer, start: number, end: number) => {
    try {
      const workbook = XLSX.read(chunk, { type: "array" })
      const worksheet = workbook.Sheets[workbook.SheetNames[workbook.SheetNames.length-1]]
      const chunkData = XLSX.utils.sheet_to_json(worksheet, { range: "C5:W35000", header: 1, raw: true })
      return chunkData
    } catch (error) {
      throw new Error(`Error processing chunk: ${error}`)
    }
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.")
      return
    }

    setLoading(true)
    setError(null)
    setProgress(0)
    setData([])

    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer()
      setProgress(30) // Indicate file reading progress

      // Process the Excel file
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      setProgress(60) // Indicate Excel processing progress

      console.log('Sheet names:', workbook.SheetNames)
      const lastSheetName = workbook.SheetNames[workbook.SheetNames.length - 1]
      console.log('Using sheet:', lastSheetName)
      
      const worksheet = workbook.Sheets[lastSheetName]
      // console.log('Worksheet range:', worksheet['!ref'])

      // // First try to read without range restriction to see what data we have
      // const allData = XLSX.utils.sheet_to_json(worksheet, { 
      //   header: 1,
      //   raw: true,
      //   defval: null
      // }) as any[][]

      // console.log('All data length:', allData.length)
      // console.log('First few rows:', allData.slice(0, 3))

      // Now process with the specific range
      const processedData = XLSX.utils.sheet_to_json(worksheet, { 
        range: "C5:W35000", 
        header: 1, 
        raw: true,
        defval: null
      }) as any[][]

      console.log('Processed data length:', processedData.length)
      console.log('First processed row:', processedData[0])

      // Filter out empty rows and validate data
      const validData = processedData.filter((row) => {
        // Skip if row is null/undefined
        if (!row) return false
        
        // Skip if row is empty array
        if (!Array.isArray(row) || row.length === 0) return false
        
        // Check if required columns exist and have valid data
        const [
          Scheduler,          // index 0
          ,                   // skip index 1
          MRPController,      // index 2
          OldMaterialNo,      // index 3
          Material,           // index 4
          MaterialDescription,// index 5
          GrC,               // index 6
          BaseQuantity,       // index 7
          Un1,               // index 8
          Un2,               // index 9
          OpAc,              // index 10
          WorkCtr,           // index 11
          WorkCenterDescription, // index 12
          Machine,           // index 13
          Unit1,             // index 14
          Labor,             // index 15
          Unit2,             // index 16
          NoEmpl,            // index 17
          CycleTime,         // index 18
          CtrK,              // index 19
          Cavities           // index 20
        ] = row;

        // Basic validation for required fields
        if (!Scheduler || !Material || !MaterialDescription) return false;
        

        // Convert and validate numeric fields but skip the header row
        if (Scheduler !== 'Scheduler') {

        const cycleTime = Number(CycleTime);
        const cavities = Number(Cavities);
        
        if (isNaN(cycleTime) || isNaN(cavities)) {
          row[18] = 0;
          row[20] = 0;
          return true;
        }
        
        // Replace the original values with converted numbers
        row[18] = cycleTime;
        row[20] = cavities;
      }
        
        return true;
      });

      console.log('Valid data length:', validData.length)
      console.log('First valid row:', validData[0])
      console.log('Sample row data:', {
        Scheduler: validData[0]?.[0],
        Material: validData[0]?.[4],
        MaterialDescription: validData[0]?.[5],
        CycleTime: validData[0]?.[18],
        Cavities: validData[0]?.[20]
      })
      console.log('Last 5 rows:', validData.slice(-1)[0])

      if (validData.length === 0) {
        throw new Error(`No valid data found in the Excel file. Sheet: ${lastSheetName}, Range: ${worksheet['!ref']}. Please check if the file contains data in the specified range (C5:W35000).`)
      }

      setProgress(90) // Indicate data processing progress
      setData(validData)
      toast.success(`File processed successfully. Found ${validData.length} rows of data.`)
    } catch (error: any) {
      setError(`Error processing the file: ${error.message}`)
      console.error('File processing error:', error)
    } finally {
      setLoading(false)
      setProgress(100)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleSyncDb = async () => {

    if(data){
        setLoading(true)
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/countboards/routing`, {
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
            toast.error(`Gagal sinkronisasi: ${response.statusText}`)
            setLoading(false)
          }
        } catch (error: any) {
          toast.error(`Terjadi kesalahan : ${error.message}`)
          setLoading(false)
        }
    }
  }

  return (
    <div className="p-4 w-full mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="">Excel File Upload ROUTING</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <p className="">Perhatikan hal-hal berikut sebelum upload :</p>
                    <p className="">1. Pastikan data sudah benar, yaitu ROUTING</p>
                    <p className="">2. Pastikan data komplit, hindari data kosong, untuk COATING Cavities diisi 0</p>
                    <p className="">3. Sheet yang dipilih adalah sheet yang paling terakhir</p>
                    <p className="">4. Kolom yang dipilih adalah C5:W35000</p>
                    <p className="">5. Data yang wajib ada : Scheduler, Material, Material Description, Cycle Time, Cavities</p>
                    <p className="flex">6. Download contoh file ROUTING : <><a href="/admin/contoh_routing.xlsx" download className="text-secondary-foreground underline flex items-center"> Contoh ROUTING <Download size={16}/></a></></p>
                    <p className="text-sm text-gray-500 mt-2">Maximum file size: 20MB</p>
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
                <p className="ml-2 text-sm" style={{color: selectedFile.name.toLowerCase().includes("routing") ? "green" : "red"}}>
                  {selectedFile.name.toLowerCase().includes("routing") ? "OK" : "Warning ! This file name seems incorrect, please recheck before upload!"}
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
              <CardTitle>Uploaded Data (Showing first 50 rows of {data.length} total rows)</CardTitle>
              <Button onClick={() => handleSyncDb()} disabled={loading}>
                <RefreshCw className={loading ? 'animate-spin' : ''}/>Syncronize to DB
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Array.from({ length: data[0].length }, (_, index) => (
                      <TableHead 
                        key={index} 
                        className="border border-gray-300 bg-gray-100 dark:bg-gray-800 min-w-[50px] text-center"
                      >
                        {data[0][index] == null || data[0][index]?.toString().trim() === "" ? (
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
                        <TableCell 
                          key={cellIndex} 
                          className="border border-gray-300 text-center"
                        >
                          {row[cellIndex] == null || row[cellIndex]?.toString().trim() === "" ? (
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

