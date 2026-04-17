import { Hono } from 'hono';
import router from './routes';
import { cors } from 'hono/cors';
import { timeout } from 'hono/timeout'
import { logger } from 'hono/logger';
// import "reflect-metadata"

const app = new Hono();

if (process.env.NODE_ENV === 'development') {
    app.use(logger());
}

app.use('/api/*', cors({ 
    origin: '*', 
    allowHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Custom-Header',
        'Upgrade-Insecure-Requests'
    ],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}), timeout(120000));

app.onError((err, c) => {
    const message = String((err as any)?.message || 'Internal Server Error');
    const lower = message.toLowerCase();

    if (lower.includes('timed out') || lower.includes('timeout')) {
        return c.json({ success: false, message: 'Request timeout' }, 504);
    }

    if (lower.includes('unauthorized') || lower.includes('invalid or expired token')) {
        return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    console.error('Unhandled app error:', err);
    return c.json({ success: false, message: 'Internal Server Error' }, 500);
});

app.notFound((c) => {
    return c.json({ success: false, message: 'Route not found' }, 404);
});


app.route('/api', router);

export default app;
