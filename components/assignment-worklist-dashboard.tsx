'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type RowData = Record<string, string>

const DEFAULT_COLUMNS = [
  'Material_Id',
  'Quantity',
  'Timestamp',
  'Machine_Id',
  'Order',
  'Assignby',
  'AssignTo',
  'Status',
]

const STATUS_OPTIONS = ['Open', 'Close', 'On progress']
const STORAGE_KEY = 'assignment_worklist_dashboard_v1'

const toKey = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '')

const createEmptyRow = (columns: string[]) =>
  Object.fromEntries(columns.map((col) => [col, ''])) as RowData

const normalizeRows = (rows: RowData[], columns: string[]) =>
  rows.map((row) => {
    const next = createEmptyRow(columns)
    columns.forEach((col) => {
      next[col] = String(row[col] ?? '')
    })
    return next
  })

const moveItem = (arr: string[], from: number, to: number) => {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return arr
  }
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export default function AssignmentWorklistDashboard() {
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [rows, setRows] = useState<RowData[]>([])
  const [isEditMode, setIsEditMode] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [dragHeader, setDragHeader] = useState<string | null>(null)
  const [newHeader, setNewHeader] = useState('')
  const [splitSource, setSplitSource] = useState('Material_Id')
  const [splitDelimiter, setSplitDelimiter] = useState('-')
  const [splitLeftHeader, setSplitLeftHeader] = useState('Material')
  const [splitRightHeader, setSplitRightHeader] = useState('OrderNo')
  const [removeSourceAfterSplit, setRemoveSourceAfterSplit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const splitSourceExists = useMemo(
    () => columns.includes(splitSource),
    [columns, splitSource]
  )

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as {
          columns?: string[]
          rows?: RowData[]
        }
        const loadedColumns = Array.isArray(parsed.columns) && parsed.columns.length > 0
          ? parsed.columns.map((c) => toKey(String(c))).filter(Boolean)
          : DEFAULT_COLUMNS
        const uniqueColumns = Array.from(new Set(loadedColumns))
        const loadedRows = Array.isArray(parsed.rows) ? parsed.rows : []
        setColumns(uniqueColumns)
        setRows(normalizeRows(loadedRows, uniqueColumns))
        setSplitSource(uniqueColumns.includes('Material_Id') ? 'Material_Id' : uniqueColumns[0] || '')
      }
    } catch {
      // ignore malformed localStorage payload
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns, rows }))
  }, [columns, rows, isHydrated])

  const addHeader = () => {
    if (!isEditMode) return
    const raw = newHeader.trim()
    if (!raw) return
    const key = toKey(raw)
    if (!key) {
      setError('Header tidak valid.')
      return
    }
    if (columns.includes(key)) {
      setError(`Header "${key}" sudah ada.`)
      return
    }
    setError(null)
    setColumns((prev) => [...prev, key])
    setRows((prev) => prev.map((row) => ({ ...row, [key]: '' })))
    setNewHeader('')
  }

  const addRow = () => {
    if (!isEditMode) return
    setRows((prev) => [...prev, createEmptyRow(columns)])
  }

  const removeRow = (index: number) => {
    if (!isEditMode) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const removeHeader = (header: string) => {
    if (!isEditMode) return
    if (DEFAULT_COLUMNS.includes(header)) {
      setError(`Header default "${header}" tidak bisa dihapus.`)
      return
    }
    setError(null)
    setColumns((prev) => prev.filter((col) => col !== header))
    setRows((prev) =>
      prev.map((row) => {
        const next = { ...row }
        delete next[header]
        return next
      })
    )
  }

  const updateCell = (rowIndex: number, header: string, value: string) => {
    if (!isEditMode) return
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === rowIndex
          ? {
              ...row,
              [header]: value,
            }
          : row
      )
    )
  }

  const runSplitColumn = () => {
    if (!isEditMode) return
    const source = splitSource.trim()
    const delimiter = splitDelimiter
    const left = toKey(splitLeftHeader)
    const right = toKey(splitRightHeader)

    if (!source || !columns.includes(source)) {
      setError('Kolom sumber split tidak ditemukan.')
      return
    }
    if (!delimiter) {
      setError('Delimiter split wajib diisi.')
      return
    }
    if (!left || !right) {
      setError('Header hasil split wajib diisi.')
      return
    }
    if (left === right) {
      setError('Header hasil split tidak boleh sama.')
      return
    }

    setError(null)
    setColumns((prev) => {
      const withNew = [...prev]
      if (!withNew.includes(left)) withNew.push(left)
      if (!withNew.includes(right)) withNew.push(right)
      return removeSourceAfterSplit ? withNew.filter((c) => c !== source) : withNew
    })

    setRows((prev) =>
      prev.map((row) => {
        const sourceValue = String(row[source] ?? '')
        const parts = sourceValue.split(delimiter)
        const first = (parts.shift() ?? '').trim()
        const second = parts.join(delimiter).trim()

        const next: RowData = {
          ...row,
          [left]: first,
          [right]: second,
        }
        if (removeSourceAfterSplit) {
          delete next[source]
        }
        return next
      })
    )
  }

  const resetToDefault = () => {
    if (!isEditMode) return
    setColumns(DEFAULT_COLUMNS)
    setRows([])
    setSplitSource('Material_Id')
    setError(null)
  }

  const onHeaderDrop = (targetHeader: string) => {
    if (!isEditMode || !dragHeader || dragHeader === targetHeader) return
    const fromIdx = columns.indexOf(dragHeader)
    const toIdx = columns.indexOf(targetHeader)
    setColumns((prev) => moveItem(prev, fromIdx, toIdx))
    setDragHeader(null)
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Assignment Worklist Dashboard</h2>
          <p className="text-sm text-slate-500">
            Mode edit/view, header dinamis, split kolom, urutan kolom drag-drop, dan simpan lokal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={isEditMode ? 'default' : 'outline'}
            onClick={() => setIsEditMode((prev) => !prev)}
          >
            {isEditMode ? 'Switch to View' : 'Switch to Edit'}
          </Button>
          {isEditMode ? (
            <>
              <Button type="button" onClick={addRow}>
                Add Row
              </Button>
              <Button type="button" variant="outline" onClick={resetToDefault}>
                Reset Default
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {isEditMode ? (
        <div className="grid gap-3 rounded-lg border bg-slate-50 p-3 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Add Header</label>
            <Input
              value={newHeader}
              onChange={(e) => setNewHeader(e.target.value)}
              placeholder="Contoh: Priority_Level"
            />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={addHeader}>
              Add Header
            </Button>
          </div>
        </div>
      ) : null}

      {isEditMode ? (
        <div className="grid gap-3 rounded-lg border bg-slate-50 p-3 md:grid-cols-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Source Column</label>
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={splitSource}
              onChange={(e) => setSplitSource(e.target.value)}
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Delimiter</label>
            <Input
              value={splitDelimiter}
              onChange={(e) => setSplitDelimiter(e.target.value)}
              placeholder="-"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Left Header</label>
            <Input
              value={splitLeftHeader}
              onChange={(e) => setSplitLeftHeader(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Right Header</label>
            <Input
              value={splitRightHeader}
              onChange={(e) => setSplitRightHeader(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Action</label>
            <Button
              type="button"
              onClick={runSplitColumn}
              disabled={!splitSourceExists}
              className="w-full"
            >
              Split Column
            </Button>
          </div>
          <label className="col-span-full inline-flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={removeSourceAfterSplit}
              onChange={(e) => setRemoveSourceAfterSplit(e.target.checked)}
            />
            Hapus kolom sumber setelah split
          </label>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="border px-2 py-2 text-left font-semibold text-slate-700">No</th>
              {columns.map((header) => (
                <th
                  key={header}
                  className={`border px-2 py-2 text-left font-semibold text-slate-700 ${
                    isEditMode ? 'cursor-move' : ''
                  }`}
                  draggable={isEditMode}
                  onDragStart={() => setDragHeader(header)}
                  onDragOver={(e) => {
                    if (!isEditMode) return
                    e.preventDefault()
                  }}
                  onDrop={() => onHeaderDrop(header)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{header}</span>
                    {isEditMode && !DEFAULT_COLUMNS.includes(header) ? (
                      <button
                        type="button"
                        onClick={() => removeHeader(header)}
                        className="rounded border px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-white"
                      >
                        x
                      </button>
                    ) : null}
                  </div>
                </th>
              ))}
              {isEditMode ? (
                <th className="border px-2 py-2 text-left font-semibold text-slate-700">Action</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (isEditMode ? 2 : 1)} className="px-3 py-8 text-center text-slate-500">
                  Tabel masih kosong. Klik <span className="font-semibold">Add Row</span> untuk mulai.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="hover:bg-slate-50">
                  <td className="border px-2 py-2">{rowIndex + 1}</td>
                  {columns.map((header) => (
                    <td key={`${rowIndex}-${header}`} className="border px-2 py-2">
                      {header === 'Status' ? (
                        <select
                          className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                          value={row[header] || 'Open'}
                          disabled={!isEditMode}
                          onChange={(e) => updateCell(rowIndex, header, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          value={row[header] ?? ''}
                          readOnly={!isEditMode}
                          onChange={(e) => updateCell(rowIndex, header, e.target.value)}
                          className="h-8 text-xs"
                        />
                      )}
                    </td>
                  ))}
                  {isEditMode ? (
                    <td className="border px-2 py-2">
                      <Button
                        type="button"
                        variant="destructive"
                        className="h-8 px-2 text-xs"
                        onClick={() => removeRow(rowIndex)}
                      >
                        Delete
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isHydrated ? (
        <div className="text-xs text-slate-500">
          Data tersimpan lokal di browser (hardcode lokal). Mode {isEditMode ? 'Edit' : 'View'} aktif.
        </div>
      ) : null}
    </div>
  )
}
