import { Hono } from 'hono';
import cameraRoutes from './cameraRoutes';
import yamlRoutes from './yamlRoutes';
import deviceNamesRoutes from './deviceNamesRoutes';
import videoSourceRoutes from './videoSourceRoutes';

const detectionRouter = new Hono();



detectionRouter.route('/cameras', cameraRoutes);
detectionRouter.route('/yaml', yamlRoutes);
detectionRouter.route('/device_names', deviceNamesRoutes);
detectionRouter.route('/video_sources', videoSourceRoutes);
export default detectionRouter;
