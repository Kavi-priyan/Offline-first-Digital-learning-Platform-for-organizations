import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Create session (start viewing)
router.post('/', async (req, res) => {
  try {
    const { lessonId, studentId, device } = req.body || {};
    if (!lessonId || !studentId) return res.status(400).json({ error: 'missing_fields' });
    // Ensure lesson exists to avoid FK error
    const exists = await query('SELECT 1 FROM lessons WHERE id = $1', [lessonId]);
    if (!exists.rows[0]) return res.status(400).json({ error: 'unknown_lesson', lessonId });

    const { rows } = await query(
      `INSERT INTO video_sessions (lesson_id, student_id, device)
       VALUES ($1, $2, $3)
       RETURNING id, lesson_id as "lessonId", student_id as "studentId", started_at as "startedAt", device`,
      [lessonId, studentId, device || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'create_failed', message: e?.message });
  }
});

// End session (stop viewing)
router.post('/:id/stop', async (req, res) => {
  const id = req.params.id;
  const { durationSeconds } = req.body || {};
  const { rows } = await query(
    `UPDATE video_sessions
     SET ended_at = now(), duration_seconds = COALESCE($2, EXTRACT(EPOCH FROM (now() - started_at))::int)
     WHERE id = $1
     RETURNING id, lesson_id as "lessonId", student_id as "studentId", started_at as "startedAt", ended_at as "endedAt", duration_seconds as "durationSeconds"`,
    [id, Number.isFinite(durationSeconds) ? durationSeconds : null]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
});

// Optional: list sessions per lesson
router.get('/lesson/:lessonId', async (req, res) => {
  const { rows } = await query(
    `SELECT id, lesson_id as "lessonId", student_id as "studentId", started_at as "startedAt", ended_at as "endedAt", duration_seconds as "durationSeconds", device
     FROM video_sessions WHERE lesson_id = $1 ORDER BY started_at DESC`,
    [req.params.lessonId]
  );
  res.json(rows);
});

export default router;


