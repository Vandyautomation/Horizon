import { Hono } from 'hono';
import {
  createMdpActionMaster,
  createMdpProblemMaster,
  getMdpHistory,
  getMdpActionMaster,
  getMdpProblemMaster,
  getMdpPositions,
  getMdpSummary,
  updateMdpHistoryCauseComment,
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
    const intervalMinutes = Number(c.req.query('intervalMinutes') || 5);
    const shift = c.req.query('shift') || undefined;
    const data = await getMdpHistory({ mdpId, date, intervalMinutes, shift });
    return c.json({ mdpId, date, intervalMinutes, shift, data });
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

export default mdpRoutes;
