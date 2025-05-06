import { Hono } from 'hono';
import { deleteCamera, getCameras, createCamera, updateCamera } from '@/api/controllers/detection/cameraController';

const cameraRoutes = new Hono();

cameraRoutes.get('/', async (c) => {
    try {
        const cameras = await getCameras();
        return c.json({ success: true, message: 'Success fetch camera data', data: cameras }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

cameraRoutes.post('/', async (c) => {
    try {
        const { name, video_source, yaml_file, yaml_file_content, udp_ip, udp_port, device_name, is_active, is_paused } = await c.req.json();
        const camera = await createCamera(name, video_source, yaml_file, yaml_file_content, udp_ip, udp_port, device_name, is_active, is_paused);
        return c.json({ success: true, message: 'Success create camera', data: camera }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

cameraRoutes.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { name, video_source, yaml_file, yaml_file_content, udp_ip, udp_port, device_name, is_active, is_paused } = await c.req.json();
        const camera = await updateCamera(id, name, video_source, yaml_file, yaml_file_content, udp_ip, udp_port, device_name, is_active, is_paused);
        return c.json({ success: true, message: 'Success update camera', data: camera }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

cameraRoutes.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const camera = await deleteCamera(id);
        return c.json({ success: true, message: 'Success delete camera', data: camera }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
})



export default cameraRoutes;
