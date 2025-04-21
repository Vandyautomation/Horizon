import { Hono } from 'hono';
import authRoutes from '../authRoutes';
import taskRoutes from '@/api/routes/qco/taskRoutes';
import roleRoutes from './roleRoutes';
import userRoutes from '../userRoutes';
import proRoutes from './proRoutes';
import machineRoutes from './machineRoutes';
import moldRoutes from './moldRoutes';
import itemRoutes from './itemRoutes';
import taskCategoryRoutes from './taskCategoryRoutes';
import subTaskRoutes from './subTaskRoutes';
import userSubTaskRoutes from './userSubTaskRoutes';
import manufacturingDataRoutes from './manufacturingDataRoutes';



const qcoRouter = new Hono();

qcoRouter.route('/auth', authRoutes);
qcoRouter.route('/roles', roleRoutes);
qcoRouter.route('/users', userRoutes);
qcoRouter.route('/pros', proRoutes);
qcoRouter.route('/machines', machineRoutes);
qcoRouter.route('/molds', moldRoutes);
qcoRouter.route('/items', itemRoutes);
qcoRouter.route('/task_categories', taskCategoryRoutes);
qcoRouter.route('/sub_tasks', subTaskRoutes);
qcoRouter.route('/tasks', taskRoutes);
qcoRouter.route('/user_sub_tasks', userSubTaskRoutes);

qcoRouter.route('/manufacturing-data', manufacturingDataRoutes);

export default qcoRouter;
