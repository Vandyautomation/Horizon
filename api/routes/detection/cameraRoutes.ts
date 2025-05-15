import { Hono } from 'hono';
import { deleteCamera, getCameras, createCamera, updateCamera, getCamerasByMachineId } from '@/api/controllers/detection/cameraController';

const cameraRoutes = new Hono();

cameraRoutes.get('/', async (c) => {
    try {
        const cameras = await getCameras();
        return c.json({ success: true, message: 'Success fetch camera data', data: cameras }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

cameraRoutes.get('/status', async (c) => {
    try {
        const cameras = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/cameras/status?status=all`, {
            method: 'GET',
        })
        const data = await cameras.json()
        return c.json(data, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});
cameraRoutes.get('/:machine_id', async (c) => {
    try {
        const { machine_id } = c.req.param();
        const cameras = await getCamerasByMachineId(machine_id);
        return c.json(cameras, 200);
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
                    id: Number(camera.id),
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

cameraRoutes.post('/restart', async (c) => {
    try {
        let { camera_id, yaml_file, video_source, udp_ip, udp_port, device_name, machine_id, name } = await c.req.json();

        if (machine_id) {
            const cameras = await getCameras();
            const camera = cameras.find((c: any) => c.machine_id === machine_id);
            if (!camera) {
                return c.json({ success: false, message: 'Camera not found' }, 404);
            }
            camera_id = camera.id;
            yaml_file = camera.yaml_file;
            video_source = camera.video_source;
            udp_ip = camera.udp_ip;
            name = camera.name;
            udp_port = camera.udp_port;
            device_name = camera.device_name;
        }

        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/camera/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'restart',
                camera: {
                    id: Number(camera_id),
                    yaml_file: yaml_file,
                    name: name,
                    video_source: video_source,
                    udp_ip: udp_ip,
                    udp_port: Number(udp_port),
                    device_name: device_name
                }
            })
        })
        return c.json({ success: true, message: 'Success restart camera' }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
})

cameraRoutes.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { name, video_source, yaml_file, udp_ip, udp_port, device_name } = await c.req.json();
        const camera = await updateCamera(id, name, video_source, yaml_file, udp_ip, udp_port, device_name);
        // console.log("Updating camera by calling sync api")
        const sync = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/camera/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update',
                camera: {
                    id: Number(id),
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
            // console.log("Success updating camera by calling sync api")
            // console.log(sync)
            return c.json({ success: true, message: 'Success update camera', data: camera }, 200);

        } else {
            // console.log("Failed to update camera by calling sync api")
            // console.log(sync)
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
                    id: Number(id)
                }
            })
        })  
        return c.json({ success: true, message: 'Success delete camera', data: camera }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
})



export default cameraRoutes;
