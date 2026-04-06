'use client'

import useSWR, { mutate } from 'swr'
import { useState, useEffect } from 'react'

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
  material_Id: string
  material_name: string
  cavity: number
  paramset: string
  created_at: string
}

const parameterLabels = {
  InjectScrewPosition: 'Inj Start Position',
  VPTimeText: 'Injection Time',
  VPPositionText: 'V/P position',
  InjPeakPressure: 'Inj Peak Pressure',
  Thickness: 'Cushion',
  CarriageBwd_SE: 'Carriage Backward SE',
}

const parameterDelta: Record<string, { min: number; max: number }> = {
  InjPeakPressure: { min: -2, max: 0.5 },
  VPTimeText: { min: -0.5, max: 0.5 },
  VPPositionText: { min: -0.1, max: 0.1 },
  InjectScrewPosition: { min: -0.5, max: 0.5 },
  Thickness: { min: -0.1, max: 0.1 },
  CarriageBwd_SE: { min: -0.5, max: 0.5 },
}

const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/Pamzhafir`
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ZhafirParameter() {
  const [machineQuery, setMachineQuery] = useState('')
  const [machineOptions, setMachineOptions] = useState<
    { MchID: string; MchDesc: string }[]
  >([])
  const [materialQuery, setMaterialQuery] = useState('')
  const [materialOptions, setMaterialOptions] = useState<
    { material_id: string; material_name: string }[]
  >([])
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const parameterKeys = Object.keys(
    parameterLabels
  ) as (keyof typeof parameterLabels)[]
  const [form, setForm] = useState<Record<string, string>>({
    machineId: '',
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

  // Fetch machine options
  useEffect(() => {
    if (!machineQuery) return

    const timeout = setTimeout(async () => {
      try {
        console.log('Fetching machines for query:', machineQuery)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/machines?q=${machineQuery}`
        )
        const data = await res.json()
        console.log('Machines received:', data)
        setMachineOptions(data)
      } catch (err) {
        console.error(err)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [machineQuery])
  // Fetch routing options
  useEffect(() => {
    if (!materialQuery) return

    const timeout = setTimeout(async () => {
      try {
        console.log('Fetching routing for query:', materialQuery)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/routing?q=${materialQuery}`
        )
        const data = await res.json()
        console.log('Routing  received:', data)
        setMaterialOptions(data)
      } catch (err) {
        console.error(err)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [materialQuery])
  // const handleAdd = async () => {
  //   const paramset: Record<string, number> = {}

  //   for (const key of Object.keys(parameterDelta)) {
  //     const value = Number(form[key] || 0)
  //     paramset[key] = value
  //     paramset[`${key}_min`] = value + parameterDelta[key].min
  //     paramset[`${key}_max`] = value + parameterDelta[key].max
  //   }

  //   const payload = {
  //     machineId: form.machineId,
  //     material_Id: form.material_Id,
  //     material_name: form.material_name,
  //     cavity: Number(form.cavity),
  //     paramset,
  //   }

  //   console.log('PARAMSET:', payload)

  //   try {
  //     const res = await fetch(endpoint, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(payload),
  //     })

  //     if (!res.ok) {
  //       console.error('Add failed', await res.text())
  //       return
  //     }

  //     mutate(endpoint)
  //     setOpen(false)
  //     setForm({
  //       machineId: '',
  //       material_Id: '',
  //       material_name: '',
  //       cavity: '',
  //       InjectScrewPosition: '',
  //       VPTimeText: '',
  //       VPPositionText: '',
  //       InjPeakPressure: '',
  //       Thickness: '',
  //       CarriageBwd_SE: '',
  //     })
  //   } catch (err) {
  //     console.error('Add failed', err)
  //   }
  // }

  // update and handle save (both add and update)
  const handleSave = async () => {
    const paramset: Record<string, number> = {}
    for (const key of Object.keys(parameterDelta)) {
      const value = Number(form[key] || 0)
      paramset[key] = value
      paramset[`${key}_min`] = value + parameterDelta[key].min
      paramset[`${key}_max`] = value + parameterDelta[key].max
    }

    const payload = {
      machineId: form.machineId,
      material_Id: form.material_Id,
      material_name: form.material_name,
      cavity: Number(form.cavity),
      paramset,
    }

    try {
      const res = await fetch(
        editMode && editId ? `${endpoint}/${editId}` : endpoint,
        {
          method: editMode ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) throw new Error('Save failed')

      mutate(endpoint)
      setOpen(false)
      setEditMode(false)
      setEditId(null)
      setForm({
        machineId: '',
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
      console.error(err)
    }
  }
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      mutate(endpoint)
    } catch (err) {
      console.error('Delete failed', err)
    }
  }
  const resetForm = () => {
    setForm({
      machineId: '',
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
    setEditMode(false)
    setEditId(null)
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
            <Button
              className="bg-gray-900 hover:bg-black text-white"
              onClick={resetForm} // reset form sebelum buka Add
            >
              Add Parameter
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto p-6">
            <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edit Summary Injection STD' : 'Add Summary Injection STD'}
            </DialogTitle>
            </DialogHeader>

          {/* MATERIAL SECTION */}
          <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-gray-700">
              Material Information
            </div>

            <div className="space-y-4 relative">
              <label className="text-sm font-medium text-gray-600">
                Machine ID
              </label>
              <Input
                className="mt-1"
                value={form.machineId}
                onChange={(e) => {
                  setForm({ ...form, machineId: e.target.value })
                  setMachineQuery(e.target.value)
                }}
              />
              {machineOptions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded-md max-h-40 overflow-y-auto mt-1 shadow-md">
                  {machineOptions.map((m) => (
                    <li
                      key={m.MchID}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm({ ...form, machineId: m.MchID })
                        setMachineOptions([])
                      }}
                    >
                      {m.MchDesc} ({m.MchID})
                    </li>
                  ))}
                </ul>
              )}
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

            {/* Material Name & ID */}
            <div className="space-y-4 relative">
              <label className="text-sm font-medium text-gray-600">
                Material Name
              </label>
              <Input
                value={form.material_name}
                onChange={(e) => {
                  setForm({
                    ...form,
                    material_name: e.target.value,
                    material_Id: '', // reset ID saat typing baru
                  })
                  setMaterialQuery(e.target.value)
                }}
              />
              {materialOptions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded-md max-h-40 overflow-y-auto mt-1 shadow-md">
                  {materialOptions.map((m) => (
                    <li
                      key={m.material_id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm({
                          ...form,
                          material_name: m.material_name,
                          material_Id: m.material_id,
                        })
                        setMaterialOptions([])
                      }}
                    >
                      {m.material_name} ({m.material_id})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* <div className="space-y-4">
              <label className="text-sm font-medium text-gray-600">
                Cavity
              </label>
              <Input
                value={form.cavity}
                onChange={(e) => setForm({ ...form, cavity: e.target.value })}
              />
            </div> */}
          </div>

          {/* SUMMARY INJECTION SECTION */}
          <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
            <div className="text-xs font-semibold text-gray-600 uppercase">
              Summary Injection STD
            </div>

            {parameterKeys.map((key) => (
              <div
                key={key}
                className="grid grid-cols-[1fr_120px_40px] gap-2 items-center"
              >
                <label className="text-sm">{parameterLabels[key]}</label>
                <Input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
                <span className="text-xs text-gray-500">
                  {key.includes('Time') ? 's' : 'mm'}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSave}
            className="bg-gray-900 hover:bg-black text-white"
          >
            {editMode ? 'Update Parameter' : 'Apply Parameter'}
          </Button>
        </DialogContent>
      </Dialog>

      <table className="min-w-full text-sm">
        {/* Table Header */}
        <thead className="bg-gray-50 border-b">
          <tr className="border-b last:border-0 hover:bg-gray-50/70 transition">
            <th className="px-4 py-3 text-left">No</th>
            <th className="px-4 py-3 text-left">Machine ID</th>
            <th className="px-4 py-3 text-left">Material ID</th>
            <th className="px-4 py-3 text-left">Material Name</th>
            <th className="px-4 py-3 text-left">Cavity</th>
            {parameterKeys.map((key) => (
              <th key={key} className="px-3 py-3 text-left">
                {parameterLabels[key]}
              </th>
            ))}
            <th className="px-4 py-3 text-left">Created At</th>
            <th className="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {data?.map((item, index) => {
            const rawParams = JSON.parse(item.paramset || '{}')

            return (
              <tr
                key={item.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  // Prefill form hanya dengan value utama (tanpa min/max)
                  const prefill: Record<string, string> = {}
                  parameterKeys.forEach((key) => {
                    prefill[key] = rawParams[key]?.toString() || ''
                  })

                  setForm({
                    machineId: item.machineId,
                    material_Id: item.material_Id,
                    material_name: item.material_name,
                    cavity: item.cavity.toString(),
                    ...prefill,
                  })
                  setEditMode(true)
                  setEditId(item.id)
                  setOpen(true)
                }}
              >
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{item.machineId}</td>
                <td className="px-4 py-3">{item.material_Id}</td>
                <td className="px-4 py-3" title={item.material_name}>
                  {item.material_name}
                </td>
                <td className="px-4 py-3">{item.cavity}</td>

                {parameterKeys.map((key) => (
                  <td key={key} className="px-3 py-3">
                    {rawParams[key] !== undefined
                      ? `${rawParams[key]} (Min: ${rawParams[`${key}_min`]}, Max: ${rawParams[`${key}_max`]})`
                      : '-'}
                  </td>
                ))}

                <td className="px-4 py-3">
                  {new Date(item.created_at).toLocaleString()}
                </td>

                <td className="px-4 py-3">
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white text-xs"
                    onClick={(e) => {
                      e.stopPropagation() // supaya klik Delete ga ikut trigger edit
                      handleDelete(item.id)
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
