import { Hono } from 'hono'
import * as XLSX from 'xlsx'
import { format } from 'date-fns' // Pastikan install date-fns jika belum

const exportRoutes = new Hono()

exportRoutes.get('/eskalasi', async (c) => {
  const fromDate = c.req.query('fromDate')
  const toDate = c.req.query('toDate')
  const dept = c.req.query('dept')

  try {
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
    const res = await fetch(
      `${API_BASE}/api/countboards/eskalasi?fromDate=${fromDate}&toDate=${toDate}`
    )

    const data = await res.json()
    let filtered = Array.isArray(data) ? data : []

    if (dept && dept !== 'ALL') {
      filtered = filtered.filter(
        (item: any) =>
          item.AssignToDept?.toLowerCase().replace(/\s+/g, '') ===
          dept.toLowerCase().replace(/\s+/g, '')
      )
    }

    const mapped = filtered.map((item: any, index: number) => {
      let durationHours: string | number = '-'

      if (item.ActualFinish && item.ActualEskalasiFinish) {
        const submit = new Date(item.ActualFinish)
        const finish = new Date(item.ActualEskalasiFinish)

        const diffMs = finish.getTime() - submit.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        durationHours = diffHours > 0 ? parseFloat(diffHours.toFixed(2)) : 0
      }

      return {
        No: index + 1,
        'Ticket Date': item.TicketDate
          ? format(new Date(item.TicketDate), 'yyyy-MM-dd HH:mm')
          : '-',
        'Mch ID': item.MchID,
        ActualFinish:item.ActualFinish,
        Location: item.MchLoc || '-',
        'Mch Number': item.MchNumber || '-',
        Problem: item.Problem,
        'Action Plan': item.ActionPlan || '-',
        Department: item.AssignToDept,
        'Duration (Hours)': durationHours,
        Status: item.EskalasiStatus,
        Submit: item.ActualSubmit
          ? item.ActualSubmit.slice(0, 16).replace('T', ' ')
          : '-',
        Finish: item.ActualEskalasiFinish
          ? item.ActualEskalasiFinish.slice(0, 16).replace('T', ' ')
          : '-',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(mapped)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Eskalasi')

    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 30 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
    ]

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=eskalasi_export_${fromDate}_to_${toDate}.xlsx`,
      },
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Export gagal' }, 500)
  }
})

export default exportRoutes
