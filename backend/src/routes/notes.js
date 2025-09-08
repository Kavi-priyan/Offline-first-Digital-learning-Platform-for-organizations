import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM lesson_notes ORDER BY updated_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { id, lessonId, text, updatedAt } = req.body;
  const { rows } = await query(
    `INSERT INTO lesson_notes (id, lesson_id, text, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       lesson_id = EXCLUDED.lesson_id,
       text = EXCLUDED.text,
       updated_at = GREATEST(lesson_notes.updated_at, EXCLUDED.updated_at)
     RETURNING *`,
    [id, lessonId, text, updatedAt]
  );
  res.status(201).json(rows[0]);
});

export default router;
