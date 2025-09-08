import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import lessonsRouter from './routes/lessons.js';
import quizzesRouter from './routes/quizzes.js';
import progressRouter from './routes/progress.js';
import syncRouter from './routes/sync.js';
import notesRouter from './routes/notes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/lessons', lessonsRouter);
app.use('/quizzes', quizzesRouter);
app.use('/progress', progressRouter);
app.use('/notes', notesRouter);
app.use('/sync', syncRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
