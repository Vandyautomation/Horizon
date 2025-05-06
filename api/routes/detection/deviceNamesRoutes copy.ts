import { Hono } from 'hono';
import { getDeviceNames } from '@/api/controllers/detection/deviceNamesController';

const deviceNamesRoutes = new Hono();

deviceNamesRoutes.get('/', async (c) => {
    try {
        const deviceNames = await getDeviceNames();
        return c.json({ success: true, message: 'Success fetch device names data', data: deviceNames }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

export default deviceNamesRoutes;
