import express, { Application, Router } from 'express';
import routes from './api/routes';
import { setupSwagger } from './docs/swagger';
const router = Router();
export const createServer = (): Application => {
    const app = express();

    app.use(express.json());

    router.get('/', (req, res) => {
        res.json('working...');
    });

    app.use('/', router)
    app.use('/api', routes);

    setupSwagger(app);

    return app;
};
