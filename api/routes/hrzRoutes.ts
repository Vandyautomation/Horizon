import { Hono } from 'hono';
import { getHRZData, getHRZColumns, getTableColumns } from '../controllers/hrzController';
import {
  getPlannerData,
  getPlannerProcessDetail,
  getPlannerDispatchSlots,
  getPlannerCapacity,
  updatePlannerDispatch,
  PlannerDispatchUpdateBody,
} from '../controllers/hrzPlannerController';

const hrzRoutes = new Hono();

hrzRoutes.get('/test-mssql', async (c) => {
  try {
    // perform a simple query to verify DB connectivity
    const data = await getHRZData();
    return c.json({ status: 'OKE ✅ Koneksi MSSQL berhasil', sample: data.data?.slice(0, 1) ?? [] });
  } catch (err: any) {
    return c.json({ status: 'GAGAL ❌', message: err.message }, 500);
  }
});

hrzRoutes.get('/data', async (c) => {
  try {
    const customer = c.req.query('customer') || undefined;
    const uap = c.req.query('uap') || undefined;
    const itemPrefix = c.req.query('itemPrefix') || undefined;
    const pageParam = c.req.query('page');
    const limitParam = c.req.query('limit');
    const yearParam = c.req.query('year');
    const monthParam = c.req.query('month');
    const dayParam = c.req.query('day');
    const page = pageParam ? Number(pageParam) : undefined;
    const limit = limitParam ? Number(limitParam) : undefined;
    const year = yearParam ? Number(yearParam) : undefined;
    const month = monthParam ? Number(monthParam) : undefined;
    const day = dayParam ? Number(dayParam) : undefined;
    const filters: {
      customer?: string;
      uap?: string;
      itemPrefix?: string;
      page?: number;
      limit?: number;
      year?: number;
      month?: number;
      day?: number;
    } = {
      customer,
      uap,
      itemPrefix,
      page,
      limit,
      year,
      month,
      day,
    };
    const data = await getHRZData(filters);
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// list columns for SalesOrderMST by default or for a provided table via query param
hrzRoutes.get('/columns', async (c) => {
  try {
    const table = c.req.query('table');
    if (table) {
      const cols = await getTableColumns(table);
      return c.json({ table, columns: cols });
    }
    const cols = await getHRZColumns();
    return c.json({ table: 'SalesOrderMST', columns: cols });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Planner data for Sales Order detail
hrzRoutes.get('/planner', async (c) => {
  try {
    const so = c.req.query('so') || undefined;
    const itemNo = c.req.query('itemNo') || undefined;
    const yearParam = c.req.query('year');
    const fromWeekParam = c.req.query('fromWeek');
    const toWeekParam = c.req.query('toWeek');
    const mode = c.req.query('mode') || undefined;

    const year = yearParam ? Number(yearParam) : undefined;
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined;
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined;

    const data = await getPlannerData({ so, itemNo, year, fromWeek, toWeek, mode });
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Detail proses (level 3) untuk satu MaterialID
hrzRoutes.get('/planner-process', async (c) => {
  try {
    const so = c.req.query('so');
    const materialIdParam = c.req.query('materialId');
    if (!so || !materialIdParam) {
      return c.json({ error: 'Missing so or materialId' }, 400);
    }

    const yearParam = c.req.query('year');
    const fromWeekParam = c.req.query('fromWeek');
    const toWeekParam = c.req.query('toWeek');

    const materialId = Number(materialIdParam);
    const year = yearParam ? Number(yearParam) : undefined;
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined;
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined;

    const data = await getPlannerProcessDetail({ so, materialId, year, fromWeek, toWeek });
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Ambil slot dispatch yang sudah disimpan di Hrz_DispatchPlan
hrzRoutes.get('/planner-dispatch-slots', async (c) => {
  try {
    const so = c.req.query('so');
    const materialIdParam = c.req.query('materialId');
    const yearParam = c.req.query('year');
    if (!so || !materialIdParam || !yearParam) {
      return c.json({ error: 'Missing so, materialId, or year' }, 400);
    }

    const fromWeekParam = c.req.query('fromWeek');
    const toWeekParam = c.req.query('toWeek');

    const materialId = Number(materialIdParam);
    const year = Number(yearParam);
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined;
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined;

    const data = await getPlannerDispatchSlots({ so, materialId, year, fromWeek, toWeek });
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Capacity data for planner (Group/UAP/Process)
hrzRoutes.get('/planner-capacity', async (c) => {
  try {
    const yearParam = c.req.query('year');
    if (!yearParam) {
      return c.json({ error: 'Missing year' }, 400);
    }

    const fromWeekParam = c.req.query('fromWeek');
    const toWeekParam = c.req.query('toWeek');
    const process = c.req.query('process') || undefined;
    const uap = c.req.query('uap') || undefined;
    const group = c.req.query('group') || undefined;

    const year = Number(yearParam);
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined;
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined;

    const data = await getPlannerCapacity({ year, fromWeek, toWeek, process, uap, group });
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Update dispatch / DSPT untuk level 3 (per MaterialID + Process)
// Body mengikuti tipe PlannerDispatchUpdateBody
hrzRoutes.post('/planner-dispatch', async (c) => {
  try {
    const body = (await c.req.json()) as PlannerDispatchUpdateBody;
    const result = await updatePlannerDispatch(body);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

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
  ];

  const result: Record<string, any> = {};
  for (const t of candidates) {
    try {
      const cols = await getTableColumns(t);
      result[t] = { found: true, columns: cols };
    } catch (err: any) {
      result[t] = { found: false, error: err.message };
    }
  }

  return c.json(result);
});

export default hrzRoutes;


