import { Hono } from 'hono';
import {
  getZhafirQueryTemplates,
  getZhafirSections,
  getZhafirStdActByParaId,
  getZhafirActualFromView,
  getZhafirActualFromViewByHour,
  getZhafirAvailableHours,
  getZhafirMaterialTypeFromRouting,
  checkZhafirParamsetExists,
  getZhafirMaterialContext,
  updateLatestTrxMaterialByMachine,
  updateRoutingMaterialTypeByMaterialId,
  insertZhafirActual,
  updateHardcodedActField,
  updateHardcodedBulk,
  updateHardcodedStdField,
  upsertZhafirStd,
} from '../controllers/zhafirController';

const zhafirRoutes = new Hono();

zhafirRoutes.get('/sections', async (c) => {
  try {
    const sections = getZhafirSections();
    return c.json({ data: sections });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

zhafirRoutes.get('/templates', async (c) => {
  try {
    const section = c.req.query('section');
    const templates = getZhafirQueryTemplates(section);
    return c.json({ section: section || 'all', data: templates });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/', async (c) => {
  try {
    const paraId = c.req.query('paraId');
    const section = c.req.query('section');
    const machineId = c.req.query('machine_id') || c.req.query('machineId') || undefined;

    if (!paraId) {
      return c.json({ error: 'paraId is required' }, 400);
    }
    if (!machineId) {
      return c.json({ error: 'machine_id (or machineId) is required' }, 400);
    }

    const data = await getZhafirStdActByParaId(paraId, section, machineId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/actual-view', async (c) => {
  try {
    const paraId = c.req.query('paraId') || undefined;
    const machineId = c.req.query('machine_id') || c.req.query('machineId') || undefined;
    const date = c.req.query('date') || undefined;
    const hourRaw = c.req.query('hour') || undefined;
    if (!machineId) {
      return c.json({ error: 'machine_id (or machineId) is required' }, 400);
    }
    if (date && hourRaw !== undefined) {
      const hour = Number(hourRaw);
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return c.json({ error: 'hour must be integer 0..23' }, 400);
      }
      const data = await getZhafirActualFromViewByHour(paraId, machineId, date, hour);
      return c.json(data);
    }
    const data = await getZhafirActualFromView(paraId, machineId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/actual-hours', async (c) => {
  try {
    const machineId = c.req.query('machine_id') || c.req.query('machineId') || undefined;
    const date = c.req.query('date') || undefined;
    if (!machineId) {
      return c.json({ error: 'machine_id (or machineId) is required' }, 400);
    }
    if (!date) {
      return c.json({ error: 'date is required (YYYY-MM-DD)' }, 400);
    }
    const data = await getZhafirAvailableHours(machineId, date);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/exists', async (c) => {
  try {
    const machineId = c.req.query('machine_id') || c.req.query('machineId');
    if (!machineId) {
      return c.json({ error: 'machine_id (or machineId) is required' }, 400);
    }
    const data = await checkZhafirParamsetExists(machineId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/material-context', async (c) => {
  try {
    const po = c.req.query('po');
    if (!po) {
      return c.json({ error: 'po is required' }, 400);
    }
    const data = await getZhafirMaterialContext(po);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});
zhafirRoutes.get('/material-type-routing', async (c) => {
  try {
    const materialId = c.req.query('material_id') || c.req.query('materialId');
    if (!materialId) return c.json({ error: 'material_id is required' }, 400);
    const data = await getZhafirMaterialTypeFromRouting(materialId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.post('/material-type-routing', async (c) => {
  try {
    const body = await c.req.json();
    const machineId = (body.machine_id || body.machineId) as string | undefined;
    const materialId = (body.material_id || body.materialId) as string | undefined;
    const materialType = (body.materialType || body.type || body.material) as string | undefined;

    if (!machineId) return c.json({ error: 'machine_id is required' }, 400);
    if (!materialId) return c.json({ error: 'material_id is required' }, 400);
    if (!materialType) return c.json({ error: 'materialType is required' }, 400);

    const routingUpdate = await updateRoutingMaterialTypeByMaterialId(materialId, materialType);
    const trxUpdate = await updateLatestTrxMaterialByMachine(machineId, materialType);
    return c.json({ routingUpdate, trxUpdate });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.post('/material-type', async (c) => {
  try {
    const body = await c.req.json();
    const machineId = (body.machine_id || body.machineId) as string | undefined;
    const materialType = (body.materialType || body.type || body.material) as string | undefined;

    if (!machineId) {
      return c.json({ error: 'machine_id is required' }, 400);
    }
    if (!materialType) {
      return c.json({ error: 'materialType is required' }, 400);
    }

    const data = await updateLatestTrxMaterialByMachine(machineId, materialType);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.post('/std', async (c) => {
  try {
    const body = await c.req.json();
    const paraId = body.paraId as string | undefined;
    const section = body.section as string | undefined;
    const machineId = (body.machine_id || body.machineId) as string | undefined;
    const material = body.material as string | undefined;
    const values = ((body.values ?? body) as Record<string, unknown>) || {};

    if (!paraId) {
      return c.json({ error: 'paraId is required' }, 400);
    }

    const data = await upsertZhafirStd(paraId, values, section, machineId, material);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.post('/actual', async (c) => {
  try {
    const body = await c.req.json();
    const paraId = body.paraId as string | undefined;
    const section = body.section as string | undefined;
    const values = ((body.values ?? body) as Record<string, unknown>) || {};

    if (!paraId) {
      return c.json({ error: 'paraId is required' }, 400);
    }

    const data = await insertZhafirActual(paraId, values, section);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.post('/manual-actual', async (c) => {
  try {
    const body = await c.req.json();
    const field = body.field as string | undefined;
    const valueRaw = body.value as number | string | undefined;
    const machineId = (body.machine_id || body.machineId) as string | undefined;

    if (!field) {
      return c.json({ error: 'field is required' }, 400);
    }

    const data = await updateHardcodedActField(field, valueRaw as any, machineId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.post('/manual-std', async (c) => {
  try {
    const body = await c.req.json();
    const field = body.field as string | undefined;
    const valueRaw = body.value as number | string | undefined;
    const machineId = (body.machine_id || body.machineId) as string | undefined;
    const material = body.material as string | undefined;

    if (!field) {
      return c.json({ error: 'field is required' }, 400);
    }

    const data = await updateHardcodedStdField(field, valueRaw as any, machineId, material);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.post('/manual-bulk', async (c) => {
  try {
    const body = await c.req.json();
    const std = (body.std || {}) as Record<string, number | string>;
    const act = (body.act || {}) as Record<string, number | string>;
    const machineId = (body.machine_id || body.machineId) as string | undefined;
    const material = body.material as string | undefined;
    const data = await updateHardcodedBulk({ std, act }, machineId, material);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

export default zhafirRoutes;