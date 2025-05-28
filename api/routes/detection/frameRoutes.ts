import { Hono } from 'hono';

const frameRoutes = new Hono();

frameRoutes.get('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const frame = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_PYTHON}/api/frame/${id}`);
        const frameData = frame
        return frameData;
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
});



export default frameRoutes;
