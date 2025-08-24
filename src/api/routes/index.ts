import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import secretRoutes from './secret.routes';

const router = Router();

// health route
router.use('/', healthRoutes);

// auth routes
router.use('/auth', authRoutes);

// project routes
router.use('/projects', projectRoutes);

// secret routes
router.use('/projects', secretRoutes);


export default router;
