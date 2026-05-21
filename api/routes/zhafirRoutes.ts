import { Hono, type Context } from 'hono';
import {
  getZhafirSections,
  getZhafirStdActByMachine,
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
const ZHAFIR_INDICATOR_ONLY_MODE = true;
const zhafirTemporaryEnabledMachines = new Set<string>();
const ZHAFIR_SNAPSHOT_FIELDS = [
  'InjectScrewPosition',
  'VPPositionText',
  'InjPeakPressure',
  'Thickness',
  'VPTimeText',
] as const;

function indicatorOnlyDisabled(c: Context) {
  return c.json(
    { error: 'Temporarily disabled: indicator-only mode is active.' },
    404,
  );
}

function isParamModeRequest(c: Context) {
  const mode = (c.req.query('mode') || '').trim().toLowerCase();
  return mode === 'param';
}

function toFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function classifyStatus(
  act: number | null,
  min: number | null,
  max: number | null,
  std: number | null,
) {
  if (act === null) return 'unknown';
  if (min !== null && act < min) return 'too_low';
  if (max !== null && act > max) return 'too_high';
  if (min === null && max === null && std !== null && act > std) return 'too_high';
  return 'in_range';
}

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
        AND MchProcess = 'INJECTION'
    `,
    { MachineID: resolvedMachineId },
  );

  const row = rows?.[0] as { locationName?: string | null; machineNumber?: string | number | null } | undefined;
  if (!row) return false;
  return true;
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
          'Machine is not allowed. Ensure machine_id is active and process is INJECTION, or enable temporary access.',
      },
      403,
    );
  }
  return null;
}

zhafirRoutes.get('/temporary-access-status', async (c) => {
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
  try {
    const sections = getZhafirSections();
    return c.json({ data: sections });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

zhafirRoutes.get('/templates', async (c) => {
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
  return c.json(
    { error: 'Temporarily disabled: legacy ParaSetMST/ParaSetTRX templates are not used.' },
    404,
  );
});

zhafirRoutes.get('/', async (c) => {
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
  try {
    const section = c.req.query('section');
    const machineId = c.req.query('machine_id') || c.req.query('machineId') || undefined;

    const denied = await ensureTemporaryMachineAccess(c, machineId);
    if (denied) return denied;
    const resolvedMachineId = String(machineId).trim();

    const data = await getZhafirStdActByMachine(section, resolvedMachineId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/actual-view', async (c) => {
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
  try {
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
      const data = await getZhafirActualFromViewByHour(resolvedMachineId, date, hour);
      return c.json(data);
    }
    const data = await getZhafirActualFromView(resolvedMachineId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/snapshot', async (c) => {
  try {
    const compact = (c.req.query('compact') || '').trim() === '1';
    const section = c.req.query('section') || undefined;
    const machineId = c.req.query('machine_id') || c.req.query('machineId') || undefined;
    const date = c.req.query('date') || undefined;
    const hourRaw = c.req.query('hour') || undefined;
    const resolvedMachineId = String(machineId || '').trim();

    if (!resolvedMachineId) {
      return c.json({ error: 'machine_id (or machineId) is required' }, 400);
    }

    const enabled = await isAllowedTemporaryMachine(resolvedMachineId);
    const access = {
      machineId: resolvedMachineId,
      enabled,
      runtimeEnabled: zhafirTemporaryEnabledMachines.has(resolvedMachineId),
      note: 'runtimeEnabled resets when backend restarts',
    };

    if (!enabled) {
      return c.json({
        access,
        stdAct: null,
        actualView: null,
      });
    }

    const stdAct = await getZhafirStdActByMachine(section, resolvedMachineId);
    let actualView;
    if (date && hourRaw !== undefined) {
      const hour = Number(hourRaw);
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return c.json({ error: 'hour must be integer 0..23' }, 400);
      }
      actualView = await getZhafirActualFromViewByHour(resolvedMachineId, date, hour);
    } else {
      actualView = await getZhafirActualFromView(resolvedMachineId);
    }

    const response = {
      access,
      stdAct,
      actualView,
    } as Record<string, unknown>;

    if (compact) {
      const indicators = Object.fromEntries(
        ZHAFIR_SNAPSHOT_FIELDS.map((field) => {
          const pair = (stdAct as any)?.values?.[field];
          const range = (stdAct as any)?.ranges?.[field];
          const mergedAct = (actualView as any)?.values?.[field] ?? pair?.act;

          const std = toFiniteNumber(pair?.std);
          const act = toFiniteNumber(mergedAct);
          const min = toFiniteNumber(range?.min);
          const max = toFiniteNumber(range?.max);
          const status = classifyStatus(act, min, max, std);

          return [
            field,
            {
              std,
              act,
              min,
              max,
              status,
            },
          ];
        })
      );
      response.indicators = indicators;
    }

    return c.json(response);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/actual-hours', async (c) => {
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
    const compact = (c.req.query('compact') || '').trim() === '1';
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
      endAt,
      date,
      hoursBack,
    });
    if (!compact) return c.json(data);

    const compactHours = Array.isArray((data as any)?.hours)
      ? (data as any).hours.map((hour: any) => {
          const values = hour?.values || null;
          const compactValues = values
            ? Object.fromEntries(
                ZHAFIR_SNAPSHOT_FIELDS.map((field) => [
                  field,
                  toFiniteNumber(values?.[field]),
                ])
              )
            : null;
          return {
            hourStart: hour?.hourStart ?? null,
            hourLabel: hour?.hourLabel ?? null,
            actualDate: hour?.actualDate ?? null,
            hasData: Boolean(hour?.hasData),
            values: compactValues,
          };
        })
      : [];

    const compactRanges = Object.fromEntries(
      ZHAFIR_SNAPSHOT_FIELDS.map((field) => {
        const range = (data as any)?.ranges?.[field] || {};
        return [
          field,
          {
            min: toFiniteNumber(range?.min),
            max: toFiniteNumber(range?.max),
          },
        ];
      })
    );

    return c.json({
      machineId: (data as any)?.machineId ?? resolvedMachineId,
      endAt: (data as any)?.endAt ?? null,
      hoursBack: (data as any)?.hoursBack ?? hoursBack,
      ranges: compactRanges,
      hours: compactHours,
    });
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
  try {
    const uom = c.req.query('uom') || 'HAITIAN';
    const data = await getZhafirSummaryRangeConfig(uom);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

zhafirRoutes.get('/section-styles', async (c) => {
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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

// Temporarily disabled (view-only mode):
// zhafirRoutes.post('/section-styles', ...)
// zhafirRoutes.post('/section-styles/', ...)
zhafirRoutes.get('/material-type-routing', async (c) => {
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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

// Temporarily disabled (view-only mode):
// zhafirRoutes.post('/std', ...)
// zhafirRoutes.post('/actual', ...)
// zhafirRoutes.post('/manual-actual', ...)
// zhafirRoutes.post('/manual-std', ...)
// zhafirRoutes.post('/manual-bulk', ...)

zhafirRoutes.get('/Pamzhafir', async (c) => {
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
  try {
    const data = await getSettingPamzhafir()
    return c.json(data)
  } catch (error) {
    console.error('Error fetching Pamzhafir settings:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})
zhafirRoutes.post('/Pamzhafir', async (c) => {
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
  if (ZHAFIR_INDICATOR_ONLY_MODE && !isParamModeRequest(c)) return indicatorOnlyDisabled(c);
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
