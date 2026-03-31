'use client'

import useSWR, { mutate } from 'swr'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type ZhafirParameterType = {
  id: number
  machineId: string
  machine_name?: string
  material_Id: string
  material_name: string
  cavity: number | null
  paramset: string
  created_at: string
  created_at_local?: string
}
type ZhafirMachineOption = {
  machineId: string
  machineName: string
  active: boolean
}
type ZhafirMaterialOption = {
  materialId: string
  materialName: string
}
const parameterLabels = {
  InjectScrewPosition: 'End of Plastification',
  VPTimeText: 'Injection Time',
  VPPositionText: 'Switching Position',
  InjPeakPressure: 'Inj Peak Pressure',
  Thickness: 'Cushion',
  CarriageBwd_SE: 'Carriage Bwd SE',
}
const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/Pamzhafir`

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const formatJakartaDateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
  })

export default function ZhafirParameter() {
  const [open, setOpen] = useState(false)
  const [showMachineSuggestions, setShowMachineSuggestions] = useState(false)
  const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false)
  const parameterKeys = Object.keys(
    parameterLabels
  ) as (keyof typeof parameterLabels)[]
  const [form, setForm] = useState({
    machineId: '',
    machine_name: '',
    material_Id: '',
    material_name: '',
    cavity: '',

    InjectScrewPosition: '',
    VPTimeText: '',
    VPPositionText: '',
    InjPeakPressure: '',
    Thickness: '',
    CarriageBwd_SE: '',
  })

  const { data, error, isLoading } = useSWR<ZhafirParameterType[]>(
    endpoint,
    fetcher
  )
  const machineQuery = form.machine_name.trim()
  const machineSuggestionEndpoint = useMemo(() => {
    if (!open) return null
    if (!machineQuery) return null
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/machines?q=${encodeURIComponent(machineQuery)}`
  }, [machineQuery, open])
  const { data: machineSuggestionData } = useSWR<{ data: ZhafirMachineOption[] }>(
    machineSuggestionEndpoint,
    fetcher
  )
  const machineSuggestions = machineSuggestionData?.data ?? []
  const materialQuery = form.material_name.trim()
  const materialSuggestionEndpoint = useMemo(() => {
    if (!open) return null
    if (!materialQuery) return null
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/materials-routing?q=${encodeURIComponent(materialQuery)}`
  }, [materialQuery, open])
  const { data: materialSuggestionData } = useSWR<{
    data: ZhafirMaterialOption[]
  }>(materialSuggestionEndpoint, fetcher)
  const materialSuggestions = materialSuggestionData?.data ?? []

  const handleAdd = async () => {
    if (!form.machineId) {
      console.error('Machine ID is required')
      alert('Machine ID harus diisi!')
      return
    }

    const payload = {
      paraId: 'ZHF-STD-001',
      machineId: form.machineId,
      machine_id: form.machineId,
      machine_name: form.machine_name,
      material_Id: form.material_Id,
      material_id: form.material_Id,
      material_name: form.material_name,
      cavity: form.cavity ? Number(form.cavity) : null,

      paramset: {
        InjectScrewPosition: {
          std: Number(form.InjectScrewPosition),
        },
        VPTimeText: {
          std: Number(form.VPTimeText),
        },
        VPPositionText: {
          std: Number(form.VPPositionText),
        },
        InjPeakPressure: {
          std: Number(form.InjPeakPressure),
        },
        Thickness: {
          std: Number(form.Thickness),
        },
        CarriageBwd_SE: {
          std: Number(form.CarriageBwd_SE),
        },
      },
    }

    console.log('PARAMSET:', payload)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        console.error('Failed to add parameter')
        return
      }

      mutate(endpoint)

      setOpen(false)
      setShowMachineSuggestions(false)
      setShowMaterialSuggestions(false)

      setForm({
        machineId: '',
        machine_name: '',
        material_Id: '',
        material_name: '',
        cavity: '',
        InjectScrewPosition: '',
        VPTimeText: '',
        VPPositionText: '',
        InjPeakPressure: '',
        Thickness: '',
        CarriageBwd_SE: '',
      })
    } catch (err) {
      console.error('Add failed', err)
    }
  }

  if (isLoading) return <div className="text-gray-500">Loading data...</div>
  if (error) return <div className="text-red-500">Failed to load data</div>

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between p-5 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Zhafir Injection Parameter
            </h2>
            <p className="text-sm text-gray-500">
              Standard parameter configuration
            </p>
          </div>

          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-black text-white">
              Add Parameter
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Add Summary Injection STD</DialogTitle>
          </DialogHeader>

          {/* MATERIAL SECTION */}
          <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-gray-700">
              Material Information
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-600">
                Machine Name
              </label>
              <div className="relative">
                <Input
                  className="mt-1"
                  value={form.machine_name}
                  onFocus={() => setShowMachineSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowMachineSuggestions(false), 150)
                  }}
                  onChange={(e) => {
                    setShowMachineSuggestions(true)
                    setForm({ ...form, machine_name: e.target.value })
                  }}
                />
                {showMachineSuggestions && machineSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md max-h-56 overflow-y-auto">
                    {machineSuggestions.map((option) => (
                      <button
                        key={`${option.machineId}-${option.machineName}`}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                        onMouseDown={() => {
                          setForm({
                            ...form,
                            machineId: option.machineId,
                            machine_name: option.machineName,
                          })
                          setShowMachineSuggestions(false)
                        }}
                      >
                        <div className="font-medium text-gray-800">
                          {option.machineName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {option.machineId}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-600">
                Machine ID
              </label>
              <Input
                className="mt-1"
                value={form.machineId}
                onChange={(e) =>
                  setForm({ ...form, machineId: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-600">
                Material ID
              </label>
              <Input
                value={form.material_Id}
                onChange={(e) =>
                  setForm({ ...form, material_Id: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-600">
                Material Name
              </label>
              <div className="relative">
                <Input
                  value={form.material_name}
                  onFocus={() => setShowMaterialSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowMaterialSuggestions(false), 150)
                  }}
                  onChange={(e) => {
                    setShowMaterialSuggestions(true)
                    setForm({ ...form, material_name: e.target.value })
                  }}
                />
                {showMaterialSuggestions && materialSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md max-h-56 overflow-y-auto">
                    {materialSuggestions.map((option) => (
                      <button
                        key={`${option.materialId}-${option.materialName}`}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                        onMouseDown={() => {
                          setForm({
                            ...form,
                            material_Id: option.materialId,
                            material_name: option.materialName,
                          })
                          setShowMaterialSuggestions(false)
                        }}
                      >
                        <div className="font-medium text-gray-800">
                          {option.materialName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {option.materialId}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-600">
                Cavity
              </label>
              <Input
                value={form.cavity}
                onChange={(e) => setForm({ ...form, cavity: e.target.value })}
              />
            </div> 
          </div>

          {/* SUMMARY INJECTION SECTION */}
          <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
            <div className="text-xs font-semibold text-gray-600 uppercase">
              Summary Injection STD
            </div>

            <div className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
              <label className="text-sm">End Of Plastification</label>
              <Input
                value={form.InjectScrewPosition}
                onChange={(e) =>
                  setForm({ ...form, InjectScrewPosition: e.target.value })
                }
              />
              <span className="text-xs text-gray-500">mm</span>
            </div>

            <div className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
              <label className="text-sm">Injection Time</label>
              <Input
                value={form.VPTimeText}
                onChange={(e) => setForm({ ...form, VPTimeText: e.target.value })}
              />
              <span className="text-xs text-gray-500">s</span>
            </div>

            <div className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
              <label className="text-sm">Switching Position</label>
              <Input
                value={form.VPPositionText}
                onChange={(e) =>
                  setForm({ ...form, VPPositionText: e.target.value })
                }
              />
              <span className="text-xs text-gray-500">mm</span>
            </div>

            <div className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
              <label className="text-sm">Inj Peak Pressure</label>
              <Input
                value={form.InjPeakPressure}
                onChange={(e) =>
                  setForm({ ...form, InjPeakPressure: e.target.value })
                }
              />
              <span className="text-xs text-gray-500">bar</span>
            </div>

            <div className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
              <label className="text-sm">Cushion</label>
              <Input
                value={form.Thickness}
                onChange={(e) =>
                  setForm({ ...form, Thickness: e.target.value })
                }
              />
              <span className="text-xs text-gray-500">mm</span>
            </div>

            <div className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
              <label className="text-sm">Carriage Backward SE</label>
              <Input
                value={form.CarriageBwd_SE}
                onChange={(e) =>
                  setForm({ ...form, CarriageBwd_SE: e.target.value })
                }
              />
              <span className="text-xs text-gray-500">mm</span>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            className="bg-gray-900 hover:bg-black text-white"
          >
            Apply Parameter
          </Button>
        </DialogContent>
      </Dialog>

      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr className="border-b last:border-0 hover:bg-gray-50/70 transition">
            <th className="px-4 py-3 text-left">No</th>
            <th className="px-4 py-3 text-left">Machine ID</th>
            <th className="px-4 py-3 text-left">Machine Name</th>
            <th className="px-4 py-3 text-left">Material ID</th>
            <th className="px-4 py-3 text-left">Material Name</th>
            <th className="px-4 py-3 text-left">Cavity</th>
            {parameterKeys.map((key) => (
              <th key={key} className="px-3 py-3">
                {parameterLabels[key]}
              </th>
            ))}
            <th className="px-4 py-3 text-left">Created At</th>
          </tr>
        </thead>

        <tbody>
          {data?.map((item, index) => {
            const params = JSON.parse(item.paramset || '{}')

            return (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{item.machineId}</td>
                <td className="px-4 py-3" title={item.machine_name}>
                  {item.machine_name ?? '-'}
                </td>
                <td className="px-4 py-3">{item.material_Id}</td>
                <td className="px-4 py-3" title={item.material_name}>
                  {item.material_name}
                </td>
                <td className="px-4 py-3">{item.cavity}</td>

                {parameterKeys.map((key) => (
                  <td key={key} className="px-3 py-3">
                    {params?.[key]?.std ?? '-'}
                  </td>
                ))}

                <td className="px-4 py-3">
                  {item.created_at_local ?? formatJakartaDateTime(item.created_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
