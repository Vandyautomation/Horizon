import { Hono } from 'hono';
import router from './routes';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(cors({ origin: '*', credentials: true }));

app.route('/api', router);

export default app;
