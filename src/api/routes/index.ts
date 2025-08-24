import { Router } from 'express';
import { sayHello } from '../controllers/helloController';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';

const router = Router();

// health route
router.use('/', healthRoutes);

// auth routes
router.use('/auth', authRoutes);

// project routes
router.use('/projects', projectRoutes);

// test route
router.get('/test', sayHello);

export default router;
