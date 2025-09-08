import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM quizzes ORDER BY updated_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { id, lessonId, data, version, updatedAt } = req.body;
  const { rows } = await query(
    `INSERT INTO quizzes (id, lesson_id, data, version, updated_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       lesson_id = EXCLUDED.lesson_id,
       data = EXCLUDED.data,
       version = EXCLUDED.version,
       updated_at = EXCLUDED.updated_at
     RETURNING *`,
    [id, lessonId, data, version, updatedAt]
  );
  res.status(201).json(rows[0]);
});

export default router;
