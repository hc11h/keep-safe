import { config } from 'dotenv';
import { createServer } from './app';

config(); // load .env

const PORT = process.env.PORT || 3000;
const app = createServer();

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📖 Swagger docs available at http://localhost:${PORT}/docs`);
  });
