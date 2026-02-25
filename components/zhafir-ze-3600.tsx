'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'

type StdActValue = {
  std: number | string | null
  act: number | string | null
}

type ApiResponse = {
  paraId: string
  values: Record<string, StdActValue>
}

type MaterialContext = {
  po: string
  materialId: string | null
  materialName: string | null
  materialType: string | null
  found: boolean
}

const MATERIAL_TYPE_OPTIONS = [
  'PET',
  'PP',
  'AS-ABS',
  'ABS',
  'AS/SAN',
  'PCR',
  'PS',
  'LD/HDPE',
  'PETG',
  'POM',
  'PCTG',
]

type SectionProps = {
  title: string
  children: React.ReactNode
  className?: string
  sectionKey?: string
  expanded?: boolean
  onToggle?: (key: string) => void
}

type RowProps = {
  labels: string[]
  type: 'triple' | 'double'
  fields?: string[]
  keyMap?: Record<string, Array<string | null>>
  values: Record<string, StdActValue>
}

type InputProps = {
  isActOverLimit?: boolean
  label?: string
  pair?: boolean
  fieldKey?: string | null
  values: Record<string, StdActValue>
  stdDraft?: Record<string, string>
  actDraft?: Record<string, string>
  onStdChange?: (fieldKey: string, value: string) => void
  onStdSave?: (fieldKey: string) => Promise<void>
  onActChange?: (fieldKey: string, value: string) => void
  onActSave?: (fieldKey: string) => Promise<void>
  savingKey?: string | null
  savingField?: string | null
}

const PARA_ID = 'ZHF-STD-001'
const EDIT_MODE_PASSWORD = 'P168421TK1'
const ENABLE_PER_FIELD_SAVE = false
const STRING_FIELDS = new Set([
  'AirBlowStart',
  'VPPositionText',
  'VPTimeText',
  'VPPosnText',
  'AirBlowMaleFemale',
])
const SINGLE_VALUE_FIELDS = new Set([
  ...Array.from({ length: 16 }, (_, i) => `BeratUnit${i + 1}`),
  ...Array.from({ length: 14 }, (_, i) => `HeaterControl${i + 1}`),
])

function fmt(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return ''
  return `${value}`
}

function formatNumericDisplay(
  value: number | string | null | undefined,
  decimals = 2
): string {
  if (value === null || value === undefined) return ''
  if (value === '') return ''
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return `${value}`
  if (Number.isInteger(num)) return String(num)
  const fixed = num.toFixed(decimals)
  return fixed.replace(/\.?0+$/, '')
}

export default function ZhafirParameterForm() {
  const searchParams = useSearchParams()
  const machineId = searchParams.get('machine_id') || ''
  const machineDesc = searchParams.get('machine_desc') || ''
  const machineNumber = searchParams.get('machine_number') || ''
  const location = searchParams.get('location') || ''
  const poNumber = searchParams.get('po') || ''
  const materialParam = searchParams.get('material') || ''
  const countboardHref = `/countboard?machineNumber=${encodeURIComponent(machineNumber || '')}&location=${encodeURIComponent(location || '')}`
  const [tolerance, setTolerance] = useState<number>(0)
  const SECTION_KEYS = [
    'SUMMARY INJECTION SETTINGS',
    'INJECT',
    'HOLDING',
    'CHARGING',
    'CLAMP / MOLD',
    'TEMPERATURE',
    'EJECTOR FWD',
    'EJECTOR BWD',
    'AIR BLOW',
    'CORE A',
    'CORE B',
    'CORE C',
    'CORE D',
    'CUSSION',
    'COOLING TIME',
    'V/P',
    'SUCKBACK BEG. CHARG',
    'SUCKBACK AFT. CHARG',
    'BERAT UNIT',
    'HEATER CONTROL',
  ]
  const [values, setValues] = useState<Record<string, StdActValue>>({})
  const [stdDraft, setStdDraft] = useState<Record<string, string>>({})
  const [actDraft, setActDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [materialContext, setMaterialContext] =
    useState<MaterialContext | null>(null)
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('')
  const [materialTypeSaving, setMaterialTypeSaving] = useState(false)
  const [materialTypeLoading, setMaterialTypeLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })
  const [hourOptions, setHourOptions] = useState<number[]>([])
  const [selectedHour, setSelectedHour] = useState<string>('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false)
  const [editPasswordInput, setEditPasswordInput] = useState('')
  const [editPasswordError, setEditPasswordError] = useState<string | null>(
    null
  )
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => Object.fromEntries(SECTION_KEYS.map((key) => [key, true])))
  const materialTypeOptions = useMemo(() => {
    if (
      selectedMaterialType &&
      !MATERIAL_TYPE_OPTIONS.includes(selectedMaterialType)
    ) {
      return [selectedMaterialType, ...MATERIAL_TYPE_OPTIONS]
    }
    return MATERIAL_TYPE_OPTIONS
  }, [selectedMaterialType])

  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:9999',
    []
  )
  // Check if any actual value is over its standard
  const isStdGreaterThanAct = (fieldKey: string) => {
    const std = Number(stdDraft[fieldKey])
    const act = Number(actDraft[fieldKey])

    if (Number.isNaN(std) || Number.isNaN(act)) return false

    const toleranceValue = std * (tolerance / 100)
    const maxAllowed = std + toleranceValue

    return act > maxAllowed
  }
  useEffect(() => {
    let active = true
    const REQUEST_TIMEOUT_MS = 5000

    const buildCandidates = () => {
      const trimmed = (baseUrl || '').replace(/\/+$/, '')
      const normalized = trimmed.endsWith('/api')
        ? trimmed.slice(0, -4)
        : trimmed
      const q = `?paraId=${encodeURIComponent(PARA_ID)}${
        machineId ? `&machine_id=${encodeURIComponent(machineId)}` : ''
      }`
      const unique = new Set<string>()
      if (normalized) unique.add(`${normalized}/api/zhafir-ze-3600${q}`)
      unique.add('http://localhost:9999/api/zhafir-ze-3600' + q)
      unique.add('http://127.0.0.1:9999/api/zhafir-ze-3600' + q)
      unique.add(`/be/api/zhafir-ze-3600${q}`)
      unique.add(`/api/zhafir-ze-3600${q}`)
      return Array.from(unique)
    }

    const buildActualCandidates = () => {
      const trimmed = (baseUrl || '').replace(/\/+$/, '')
      const normalized = trimmed.endsWith('/api')
        ? trimmed.slice(0, -4)
        : trimmed
      const q = `?paraId=${encodeURIComponent(PARA_ID)}${
        machineId ? `&machine_id=${encodeURIComponent(machineId)}` : ''
      }${selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ''}${
        selectedHour !== '' ? `&hour=${encodeURIComponent(selectedHour)}` : ''
      }`
      const unique = new Set<string>()
      if (normalized)
        unique.add(`${normalized}/api/zhafir-ze-3600/actual-view${q}`)
      unique.add('http://localhost:9999/api/zhafir-ze-3600/actual-view' + q)
      unique.add('http://127.0.0.1:9999/api/zhafir-ze-3600/actual-view' + q)
      unique.add(`/be/api/zhafir-ze-3600/actual-view${q}`)
      unique.add(`/api/zhafir-ze-3600/actual-view${q}`)
      return Array.from(unique)
    }

    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        return await fetch(url, {
          cache: 'no-store',
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const candidates = buildCandidates()
        let data: ApiResponse | null = null
        let lastStatus = 'unknown'

        for (const url of candidates) {
          let res: Response
          try {
            res = await fetchWithTimeout(url)
          } catch (e) {
            const name = (e as Error).name || 'Error'
            lastStatus = `${name} @ ${url}`
            continue
          }
          lastStatus = `${res.status} @ ${url}`
          if (!res.ok) continue
          data = (await res.json()) as ApiResponse
          break
        }

        if (!data) throw new Error(`Failed to load data (${lastStatus})`)
        const actualCandidates = buildActualCandidates()
        let actualData: { values?: Record<string, unknown> } | null = null
        let actualStatus = 'unknown'

        for (const url of actualCandidates) {
          let res: Response
          try {
            res = await fetchWithTimeout(url)
          } catch (e) {
            const name = (e as Error).name || 'Error'
            actualStatus = `${name} @ ${url}`
            continue
          }
          actualStatus = `${res.status} @ ${url}`
          if (!res.ok) continue
          actualData = (await res.json()) as {
            values?: Record<string, unknown>
          }
          break
        }

        if (!actualData) {
          console.warn(`Failed to load actual view (${actualStatus})`)
        }
        if (active) {
          const incoming = data.values || {}
          const actualValues = (actualData?.values ?? {}) as Record<
            string,
            unknown
          >
          const mergedValues: Record<string, StdActValue> = {}
          Object.entries(incoming).forEach(([key, pair]) => {
            mergedValues[key] = {
              std: pair?.std ?? null,
              act: (actualValues[key] ?? pair?.act ?? null) as any,
            }
          })
          setValues(mergedValues)
          const stdDraftLocal: Record<string, string> = {}
          const draft: Record<string, string> = {}
          Object.entries(mergedValues).forEach(([key, pair]) => {
            stdDraftLocal[key] = fmt(pair?.std)
            draft[key] = fmt(pair?.act)
          })
          setStdDraft(stdDraftLocal)
          setActDraft(draft)
        }
      } catch (err) {
        if (active) setError((err as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [baseUrl, machineId, selectedDate, selectedHour])

  useEffect(() => {
    let active = true
    const REQUEST_TIMEOUT_MS = 5000

    if (!machineId || !selectedDate) {
      setHourOptions([])
      setSelectedHour('')
      return
    }

    const buildHourCandidates = () => {
      const trimmed = (baseUrl || '').replace(/\/+$/, '')
      const normalized = trimmed.endsWith('/api')
        ? trimmed.slice(0, -4)
        : trimmed
      const q = `?machine_id=${encodeURIComponent(machineId)}&date=${encodeURIComponent(selectedDate)}`
      const unique = new Set<string>()
      if (normalized)
        unique.add(`${normalized}/api/zhafir-ze-3600/actual-hours${q}`)
      unique.add('http://localhost:9999/api/zhafir-ze-3600/actual-hours' + q)
      unique.add('http://127.0.0.1:9999/api/zhafir-ze-3600/actual-hours' + q)
      unique.add(`/be/api/zhafir-ze-3600/actual-hours${q}`)
      unique.add(`/api/zhafir-ze-3600/actual-hours${q}`)
      return Array.from(unique)
    }

    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        return await fetch(url, {
          cache: 'no-store',
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }
    }

    const loadHours = async () => {
      for (const url of buildHourCandidates()) {
        try {
          const res = await fetchWithTimeout(url)
          if (!res.ok) continue
          const data = (await res.json()) as { hours?: number[] }
          const hours = Array.isArray(data.hours) ? data.hours : []
          if (!active) return
          setHourOptions(hours)
          if (hours.length === 0) {
            setSelectedHour('')
            return
          }
          const currentHour = selectedHour === '' ? null : Number(selectedHour)
          if (currentHour === null || !hours.includes(currentHour)) {
            setSelectedHour(String(hours[hours.length - 1]))
          }
          return
        } catch {
          // try next candidate
        }
      }
      if (active) {
        setHourOptions([])
        setSelectedHour('')
      }
    }

    loadHours()
    return () => {
      active = false
    }
  }, [baseUrl, machineId, selectedDate])

  useEffect(() => {
    let active = true
    const REQUEST_TIMEOUT_MS = 5000

    if (!poNumber) {
      setMaterialContext(null)
      return
    }

    const buildMaterialCandidates = () => {
      const trimmed = (baseUrl || '').replace(/\/+$/, '')
      const normalized = trimmed.endsWith('/api')
        ? trimmed.slice(0, -4)
        : trimmed
      const q = `?po=${encodeURIComponent(poNumber)}`
      const unique = new Set<string>()
      if (normalized)
        unique.add(`${normalized}/api/zhafir-ze-3600/material-context${q}`)
      unique.add(
        'http://localhost:9999/api/zhafir-ze-3600/material-context' + q
      )
      unique.add(
        'http://127.0.0.1:9999/api/zhafir-ze-3600/material-context' + q
      )
      unique.add('/be/api/zhafir-ze-3600/material-context' + q)
      unique.add('/api/zhafir-ze-3600/material-context' + q)
      return Array.from(unique)
    }

    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        return await fetch(url, {
          cache: 'no-store',
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }
    }

    const loadMaterial = async () => {
      for (const url of buildMaterialCandidates()) {
        try {
          const res = await fetchWithTimeout(url)
          if (!res.ok) continue
          const data = (await res.json()) as MaterialContext
          if (active) setMaterialContext(data)
          return
        } catch {
          // try next candidate
        }
      }
      if (active) setMaterialContext(null)
    }

    loadMaterial()
    return () => {
      active = false
    }
  }, [baseUrl, poNumber])

  useEffect(() => {
    let active = true
    const REQUEST_TIMEOUT_MS = 5000
    const materialId = materialContext?.materialId

    if (!materialId) {
      setSelectedMaterialType('')
      return
    }
    if (isEditMode) return

    const buildRoutingTypeCandidates = () => {
      const trimmed = (baseUrl || '').replace(/\/+$/, '')
      const normalized = trimmed.endsWith('/api')
        ? trimmed.slice(0, -4)
        : trimmed
      const q = `?material_id=${encodeURIComponent(materialId)}`
      const unique = new Set<string>()
      if (normalized)
        unique.add(`${normalized}/api/zhafir-ze-3600/material-type-routing${q}`)
      unique.add(
        'http://localhost:9999/api/zhafir-ze-3600/material-type-routing' + q
      )
      unique.add(
        'http://127.0.0.1:9999/api/zhafir-ze-3600/material-type-routing' + q
      )
      unique.add('/be/api/zhafir-ze-3600/material-type-routing' + q)
      unique.add('/api/zhafir-ze-3600/material-type-routing' + q)
      return Array.from(unique)
    }

    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        return await fetch(url, {
          cache: 'no-store',
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }
    }

    const loadRoutingType = async () => {
      setMaterialTypeLoading(true)
      try {
        for (const url of buildRoutingTypeCandidates()) {
          try {
            const res = await fetchWithTimeout(url)
            if (!res.ok) continue
            const data = (await res.json()) as { materialType?: string | null }
            if (!active) return
            const normalized = (data.materialType || '').trim().toUpperCase()
            setSelectedMaterialType(normalized || '')
            return
          } catch {
            // try next candidate
          }
        }
        if (active) setSelectedMaterialType('')
      } finally {
        if (active) setMaterialTypeLoading(false)
      }
    }

    loadRoutingType()
    return () => {
      active = false
    }
  }, [baseUrl, materialContext?.materialId, isEditMode])

  const handleMaterialTypeChange = async (value: string) => {
    setSelectedMaterialType(value)
    const materialId = materialContext?.materialId
    if (!machineId || !materialId || !value) return

    setMaterialTypeSaving(true)
    setError(null)
    let lastError = 'unknown'
    try {
      let saved = false
      const trimmed = (baseUrl || '').replace(/\/+$/, '')
      const normalized = trimmed.endsWith('/api')
        ? trimmed.slice(0, -4)
        : trimmed
      const candidateUrls = new Set<string>()
      if (normalized)
        candidateUrls.add(
          `${normalized}/api/zhafir-ze-3600/material-type-routing`
        )
      candidateUrls.add(
        'http://localhost:9999/api/zhafir-ze-3600/material-type-routing'
      )
      candidateUrls.add(
        'http://127.0.0.1:9999/api/zhafir-ze-3600/material-type-routing'
      )
      candidateUrls.add('/be/api/zhafir-ze-3600/material-type-routing')
      candidateUrls.add('/api/zhafir-ze-3600/material-type-routing')

      for (const url of Array.from(candidateUrls)) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              machine_id: machineId,
              material_id: materialId,
              materialType: value,
            }),
          })
          if (!res.ok) {
            lastError = `${res.status} @ ${url}`
            continue
          }
          saved = true
          break
        } catch (e) {
          lastError = `${(e as Error).name || 'Error'} @ ${url}`
        }
      }
      if (!saved) {
        setError(`Gagal update material type (${lastError})`)
      }
    } finally {
      setMaterialTypeSaving(false)
    }
  }

  const resolveSaveCandidates = (kind: 'actual' | 'std') => {
    const trimmed = (baseUrl || '').replace(/\/+$/, '')
    const normalized = trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed
    const endpoint = kind === 'actual' ? 'manual-actual' : 'manual-std'
    const unique = new Set<string>()
    if (normalized) unique.add(`${normalized}/api/zhafir-ze-3600/${endpoint}`)
    unique.add(`http://localhost:9999/api/zhafir-ze-3600/${endpoint}`)
    unique.add(`http://127.0.0.1:9999/api/zhafir-ze-3600/${endpoint}`)
    unique.add(`/be/api/zhafir-ze-3600/${endpoint}`)
    unique.add(`/api/zhafir-ze-3600/${endpoint}`)
    return Array.from(unique)
  }

  const saveField = async (kind: 'actual' | 'std', fieldKey: string) => {
    const rawValue = kind === 'actual' ? actDraft[fieldKey] : stdDraft[fieldKey]
    const numericValue = Number(rawValue)
    if (Number.isNaN(numericValue)) {
      setError(`Value untuk ${fieldKey} harus angka (${kind.toUpperCase()})`)
      return
    }

    setSavingKey(`${kind}:${fieldKey}`)
    setError(null)
    let lastError = 'unknown'

    try {
      const candidates = resolveSaveCandidates(kind)
      let saved = false

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              field: fieldKey,
              value: numericValue,
              machine_id: machineId || undefined,
              material:
                materialContext?.materialId && selectedMaterialType
                  ? `${materialContext.materialId} - ${selectedMaterialType}`
                  : materialParam || undefined,
            }),
          })
          if (!res.ok) {
            lastError = `${res.status} @ ${url}`
            continue
          }
          saved = true
          break
        } catch (e) {
          const name = (e as Error).name || 'Error'
          lastError = `${name} @ ${url}`
        }
      }

      if (!saved) {
        setError(`Gagal save (${lastError})`)
        return
      }

      setValues((prev) => ({
        ...prev,
        [fieldKey]: {
          std: kind === 'std' ? numericValue : (prev[fieldKey]?.std ?? null),
          act: kind === 'actual' ? numericValue : (prev[fieldKey]?.act ?? null),
        },
      }))
    } finally {
      setSavingKey(null)
    }
  }

  const saveActField = async (fieldKey: string) => saveField('actual', fieldKey)
  const saveStdField = async (fieldKey: string) => saveField('std', fieldKey)
  const handleStdChange = (fieldKey: string, value: string) => {
    if (!isEditMode) return
    setStdDraft((prev) => ({ ...prev, [fieldKey]: value }))
  }
  const handleActChange = (fieldKey: string, value: string) =>
    setActDraft((prev) => ({ ...prev, [fieldKey]: value }))
  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  const allExpanded = SECTION_KEYS.every((key) => expandedSections[key])
  const toggleAll = () =>
    setExpandedSections(
      Object.fromEntries(SECTION_KEYS.map((key) => [key, !allExpanded]))
    )
  const closeEditPasswordModal = () => {
    setShowEditPasswordModal(false)
    setEditPasswordInput('')
    setEditPasswordError(null)
  }
  const submitEditPassword = () => {
    if (editPasswordInput !== EDIT_MODE_PASSWORD) {
      setEditPasswordError('Password salah.')
      return
    }
    setError(null)
    setIsEditMode(true)
    setStatusMessage('Mode Edit aktif.')
    closeEditPasswordModal()
  }
  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false)
      setStatusMessage('Mode View aktif.')
      return
    }
    setEditPasswordInput('')
    setEditPasswordError(null)
    setShowEditPasswordModal(true)
  }
  const canSelectMaterialType = Boolean(
    !isEditMode &&
    machineId &&
    materialContext?.materialId &&
    !materialTypeSaving &&
    !materialTypeLoading &&
    !selectedMaterialType
  )

  const resolveBulkSaveCandidates = () => {
    const trimmed = (baseUrl || '').replace(/\/+$/, '')
    const normalized = trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed
    const unique = new Set<string>()
    if (normalized) unique.add(`${normalized}/api/zhafir-ze-3600/manual-bulk`)
    unique.add('http://localhost:9999/api/zhafir-ze-3600/manual-bulk')
    unique.add('http://127.0.0.1:9999/api/zhafir-ze-3600/manual-bulk')
    unique.add('/be/api/zhafir-ze-3600/manual-bulk')
    unique.add('/api/zhafir-ze-3600/manual-bulk')
    return Array.from(unique)
  }

  const saveAll = async () => {
    if (!isEditMode) {
      setError('Standard hanya bisa disimpan di mode Edit.')
      return
    }

    const confirmed = window.confirm(
      'Apakah Anda sudah yakin semua data benar?'
    )
    if (!confirmed) return

    setError(null)
    setStatusMessage(null)
    setSavingKey('bulk')

    const stdPayload: Record<string, number | string> = {}
    const actPayload: Record<string, number | string> = {}

    for (const key of Object.keys(values)) {
      if (SINGLE_VALUE_FIELDS.has(key)) {
        const singleRaw = stdDraft[key] ?? actDraft[key]
        const singleNumber = Number(singleRaw)
        if (Number.isNaN(singleNumber)) {
          setSavingKey(null)
          setError(`Nilai untuk "${key}" harus angka`)
          return
        }
        stdPayload[key] = singleNumber
        actPayload[key] = singleNumber
      } else if (STRING_FIELDS.has(key)) {
        stdPayload[key] = stdDraft[key] ?? ''
        actPayload[key] = actDraft[key] ?? ''
      } else {
        const stdNumber = Number(stdDraft[key])
        const actNumber = Number(actDraft[key])
        if (Number.isNaN(stdNumber) || Number.isNaN(actNumber)) {
          setSavingKey(null)
          setError(`Nilai STD/ACT untuk "${key}" harus angka`)
          return
        }
        stdPayload[key] = stdNumber
        actPayload[key] = actNumber
      }
    }

    let lastError = 'unknown'
    try {
      let saved = false
      for (const url of resolveBulkSaveCandidates()) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              std: stdPayload,
              act: actPayload,
              machine_id: machineId || undefined,
              material:
                materialContext?.materialId && selectedMaterialType
                  ? `${materialContext.materialId} - ${selectedMaterialType}`
                  : materialParam || undefined,
            }),
          })
          if (!res.ok) {
            lastError = `${res.status} @ ${url}`
            continue
          }
          saved = true
          break
        } catch (e) {
          const name = (e as Error).name || 'Error'
          lastError = `${name} @ ${url}`
        }
      }

      if (!saved) {
        setError(`Gagal save all (${lastError})`)
        return
      }

      setValues((prev) => {
        const next = { ...prev }
        for (const key of Object.keys(prev)) {
          next[key] = {
            std: stdPayload[key] as any,
            act: actPayload[key] as any,
          }
        }
        return next
      })
      setStatusMessage('Semua data STD/ACT berhasil disimpan.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="p-6 text-sm">
      <div className="mb-4 flex h-12 items-center gap-2 border-b px-2">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={countboardHref}>Countboard Injection</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Zhafir ZE-3600</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-4 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Machine Name
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {machineDesc || '-'}
              {machineNumber ? ` - ${machineNumber}` : ''}
            </div>
          </div>
          <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Machine ID
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {machineId || '-'}
            </div>
          </div>
          <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Gedung
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {location || '-'}
            </div>
          </div>
          <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Material ID
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {materialContext?.materialId || '-'}
            </div>
          </div>
          <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Zhafir Material Name
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {materialContext?.materialName || '-'}
            </div>
          </div>
          <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Type
            </div>
            <select
              value={selectedMaterialType}
              onChange={(e) => handleMaterialTypeChange(e.target.value)}
              disabled={!canSelectMaterialType}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            >
              <option value="">Pilih type</option>
              {materialTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {materialTypeLoading && !materialTypeSaving && (
              <div className="mt-1 text-[10px] text-gray-500">Loading...</div>
            )}
            {materialTypeSaving && (
              <div className="mt-1 text-[10px] text-gray-500">Saving...</div>
            )}
          </div>
          <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              PRO Name
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {poNumber || '-'}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          ParaID: <span className="font-semibold">{PARA_ID}</span>
          {` | Mode: ${isEditMode ? 'EDIT' : 'VIEW'}`}
          {loading ? ' | Loading...' : ''}
          {error ? ` | ${error}` : ''}
          {!materialContext && materialParam
            ? ` | Material: ${materialParam}`
            : ''}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleEditMode}
          className={`rounded-md border px-3 py-1 text-xs ${
            isEditMode
              ? 'border-amber-500 bg-amber-50 text-amber-800 hover:bg-amber-100'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isEditMode ? 'Switch to View Mode' : 'Enter Edit Mode'}
        </button>
        <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1">
          <label className="text-xs text-gray-600">Tanggal</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 outline-none focus:border-gray-500"
          />
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1">
          <label className="text-xs text-gray-600">Jam</label>
          <select
            value={selectedHour}
            onChange={(e) => setSelectedHour(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 outline-none focus:border-gray-500"
          >
            {hourOptions.map((h) => (
              <option key={h} value={String(h)}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>
        {isEditMode && (
          <button
            type="button"
            onClick={saveAll}
            disabled={loading || savingKey === 'bulk'}
            className="rounded-md border px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            {savingKey === 'bulk' ? 'Saving All...' : 'Save All STD + ACT'}
          </button>
        )}
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-md border px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200"
        >
          {allExpanded ? 'Collapse All -' : 'Expand All +'}
        </button>
        {statusMessage && (
          <span className="text-xs text-green-700">{statusMessage}</span>
        )}
        <div className="flex items-center rounded-md border bg-white px-2 py-1">
          <label className="text-xs font-semibold">Tolerance:</label>
          <select
            value={tolerance}
            onChange={(e) => setTolerance(Number(e.target.value))}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value={0}>0%</option>
            <option value={5}>5%</option>
            <option value={10}>10%</option>
          </select>
        </div>
      </div>
      {showEditPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={closeEditPasswordModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 text-sm font-semibold text-slate-900">
              Masuk Mode Edit
            </div>
            <div className="mb-4 text-xs text-slate-500">
              Masukkan password untuk mengaktifkan edit Standard.
            </div>
            <input
              type="password"
              value={editPasswordInput}
              onChange={(e) => {
                setEditPasswordInput(e.target.value)
                if (editPasswordError) setEditPasswordError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitEditPassword()
                if (e.key === 'Escape') closeEditPasswordModal()
              }}
              autoFocus
              placeholder="Password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            {editPasswordError && (
              <div className="mt-2 text-xs text-red-600">
                {editPasswordError}
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEditPasswordModal}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEditPassword}
                className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800"
              >
                Masuk Edit
              </button>
            </div>
          </div>
        </div>
      )}

      <Section
        title="SUMMARY INJECTION SETTINGS"
        sectionKey="SUMMARY INJECTION SETTINGS"
        expanded={expandedSections['SUMMARY INJECTION SETTINGS']}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="border rounded-md p-3 bg-gray-50">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700 mb-2 items-center">
              <div className="col-span-4">Summary Injection Settings</div>

              <div className="col-span-4 text-center">Actual / Standard</div>

              <div className="col-span-2 text-center">Unit</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center mb-2">
              <div
                className={`col-span-5 text-xs font-semibold transition-colors duration-300
      ${isStdGreaterThanAct('InjectScrewPosition') ? 'text-red-600' : ''}`}
              >
                Inj Start Pos
                {isStdGreaterThanAct('InjectScrewPosition') && (
                  <div className="text-right">
                    <span className="text-red-600 font-bold warning-blink">
                      ⚠ Value di luar toleransi
                    </span>
                  </div>
                )}
              </div>

              <div className="col-span-5">
                <Input
                  pair
                  fieldKey="InjectScrewPosition"
                  values={values}
                  stdDraft={stdDraft}
                  actDraft={actDraft}
                  onStdChange={isEditMode ? handleStdChange : undefined}
                  onActChange={handleActChange}
                  savingKey={savingKey}
                  isActOverLimit={isStdGreaterThanAct('InjectScrewPosition')}
                />
              </div>

              <div
                className={`col-span-2 text-xs text-center transition-colors duration-300
    ${isStdGreaterThanAct('InjectScrewPosition') ? 'text-red-600 font-semibold' : ''}`}
              >
                mm
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center mb-2">
              <div
                className={`col-span-5 text-xs font-semibold transition-colors duration-300
    ${isStdGreaterThanAct('VPTimeText') ? 'text-red-600' : ''}`}
              >
                V/P Time
                {isStdGreaterThanAct('VPTimeText') && (
                  <div className="text-right">
                    <span className="text-red-600 font-bold warning-blink">
                      ⚠ Value di luar toleransi
                    </span>
                  </div>
                )}
              </div>
              <div className="col-span-5">
                <Input
                  pair
                  fieldKey="VPTimeText"
                  values={values}
                  stdDraft={stdDraft}
                  actDraft={actDraft}
                  onStdChange={isEditMode ? handleStdChange : undefined}
                  onActChange={handleActChange}
                  savingKey={savingKey}
                  isActOverLimit={isStdGreaterThanAct('VPTimeText')}
                />
              </div>

              <div
                className={`col-span-2 text-xs text-center
    ${isStdGreaterThanAct('VPTimeText') ? 'text-red-600 font-semibold' : ''}`}
              >
                s
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center mb-2">
              <div
                className={`col-span-5 text-xs font-semibold transition-colors duration-300
    ${isStdGreaterThanAct('VPPositionText') ? 'text-red-600' : ''}`}
              >
                V/P Position
                {isStdGreaterThanAct('VPPositionText') && (
                  <div className="text-right">
                    <span className="text-red-600 font-bold warning-blink">
                      ⚠ Value di luar toleransi
                    </span>
                  </div>
                )}
              </div>

              <div className="col-span-5">
                <Input
                  pair
                  fieldKey="VPPositionText"
                  values={values}
                  stdDraft={stdDraft}
                  actDraft={actDraft}
                  onStdChange={isEditMode ? handleStdChange : undefined}
                  onActChange={handleActChange}
                  savingKey={savingKey}
                  isActOverLimit={isStdGreaterThanAct('VPPositionText')}
                />
              </div>
              <div
                className={`col-span-2 text-xs text-center transition-colors duration-300
    ${isStdGreaterThanAct('VPPositionText') ? 'text-red-600 font-semibold' : ''}`}
              >
                mm
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center mb-2">
              <div
                className={`col-span-5 text-xs font-semibold transition-colors duration-300
    ${isStdGreaterThanAct('Thickness') ? 'text-red-600' : ''}`}
              >
                Min Cushion Position
                {isStdGreaterThanAct('Thickness') && (
                  <div className="text-right">
                    <span className="text-red-600 font-bold warning-blink">
                      ⚠ Value di luar toleransi
                    </span>
                  </div>
                )}
              </div>

              <div className="col-span-5">
                <Input
                  pair
                  fieldKey="Thickness"
                  values={values}
                  stdDraft={stdDraft}
                  actDraft={actDraft}
                  onStdChange={isEditMode ? handleStdChange : undefined}
                  onActChange={handleActChange}
                  savingKey={savingKey}
                  isActOverLimit={isStdGreaterThanAct('Thickness')}
                />
              </div>

              <div
                className={`col-span-2 text-xs text-center transition-colors duration-300
    ${isStdGreaterThanAct('Thickness') ? 'text-red-600 font-semibold' : ''}`}
              >
                mm
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center mb-2">
              <div
                className={`col-span-5 text-xs font-semibold transition-colors duration-300
    ${isStdGreaterThanAct('CarriageBwd_SE') ? 'text-red-600' : ''}`}
              >
                Carriage Backward SE
                {isStdGreaterThanAct('CarriageBwd_SE') && (
                  <div className="text-right">
                    <span className="text-red-600 font-bold warning-blink">
                      ⚠ Value di luar toleransi
                    </span>
                  </div>
                )}
              </div>

              <div className="col-span-5 transition-all duration-300">
                <Input
                  pair
                  fieldKey="CarriageBwd_SE"
                  values={values}
                  stdDraft={stdDraft}
                  actDraft={actDraft}
                  onStdChange={isEditMode ? handleStdChange : undefined}
                  onActChange={handleActChange}
                  savingKey={savingKey}
                  isActOverLimit={isStdGreaterThanAct('CarriageBwd_SE')}
                />
              </div>

              <div
                className={`col-span-2 text-xs text-center transition-colors duration-300
    ${isStdGreaterThanAct('CarriageBwd_SE') ? 'text-red-600 font-semibold' : ''}`}
              >
                mm
              </div>
            </div>
          </div>

          <div className="border rounded-md p-3 bg-gray-50">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700 mb-2">
              <div className="col-span-4">Hopper Temp.</div>
              <div className="col-span-6 text-center">Actual / Standard</div>
              <div className="col-span-2 text-center">Unit</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center mb-2">
              <div className="col-span-4 text-xs">Set</div>
              <div className="col-span-6">
                <Input
                  pair
                  fieldKey="HopperSet"
                  values={values}
                  stdDraft={stdDraft}
                  actDraft={actDraft}
                  onStdChange={isEditMode ? handleStdChange : undefined}
                  onActChange={handleActChange}
                  savingKey={savingKey}
                />
              </div>
              <div className="col-span-2 text-xs text-center">C</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center mb-2">
              <div className="col-span-4 text-xs">Max +</div>
              <div className="col-span-6">
                <Input
                  pair
                  fieldKey="HopperMax"
                  values={values}
                  stdDraft={stdDraft}
                  actDraft={actDraft}
                  onStdChange={isEditMode ? handleStdChange : undefined}
                  onActChange={handleActChange}
                  savingKey={savingKey}
                />
              </div>
              <div className="col-span-2 text-xs text-center">C</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-xs">Min -</div>
              <div className="col-span-6">
                <Input
                  pair
                  fieldKey="HopperMin"
                  values={values}
                  stdDraft={stdDraft}
                  actDraft={actDraft}
                  onStdChange={isEditMode ? handleStdChange : undefined}
                  onActChange={handleActChange}
                  savingKey={savingKey}
                />
              </div>
              <div className="col-span-2 text-xs text-center">C</div>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="INJECT"
        sectionKey="INJECT"
        expanded={expandedSections['INJECT']}
        onToggle={toggleSection}
      >
        <Row
          labels={['SE', 'S4', 'S3', 'S2', 'S1', 'SB']}
          type="triple"
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={isEditMode ? handleStdChange : undefined}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            SE: ['InjectSEPosition', 'Inject4Velo', 'Inject4Press'],
            S4: ['Inject3To', 'Inject3Velo', 'Inject3Press'],
            S3: ['Inject2To', 'Inject2Velo', 'Inject2Press'],
            S2: ['Inject1To', 'Inject1Velo', 'Inject1Press'],
            S1: ['InjectScrewPosition', 'InjectS1Speed', 'InjectionPressure'],
            SB: ['InjectSBPosition', 'InjectSBSpeed', 'InjectSBPressure'],
          }}
        />
      </Section>

      <Section
        title="HOLDING"
        sectionKey="HOLDING"
        expanded={expandedSections['HOLDING']}
        onToggle={toggleSection}
      >
        <Row
          labels={['P3', 'P2', 'P1']}
          type="triple"
          fields={['Pressure', 'Time', 'Hold Speed']}
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={isEditMode ? handleStdChange : undefined}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            P3: ['Hold3Press', 'Hold3To', 'Hold3Velo'],
            P2: ['Hold2Press', 'Hold2To', 'Hold2Velo'],
            P1: ['Hold1Press', 'Hold1To', 'Hold1Velo'],
          }}
        />
      </Section>

      <Section
        title="CHARGING"
        sectionKey="CHARGING"
        expanded={expandedSections['CHARGING']}
        onToggle={toggleSection}
      >
        <Row
          labels={['S1', 'S2', 'SE']}
          type="triple"
          fields={['Position', 'Speed', 'Pressure', 'Back Press']}
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={isEditMode ? handleStdChange : undefined}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            S1: [
              'Plasticise1To',
              'Plasticise1Velo',
              'Plasticise1Press',
              'Plasticise1BackPress',
            ],
            S2: ['Plasticise2To', 'Plasticise2Velo', 'Plasticise2Press', null],
            SE: [
              'AfterPlasticisePosition',
              'AfterPlasticiseSpeed',
              'AfterPlasticisePress',
              'AfterPlasticiseBackPress',
            ],
          }}
        />
      </Section>

      <Section
        title="CLAMP / MOLD"
        sectionKey="CLAMP / MOLD"
        expanded={expandedSections['CLAMP / MOLD']}
        onToggle={toggleSection}
      >
        <SubSection title="Close Mold">
          <Row
            labels={['S0', 'S1', 'S2', 'S3', 'LP', 'HP', 'SE']}
            type="double"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={isEditMode ? handleStdChange : undefined}
            onActChange={handleActChange}
            onStdSave={saveStdField}
            onActSave={saveActField}
            savingKey={savingKey}
            keyMap={{
              S0: ['Close0To', 'Close0Velo'],
              S1: ['Close1To', 'Close1Velo'],
              S2: ['Close2To', 'Close2Velo'],
              S3: ['ProtectTo', 'ProtectVelo'],
              LP: ['CloseLPTo', 'CloseLPVelo'],
              HP: ['CloseHPTo', 'CloseHPVelo'],
              SE: ['CloseSETo', 'CloseSEVelo'],
            }}
          />
        </SubSection>

        <SubSection title="Open Mold">
          <Row
            labels={['SE', 'S5', 'S4', 'S3', 'S2', 'S1']}
            type="double"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={isEditMode ? handleStdChange : undefined}
            onActChange={handleActChange}
            onStdSave={saveStdField}
            onActSave={saveActField}
            savingKey={savingKey}
            keyMap={{
              SE: ['Open4To', 'Open4Velo'],
              S5: ['OpenS5To', 'OpenS5Velo'],
              S4: ['OpenS4To', 'OpenS4Velo'],
              S3: ['Open3To', 'Open3Velo'],
              S2: ['Open2To', 'Open2Velo'],
              S1: ['Open1To', 'Open1Velo'],
            }}
          />
        </SubSection>
      </Section>

      <Section
        title="TEMPERATURE"
        sectionKey="TEMPERATURE"
        expanded={expandedSections['TEMPERATURE']}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-9 gap-2">
          {[
            { zone: 'Zone 1', real: 'Barrel1', set: 'Barrel1' },
            { zone: 'Zone 2', real: 'Barrel2', set: 'Barrel2' },
            { zone: 'Zone 3', real: 'Barrel3', set: 'Barrel3' },
            { zone: 'Zone 4', real: 'Barrel4', set: 'Barrel4' },
            { zone: 'Zone 5', real: 'Barrel5', set: 'Barrel5' },
            { zone: 'Zone 6', real: 'Barrel6', set: 'Barrel6' },
            { zone: 'Hopper', real: 'HopperReal', set: 'HopperSet' },
          ].map((z) => (
            <div key={z.zone} className="border p-2">
              <div className="font-semibold">{z.zone}</div>
              <Input
                label="Real"
                fieldKey={z.real}
                values={values}
                actDraft={actDraft}
                stdDraft={stdDraft}
                onStdChange={isEditMode ? handleStdChange : undefined}
                onStdSave={saveStdField}
                onActChange={handleActChange}
                onActSave={saveActField}
                savingKey={savingKey}
              />
              <Input
                label="Set"
                fieldKey={z.set}
                values={values}
                stdDraft={stdDraft}
                actDraft={actDraft}
                onStdChange={isEditMode ? handleStdChange : undefined}
                onStdSave={saveStdField}
                onActChange={handleActChange}
                onActSave={saveActField}
                savingKey={savingKey}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="EJECTOR FWD"
        sectionKey="EJECTOR FWD"
        expanded={expandedSections['EJECTOR FWD']}
        onToggle={toggleSection}
      >
        <Row
          labels={['S1', 'SE']}
          type="triple"
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={isEditMode ? handleStdChange : undefined}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            S1: ['Forward1To', 'Forward1Velo', 'Forward1Press'],
            SE: ['Forward2To', 'Forward2Velo', 'Forward2Press'],
          }}
        />
      </Section>

      <Section
        title="EJECTOR BWD"
        sectionKey="EJECTOR BWD"
        expanded={expandedSections['EJECTOR BWD']}
        onToggle={toggleSection}
      >
        <Row
          labels={['SE', 'S1']}
          type="triple"
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={isEditMode ? handleStdChange : undefined}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            SE: ['Backward2To', 'Backward2Velo', 'Backward2Press'],
            S1: ['Backward1To', 'Backward1Velo', 'Backward1Press'],
          }}
        />
      </Section>

      <Section
        title="AIR BLOW"
        sectionKey="AIR BLOW"
        expanded={expandedSections['AIR BLOW']}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Blow start"
            pair
            fieldKey="AirBlowStart"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={isEditMode ? handleStdChange : undefined}
            onActChange={handleActChange}
            savingKey={savingKey}
          />
          <Input
            label="Blow delay"
            pair
            fieldKey="AirBlowDelay"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={isEditMode ? handleStdChange : undefined}
            onActChange={handleActChange}
            savingKey={savingKey}
          />
          <Input
            label="Blow time"
            pair
            fieldKey="AirBlowTime"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={isEditMode ? handleStdChange : undefined}
            onActChange={handleActChange}
            savingKey={savingKey}
          />
          <Input
            label="Blow count"
            pair
            fieldKey="AirBlowCount"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={isEditMode ? handleStdChange : undefined}
            onActChange={handleActChange}
            savingKey={savingKey}
          />
          <Input
            label="Star post"
            pair
            fieldKey="AirBlowStarPost"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={isEditMode ? handleStdChange : undefined}
            onActChange={handleActChange}
            savingKey={savingKey}
          />
          <Input
            label="Male/Female"
            pair
            fieldKey="AirBlowMaleFemale"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={isEditMode ? handleStdChange : undefined}
            onActChange={handleActChange}
            savingKey={savingKey}
          />
        </div>
      </Section>

      <Section
        title="CORE A"
        sectionKey="CORE A"
        expanded={expandedSections['CORE A']}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Core Mode (In)"
            pair
            fieldKey="Core_In_Mode_A"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Core Mode (Out)"
            pair
            fieldKey="Core_Out_Mode_A"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Mold Pos (In)"
            pair
            fieldKey="Core_In_Mold_Position_A"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Mold Pos (Out)"
            pair
            fieldKey="Core_Out_Mold_Position_A"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Delay Time (In)"
            pair
            fieldKey="Core_In_Delay_Time_A"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Delay Time (Out)"
            pair
            fieldKey="Core_Out_Delay_Time_A"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Time (In)"
            pair
            fieldKey="Core_In_Time_A"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Time (Out)"
            pair
            fieldKey="Core_Out_Time_A"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Press (In)"
            pair
            fieldKey="CoreA_In_Pressure"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Press (Out)"
            pair
            fieldKey="CoreA_Out_Pressure"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Flow (In)"
            pair
            fieldKey="CoreA_In_Flow"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Flow (Out)"
            pair
            fieldKey="CoreA_Out_Flow"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
        </div>
      </Section>

      <Section
        title="CORE B"
        sectionKey="CORE B"
        expanded={expandedSections['CORE B']}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Core Mode (In)"
            pair
            fieldKey="Core_In_Mode_B"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Core Mode (Out)"
            pair
            fieldKey="Core_Out_Mode_B"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Mold Pos (In)"
            pair
            fieldKey="Core_In_Mold_Position_B"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Mold Pos (Out)"
            pair
            fieldKey="Core_Out_Mold_Position_B"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Delay Time (In)"
            pair
            fieldKey="Core_In_Delay_Time_B"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Delay Time (Out)"
            pair
            fieldKey="Core_Out_Delay_Time_B"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Time (In)"
            pair
            fieldKey="Core_In_Time_B"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Time (Out)"
            pair
            fieldKey="Core_Out_Time_B"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Press (In)"
            pair
            fieldKey="CoreB_In_Pressure"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Press (Out)"
            pair
            fieldKey="CoreB_Out_Pressure"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Flow (In)"
            pair
            fieldKey="CoreB_In_Flow"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Flow (Out)"
            pair
            fieldKey="CoreB_Out_Flow"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
        </div>
      </Section>

      <Section
        title="CORE C"
        sectionKey="CORE C"
        expanded={expandedSections['CORE C']}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Core Mode (In)"
            pair
            fieldKey="Core_In_Mode_C"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Core Mode (Out)"
            pair
            fieldKey="Core_Out_Mode_C"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Mold Pos (In)"
            pair
            fieldKey="Core_In_Mold_Position_C"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Mold Pos (Out)"
            pair
            fieldKey="Core_Out_Mold_Position_C"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Delay Time (In)"
            pair
            fieldKey="Core_In_Delay_Time_C"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Delay Time (Out)"
            pair
            fieldKey="Core_Out_Delay_Time_C"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Time (In)"
            pair
            fieldKey="Core_In_Time_C"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Time (Out)"
            pair
            fieldKey="Core_Out_Time_C"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Press (In)"
            pair
            fieldKey="CoreC_In_Pressure"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Press (Out)"
            pair
            fieldKey="CoreC_Out_Pressure"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Flow (In)"
            pair
            fieldKey="CoreC_In_Flow"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Flow (Out)"
            pair
            fieldKey="CoreC_Out_Flow"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
        </div>
      </Section>

      <Section
        title="CORE D"
        sectionKey="CORE D"
        expanded={expandedSections['CORE D']}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Core Mode (In)"
            pair
            fieldKey="Core_In_Mode_D"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Core Mode (Out)"
            pair
            fieldKey="Core_Out_Mode_D"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Mold Pos (In)"
            pair
            fieldKey="Core_In_Mold_Position_D"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Mold Pos (Out)"
            pair
            fieldKey="Core_Out_Mold_Position_D"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Delay Time (In)"
            pair
            fieldKey="Core_In_Delay_Time_D"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Delay Time (Out)"
            pair
            fieldKey="Core_Out_Delay_Time_D"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Time (In)"
            pair
            fieldKey="Core_In_Time_D"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Time (Out)"
            pair
            fieldKey="Core_Out_Time_D"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Press (In)"
            pair
            fieldKey="CoreD_In_Pressure"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Press (Out)"
            pair
            fieldKey="CoreD_Out_Pressure"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Flow (In)"
            pair
            fieldKey="CoreD_In_Flow"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
          <Input
            label="Flow (Out)"
            pair
            fieldKey="CoreD_Out_Flow"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            savingKey={savingKey}
          />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Section
          title="CUSSION"
          className="mb-0 h-full"
          sectionKey="CUSSION"
          expanded={expandedSections['CUSSION']}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Cussion"
              fieldKey="Thickness"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
            <Input
              label="Act Inj Time"
              fieldKey="InjectTime"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
          </div>
        </Section>
        <Section
          title="Cooling Time"
          className="mb-0 h-full"
          sectionKey="COOLING TIME"
          expanded={expandedSections['COOLING TIME']}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-1 gap-2">
            <Input
              label="Cooling Time"
              fieldKey="CoolingTime"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
          </div>
        </Section>
        <Section
          title="V/P"
          className="mb-0 h-full"
          sectionKey="V/P"
          expanded={expandedSections['V/P']}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="V/P Position"
              fieldKey="VPPositionText"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
            <Input
              label="V/P Time"
              fieldKey="VPTimeText"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
            <Input
              label="V/P Posn"
              fieldKey="VPPosnText"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
          </div>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        <Section
          title="Suckback Beg. Charg"
          className="mb-0 h-full"
          sectionKey="SUCKBACK BEG. CHARG"
          expanded={expandedSections['SUCKBACK BEG. CHARG']}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-1 gap-2">
            <Input
              label=""
              pair
              fieldKey="Plasticise1Press"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
            <Input
              label=""
              pair
              fieldKey="Plasticise1Velo"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
          </div>
        </Section>
        <Section
          title="Suckback Aft. Charg"
          className="mb-0 h-full"
          sectionKey="SUCKBACK AFT. CHARG"
          expanded={expandedSections['SUCKBACK AFT. CHARG']}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-1 gap-2">
            <Input
              label=""
              pair
              fieldKey="AfterPlasticisePress"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
            <Input
              label=""
              pair
              fieldKey="AfterPlasticiseVelo"
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onStdSave={saveStdField}
              onActChange={handleActChange}
              onActSave={saveActField}
              savingKey={savingKey}
            />
          </div>
        </Section>
      </div>

      <Section
        title="BERAT UNIT"
        sectionKey="BERAT UNIT"
        expanded={expandedSections['BERAT UNIT']}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <Input
              key={i}
              label={`${i + 1}`}
              pair={false}
              fieldKey={`BeratUnit${i + 1}`}
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onActChange={handleActChange}
              savingKey={savingKey}
            />
          ))}
        </div>
      </Section>

      <Section
        title="HEATER CONTROL"
        sectionKey="HEATER CONTROL"
        expanded={expandedSections['HEATER CONTROL']}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <Input
              key={i}
              label={`${i + 1}`}
              pair={false}
              fieldKey={`HeaterControl${i + 1}`}
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={isEditMode ? handleStdChange : undefined}
              onActChange={handleActChange}
              savingKey={savingKey}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
  className,
  sectionKey,
  expanded,
  onToggle,
}: SectionProps) {
  const isExpanded = expanded ?? true
  return (
    <div
      className={`border-2 border-gray-400 rounded-xl p-4 mb-4 bg-white shadow-sm ${className ?? ''}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2 bg-gray-100 border border-gray-300 rounded-md px-3 py-2">
        <h2 className="font-bold">{title}</h2>
        {sectionKey && onToggle && (
          <button
            type="button"
            onClick={() => onToggle(sectionKey)}
            className="rounded border px-2 py-0.5 text-xs bg-white hover:bg-gray-100"
          >
            {isExpanded ? 'Collapse -' : 'Expand +'}
          </button>
        )}
      </div>
      {isExpanded ? children : null}
    </div>
  )
}

function SubSection({ title, children }: SectionProps) {
  return (
    <div className="border-2 border-gray-300 rounded-lg bg-gray-50 p-3 mb-3">
      <h3 className="font-semibold mb-2 bg-white border border-gray-200 rounded-md px-2 py-1">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Row({
  labels,
  type,
  fields,
  keyMap,
  values,
  stdDraft,
  actDraft,
  onStdChange,
  onStdSave,
  onActChange,
  onActSave,
  savingKey,
  savingField,
}: RowProps &
  Pick<
    InputProps,
    | 'stdDraft'
    | 'actDraft'
    | 'onStdChange'
    | 'onStdSave'
    | 'onActChange'
    | 'onActSave'
    | 'savingKey'
    | 'savingField'
  >) {
  const tripleFields = fields ?? ['Position', 'Speed', 'Pressure']
  const rowFields = type === 'triple' ? tripleFields : ['Position', 'Speed']

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}
    >
      {labels.map((label) => (
        <div
          key={label}
          className="border-2 border-gray-500 rounded-md p-2 bg-white"
        >
          <div className="font-semibold mb-1 text-center">{label}</div>
          {rowFields.map((field, idx) => (
            <Input
              key={`${label}-${field}`}
              label={field}
              pair
              values={values}
              fieldKey={keyMap?.[label]?.[idx] ?? null}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={onStdChange}
              onStdSave={onStdSave}
              onActChange={onActChange}
              onActSave={onActSave}
              savingKey={savingKey}
              savingField={savingField}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function Input({
  label,
  pair,
  fieldKey,
  values,
  stdDraft,
  actDraft,
  onStdChange,
  onStdSave,
  onActChange,
  onActSave,
  savingKey,
  savingField,
  isActOverLimit,
}: InputProps) {
  const hasLabel = Boolean(label)
  const stdValue = fieldKey
    ? (stdDraft?.[fieldKey] ?? fmt(values[fieldKey]?.std))
    : ''
  const actRawValue = fieldKey
    ? (actDraft?.[fieldKey] ?? values[fieldKey]?.act ?? '')
    : ''
  const actValue = fieldKey ? formatNumericDisplay(actRawValue, 2) : ''
  const currentSavingKey = savingKey ?? savingField ?? null
  const isSavingStd = fieldKey ? currentSavingKey === `std:${fieldKey}` : false
  const isSavingAct = fieldKey
    ? currentSavingKey === `actual:${fieldKey}` || currentSavingKey === fieldKey
    : false
  const actReadOnly = true

  return (
    <div className="flex flex-col mb-1">
      {!pair && hasLabel && <label className="text-xs">{label}</label>}
      {pair ? (
        <div className="grid grid-cols-2 gap-1">
          <div className="flex flex-col">
            <span className="text-[10px] leading-3">
              {hasLabel ? `${label} Std` : 'Std'}
            </span>
            <div className="flex gap-1">
              <input
                value={stdValue}
                onChange={(e) => {
                  if (!fieldKey || !onStdChange) return
                  onStdChange(fieldKey, e.target.value)
                }}
                className="border px-1 py-0.5 rounded w-full bg-white"
              />
              {fieldKey && onStdSave && ENABLE_PER_FIELD_SAVE && (
                <button
                  type="button"
                  onClick={() => onStdSave(fieldKey)}
                  disabled={isSavingStd}
                  className="px-2 py-0.5 text-[10px] rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  {isSavingStd ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] leading-3">
              {hasLabel ? `${label} Act` : 'Act'}
            </span>
            <div className="flex gap-1">
              <input
                value={actValue}
                readOnly={actReadOnly}
                className={`px-1 py-0.5 rounded w-full bg-gray-100 text-gray-700 transition-all duration-300
    ${isActOverLimit ? 'border border-red-500 ring-1 ring-red-400' : 'border'}`}
              />
              {fieldKey && onActSave && ENABLE_PER_FIELD_SAVE && (
                <button
                  type="button"
                  onClick={() => onActSave(fieldKey)}
                  disabled={isSavingAct}
                  className="px-2 py-0.5 text-[10px] rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  {isSavingAct ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-1">
          <input
            value={stdValue}
            onChange={(e) => {
              if (!fieldKey || !onStdChange) return
              onStdChange(fieldKey, e.target.value)
            }}
            className="border px-1 py-0.5 rounded w-full bg-white"
          />
          {fieldKey && onStdSave && ENABLE_PER_FIELD_SAVE && (
            <button
              type="button"
              onClick={() => onStdSave(fieldKey)}
              disabled={isSavingStd}
              className="px-2 py-0.5 text-[10px] rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              {isSavingStd ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
