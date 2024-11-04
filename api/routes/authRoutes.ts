import { Hono } from 'hono';
import { loginHandler } from '../controllers/authController';

const authRoutes = new Hono();

authRoutes.post('/login', loginHandler);

export default authRoutes;
