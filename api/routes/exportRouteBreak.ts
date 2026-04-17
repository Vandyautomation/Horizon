import { Hono } from 'hono'
import { Group } from 'lucide-react'
import * as XLSX from 'xlsx'
// import exportRoutes from './exportRoutes'

const exportRoutesBreak = new Hono()

exportRoutesBreak.get('/breakdown', async (c) => {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL

    const lostRes = await fetch(`${API_BASE}/api/countboards/lost-time`)
    const lostData = await lostRes.json()

    const problemRes = await fetch(`${API_BASE}/api/countboards/problem`)
    const problemData = await problemRes.json()

    const lostMapped = (lostData || []).map((item: any, index: number) => ({
      No: index + 1,
      Location: item.Location,
      MchID: item.MchID,
      Brand: item.Brand,
      materialName: item.material_name || '-',
      ProblemGroup: item.ProblemGroupName || '-',
      Problem: item.Problem || '-',
      ActionPlan: item.ActionPlan || '-',
      Ton: item.MchTon,
      Duration_Hour: (item.DuraMin / 60).toFixed(2),
    }))

    const problemMapped = (problemData || []).map(
      (item: any, index: number) => ({
        No: index + 1,
        UAP: item.UAP,
        Brand: item.Brand,
        Location: item.Location,
        materialName: item.material_name || '-',
        ProblemGroup: item.ProblemGroupName || '-',
        Problem: item.Problem || '-',
        Action: item.Action || '-',
        PIC: item.pic || '-',
        Status: item.TicketStatus || '-',
      })
    )

    const lostSheet = XLSX.utils.json_to_sheet(lostMapped)
    const problemSheet = XLSX.utils.json_to_sheet(problemMapped)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, lostSheet, 'Lost Time')
    XLSX.utils.book_append_sheet(workbook, problemSheet, 'Problem Action')

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=breakdown.xlsx',
      },
    })
  } catch (error) {
    return c.json({ error: 'Export gagal' }, 500)
  }
})

export default exportRoutesBreak
