import { Hono } from 'hono';
import { createDeviceName, deleteDeviceName, getDeviceNames, updateDeviceName } from '@/api/controllers/detection/deviceNamesController';

const deviceNamesRoutes = new Hono();

deviceNamesRoutes.get('/', async (c) => {
    try {
        const deviceNames = await getDeviceNames();
        return c.json({ success: true, message: 'Success fetch device names data', data: deviceNames }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

deviceNamesRoutes.post('/', async (c) => {
    try {
        const { name, value } = await c.req.json();
        const deviceName = await createDeviceName(name, value);
        return c.json({ success: true, message: 'Success create device name', data: deviceName }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

deviceNamesRoutes.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { name, value } = await c.req.json();
        const deviceName = await updateDeviceName(id, name, value);
        return c.json({ success: true, message: 'Success update device name', data: deviceName }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

deviceNamesRoutes.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const deviceName = await deleteDeviceName(id);
        return c.json({ success: true, message: 'Success delete device name', data: deviceName }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});



export default deviceNamesRoutes;
