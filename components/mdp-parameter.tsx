'use client'

import useSWR, { mutate } from 'swr'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type MdpThresholdRow = {
  id: number
  mdp_id: number
  timestamp: string
  ThresholdUpperID1: string | null
  ThresholdLowerID1: string | null
  ThresholdUpperID2: string | null
  ThresholdLowerID2: string | null
  ThresholdUpperID3: string | null
  ThresholdLowerID3: string | null
}

const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mdp/master/thresholds`
const fetcher = (url: string) => fetch(url).then((res) => res.json())

const initialForm = {
  mdpId: '2',
  ThresholdUpperID1: '',
  ThresholdLowerID1: '',
  ThresholdUpperID2: '',
  ThresholdLowerID2: '',
  ThresholdUpperID3: '',
  ThresholdLowerID3: '',
}

export default function MdpParameter() {
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const { data, isLoading } = useSWR<{ data: MdpThresholdRow[] }>(endpoint, fetcher)

  const resetForm = () => {
    setForm(initialForm)
    setEditId(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const isEdit = editId !== null
      const targetUrl = isEdit ? `${endpoint}/${editId}` : endpoint
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(targetUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mdpId: Number(form.mdpId),
          ThresholdUpperID1: form.ThresholdUpperID1,
          ThresholdLowerID1: form.ThresholdLowerID1,
          ThresholdUpperID2: form.ThresholdUpperID2,
          ThresholdLowerID2: form.ThresholdLowerID2,
          ThresholdUpperID3: form.ThresholdUpperID3,
          ThresholdLowerID3: form.ThresholdLowerID3,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      mutate(endpoint)
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (row: MdpThresholdRow) => {
    setEditId(row.id)
    setForm({
      mdpId: String(row.mdp_id ?? 2),
      ThresholdUpperID1: row.ThresholdUpperID1 ?? '',
      ThresholdLowerID1: row.ThresholdLowerID1 ?? '',
      ThresholdUpperID2: row.ThresholdUpperID2 ?? '',
      ThresholdLowerID2: row.ThresholdLowerID2 ?? '',
      ThresholdUpperID3: row.ThresholdUpperID3 ?? '',
      ThresholdLowerID3: row.ThresholdLowerID3 ?? '',
    })
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      mutate(endpoint)
    } catch (error) {
      console.error(error)
    }
  }

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">Loading data...</div>
  }

  return (
    <div className="m-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <div className="flex items-center justify-between border-b bg-gray-50 p-5">
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold text-gray-800">MDP Parameter Threshold</h2>
            <p className="text-sm text-gray-500">Configuration per MDP</p>
          </div>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 text-white hover:bg-black" onClick={resetForm}>
              Add Parameter
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-[780px] p-6">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit MDP Threshold' : 'Add MDP Threshold'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-4">
              <label className="text-xs font-bold text-gray-600">MdpId</label>
              <Input
                value={form.mdpId}
                onChange={(e) => setForm({ ...form, mdpId: e.target.value })}
                type="number"
              />
            </div>

            {Object.keys(initialForm)
              .filter((k) => k !== 'mdpId')
              .map((key) => (
                <div key={key} className="col-span-2">
                  <label className="text-xs font-bold text-gray-600">{key}</label>
                  <Input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    type="number"
                  />
                </div>
              ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? 'Saving...' : editId ? 'Update Configuration' : 'Save Configuration'}
          </Button>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-center">No</th>
              <th className="px-4 py-3 text-center">MdpId</th>
              <th className="px-3 py-3 text-center">ThresholdUpperID1</th>
              <th className="px-3 py-3 text-center">ThresholdLowerID1</th>
              <th className="px-3 py-3 text-center">ThresholdUpperID2</th>
              <th className="px-3 py-3 text-center">ThresholdLowerID2</th>
              <th className="px-3 py-3 text-center">ThresholdUpperID3</th>
              <th className="px-3 py-3 text-center">ThresholdLowerID3</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {(data?.data || []).map((row, index) => (
              <tr key={row.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-center">{index + 1}</td>
                <td className="px-4 py-3 text-center font-bold">{row.mdp_id}</td>
                <td className="px-3 py-3 text-center">{row.ThresholdUpperID1 ?? '-'}</td>
                <td className="px-3 py-3 text-center">{row.ThresholdLowerID1 ?? '-'}</td>
                <td className="px-3 py-3 text-center">{row.ThresholdUpperID2 ?? '-'}</td>
                <td className="px-3 py-3 text-center">{row.ThresholdLowerID2 ?? '-'}</td>
                <td className="px-3 py-3 text-center">{row.ThresholdUpperID3 ?? '-'}</td>
                <td className="px-3 py-3 text-center">{row.ThresholdLowerID3 ?? '-'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => handleEdit(row)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => handleDelete(row.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
