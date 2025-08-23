import { Router } from 'express';
import { sayHello } from '../controllers/helloController';
import healthRoutes from './health.routes';
const router = Router();

// health route
router.use('/', healthRoutes);

// test route
router.get('/test', sayHello);

export default router;
