import { Hono } from 'hono'
import * as XLSX from 'xlsx'

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

    const mapped = filtered.map((item: any, index: number) => ({
      No: index + 1,
      'Ticket Date': item.TicketDate,
      'Mch ID': item.MchID,
      Problem: item.Problem,
      'Action Plan': item.ActionPlan,
      Department: item.AssignToDept,
      Message: item.Message || '-',
      Status: item.EskalasiStatus,
    }))

    const worksheet = XLSX.utils.json_to_sheet(mapped)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Eskalasi')

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=eskalasi.xlsx',
      },
    })
  } catch (err) {
    return c.json({ error: 'Export gagal' }, 500)
  }
})

export default exportRoutes
