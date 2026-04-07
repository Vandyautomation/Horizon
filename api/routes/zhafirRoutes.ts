import { Hono, type Context } from 'hono';
import {
  getZhafirQueryTemplates,
  getZhafirSections,
  getZhafirStdActByParaId,
  getZhafirActualFromView,
  getZhafirActualFromViewByHour,
  getZhafirAvailableHours,
  getZhafirActiveMaterialByMachine,
  getZhafirActualByHourWindow,
  getZhafirSummaryRangeConfig,
  getZhafirSectionStyles,
  getZhafirMaterialTypeFromRouting,
  checkZhafirParamsetExists,
  getZhafirMaterialContext,
  getZhafirMaterialContextByMaterialId,
  updateLatestTrxMaterialByMachine,
  updateRoutingMaterialTypeByMaterialId,
  insertZhafirActual,
  updateHardcodedActField,
  updateHardcodedBulk,
  updateHardcodedStdField,
  upsertZhafirStd,
  upsertZhafirSectionStyle,
  getSettingPamzhafir,
  createSettingPamzhafir,
  deleteSettingPamzhafir,
  getActiveMachines,
  getcoois,
  updateSettingPamzhafir,
} from '../controllers/zhafirController';
import { queryDatabase } from '../utils/queryDatabase';

const zhafirRoutes = new Hono();
const ZHAFIR_TEMP_PASSWORD = 'P168421TK1';
const zhafirTemporaryEnabledMachines = new Set<string>();

async function isAllowedTemporaryMachine(machineId: string) {
  const resolvedMachineId = (machineId || '').trim();
  if (!resolvedMachineId) return false;
  if (zhafirTemporaryEnabledMachines.has(resolvedMachineId)) return true;

  const rows = await queryDatabase(
    `
      SELECT TOP 1 MchLoc AS locationName, MchNumber AS machineNumber
      FROM IoT.dbo.MachineMST
      WHERE MchID = @MachineID
        AND Active = 1
    `,
    { MachineID: resolvedMachineId },
  );

  const row = rows?.[0] as { locationName?: string | null; machineNumber?: string | number | null } | undefined;
  if (!row) return false;

  const location = (row.locationName || '').trim().toLowerCase();
  const machineNumber = String(row.machineNumber ?? '').trim();
  return location === 'inj bld g' && machineNumber === '2';
}

async function ensureTemporaryMachineAccess(c: Context, machineId?: string) {
  const resolvedMachineId = (machineId || '').trim();
  if (!resolvedMachineId) {
    return c.json({ error: 'machine_id (or machineId) is required' }, 400);
  }
  const allowed = await isAllowedTemporaryMachine(resolvedMachineId);
  if (!allowed) {
    return c.json(
      {
        error:
          'Temporary restriction: Zhafir endpoints are enabled only for INJ Bld G machine number 2.',
      },
      403,
    );
  }
  return null;
}

zhafirRoutes.get('/temporary-access-status', async (c) => {
  try {
    const machineId = c.req.query('machine_id') || c.req.query('machineId');
    if (!machineId) {
      return c.json({ error: 'machine_id (or machineId) is required' }, 400);
    }
    const enabled = await isAllowedTemporaryMachine(machineId);
    return c.json({
      machineId,
      enabled,
      runtimeEnabled: zhafirTemporaryEnabledMachines.has(String(machineId).trim()),
      note: 'runtimeEnabled resets when backend restarts',
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.post('/temporary-access', async (c) => {
  try {
    const body = await c.req.json();
    const machineId = (body.machine_id || body.machineId) as string | undefined;
    const password = (body.password || '') as string;
    const enabled = Boolean(body.enabled);

    if (!machineId) {
      return c.json({ error: 'machine_id is required' }, 400);
    }
    if (password !== ZHAFIR_TEMP_PASSWORD) {
      return c.json({ error: 'Invalid password' }, 401);
    }

    const resolvedMachineId = machineId.trim();
    if (!resolvedMachineId) {
      return c.json({ error: 'machine_id is required' }, 400);
    }

    if (enabled) {
      zhafirTemporaryEnabledMachines.add(resolvedMachineId);
    } else {
      zhafirTemporaryEnabledMachines.delete(resolvedMachineId);
    }

    return c.json({
      machineId: resolvedMachineId,
      enabled: await isAllowedTemporaryMachine(resolvedMachineId),
      runtimeEnabled: zhafirTemporaryEnabledMachines.has(resolvedMachineId),
      note: 'runtimeEnabled resets when backend restarts',
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

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
    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();

    const data = await getZhafirStdActByParaId(paraId, section, resolvedMachineId);
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
    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();
    if (date && hourRaw !== undefined) {
      const hour = Number(hourRaw);
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return c.json({ error: 'hour must be integer 0..23' }, 400);
      }
      const data = await getZhafirActualFromViewByHour(paraId, resolvedMachineId, date, hour);
      return c.json(data);
    }
    const data = await getZhafirActualFromView(paraId, resolvedMachineId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/actual-hours', async (c) => {
  try {
    const machineId = c.req.query('machine_id') || c.req.query('machineId') || undefined;
    const date = c.req.query('date') || undefined;
    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();
    if (!date) {
      return c.json({ error: 'date is required (YYYY-MM-DD)' }, 400);
    }
    const data = await getZhafirAvailableHours(resolvedMachineId, date);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/material-active', async (c) => {
  try {
    const machineId = c.req.query('machine_id') || c.req.query('machineId') || undefined;
    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();
    const data = await getZhafirActiveMaterialByMachine(resolvedMachineId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/actual-view-window', async (c) => {
  try {
    const paraId = c.req.query('paraId') || undefined;
    const machineId = c.req.query('machine_id') || c.req.query('machineId') || undefined;
    const endAt = c.req.query('endAt') || undefined;
    const date = c.req.query('date') || undefined;
    const hoursBackRaw = c.req.query('hoursBack') || undefined;

    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;

    const resolvedMachineId = String(machineId).trim();
    const hoursBack = hoursBackRaw ? Number(hoursBackRaw) : 24;
    if (!Number.isInteger(hoursBack) || hoursBack < 1 || hoursBack > 720) {
      return c.json({ error: 'hoursBack must be integer 1..720' }, 400);
    }
    if (endAt) {
      const parsedEndAt = new Date(endAt);
      if (Number.isNaN(parsedEndAt.getTime())) {
        return c.json({ error: 'endAt must be valid datetime' }, 400);
      }
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json({ error: 'date must be in YYYY-MM-DD format' }, 400);
    }

    const data = await getZhafirActualByHourWindow(resolvedMachineId, {
      paraId,
      endAt,
      date,
      hoursBack,
    });
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/exists', async (c) => {
  try {
    const machineId = c.req.query('machine_id') || c.req.query('machineId');
    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const data = await checkZhafirParamsetExists(String(machineId).trim());
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

zhafirRoutes.get('/material-context-by-material-id', async (c) => {
  try {
    const materialId = c.req.query('material_id') || c.req.query('materialId');
    if (!materialId) {
      return c.json({ error: 'material_id is required' }, 400);
    }
    const data = await getZhafirMaterialContextByMaterialId(materialId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/summary-range-config', async (c) => {
  try {
    const uom = c.req.query('uom') || 'HAITIAN';
    const data = await getZhafirSummaryRangeConfig(uom);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/section-styles', async (c) => {
  try {
    const machineId = c.req.query('machine_id') || c.req.query('machineId');
    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const data = await getZhafirSectionStyles(String(machineId).trim());
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});
zhafirRoutes.get('/section-styles/', async (c) => {
  try {
    const machineId = c.req.query('machine_id') || c.req.query('machineId');
    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const data = await getZhafirSectionStyles(String(machineId).trim());
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.post('/section-styles', async (c) => {
  try {
    const body = await c.req.json();
    const machineId = (body.machine_id || body.machineId) as string | undefined;
    const sectionKey = (body.sectionKey || body.section_key) as string | undefined;
    const headerBgColor = body.headerBgColor as string | undefined;
    const actBgColor = body.actBgColor as string | undefined;

    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;

    const data = await upsertZhafirSectionStyle(
      String(machineId).trim(),
      sectionKey || '',
      headerBgColor || '',
      actBgColor || '',
    );
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});
zhafirRoutes.post('/section-styles/', async (c) => {
  try {
    const body = await c.req.json();
    const machineId = (body.machine_id || body.machineId) as string | undefined;
    const sectionKey = (body.sectionKey || body.section_key) as string | undefined;
    const headerBgColor = body.headerBgColor as string | undefined;
    const actBgColor = body.actBgColor as string | undefined;

    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;

    const data = await upsertZhafirSectionStyle(
      String(machineId).trim(),
      sectionKey || '',
      headerBgColor || '',
      actBgColor || '',
    );
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

    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();
    if (!materialId) return c.json({ error: 'material_id is required' }, 400);
    if (!materialType) return c.json({ error: 'materialType is required' }, 400);

    const routingUpdate = await updateRoutingMaterialTypeByMaterialId(materialId, materialType);
    const trxUpdate = await updateLatestTrxMaterialByMachine(resolvedMachineId, materialType);
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

    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    if (!materialType) {
      return c.json({ error: 'materialType is required' }, 400);
    }

    const data = await updateLatestTrxMaterialByMachine(String(machineId).trim(), materialType);
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
    const materialId = (body.material_id || body.materialId) as string | undefined;
    const materialName = (body.material_name || body.materialName) as string | undefined;
    const values = ((body.values ?? body) as Record<string, unknown>) || {};

    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();

    if (!paraId) {
      return c.json({ error: 'paraId is required' }, 400);
    }

    const data = await upsertZhafirStd(
      paraId,
      values,
      section,
      resolvedMachineId,
      material,
      materialId,
      materialName,
    );
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

    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();

    if (!field) {
      return c.json({ error: 'field is required' }, 400);
    }

    const data = await updateHardcodedActField(field, valueRaw as any, resolvedMachineId);
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
    const materialId = (body.material_id || body.materialId) as string | undefined;
    const materialName = (body.material_name || body.materialName) as string | undefined;

    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();

    if (!field) {
      return c.json({ error: 'field is required' }, 400);
    }

    const data = await updateHardcodedStdField(
      field,
      valueRaw as any,
      resolvedMachineId,
      material,
      materialId,
      materialName,
    );
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
    const materialId = (body.material_id || body.materialId) as string | undefined;
    const materialName = (body.material_name || body.materialName) as string | undefined;
    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();

    const data = await updateHardcodedBulk(
      { std, act },
      resolvedMachineId,
      material,
      materialId,
      materialName,
    );
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});
zhafirRoutes.get('/Pamzhafir', async (c) => {
  try {
    const data = await getSettingPamzhafir()
    return c.json(data)
  } catch (error) {
    console.error('Error fetching Pamzhafir settings:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})
zhafirRoutes.post('/Pamzhafir', async (c) => {
  try {
    const body = await c.req.json()

    await createSettingPamzhafir(body)

    return c.json({ success: true })
  } catch (error) {
    console.error('Error creating Pamzhafir:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})
zhafirRoutes.delete('/Pamzhafir/:id', async (c) => {
  try {
    const id = c.req.param('id') // ambil id dari url
    await deleteSettingPamzhafir(Number(id))
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting Pamzhafir:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})
zhafirRoutes.get('/machines', async (c) => {
  try {
    const keyword = c.req.query('q') || '';
    const machines = await getActiveMachines(keyword);
    return c.json(machines);
  } catch (error) {
    console.error('Error fetching machines:', error);
    return c.json({ error: (error as Error).message }, 500);
  }
});
zhafirRoutes.get('/coois', async (c) => {
  try {
    const keyword = c.req.query('q') || '';
    const routing = await getcoois(keyword);
    return c.json(routing);
  } catch (error) {
    console.error('Error fetching coois:', error);
    return c.json({ error: (error as Error).message }, 500);
  }
});
zhafirRoutes.put('/Pamzhafir/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    await updateSettingPamzhafir(id, body);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating Pamzhafir:', error);
    return c.json({ error: (error as Error).message }, 500);
  }
});
export default zhafirRoutes;