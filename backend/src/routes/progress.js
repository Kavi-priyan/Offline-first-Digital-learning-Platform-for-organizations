import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM progress ORDER BY updated_at DESC');
  res.json(rows);
});

router.get('/report', async (req, res) => {
  const { rows } = await query(
    `SELECT student_id as "studentId",
            quiz_id as "quizId",
            COUNT(*) as attempts_count,
            MAX(score) as max_score
     FROM progress
     GROUP BY student_id, quiz_id
     ORDER BY student_id, quiz_id`
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { id, studentId, quizId, score, attempts, updatedAt } = req.body;
  const { rows } = await query(
    `INSERT INTO progress (id, student_id, quiz_id, score, attempts, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       student_id = EXCLUDED.student_id,
       quiz_id = EXCLUDED.quiz_id,
       score = GREATEST(progress.score, EXCLUDED.score),
       attempts = (
         SELECT jsonb_agg(a ORDER BY (a->>'at')) FROM (
           SELECT jsonb_array_elements(progress.attempts) AS a
           UNION ALL
           SELECT jsonb_array_elements(EXCLUDED.attempts) AS a
         ) t
       ),
       updated_at = GREATEST(progress.updated_at, EXCLUDED.updated_at)
     RETURNING *`,
    [id, studentId, quizId, score, attempts, updatedAt]
  );
  res.status(201).json(rows[0]);
});

export default router;
