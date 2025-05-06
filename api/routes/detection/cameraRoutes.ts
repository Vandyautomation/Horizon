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
        const { name, video_source, yaml_file, udp_ip, udp_port, device_name } = await c.req.json();
        const camera = await createCamera(name, video_source, yaml_file, udp_ip, udp_port, device_name);
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/camera/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'add',
                camera: {
                    id: camera.id,
                    name: name,
                    video_source: video_source,
                    yaml_file: yaml_file,
                    udp_ip: udp_ip,
                    udp_port: Number(udp_port),
                    device_name: device_name
                }
            })
        })
        return c.json({ success: true, message: 'Success create camera', data: camera }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

cameraRoutes.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { name, video_source, yaml_file, udp_ip, udp_port, device_name } = await c.req.json();
        const camera = await updateCamera(id, name, video_source, yaml_file, udp_ip, udp_port, device_name);
        console.log("Updating camera by calling sync api")
        const sync = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/camera/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update',
                camera: {
                    id: id,
                    name: name,
                    video_source: video_source,
                    yaml_file: yaml_file,
                    udp_ip: udp_ip,
                    udp_port: Number(udp_port),
                    device_name: device_name
                }
            })
        })
        if (sync.ok) {
            console.log("Success updating camera by calling sync api")
            console.log(sync)
            return c.json({ success: true, message: 'Success update camera', data: camera }, 200);

        } else {
            console.log("Failed to update camera by calling sync api")
            console.log(sync)
            return c.json({ success: false, message: 'Failed to update camera by calling sync api', error: sync.statusText }, 500);
        }
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

cameraRoutes.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const camera = await deleteCamera(id);
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/camera/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete',
                camera: {
                    id: id
                }
            })
        })  
        return c.json({ success: true, message: 'Success delete camera', data: camera }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
})



export default cameraRoutes;
