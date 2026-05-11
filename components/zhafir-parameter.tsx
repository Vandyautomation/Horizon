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

const endpointBase = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/Pamzhafir`
const endpoint = `${endpointBase}?mode=param`
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ZhafirParameter() {
  const [machineQuery, setMachineQuery] = useState('')
  const [machineOptions, setMachineOptions] = useState<{ MchID: string; MchDesc: string }[]>([])
  const [materialQuery, setMaterialQuery] = useState('')
  const [materialOptions, setMaterialOptions] = useState<{ material_id: string; material_name: string }[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  const parameterKeys = Object.keys(parameterLabels) as (keyof typeof parameterLabels)[]

  // Inisialisasi form dengan tambahan field _min dan _max
  const initialFormState = {
    machineId: '',
    material_Id: '',
    material_name: '',
    cavity: '',
    ...Object.keys(parameterLabels).reduce((acc, key) => {
      acc[key] = ''
      acc[`${key}_min`] = ''
      acc[`${key}_max`] = ''
      return acc
    }, {} as Record<string, string>),
  }

  const [form, setForm] = useState<Record<string, string>>(initialFormState)

  const { data, error, isLoading } = useSWR<ZhafirParameterType[]>(endpoint, fetcher)
  const tableData = Array.isArray(data) ? data : []

  useEffect(() => {
    if (!machineQuery) return
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/machines?q=${machineQuery}&mode=param`)
        const data = await res.json()
        setMachineOptions(data)
      } catch (err) { console.error(err) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [machineQuery])

  useEffect(() => {
    if (!materialQuery) return
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/coois?q=${materialQuery}&mode=param`)
        const data = await res.json()
        setMaterialOptions(data)
      } catch (err) { console.error(err) }
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
  const handleSave = async () => {
    const paramset: Record<string, number> = {}
    
    // Ambil value, min, dan max langsung dari form input manual
    parameterKeys.forEach((key) => {
      paramset[key] = Number(form[key] || 0)
      paramset[`${key}_min`] = Number(form[`${key}_min`] || 0)
      paramset[`${key}_max`] = Number(form[`${key}_max`] || 0)
    })

    const payload = {
      machineId: form.machineId,
      material_Id: form.material_Id,
      material_name: form.material_name,
      cavity: Number(form.cavity || 0),
      paramset,
    }

    try {
     const res = await fetch(endpoint, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Save failed')

      mutate(endpoint)
      setOpen(false)
      resetForm()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`${endpointBase}/${id}?mode=param`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      mutate(endpoint)
    } catch (err) { console.error(err) }
  }

  const resetForm = () => {
    setForm(initialFormState)
    setEditMode(false)
    setEditId(null)
  }

  if (isLoading) return <div className="p-10 text-gray-500 text-center">Loading data...</div>

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden m-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between p-5 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Zhafir Injection Parameter</h2>
            <p className="text-sm text-gray-500">Manual min/max configuration per machine</p>
          </div>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-black text-white" onClick={resetForm}>
              Add Parameter
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Parameter' : 'Add New Parameter'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 bg-gray-50/70 border rounded-xl p-5">
            <div className="relative">
              <label className="text-xs font-bold text-gray-600">Machine ID</label>
              <Input
                value={form.machineId}
                onChange={(e) => {
                  setForm({ ...form, machineId: e.target.value })
                  setMachineQuery(e.target.value)
                }}
              />
              {machineOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border rounded-md shadow-lg">
                  {machineOptions.map((m) => (
                    <li key={m.MchID} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                      onClick={() => { setForm({ ...form, machineId: m.MchID }); setMachineOptions([]) }}>
                      {m.MchDesc} ({m.MchID})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Material ID</label>
              <Input value={form.material_Id} onChange={(e) => setForm({ ...form, material_Id: e.target.value })} />
            </div>
            <div className="col-span-2 relative">
              <label className="text-xs font-bold text-gray-600">Material Name</label>
              <Input
                value={form.material_name}
                onChange={(e) => {
                  setForm({ ...form, material_name: e.target.value, material_Id: '' })
                  setMaterialQuery(e.target.value)
                }}
              />
              {materialOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border rounded-md shadow-lg">
                  {materialOptions.map((m) => (
                    <li key={m.material_id} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                      onClick={() => { setForm({ ...form, material_name: m.material_name, material_Id: m.material_id }); setMaterialOptions([]) }}>
                      {m.material_name} ({m.material_id})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white space-y-3">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Parameter Name</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase text-center">Value</span>
              <span className="text-[10px] font-bold text-red-400 uppercase text-center">Min</span>
              <span className="text-[10px] font-bold text-green-400 uppercase text-center">Max</span>
              <span></span>
            </div>

            {parameterKeys.map((key) => (
              <div key={key} className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 items-center border-b pb-2">
                <label className="text-sm font-medium text-gray-700">{parameterLabels[key]}</label>
                <Input type="number" placeholder="Value" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                <Input type="number" placeholder="Min" className="border-red-200" value={form[`${key}_min`]} onChange={(e) => setForm({ ...form, [`${key}_min`]: e.target.value })} />
                <Input type="number" placeholder="Max" className="border-green-200" value={form[`${key}_max`]} onChange={(e) => setForm({ ...form, [`${key}_max`]: e.target.value })} />
                <span className="text-[10px] text-gray-400">{key.includes('Time') ? 's' : 'mm'}</span>
              </div>
            ))}
          </div>

          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12">
            {editMode ? 'Update Configuration' : 'Save Configuration'}
          </Button>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">No</th>
              <th className="px-4 py-3 text-left">Machine</th>
              <th className="px-4 py-3 text-left">Material</th>
              {parameterKeys.map((key) => (
                <th key={key} className="px-3 py-3 text-left">{parameterLabels[key]}</th>
              ))}
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => {
              const rawParams = JSON.parse(item.paramset || '{}')
              return (
                <tr key={item.id} className="border-t hover:bg-gray-50 cursor-pointer" 
                  onClick={() => {
                    const prefill: Record<string, string> = {}
                    parameterKeys.forEach((key) => {
                      prefill[key] = rawParams[key]?.toString() || ''
                      prefill[`${key}_min`] = rawParams[`${key}_min`]?.toString() || ''
                      prefill[`${key}_max`] = rawParams[`${key}_max`]?.toString() || ''
                    })
                    setForm({
                      machineId: item.machineId,
                      material_Id: item.material_Id,
                      material_name: item.material_name,
                      cavity: item.cavity.toString(),
                      ...prefill,
                    })
                    setEditMode(true); setEditId(item.id); setOpen(true)
                  }}>
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-bold">{item.machineId}</td>
                  <td className="px-4 py-3">{item.material_name}</td>
                  {parameterKeys.map((key) => (
                    <td key={key} className="px-3 py-3">
                      <div className="font-semibold text-gray-900">{rawParams[key] ?? '-'}</div>
                      <div className="text-[10px] text-gray-500">
                        {rawParams[`${key}_min`]} / {rawParams[`${key}_max`]}
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <Button variant="destructive" size="sm" className="h-7 text-[10px]" 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}>
                      Delete
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}