import { Hono } from 'hono';
import { getHRZData, getHRZColumns, getTableColumns } from '../controllers/hrzController';

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
    const data = await getHRZData(customer);
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

