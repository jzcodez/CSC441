// Builds the Express app: the JSON API under /api and the static frontend for everything else.
// Serving both from one server means one deployment and no cross-origin (CORS) setup.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import apiRouter from './routes/index.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

app.use('/api', apiRouter);
app.use('/api', apiNotFound);

app.use(express.static(frontendDir, { extensions: ['html'] }));
app.use((req, res) => res.status(404).sendFile(path.join(frontendDir, '404.html')));

app.use(errorHandler);
