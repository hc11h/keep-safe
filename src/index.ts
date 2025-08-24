import { config as dotenvConfig } from 'dotenv';
import { createServer } from './app';
import { config } from './infrastructure/config';


dotenvConfig();

const app = createServer();

app.listen(config.server.port, () => {
    console.log(`Server running at http://localhost:${config.server.port}`);
    console.log(`Swagger docs available at http://localhost:${config.server.port}/docs`);
});
