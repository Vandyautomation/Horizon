import { Hono } from 'hono';

import {
  getProblem,
  getProblemGroup,
  getTodo,
  createProblemGroup,
  updateProblemGroup,
  deleteProblemGroup,
  createProblem,
  updateProblem,
  deleteProblem,
  createTodo,
  updateTodo,
  deleteTodo,
  getAllProblemGroups,
  getProblemsByGroupForProcess,
  getTodosByProblem,
} from '../controllers/problemMasterController';

const problemMasterDataRouter = new Hono();

// Problem Group Routes
problemMasterDataRouter.get('/problem-group', async (c) => {
  try {
    const name = c.req.query('name');
    const page = parseInt(c.req.query('page') || '1');
    let pic = c.req.query('pic');
    if (pic === 'ALL') {
      pic = undefined;
    }
    const data = await getProblemGroup(name, page, pic);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.get('/problem-group/all', async (c) => {
  try {
    const data = await getAllProblemGroups();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.post('/problem-group', async (c) => {
  try {
    const { name } = await c.req.json();
    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }
    const data = await createProblemGroup(name);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.put('/problem-group/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { name } = await c.req.json();
    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }
    const data = await updateProblemGroup(id, name);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.delete('/problem-group/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await deleteProblemGroup(id);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Problem Routes
problemMasterDataRouter.get('/problem', async (c) => {
  try {
    const name = c.req.query('name');
    const groupId = c.req.query('groupId');
    const page = parseInt(c.req.query('page') || '1');
    const filter = c.req.query('filter');
    let pic = c.req.query('pic');
    if (pic === 'ALL') {
      pic = undefined;
    }
    const data = await getProblem(name, groupId, page, filter, pic);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.get('/problem/by-group', async (c) => {
  try {
    const groupId = c.req.query('groupId');
    const process = c.req.query('process');

    if (!groupId) {
      return c.json({ error: 'groupId is required' }, 400);
    }

    const data = await getProblemsByGroupForProcess(groupId, process);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.post('/problem', async (c) => {
  try {
    const { name, problem_group_id, color, process } = await c.req.json();
    if (!name || !problem_group_id || !color || !process) {
      return c.json({ error: 'Name, problem group, color, and process are required' }, 400);
    }
    const data = await createProblem(name, problem_group_id, color, process);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.put('/problem/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { name, problem_group_id, color, process } = await c.req.json();
    if (!name || !problem_group_id || !color || !process) {
      return c.json({ error: 'Name, problem group, color, and process are required' }, 400);
    }
    const data = await updateProblem(id, name, problem_group_id, color, process);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.delete('/problem/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await deleteProblem(id);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Todo Routes
problemMasterDataRouter.get('/todo', async (c) => {
  try {
    const name = c.req.query('name');
    const problemId = c.req.query('problemId');
    const page = parseInt(c.req.query('page') || '1');
    let pic = c.req.query('pic');
    if (pic === 'ALL') {
      pic = undefined;
    }
    const data = await getTodo(name, problemId, page, pic);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.get('/todo/by-problem', async (c) => {
  try {
    const problemId = c.req.query('problemId');

    if (!problemId) {
      return c.json({ error: 'problemId is required' }, 400);
    }

    const data = await getTodosByProblem(problemId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.post('/todo', async (c) => {
  try {
    const { name, problem_id, pic, is_escalated } = await c.req.json();
    if (!name || !problem_id || !pic) {
      return c.json({ error: 'Name, problem, and PIC are required' }, 400);
    }
    const data = await createTodo(name, problem_id, pic, is_escalated || false);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.put('/todo/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { name, problem_id, pic, is_escalated } = await c.req.json();
    if (!name || !problem_id || !pic) {
      return c.json({ error: 'Name, problem, and PIC are required' }, 400);
    }
    const data = await updateTodo(id, name, problem_id, pic, is_escalated || false);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.delete('/todo/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await deleteTodo(id);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default problemMasterDataRouter;
