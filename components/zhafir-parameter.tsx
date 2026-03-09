'use client'

import useSWR, { mutate } from 'swr'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type ZhafirParameterType = {
  id: number
  machineId: number
  material_Id: string
  material_name: string
  cavity: number
  paramset: string
  created_at: string
}
const parameterLabels = {
  InjectScrewPosition: 'End of Plastification',
  VPTime: 'Injection Time',
  VPPosition: 'Switching Position',
  InjPeakPressure: 'Inj Peak Pressure',
  Thickness: 'Cushion',
}
const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zhafir-ze-3600/Pamzhafir`

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ZhafirParameter() {
  const [open, setOpen] = useState(false)
  const parameterKeys = Object.keys(
    parameterLabels
  ) as (keyof typeof parameterLabels)[]
  const [form, setForm] = useState({
    machineId: '',
    material_Id: '',
    material_name: '',
    cavity: '',

    InjectScrewPosition: '',
    VPTime: '',
    VPPosition: '',
    InjPeakPressure: '',
    Thickness: '',
    CarriageBwd_SE: '',
  })

  const { data, error, isLoading } = useSWR<ZhafirParameterType[]>(
    endpoint,
    fetcher
  )

  const handleAdd = async () => {
    const payload = {
      machineId: Number(form.machineId),
      material_Id: form.material_Id,
      material_name: form.material_name,
      cavity: Number(form.cavity),

      paramset: {
        InjectScrewPosition: {
          std: Number(form.InjectScrewPosition),
        },
        VPTime: {
          std: Number(form.VPTime),
        },
        VPPosition: {
          std: Number(form.VPPosition),
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

      setForm({
        machineId: '',
        material_Id: '',
        material_name: '',
        cavity: '',
        InjectScrewPosition: '',
        VPTime: '',
        VPPosition: '',
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
              <Input
                value={form.material_name}
                onChange={(e) =>
                  setForm({ ...form, material_name: e.target.value })
                }
              />
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
                value={form.VPTime}
                onChange={(e) => setForm({ ...form, VPTime: e.target.value })}
              />
              <span className="text-xs text-gray-500">s</span>
            </div>

            <div className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
              <label className="text-sm">Switching Position</label>
              <Input
                value={form.VPPosition}
                onChange={(e) =>
                  setForm({ ...form, VPPosition: e.target.value })
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

          <Button className="bg-gray-900 hover:bg-black text-white">
            Apply Parameter
          </Button>
        </DialogContent>
      </Dialog>

      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr className="border-b last:border-0 hover:bg-gray-50/70 transition">
            <th className="px-4 py-3 text-left">No</th>
            <th className="px-4 py-3 text-left">Machine ID</th>
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
                  {new Date(item.created_at).toLocaleString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
