import { Hono } from 'hono';
import { createVideoSource, deleteVideoSource, getVideoSources, updateVideoSource } from '@/api/controllers/detection/videoSourceController';

const videoSourceRoutes = new Hono();

videoSourceRoutes.get('/', async (c) => {
    try {
        const videoSources = await getVideoSources();
        return c.json({ success: true, message: 'Success fetch video source data', data: videoSources }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

videoSourceRoutes.post('/', async (c) => {
    try {
        const { name, url } = await c.req.json();
        const videoSource = await createVideoSource(name, url);
        return c.json({ success: true, message: 'Success create video source', data: videoSource }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

videoSourceRoutes.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { name, url } = await c.req.json();
        const videoSource = await updateVideoSource(id, name, url);
        return c.json({ success: true, message: 'Success update video source', data: videoSource }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});

videoSourceRoutes.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const videoSource = await deleteVideoSource(id);
        return c.json({ success: true, message: 'Success delete video source', data: videoSource }, 200);
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});


export default videoSourceRoutes;
