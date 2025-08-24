import { Router } from 'express';
import { sayHello } from '../controllers/helloController';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';

const router = Router();

// health route
router.use('/', healthRoutes);

// auth routes
router.use('/auth', authRoutes);

// test route
router.get('/test', sayHello);

export default router;
