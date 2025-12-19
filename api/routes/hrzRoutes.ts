import { Hono } from 'hono';
import { getHRZData, getHRZColumns, getTableColumns } from '../controllers/hrzController';
import {
  getPlannerData,
  getPlannerProcessDetail,
  updatePlannerDispatch,
  PlannerDispatchUpdateBody,
} from '../controllers/hrzPlannerController';

const hrzRoutes = new Hono();

hrzRoutes.get('/test-mssql', async (c) => {
  try {
    // perform a simple query to verify DB connectivity
    const data = await getHRZData();
    return c.json({ status: 'OKE ✅ Koneksi MSSQL berhasil', sample: data.slice(0, 1) });
  } catch (err: any) {
    return c.json({ status: 'GAGAL ❌', message: err.message }, 500);
  }
});

hrzRoutes.get('/data', async (c) => {
  try {
    const customer = c.req.query('customer') || undefined;
    const uap = c.req.query('uap') || undefined;
    const data = await getHRZData({ customer, uap });
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

    const year = yearParam ? Number(yearParam) : undefined;
    const fromWeek = fromWeekParam ? Number(fromWeekParam) : undefined;
    const toWeek = toWeekParam ? Number(toWeekParam) : undefined;

    const data = await getPlannerData({ so, itemNo, year, fromWeek, toWeek });
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
