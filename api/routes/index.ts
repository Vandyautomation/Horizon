import { Hono } from 'hono';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import scaleTaskRoutes from './scaleTaskRoutes';
import machineRoutes from './machineRoutes';
import countboardRoutes from './countboardRoutes';
import andonRoutes from './andonRoutes';
import { cors } from 'hono/cors';


const router = new Hono();

router.use(cors({origin: 'http://localhost:3001'}));

router.route('/auth', authRoutes);
router.route('/users', userRoutes);
router.route('/scales', scaleTaskRoutes);
router.route('/machines', machineRoutes);
router.route('/countboards', countboardRoutes);
router.route('/andon', andonRoutes);

router.get('/test', (c) => c.json({ message: 'CORS working!' }));




export default router;
