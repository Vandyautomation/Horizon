import { Hono } from 'hono'
import {
  getHRZData,
  getHRZColumns,
  getTableColumns,
  getHRZCapacityMch,
  getUAPList,
  getAllProcessCapacity,
  getYearList,
} from '../controllers/hrzController'
import {
  getPlannerData,
  getPlannerAvailData,
  getPlannerProcessDetail,
  getPlannerDispatchSlots,
  getPlannerCapacity,
  updatePlannerDispatch,
  PlannerDispatchUpdateBody,
} from '../controllers/hrzPlannerController'
import { NextResponse } from 'next/server'
const hrzRoutes = new Hono()

hrzRoutes.get('/test-mssql', async (c) => {
  try {
    // perform a simple query to verify DB connectivity
    const data = await getHRZData()
    return c.json({
      status: 'OKE ✅ Koneksi MSSQL berhasil',
      sample: data.data?.slice(0, 1) ?? [],
    })
  } catch (err: any) {
    return c.json({ status: 'GAGAL ❌', message: err.message }, 500)
  }
})

hrzRoutes.get('/data', async (c) => {
  try {
    const customer = c.req.query('customer') || undefined
    const uap = c.req.query('uap') || undefined
    const itemPrefix = c.req.query('itemPrefix') || undefined
    const search = c.req.query('search') || undefined
    const searchByParam = c.req.query('searchBy') || undefined
    const pageParam = c.req.query('page')
    const limitParam = c.req.query('limit')
    const yearParam = c.req.query('year')
    const monthParam = c.req.query('month')
    const dayParam = c.req.query('day')
    const page = pageParam ? Number(pageParam) : undefined
    const limit = limitParam ? Number(limitParam) : undefined
    const year = yearParam ? Number(yearParam) : undefined
    const month = monthParam ? Number(monthParam) : null
    const day = dayParam ? Number(dayParam) : undefined
    const allowedSearchBy = new Set([
      'salesOrder',
      'itemNo',
      'description',
      'customer',
    ])
    const searchBy =
      searchByParam && allowedSearchBy.has(searchByParam)
        ? searchByParam
        : undefined
    const filters: {
      customer?: string
      uap?: string
      itemPrefix?: string
      search?: string
      searchBy?: 'salesOrder' | 'itemNo' | 'description' | 'customer'
      page?: number
      limit?: number
      year?: number
      month?: number | null
      day?: number
    } = {
      customer,
      uap,
      itemPrefix,
      search,
      searchBy,
      page,
      limit,
      year,
      month,
      day,
    }
    const data = await getHRZData(filters)
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// list columns for SalesOrderMST by default or for a provided table via query param
hrzRoutes.get('/columns', async (c) => {
  try {
    const table = c.req.query('table')
    if (table) {
      const cols = await getTableColumns(table)
      return c.json({ table, columns: cols })
    }
    const cols = await getHRZColumns()
    return c.json({ table: 'SalesOrderMST', columns: cols })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Planner data for Sales Order detail
hrzRoutes.get('/planner', async (c) => {
  try {
    const so = c.req.query('so') || undefined
    const itemNo = c.req.query('itemNo') || undefined
    const yearParam = c.req.query('year')
    const fromWeekParam = c.req.query('fromWeek')
    const toWeekParam = c.req.query('toWeek')
    const mode = c.req.query('mode') || undefined

    const year = yearParam ? Number(yearParam) : undefined
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined

    const data = await getPlannerData({
      so,
      itemNo,
      year,
      fromWeek,
      toWeek,
      mode,
    })
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Total avail data for planner (level 2 only)
hrzRoutes.get('/planner-avail', async (c) => {
  try {
    const so = c.req.query('so') || undefined
    const itemNo = c.req.query('itemNo') || undefined
    const yearParam = c.req.query('year')
    const fromWeekParam = c.req.query('fromWeek')
    const toWeekParam = c.req.query('toWeek')

    const year = yearParam ? Number(yearParam) : undefined
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined

    const data = await getPlannerAvailData({
      so,
      itemNo,
      year,
      fromWeek,
      toWeek,
    })
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Detail proses (level 3) untuk satu MaterialID
hrzRoutes.get('/planner-process', async (c) => {
  try {
    const so = c.req.query('so')
    const materialIdParam = c.req.query('materialId')
    if (!so || !materialIdParam) {
      return c.json({ error: 'Missing so or materialId' }, 400)
    }

    const yearParam = c.req.query('year')
    const fromWeekParam = c.req.query('fromWeek')
    const toWeekParam = c.req.query('toWeek')

    const materialId = Number(materialIdParam)
    const year = yearParam ? Number(yearParam) : undefined
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined

    const data = await getPlannerProcessDetail({
      so,
      materialId,
      year,
      fromWeek,
      toWeek,
    })
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Ambil slot dispatch yang sudah disimpan di Hrz_DispatchPlan
hrzRoutes.get('/planner-dispatch-slots', async (c) => {
  try {
    const so = c.req.query('so')
    const materialIdParam = c.req.query('materialId')
    const yearParam = c.req.query('year')
    if (!so || !materialIdParam || !yearParam) {
      return c.json({ error: 'Missing so, materialId, or year' }, 400)
    }

    const fromWeekParam = c.req.query('fromWeek')
    const toWeekParam = c.req.query('toWeek')

    const materialId = Number(materialIdParam)
    const year = Number(yearParam)
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined

    const data = await getPlannerDispatchSlots({
      so,
      materialId,
      year,
      fromWeek,
      toWeek,
    })
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Capacity data for planner (Group/UAP/Process)
hrzRoutes.get('/planner-capacity', async (c) => {
  try {
    const yearParam = c.req.query('year')
    if (!yearParam) {
      return c.json({ error: 'Missing year' }, 400)
    }

    const fromWeekParam = c.req.query('fromWeek')
    const toWeekParam = c.req.query('toWeek')
    const process = c.req.query('process') || undefined
    const uap = c.req.query('uap') || undefined
    const group = c.req.query('group') || undefined

    const year = Number(yearParam)
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined

    const data = await getPlannerCapacity({
      year,
      fromWeek,
      toWeek,
      process,
      uap,
      group,
    })
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Update dispatch / DSPT untuk level 3 (per MaterialID + Process)
// Body mengikuti tipe PlannerDispatchUpdateBody
hrzRoutes.post('/planner-dispatch', async (c) => {
  try {
    const body = (await c.req.json()) as PlannerDispatchUpdateBody
    const result = await updatePlannerDispatch(body)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// scan a list of likely tables and return their columns (helpful for debugging)
hrzRoutes.get('/scan-columns', async (c) => {
  const candidates = [
    'StockTRX',
    'ProductionTRX',
    'MaterialMST',
    'SalesOrderMST',
    'SalesOrderDTL',
    'Stock_TRX',
    'IoTStockTRX',
    'Production_TRX',
    'StockTransaction',
  ]

  const result: Record<string, any> = {}
  for (const t of candidates) {
    try {
      const cols = await getTableColumns(t)
      result[t] = { found: true, columns: cols }
    } catch (err: any) {
      result[t] = { found: false, error: err.message }
    }
  }

  return c.json(result)
})
// // GET data table
// hrzRoutes.get('/hrz-capacity', async (c) => {
//   try {
//     const page = Number(c.req.query('page') || 1);
//     const uap = c.req.query('uap') || null;
//     const startWeek = c.req.query('startWeek') || null; // Ambil dari query param
//     const endWeek = c.req.query('endWeek') || null;     // Ambil dari query param

//     const result = await getHRZCapacityMch(uap, page, startWeek, endWeek);

//     return c.json({ success: true, ...result });
//   } catch (err: any) {
//     return c.json({ success: false, message: err.message }, 500);
//   }
// });
hrzRoutes.get('/hrz-capacity-all', async (c) => {
  try {
    const fromWeek = Number(c.req.query('fromWeek') ?? 1)
    const toWeek = Number(c.req.query('toWeek') ?? 52)
    const uap = c.req.query('uap') ?? 'BASIC'
    const year = c.req.query('year') ? Number(c.req.query('year')) : undefined
    const data = await getAllProcessCapacity(fromWeek, toWeek, uap, year) 

    return c.json({ success: true, data })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
  
})
// GET daftar tahun
hrzRoutes.get("/hrz-year-list", async (c) => {
  try {
    const list = await getYearList()
    return c.json({ success: true, data: list })
  } catch (err: any) {
    console.error(err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET daftar UAP untuk dropdown
hrzRoutes.get('/hrz-uap-list', async (c) => {
  try {
    const list = await getUAPList()
    return c.json({ success: true, data: list })
  } catch (err: any) {
    console.error(err)
    return c.json({ success: false, message: err.message }, 500)
  }
})
export default hrzRoutes
