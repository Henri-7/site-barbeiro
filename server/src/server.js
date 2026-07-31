import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`API da Barbearia Elite rodando em http://localhost:${env.port}`);
});
