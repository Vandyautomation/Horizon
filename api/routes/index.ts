import { Hono } from 'hono';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import scaleTaskRoutes from './scaleTaskRoutes';
import machineRouter from './machineRoutes';


const router = new Hono();

router.route('/auth', authRoutes);
router.route('/users', userRoutes);
router.route('/scales', scaleTaskRoutes);
router.route('/machines', machineRouter);



export default router;
