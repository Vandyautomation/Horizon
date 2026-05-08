import { Hono } from 'hono';
import {
  createMdpActionMaster,
  createMdpProblemMaster,
  createMdpThresholdMaster,
  deleteMdpThresholdMaster,
  getMdpHistory,
  getMdpActionMaster,
  getMdpProblemMaster,
  getMdpPositions,
  getMdpSummary,
  getMdpThresholdMaster,
  updateMdpThresholdMaster,
  updateMdpHistoryCauseComment,
  updateMdpHistoryLocation,
} from '../controllers/mdpController';

const mdpRoutes = new Hono();

mdpRoutes.get('/positions', async (c) => {
  try {
    const mdpId = Number(c.req.query('mdpId') || 1);
    const data = await getMdpPositions(mdpId);
    return c.json({ mdpId, data });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

mdpRoutes.get('/history', async (c) => {
  try {
    const mdpId = Number(c.req.query('mdpId') || 1);
    const date = c.req.query('date') || new Date().toISOString().slice(0, 10);
    const shift = c.req.query('shift') || undefined;
    const data = await getMdpHistory({ mdpId, date, shift });
    return c.json({ mdpId, date, shift, data });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

mdpRoutes.get('/summary', async (c) => {
  try {
    const mdpId = Number(c.req.query('mdpId') || 1);
    const date = c.req.query('date') || new Date().toISOString().slice(0, 10);
    const shift = c.req.query('shift') || undefined;
    const data = await getMdpSummary({ mdpId, date, shift });
    return c.json({ mdpId, date, shift, data });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

mdpRoutes.get('/master/problems', async (c) => {
  try {
    const data = await getMdpProblemMaster();
    return c.json({ data });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

mdpRoutes.post('/master/problems', async (c) => {
  try {
    const body = await c.req.json();
    const name = String(body.name ?? '').trim();
    const data = await createMdpProblemMaster(name);
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

mdpRoutes.get('/master/actions', async (c) => {
  try {
    const problemIdRaw = c.req.query('problemId');
    const problemId =
      problemIdRaw === undefined || problemIdRaw === null || problemIdRaw === ''
        ? undefined
        : Number(problemIdRaw);
    const data = await getMdpActionMaster({ problemId });
    return c.json({ data });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

mdpRoutes.post('/master/actions', async (c) => {
  try {
    const body = await c.req.json();
    const name = String(body.name ?? '').trim();
    const problemIdRaw = body.problemId ?? body.problem_id;
    const problemId =
      problemIdRaw === undefined || problemIdRaw === null || problemIdRaw === ''
        ? undefined
        : Number(problemIdRaw);
    const data = await createMdpActionMaster({ name, problemId });
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

mdpRoutes.get('/master/thresholds', async (c) => {
  try {
    const data = await getMdpThresholdMaster();
    return c.json({ data });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

mdpRoutes.post('/master/thresholds', async (c) => {
  try {
    const body = await c.req.json();
    const data = await createMdpThresholdMaster({
      mdpId: Number(body.mdpId),
      ThresholdUpperID1:
        body.ThresholdUpperID1 === '' || body.ThresholdUpperID1 === undefined
          ? null
          : Number(body.ThresholdUpperID1),
      ThresholdLowerID1:
        body.ThresholdLowerID1 === '' || body.ThresholdLowerID1 === undefined
          ? null
          : Number(body.ThresholdLowerID1),
      ThresholdUpperID2:
        body.ThresholdUpperID2 === '' || body.ThresholdUpperID2 === undefined
          ? null
          : Number(body.ThresholdUpperID2),
      ThresholdLowerID2:
        body.ThresholdLowerID2 === '' || body.ThresholdLowerID2 === undefined
          ? null
          : Number(body.ThresholdLowerID2),
      ThresholdUpperID3:
        body.ThresholdUpperID3 === '' || body.ThresholdUpperID3 === undefined
          ? null
          : Number(body.ThresholdUpperID3),
      ThresholdLowerID3:
        body.ThresholdLowerID3 === '' || body.ThresholdLowerID3 === undefined
          ? null
          : Number(body.ThresholdLowerID3),
    });
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

mdpRoutes.delete('/master/thresholds/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const data = await deleteMdpThresholdMaster(id);
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

mdpRoutes.patch('/master/thresholds/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const data = await updateMdpThresholdMaster(id, {
      mdpId: Number(body.mdpId),
      ThresholdUpperID1:
        body.ThresholdUpperID1 === '' || body.ThresholdUpperID1 === undefined
          ? null
          : Number(body.ThresholdUpperID1),
      ThresholdLowerID1:
        body.ThresholdLowerID1 === '' || body.ThresholdLowerID1 === undefined
          ? null
          : Number(body.ThresholdLowerID1),
      ThresholdUpperID2:
        body.ThresholdUpperID2 === '' || body.ThresholdUpperID2 === undefined
          ? null
          : Number(body.ThresholdUpperID2),
      ThresholdLowerID2:
        body.ThresholdLowerID2 === '' || body.ThresholdLowerID2 === undefined
          ? null
          : Number(body.ThresholdLowerID2),
      ThresholdUpperID3:
        body.ThresholdUpperID3 === '' || body.ThresholdUpperID3 === undefined
          ? null
          : Number(body.ThresholdUpperID3),
      ThresholdLowerID3:
        body.ThresholdLowerID3 === '' || body.ThresholdLowerID3 === undefined
          ? null
          : Number(body.ThresholdLowerID3),
    });
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

mdpRoutes.patch('/history/cause-comment', async (c) => {
  try {
    const body = await c.req.json();
    const rowIdRaw = body.rowId ?? body.id;
    const rowId =
      rowIdRaw === undefined || rowIdRaw === null || rowIdRaw === ''
        ? undefined
        : Number(rowIdRaw);
    const historyId = Number(body.historyId ?? body.pointId);
    const cause = String(body.cause ?? '');
    const comment = String(body.comment ?? body.action ?? '');
    const mdpIdRaw = body.mdpId ?? body.mdp_id;
    const mdpId =
      mdpIdRaw === undefined || mdpIdRaw === null || mdpIdRaw === ''
        ? undefined
        : Number(mdpIdRaw);
    const timestamp = String(body.timestamp ?? body.ts ?? '').trim() || undefined;

    const data = await updateMdpHistoryCauseComment({
      rowId,
      timestamp,
      historyId: historyId as 1 | 2 | 3,
      cause,
      comment,
      mdpId,
    });

    return c.json({
      success: true,
      message: `Updated CauseID${historyId} and CommentID${historyId}`,
      data,
    });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

mdpRoutes.patch('/history/location', async (c) => {
  try {
    const body = await c.req.json();
    const rowIdRaw = body.rowId ?? body.id;
    const rowId =
      rowIdRaw === undefined || rowIdRaw === null || rowIdRaw === ''
        ? undefined
        : Number(rowIdRaw);
    const historyId = Number(body.historyId ?? body.pointId);
    const location = String(body.location ?? body.label ?? '');
    const mdpIdRaw = body.mdpId ?? body.mdp_id;
    const mdpId =
      mdpIdRaw === undefined || mdpIdRaw === null || mdpIdRaw === ''
        ? undefined
        : Number(mdpIdRaw);
    const timestamp = String(body.timestamp ?? body.ts ?? '').trim() || undefined;

    const data = await updateMdpHistoryLocation({
      rowId,
      timestamp,
      historyId: historyId as 1 | 2 | 3,
      location,
      mdpId,
    });

    return c.json({
      success: true,
      message: `Updated LocationID${historyId}`,
      data,
    });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

export default mdpRoutes;
