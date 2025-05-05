import { Hono } from 'hono';
import { getRoles, createRole, updateRole, deleteRole } from '@/api/controllers/qco/roleController';

const roleRoutes = new Hono();

roleRoutes.get('/', async (c) => {
  try {
    const roles = await getRoles();
    return c.json({ success: true, message: 'Successfully fetched roles', data: roles }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

roleRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const role = await createRole(body);
    return c.json({ success: true, message: 'Successfully created role', data: role }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

roleRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const role = await updateRole(id, body);
    return c.json({ success: true, message: 'Successfully updated role', data: role }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

roleRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await deleteRole(id);
    return c.json({ success: true, message: 'Successfully deleted role' }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});


export default roleRoutes;
