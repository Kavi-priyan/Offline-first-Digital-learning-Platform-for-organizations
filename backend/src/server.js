import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import lessonsRouter from './routes/lessons.js';
import quizzesRouter from './routes/quizzes.js';
import progressRouter from './routes/progress.js';
import syncRouter from './routes/sync.js';
import notesRouter from './routes/notes.js';
import uploadsRouter from './routes/uploads.js';
import videoSessionsRouter from './routes/videoSessions.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/lessons', lessonsRouter);
app.use('/quizzes', quizzesRouter);
app.use('/progress', progressRouter);
app.use('/notes', notesRouter);
app.use('/sync', syncRouter);
app.use('/upload', uploadsRouter);
app.use('/video-sessions', videoSessionsRouter);

// API-prefixed routes
app.use('/api/lessons', lessonsRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/notes', notesRouter);
app.use('/api/sync', syncRouter);
app.use('/api/upload', uploadsRouter);
app.use('/api/video-sessions', videoSessionsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
