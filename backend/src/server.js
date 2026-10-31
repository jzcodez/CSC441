import { app } from './app.js';
import { config } from './config/env.js';
import { checkDatabases } from './db/health.js';

app.listen(config.port, async () => {
  console.log(`Coffee website running at http://localhost:${config.port}`);
  // Report database status at startup, but keep serving pages even if one is down.
  const databases = await checkDatabases();
  for (const [name, status] of Object.entries(databases)) {
    console.log(`  ${name}: ${status}`);
  }
});
