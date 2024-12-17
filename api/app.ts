import { Hono } from 'hono';
import router from './routes';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('/api/*',cors({ 
    origin: 'http://localhost:3001', 
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests','Access-Control-Allow-Origin'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    credentials: true }));

app.route('/api', router);

export default app;
