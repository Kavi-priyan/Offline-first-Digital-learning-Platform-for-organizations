import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM lessons ORDER BY updated_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { id, title, content, videoUrl, version, updatedAt } = req.body;
  const { rows } = await query(
    `INSERT INTO lessons (id, title, content, video_url, version, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       content = EXCLUDED.content,
       video_url = EXCLUDED.video_url,
       version = EXCLUDED.version,
       updated_at = EXCLUDED.updated_at
     RETURNING *`,
    [id, title, content, videoUrl, version, updatedAt]
  );
  res.status(201).json(rows[0]);
});

export default router;
