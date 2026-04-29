'use client'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import 'react-day-picker/dist/style.css'
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Settings,
  Layers,
  LayoutDashboard,
  ChevronDown,
  Building2,
  FileText,
  X,
} from 'lucide-react'
import Link from 'next/link'
// import mqtt from 'mqtt'
// ================= TYPESCRIPT INTERFACE =================
type CiltMonitoringData = {
  MchId: string
  machine_name: string
  material_name: string
  UAP: string
  MchLoc: string
  daily_shoot: number
  mold_name: string
  statusCILT: string
  statuslight: string
  CILTLvl: string
  sum_dailyshoot: number
}

// type MqttPayload = {
//   id: string
//   loc: string
//   number: string
//   shoot: number
//   status: string
// }

// type MqttResponse = {
//   status: {
//     connected: boolean
//     latestPayload: MqttPayload
//   }
//   machines: MqttPayload[]
//   logs: any[]
//   byBuildingMachine: any
// }
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL

export default function CilMonitoring() {
  const [selectedBuilding, setSelectedBuilding] =
    useState<string>('All Buildings')
  const [selectedUap, setSelectedUap] = useState<string>('All UAP')
  const [data, setData] = useState<CiltMonitoringData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Ubah state menjadi array
  // const [mqttData, setMqttData] = useState<MqttPayload[]>([])
  // State untuk menyimpan data mesin yang dipilih & status modal
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [isPreCilModalOpen, setIsPreCilModalOpen] = useState(false)
  const [targetMachine, setTargetMachine] = useState<CiltMonitoringData | null>(
    null
  )
  const [lvMoldInput, setLvMoldInput] = useState('Lv1')
  const openModal = (item: any) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }
  const openPreCilModal = (item: CiltMonitoringData) => {
    setTargetMachine(item)
    setNoteInput('') // Reset note jadi kosong setiap buka modal baru
    setIsPreCilModalOpen(true)
  }
  const closeModal = () => {
    setSelectedItem(null)
    setIsModalOpen(false)
  }
  // const handlePreCil = async (item: CiltMonitoringData) => {
  //   const confirmAction = window.confirm(
  //     `Apakah Anda yakin ingin memproses Pre-cil untuk mesin ${item.machine_name}?`
  //   )

  //   if (!confirmAction) return

  //   try {
  //     const res = await fetch(`${API_BASE}/api/cilt/update-status`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         MchId: item.MchId,
  //         statusCILT: 'CILT',
  //       }),
  //     })

  //     const result = await res.json()

  //     if (res.ok) {
  //       alert('Status berhasil diperbarui!')
  //       fetchData() // 3. Refresh data agar UI langsung berubah
  //     } else {
  //       alert(`Gagal: ${result.error}`)
  //     }
  //   } catch (error) {
  //     console.error('Error update status:', error)
  //     alert('Terjadi kesalahan koneksi ke server.')
  //   }
  // }
  const confirmPreCil = async () => {
    if (!targetMachine) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/cilt/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          MchId: targetMachine.MchId,
          statusCILT: 'CILT',
          note: noteInput,
          CILTLvl: lvMoldInput,
        }),
      })

      if (res.ok) {
        setIsPreCilModalOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleComplete = async (MchId: string) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/cilt/complete-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MchId }),
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  // const fetchMqtt = useCallback(async () => {
  //   try {
  //     const res = await fetch(`${API_BASE}/api/mqtt-counter-shoot`)
  //     if (!res.ok) throw new Error('MQTT fetch failed')

  //     const json: MqttResponse = await res.json()

  //     // Langsung ambil dari json.machines
  //     const machineData = json.machines || []

  //     setMqttData(machineData)

  //     // Debugging untuk memastikan ID sudah muncul
  //     if (machineData.length > 0) {
  //       console.log('Sample MQTT Machine ID:', machineData[0].id)
  //     }
  //   } catch (err) {
  //     console.error('MQTT error:', err)
  //   }
  // }, [])
  // console.log('Fetched MQTT data:', mqttData)
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cilt/cilt-monitoring`)
      if (!res.ok) throw new Error('Network response was not ok')
      const json = await res.json()
      setData(json || [])
    } catch (error) {
      console.error('Error fetching CILT data:', error)
    } finally {
      setLoading(false)
    }
  }, [])
  console.log('Fetched CILT data:', data)
  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ================= FILTER LOGIC =================
  // Mengambil list building dan uap unik secara dinamis dari data MchLoc yang ada
  const buildingsList = useMemo(() => {
    const uniqueLocs = Array.from(
      new Set(data.map((item) => item.MchLoc).filter(Boolean))
    )
    return ['All Buildings', ...uniqueLocs.sort()]
  }, [data])
  const uapList = useMemo(() => {
    const uniqueUaps = Array.from(
      new Set(data.map((item) => item.UAP).filter(Boolean))
    )
    return ['All UAP', ...uniqueUaps.sort()]
  }, [data])
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchBuilding =
        selectedBuilding === 'All Buildings' || item.MchLoc === selectedBuilding

      const matchUap = selectedUap === 'All UAP' || item.UAP === selectedUap

      return matchBuilding && matchUap
    })
  }, [selectedBuilding, selectedUap, data])
  const sortedData = useMemo(() => {
    return [...filteredData].sort(
      (a, b) => (b.daily_shoot || 0) - (a.daily_shoot || 0)
    )
  }, [filteredData])
  console.log('Sorted Data:', sortedData)
  // ================= UI COMPONENTS =================
  function DashboardCard({
    title,
    value,
    color,
    icon: Icon,
  }: {
    title: string
    value: string | number
    color: 'red' | 'orange' | 'teal' | 'gray' | 'blue'
    icon: any
  }) {
    const colorMap = {
      red: 'bg-red-50 text-red-600 border-red-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-100',
      teal: 'bg-teal-50 text-teal-600 border-teal-100',
      gray: 'bg-gray-50 text-gray-600 border-gray-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
    }

    return (
      <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              {title}
            </p>
            <h3 className="mt-1 text-3xl font-bold text-gray-800">{value}</h3>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[color]} transition-transform group-hover:scale-110`}
          >
            <Icon size={24} />
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 opacity-5 transition-opacity group-hover:opacity-10">
          <Icon size={64} />
        </div>
      </div>
    )
  }
  // Menghitung Active Issues (CILT)
  const activeIssuesCount = useMemo(() => {
    return sortedData.filter((item) => item.statusCILT === 'CILT').length
  }, [sortedData])

  // Menghitung Level 1
  const lv1Count = useMemo(() => {
    return sortedData.filter(
      (item) => item.statusCILT === 'CILT' && item.CILTLvl === 'Lv1'
    ).length
  }, [sortedData])

  // Menghitung Level 2
  const lv2Count = useMemo(() => {
    return sortedData.filter(
      (item) => item.statusCILT === 'CILT' && item.CILTLvl === 'Lv2'
    ).length
  }, [sortedData])

  // Menghitung Unexpected
  const unexpectedCount = useMemo(() => {
    return sortedData.filter(
      (item) => item.statusCILT === 'CILT' && item.CILTLvl === 'Unexpected'
    ).length
  }, [sortedData])
  return (
    <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] p-6 lg:p-10">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              CILT Monitoring Dashboard
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            Real-time monitoring of machine and mold status across all
            buildings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* DYNAMIC FILTER */}
          <div className="flex flex-wrap items-center gap-3">
            {/* FILTER UAP */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                <Layers size={16} />
              </div>
              <select
                value={selectedUap}
                onChange={(e) => setSelectedUap(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 pl-10 pr-10 py-2 rounded-xl text-sm font-semibold shadow-sm hover:border-blue-200 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]"
              >
                {uapList.map((uap) => (
                  <option key={uap} value={uap}>
                    {uap}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* FILTER BUILDING */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                <Building2 size={16} />
              </div>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 pl-10 pr-10 py-2 rounded-xl text-sm font-semibold shadow-sm hover:border-blue-200 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[160px]"
              >
                {buildingsList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <Link href="/cil-monitoring/data-precilt">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors">
              <FileText size={16} />
              Data Precilt
            </button>
          </Link>

          {/* <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-200 transition-all">
            Admin Dashboard
          </button> */}
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <DashboardCard
          title="Total Machines"
          value={filteredData.length}
          color="blue"
          icon={Settings}
        />
        <DashboardCard
          title="Active Issue"
          value={activeIssuesCount}
          color={activeIssuesCount > 0 ? 'red' : 'teal'}
          icon={AlertCircle}
        />
        <DashboardCard
          title="Plant Level 1"
          value={lv1Count} // Update dari "-"
          color="orange"
          icon={Layers}
        />
        <DashboardCard
          title="Plant Level 2"
          value={lv2Count} // Update dari "-"
          color="orange"
          icon={Layers}
        />
        <DashboardCard
          title="Unexpected"
          value={unexpectedCount} // Update dari "-"
          color="gray"
          icon={Activity}
        />
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-700">
              Recent Activity & Status
            </h3>
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">
              {selectedBuilding}
            </span>
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${loading ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
          >
            {loading ? 'Syncing...' : 'System Live'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold text-center w-16">No</th>
                <th className="px-6 py-4 font-semibold">Machine</th>
                <th className="px-6 py-4 font-semibold">Material Name</th>
                <th className="px-6 py-4 font-semibold">Mold</th>
                <th className="px-6 py-4 font-semibold">UAP</th>
                <th className="px-6 py-4 font-semibold">Building</th>
                <th className="px-6 py-4 font-semibold text-center">Shoot</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Status Mold
                </th>
                <th className="px-6 py-4 font-semibold text-center">Lv mold</th>
                <th className="px-6 py-4 font-semibold">Machine Status</th>
                <th className="px-6 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {sortedData.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-4 text-center text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">
                    {item.machine_name}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">
                    {item.material_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono">
                    {item.mold_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono">
                    {item.UAP}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.MchLoc}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-sm font-bold px-4 py-3 rounded-xl ${
                        item.daily_shoot >= 5000
                          ? 'text-red-700 bg-red-100 animate-pulse' // Critical (Merah)
                          : item.daily_shoot >= 2500
                            ? 'text-yellow-700 bg-yellow-100 animate-pulse' // Warning (Kuning)
                            : 'text-gray-600' // Normal (Abu-abu)
                      }`}
                    >
                      {item.daily_shoot === 0 || item.daily_shoot === null
                        ? '-'
                        : item.daily_shoot.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {/* Logic Tampilan: Jika status DB adalah CILT ATAU shoot >= 2500, tampilkan label CILT */}
                      {item.statusCILT === 'CILT' ||
                      item.daily_shoot >= 2500 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-yellow-500 text-white shadow-sm">
                          <AlertCircle size={12} className="animate-bounce" />
                          CILT
                        </span>
                      ) : item.statuslight === 'GREEN' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700">
                          <CheckCircle2 size={12} />
                          RUNNING
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <span
                        className={`text-[12px] font-bold px-2 py-0.5 rounded ${
                          item.CILTLvl === 'Lv2'
                            ? 'bg-red-100 text-red-600'
                            : item.CILTLvl === 'Lv1'
                              ? 'bg-orange-100 text-orange-600'
                              : item.CILTLvl === 'Unexpected'
                                ? 'bg-gray-100 text-gray-600'
                                : 'text-gray-300'
                        }`}
                      >
                        {item.CILTLvl || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          item.statuslight === 'GREEN'
                            ? 'bg-green-500'
                            : item.statuslight === 'RED'
                              ? 'bg-red-500'
                              : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-xs font-medium text-gray-400">
                        {item.statuslight}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openModal(item)}
                        className="flex items-center gap-2 bg-white border border-blue-400 text-blue-500 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-50 transition-all active:scale-95"
                      >
                        <FileText size={16} />
                        Details
                      </button>
                      {item.statusCILT !== 'CILT' && (
                        <button
                          onClick={() => openPreCilModal(item)} // Ganti ke fungsi baru ini
                          className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-yellow-600 transition-all active:scale-95"
                        >
                          <Settings size={16} />
                          Pre-Cilt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredData.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              No data found in database.
            </div>
          )}
        </div>
      </div>
      {/* MODAL OVERLAY */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Machine Details
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Machine & Loc */}
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                    Machine & Location
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {selectedItem.machine_name} - {selectedItem.MchLoc}
                  </p>
                </div>

                {/* Mold Name */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Mold Name
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-700">
                    {selectedItem.mold_name || '-'}
                  </p>
                </div>

                {/* Shoots Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Last Record (Daily)
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {(selectedItem.daily_shoot || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                      Total Accumulated
                    </p>
                    <p className="text-lg font-bold text-blue-800">
                      {/* Menggunakan sum_dailyshoot sesuai request */}
                      {(selectedItem.sum_dailyshoot || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Status Activity (Hanya muncul jika sedang CILT) */}
                {(selectedItem.statusCILT === 'CILT' ||
                  selectedItem.daily_shoot >= 2500) && (
                  <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <div className="flex items-center gap-2 text-yellow-700 mb-3">
                      <Activity size={16} className="animate-pulse" />
                      <p className="text-xs font-bold uppercase tracking-tight">
                        Maintenance in Progress
                      </p>
                    </div>
                    <button
                      disabled={isSubmitting}
                      className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                      onClick={() => handleComplete(selectedItem.MchId)} // Panggil fungsi di sini
                    >
                      {isSubmitting ? 'Processing...' : 'Selesai '}
                    </button>
                  </div>
                )}

                {/* Note Section */}
                <div className="p-4 bg-white rounded-2xl border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Note
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    {selectedItem.note
                      ? selectedItem.note
                      : 'Tidak ada catatan'}
                  </p>
                </div>
              </div>

              {/* Footer Action */}
              <button
                onClick={closeModal}
                className="mt-6 w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL INPUT PRE-CIL */}
      {isPreCilModalOpen && targetMachine && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsPreCilModalOpen(false)}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl p-6 animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-6 text-yellow-600">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Settings size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Start Pre-cilt Process
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Machine to Maintenance
                </p>
                <p className="text-md font-bold text-gray-700">
                  {targetMachine.machine_name} ({targetMachine.MchLoc})
                </p>
                <p className="text-xs text-gray-500">
                  Current Shoot: {targetMachine.daily_shoot?.toLocaleString()}
                </p>
              </div>

              {/* Dropdown Lv Mold */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Select Mold Level
                </label>
                <div className="relative group">
                  <select
                    value={lvMoldInput}
                    onChange={(e) => setLvMoldInput(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-yellow-500 outline-none cursor-pointer"
                  >
                    <option value="Lv1">Level 1 (Maintenance Ringan)</option>
                    <option value="Lv2">Level 2 (Maintenance Berat)</option>
                    <option value="Unexpected">Unexpected</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Input Note */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Add Maintenance Note (Optional)
                </label>
                <textarea
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none text-sm transition-all"
                  rows={3}
                  placeholder="Tambahkan catatan..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsPreCilModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={confirmPreCil}
                className="flex-[2] py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 shadow-lg shadow-yellow-200 transition-all active:scale-95"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Pre-Cilt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
