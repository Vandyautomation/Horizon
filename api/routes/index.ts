import { Hono } from 'hono';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import scaleTaskRoutes from './scaleTaskRoutes';
import machineRoutes from './machineRoutes';
import countboardRoutes from './countboardRoutes';
import andonRoutes from './andonRoutes';
import { cors } from 'hono/cors';
import equipmentRoutes from './equipmentRoutes';


const router = new Hono();



router.route('/auth', authRoutes);
router.route('/users', userRoutes);
router.route('/scales', scaleTaskRoutes);
router.route('/machines', machineRoutes);
router.route('/countboards', countboardRoutes);
router.route('/andon', andonRoutes);
router.route('/equipments', equipmentRoutes);







export default router;
