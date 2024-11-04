import { Hono } from 'hono';
import { addTask, getPo, getScaleAsset, getTask, getTaskDetail, getTaskTransaction, pauseTask, startTask, stopTask } from '../controllers/scaleTaskController';

const scaleTaskRoutes = new Hono();

scaleTaskRoutes.get('/tasks', async (c) => {
    try {
      const data = await getTask();
      return c.json(data);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  });

  scaleTaskRoutes.get('/tasks/:taskId', async (c) => {
    try {
      const taskId = c.req.param('taskId'); 
      const data = await getTaskDetail(Number(taskId));
      return c.json(data);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  });

  scaleTaskRoutes.get('/task-transaction/:taskId', async (c) => {
    try {
      const taskId = c.req.param('taskId'); 
      const data = await getTaskTransaction(Number(taskId));
      return c.json(data);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  });

  scaleTaskRoutes.post('/tasks', async (c) => {
    const { poNumber, scaleAssetId } = await c.req.json();
    try {
      await addTask(poNumber, scaleAssetId);
      return c.json({ message: 'Data added successfully' });
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  });

  scaleTaskRoutes.get('/po-numbers', async (c) => {
    try {
      const data = await getPo();
      return c.json(data);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  });
  scaleTaskRoutes.get('/scale-assets', async (c) => {
    try {
      const data = await getScaleAsset();
      return c.json(data);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  });

  scaleTaskRoutes.post('/start-task', async (c) => {
    const { taskId } = await c.req.json();
    try {
      await startTask(taskId);
      return c.json({ message: 'Task started successfully' });
    } catch (error) {
      console.error("Error starting task:", error);
      return c.json({ error: (error as Error).message }, 500);
    }
  });

  scaleTaskRoutes.post('/pause-task', async (c) => {
    const { taskId } = await c.req.json();
    try {
      await pauseTask(taskId);
      return c.json({ message: 'Task paused successfully' });
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  });

  scaleTaskRoutes.post('/stop-task', async (c) => {
    const { taskId } = await c.req.json();
    try {
      await stopTask(taskId);
      return c.json({ message: 'Task completed successfully' });
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  });

export default scaleTaskRoutes;
