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
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
    credentials: true,
}), timeout(8000));


app.route('/api', router);

export default app;
