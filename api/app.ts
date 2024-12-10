import { Hono } from 'hono';
import router from './routes';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(cors({ origin: 'http://localhost:3001', credentials: true }));
app.use(cors({ origin: 'http://192.168.86.101:3001', credentials: true }));
app.route('/api', router);

export default app;
