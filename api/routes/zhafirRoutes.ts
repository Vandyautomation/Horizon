import { Hono } from 'hono';
import {
  getZhafirQueryTemplates,
  getZhafirSections,
  getZhafirStdActByParaId,
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

    if (!paraId) {
      return c.json({ error: 'paraId is required' }, 400);
    }

    const data = await getZhafirStdActByParaId(paraId, section);
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
    const values = ((body.values ?? body) as Record<string, unknown>) || {};

    if (!paraId) {
      return c.json({ error: 'paraId is required' }, 400);
    }

    const data = await upsertZhafirStd(paraId, values, section);
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

    if (!field) {
      return c.json({ error: 'field is required' }, 400);
    }

    const data = updateHardcodedActField(field, valueRaw as any);
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

    if (!field) {
      return c.json({ error: 'field is required' }, 400);
    }

    const data = updateHardcodedStdField(field, valueRaw as any);
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
    const data = updateHardcodedBulk({ std, act });
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

export default zhafirRoutes;
