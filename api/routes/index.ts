import { Hono } from 'hono';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import scaleTaskRoutes from './scaleTaskRoutes';
import machineRoutes from './machineRoutes';
import countboardRoutes from './countboardRoutes';
import andonRoutes from './andonRoutes';
import { cors } from 'hono/cors';
import equipmentRoutes from './equipmentRoutes';
import locationRoutes from './locationRoutes';
import uapRoutes from './uapRoutes';
import qcoRouter from './qco';
import detectionRouter from './detection';
import cooisDataRouter from './cooisDataRoutes';
import routingDataRouter from './routingDataRoutes';
import parameterSettingDataRouter from './parameterSettingDataRoutes';
import problemMasterDataRouter from './problemMasterRoutes';
import hrzRoutes from './hrzRoutes';
import zhafirRoutes from './zhafirRoutes';
import mdpRoutes from './mdpRoutes';



const router = new Hono();



router.route('/auth', authRoutes);
router.route('/users', userRoutes);
router.route('/scales', scaleTaskRoutes);
router.route('/machines', machineRoutes);
router.route('/countboards', countboardRoutes);
router.route('/andon', andonRoutes);
router.route('/equipments', equipmentRoutes);
router.route('/locations', locationRoutes);
router.route('/uaps', uapRoutes);

router.route('/qco/api', qcoRouter);
router.route('/detection/api', detectionRouter);
router.route('/hrz', hrzRoutes);
router.route('/coois-data', cooisDataRouter);
router.route('/routing-data', routingDataRouter);
router.route('/parameter-setting', parameterSettingDataRouter);
router.route('/problem-master', problemMasterDataRouter);
router.route('/zhafir-ze-3600', zhafirRoutes);
router.route('/mdp', mdpRoutes);








export default router;
