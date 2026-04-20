import { Hono } from 'hono';
import { addMachine, addMachineState, getChangeState, getEnergyAdditionalData, getEnergyMachineDaily, getEnergyStatusLightMachineDaily, getHourlyMachine, getMachine, getNooeMachine, getOeeMachine, getSpindle, getTaskMachine, getTrendHourly, getTrendHourlyDetail, getTrendStream, getTrendWeekly, makeMachineGrey, makeMachineTAO, removeOverride, removeOverrideTAO, updateMachine, updateMachineStateColorById } from '../controllers/machineController';
import { getTask } from '../controllers/scaleTaskController';
import { cache } from 'hono/cache'
import * as trendData from '../controllers/trend.json';

const machineRoutes = new Hono();
const noeeCacheMiddleware =
  typeof (globalThis as any).caches !== 'undefined'
    ? cache({
        cacheName: 'machine-noee-cache',
        cacheControl: 'max-age=300',
        vary: ['machine_id', 'date', 'shift', 'ems'],
      })
    : async (_c: any, next: any) => next();

machineRoutes.get('/', async (c) => {
  try {
    const type = c.req.query('type') || null;
    const data = await getMachine(type);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.put('/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId');
    const { machineDescription, machineTonage, machineLocation, machineProcess, machineUap, machineEquipment, machinePosition, machineRotation, machineEnergyBudget } = await c.req.json();
    const data = await updateMachine(machine_id, machineDescription, machineTonage, machineLocation, machineProcess, machineUap, machineEquipment, machinePosition, machineRotation, machineEnergyBudget);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});



machineRoutes.get('/state/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const date_from = c.req.query('date_from') || null;
    const date_to = c.req.query('date_to') || null;
    const data = await getChangeState(machine_id, date, shift, date_from, date_to);
    return c.json(data);
    // return c.json(200);

  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/trend', async (c) => {
  try {
    const date_from = c.req.query('date_from') || '2025-06-01';
    const date_to = c.req.query('date_to') || '2025-06-30';

    // Return a streamed response
    // return await getTrendStream(c, date_from, date_to);
    return c.json((trendData as any).default);

  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/trend/weekly', async (c) => {
  try {
    const date_from = c.req.query('date_from') || '2025-06-01';
    const date_to = c.req.query('date_to') || '2025-06-30';
    const uap = c.req.query('uap') || 'ALL';

    // Return a streamed response
    // return await getTrendStream(c, date_from, date_to);
    const result = await getTrendWeekly(date_from, date_to, uap);
    return c.json(result);

  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/trend/hourly', async (c) => {
  try {
    const date_from = c.req.query('date_from') || '2025-06-01';
    const date_to = c.req.query('date_to') || '2025-06-30';
    const uap = c.req.query('uap') || 'ALL';
    const accurate_duration = (c.req.query('accurate_duration') || '0') === '1';
    const excluded_mchids = (c.req.query('excluded_mchids') || '')
      .split(',')
      .map((v) => String(v || '').trim())
      .filter(Boolean);
    const result = await getTrendHourly(date_from, date_to, uap, accurate_duration, excluded_mchids);
    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/trend/hourly/detail', async (c) => {
  try {
    const hour_start = c.req.query('hour_start') || null;
    const date_from = c.req.query('date_from') || null;
    const date_to = c.req.query('date_to') || null;
    const uap = c.req.query('uap') || 'ALL';
    const status_light = c.req.query('status_light') || 'ALL';
    const excluded_mchids = (c.req.query('excluded_mchids') || '')
      .split(',')
      .map((v) => String(v || '').trim())
      .filter(Boolean);
    if (!hour_start && (!date_from || !date_to)) {
      return c.json({ error: 'hour_start or date_from/date_to is required' }, 400);
    }
    const result = await getTrendHourlyDetail(hour_start, uap, date_from, date_to, status_light, excluded_mchids);
    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// TrendK dimatikan sementara.
// machineRoutes.get('/trendk/hourly-summary', async (c) => {
//   try {
//     const date_from = c.req.query('date_from') || '2025-06-01';
//     const date_to = c.req.query('date_to') || '2025-06-30';
//     const uap = c.req.query('uap') || 'ALL';
//     const excluded_mchids = (c.req.query('excluded_mchids') || '')
//       .split(',')
//       .map((v) => String(v || '').trim())
//       .filter(Boolean);
//     const result = await getTrendkHourlySummary(date_from, date_to, uap, excluded_mchids);
//     return c.json(result);
//   } catch (error) {
//     return c.json({ error: (error as Error).message }, 500);
//   }
// });

// machineRoutes.get('/trendk/hourly-detail', async (c) => {
//   try {
//     const date_from = c.req.query('date_from') || null;
//     const date_to = c.req.query('date_to') || null;
//     if (!date_from || !date_to) {
//       return c.json({ error: 'date_from and date_to are required' }, 400);
//     }
//     const uap = c.req.query('uap') || 'ALL';
//     const status_light = c.req.query('status_light') || 'ALL';
//     const page = Number(c.req.query('page') || '1');
//     const page_size = Number(c.req.query('page_size') || '100');
//     const excluded_mchids = (c.req.query('excluded_mchids') || '')
//       .split(',')
//       .map((v) => String(v || '').trim())
//       .filter(Boolean);
//     const result = await getTrendkHourlyDetail(date_from, date_to, uap, status_light, excluded_mchids, page, page_size);
//     return c.json(result);
//   } catch (error) {
//     return c.json({ error: (error as Error).message }, 500);
//   }
// });

// machineRoutes.get('/trendk/unique-latest-summary', async (c) => {
//   try {
//     const date_from = c.req.query('date_from') || null;
//     const date_to = c.req.query('date_to') || null;
//     if (!date_from || !date_to) {
//       return c.json({ error: 'date_from and date_to are required' }, 400);
//     }
//     const uap = c.req.query('uap') || 'ALL';
//     const excluded_mchids = (c.req.query('excluded_mchids') || '')
//       .split(',')
//       .map((v) => String(v || '').trim())
//       .filter(Boolean);
//     const result = await getTrendkUniqueLatestSummary(date_from, date_to, uap, excluded_mchids);
//     return c.json(result);
//   } catch (error) {
//     return c.json({ error: (error as Error).message }, 500);
//   }
// });

// machineRoutes.get('/trendk/unique-latest-detail', async (c) => {
//   try {
//     const date_from = c.req.query('date_from') || null;
//     const date_to = c.req.query('date_to') || null;
//     if (!date_from || !date_to) {
//       return c.json({ error: 'date_from and date_to are required' }, 400);
//     }
//     const uap = c.req.query('uap') || 'ALL';
//     const status_light = c.req.query('status_light') || 'ALL';
//     const page = Number(c.req.query('page') || '1');
//     const page_size = Number(c.req.query('page_size') || '100');
//     const excluded_mchids = (c.req.query('excluded_mchids') || '')
//       .split(',')
//       .map((v) => String(v || '').trim())
//       .filter(Boolean);
//     const result = await getTrendkUniqueLatestDetail(date_from, date_to, uap, status_light, excluded_mchids, page, page_size);
//     return c.json(result);
//   } catch (error) {
//     return c.json({ error: (error as Error).message }, 500);
//   }
// });


machineRoutes.get('/spindle/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const data = await getSpindle(machine_id, date, shift);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/hourly/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const type = c.req.query('type') || null;
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const data = await getHourlyMachine(machine_id, date, shift, type);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/oee/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const data = await getOeeMachine(machine_id, date, shift);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/noee/:machineId', noeeCacheMiddleware, async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const ems = c.req.query('ems') === 'true' ? true : false;
    const data = await getNooeMachine(machine_id, date, shift, ems);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// machineRoutes.get('/noee_new/:machineId', async (c) => {
//   try {
//     const machine_id = c.req.param('machineId');
//     const date = c.req.query('date') || null;
//     const shift = c.req.query('shift') || null;
//     const ems = c.req.query('ems') === 'true' ? true : false;
//     const data = await getNooeMachineNew(machine_id, date, shift);
//     return c.json(data);
//   } catch (error) {
//     return c.json({ error: (error as Error).message }, 500);
//   }
// });

machineRoutes.get('/tasks/:machineName', async (c) => {
  try {
    const machineName = c.req.param('machineName'); 
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const data = await getTaskMachine(machineName, date, shift);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/energy/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const data = await getEnergyMachineDaily(machine_id, date);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/energy/additional/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const data = await getEnergyAdditionalData(machine_id, date);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/energy/status/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const data = await getEnergyStatusLightMachineDaily(machine_id, date);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.post('/', async (c) => {
  const { name, description } = await c.req.json();
  try {
    await addMachine(name, description);
    return c.json({ message: 'Data added successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.post('/trial/:machineId', async (c) => {
  const { machineId } = c.req.param();
  const machineStatus = c.req.query('machineStatus');
  const machineLocation = c.req.query('machineLocation');
  const machineNumber = c.req.query('machineNumber');
  let data;
  if (machineStatus == 'TRIAL') {
    data = await makeMachineGrey(machineId);
    const updateUns = await fetch(`http://dmksrv02:443/nodered1/api/update/uns/andon`, {
      method: "POST",
      body: JSON.stringify({
        colorProblem: 'GREY',
        MchID: machineId,
        MchLoc: machineLocation,
        MchNumber: machineNumber
      })
    });
    if (updateUns.status === 200) {
      return c.json({ message: 'Data added successfully' });
    } else {
      return c.json({ error: 'Failed to update UNS' }, 500);
    }
  } else {
    data = await removeOverride(machineId);
    const updateUns = await fetch(`http://dmksrv02:443/nodered1/api/update/uns/andon`, {
      method: "POST",
      body: JSON.stringify({
        colorProblem: data[0].statusLightBefore,
        MchID: machineId,
        MchLoc: machineLocation,
        MchNumber: machineNumber
      })
    });
    if (updateUns.status === 200) {
      return c.json({ message: 'Data added successfully' });
    } else {
      return c.json({ error: 'Failed to update UNS' }, 500);
    }
  }
});

machineRoutes.post('/tao/:machineId', async (c) => {
  const { machineId } = c.req.param();
  const machineStatus = c.req.query('machineStatus');
  const machineLocation = c.req.query('machineLocation');
  const machineNumber = c.req.query('machineNumber');
  let data;
  if (machineStatus == 'TAO') {
    data = await makeMachineTAO(machineId);
    const updateUns = await fetch(`http://dmksrv02:443/nodered1/api/update/uns/andon`, {
      method: "POST",
      body: JSON.stringify({
        colorProblem: 'WHITE',
        MchID: machineId,
        MchLoc: machineLocation,
        MchNumber: machineNumber
      })
    });
    if (updateUns.status === 200) {
      return c.json({ message: 'Data added successfully' });
    } else {
      return c.json({ error: 'Failed to update UNS' }, 500);
    }
  } else {
    data = await removeOverrideTAO(machineId);
    const updateUns = await fetch(`http://dmksrv02:443/nodered1/api/update/uns/andon`, {
      method: "POST",
      body: JSON.stringify({
        colorProblem: data[0].statusLightBefore,
        MchID: machineId,
        MchLoc: machineLocation,
        MchNumber: machineNumber
      })
    });
    if (updateUns.status === 200) {
      return c.json({ message: 'Data added successfully' });
    } else {
      return c.json({ error: 'Failed to update UNS' }, 500);
    }
  }
});

machineRoutes.post('/state', async (c) => {
  try {
    const { machineName, color, stateId, statusDate } = await c.req.json();
    if (!color) {
      return c.json({ error: 'color is required' }, 400);
    }

    if (stateId) {
      await updateMachineStateColorById(stateId, color);
      return c.json({ message: 'State updated successfully' });
    }

    if (!machineName) {
      return c.json({ error: 'machineName or stateId is required' }, 400);
    }
  
    await addMachineState(machineName, color, statusDate ?? null);
    return c.json({ message: 'State added successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default machineRoutes;
