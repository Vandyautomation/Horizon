  'use client'

  import React, { useEffect, useState } from 'react'

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
  const weekLabels = Array.from({ length: 52 }, (_, i) => `W${i + 1}`)

  export default function CapacityTable() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [fromWeek, setFromWeek] = useState(1)
    const [toWeek, setToWeek] = useState(52)
    const [uapList, setUapList] = useState([])
    const [selectedUap, setSelectedUap] = useState('BASIC')
    const [yearList, setYearList] = useState([])
    const [selectedYear, setSelectedYear] = useState([])

    // const UV_COATING = 'UV COATING'
    useEffect(() => {
      const fetchUap = async () => {
        const res = await fetch(`${API_BASE}/api/hrz/hrz-uap-list`)
        const json = await res.json()
        setUapList(json.data || [])
      }

      fetchUap()
    }, [])

    const weekLabels = Array.from(
      { length: toWeek - fromWeek + 1 },
      (_, i) => `W${fromWeek + i}`
    )

    const fetchData = async () => {
      setLoading(true)

      const res = await fetch(
        `${API_BASE}/api/hrz/hrz-capacity-all?fromWeek=${fromWeek}&toWeek=${toWeek}&uap=${selectedUap}${selectedYear ? `&year=${selectedYear}` : ''}`
      )
      const json = await res.json()
      setData(json.data || [])
      setLoading(false)
    }
    useEffect(() => {
      fetchData()
    }, [fromWeek, toWeek, selectedUap, selectedYear])

    console.log('data', data)
    useEffect(() => {
      const fetchYearList = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/hrz/hrz-year-list`)
          const json = await res.json()
          setYearList(json.data || [])
          if (json.data?.length > 0) setSelectedYear(json.data[0])
        } catch (err) {
          console.error(err)
        }
      }

      fetchYearList()
    }, [])

  return (
    <div className="p-4 w-full max-w-[calc(95vw-10px)] overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
        {/* Sisi Kiri: From Week & To Week */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">From Week</label>
            <input
              type="number"
              value={fromWeek}
              onChange={(e) => setFromWeek(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1.5 w-24 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">To Week</label>
            <input
              type="number"
              value={toWeek}
              onChange={(e) => setToWeek(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1.5 w-24 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Sisi Kanan: UAP & Year Filter */}
        <div className="flex gap-4 bg-gray-50 p-2 rounded-lg border border-dashed border-gray-300">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UAP</label>
            <select
              value={selectedUap}
              onChange={(e) => setSelectedUap(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 min-w-[120px] bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {uapList.map((uap) => (
                <option key={uap} value={uap}>{uap}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1.5 min-w-[100px] bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {yearList.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE WRAPPER */}
      <div 
        className="relative shadow-lg rounded-xl border border-gray-300"
        style={{ 
          overflowX: 'auto', 
          maxWidth: '100%', 
          display: 'block',
          backgroundColor: '#fff' 
        }}
      >
        <table className="w-full text-sm text-center border-collapse" style={{ minWidth: 'max-content' }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-30 bg-slate-700 text-white border-r border-slate-600 px-4 py-3 min-w-[150px] font-bold uppercase tracking-wider">
                PROCESS
              </th>
              <th className="sticky left-[150px] z-30 bg-slate-700 text-white border-r border-slate-600 px-4 py-3 min-w-[120px] font-bold uppercase tracking-wider">
                GROUP
              </th>
              {weekLabels.map((w) => (
                <th key={w} className="bg-slate-700 text-white border-r border-slate-600 px-3 py-3 min-w-[75px] font-bold text-xs uppercase tracking-tighter">
                  {w}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={weekLabels.length + 2} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 font-medium">Fetching Data...</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((processItem) =>
                processItem.groups.map((group, gIdx) => (
                  <tr key={`${processItem.process}-${group.groupName}`} className="hover:bg-blue-50 border-b border-gray-200 transition-colors">
                    {gIdx === 0 && (
                      <td
                        rowSpan={processItem.groups.length}
                        className="sticky left-0 z-20 bg-gray-50 border-r border-b font-bold px-4 align-middle text-slate-800"
                        style={{ boxShadow: '2px 0 4px -2px rgba(0,0,0,0.15)' }}
                      >
                        {processItem.process}
                      </td>
                    )}

                    <td 
                      className="sticky left-[150px] z-20 bg-gray-50 border-r border-b px-4 py-3 text-slate-700 font-semibold"
                      style={{ boxShadow: '2px 0 4px -2px rgba(0,0,0,0.15)' }}
                    >
                      {group.groupName}
                    </td>
                    {weekLabels.map((w) => (
                      <td key={w} className="border-r border-b px-2 py-3 text-gray-700 font-medium hover:bg-white transition-all">
                        {group.weeks[w] || '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
  }
