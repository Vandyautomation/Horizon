import { Hono } from 'hono';
import { createYaml, deleteYaml, getYaml, handleYaml, updateYaml } from '@/api/controllers/detection/yamlController';

const yamlRoutes = new Hono();

yamlRoutes.get('/', async (c) => {
    try {
        const yaml = await getYaml();
        return c.json({ success: true, message: 'Success fetch yaml data', data: yaml }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

yamlRoutes.post('/', async (c) => {
    try {
        const { action, name, content } = await c.req.json();
        const yaml = await handleYaml(action, name, content);
        return c.json({ success: true, message: 'Success create yaml', data: yaml }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

yamlRoutes.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { name, content } = await c.req.json();
        const yaml = await updateYaml(name, content);
        return c.json({ success: true, message: 'Success update yaml', data: yaml }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

yamlRoutes.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const yaml = await deleteYaml(id);
        return c.json({ success: true, message: 'Success delete yaml', data: yaml }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

export default yamlRoutes;
