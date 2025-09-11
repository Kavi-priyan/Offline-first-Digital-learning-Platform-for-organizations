import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

function toIsoDate(value) {
  try {
    const d = new Date(value || Date.now());
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function ensureLesson(l) {
  return {
    id: l.id,
    title: l.title ?? '',
    content: l.content ?? '',
    videoUrl: l.videoUrl ?? l.video_url ?? null,
    version: Number.isFinite(l.version) ? l.version : 1,
    updatedAt: toIsoDate(l.updatedAt ?? l.updated_at)
  };
}

function ensureQuiz(q) {
  return {
    id: q.id,
    lessonId: q.lessonId ?? q.lesson_id,
    data: q.data ?? {},
    version: Number.isFinite(q.version) ? q.version : 1,
    updatedAt: toIsoDate(q.updatedAt ?? q.updated_at)
  };
}

function ensureProgress(p) {
  return {
    id: p.id,
    studentId: p.studentId || p.student_id || 'unknown-student',
    quizId: p.quizId || p.quiz_id,
    score: Number.isFinite(p.score) ? p.score : 0,
    attempts: Array.isArray(p.attempts) ? p.attempts : [],
    updatedAt: toIsoDate(p.updatedAt)
  };
}

function ensureNote(n) {
  return {
    id: n.id,
    lessonId: n.lessonId ?? n.lesson_id,
    text: n.text ?? '',
    updatedAt: toIsoDate(n.updatedAt ?? n.updated_at)
  };
}

// GET endpoint to fetch all data from backend
router.get('/', async (req, res) => {
  try {
    const [lessonsResult, quizzesResult, progressResult, notesResult] = await Promise.all([
      query('SELECT * FROM lessons ORDER BY updated_at DESC'),
      query('SELECT * FROM quizzes ORDER BY updated_at DESC'),
      query('SELECT * FROM progress ORDER BY updated_at DESC'),
      query('SELECT * FROM lesson_notes ORDER BY updated_at DESC')
    ]);

    res.json({
      lessons: lessonsResult.rows.map(ensureLesson),
      quizzes: quizzesResult.rows.map(ensureQuiz),
      progress: progressResult.rows.map(ensureProgress),
      notes: notesResult.rows.map(ensureNote)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'fetch_failed', message: e?.message });
  }
});

// Expect body: { lessons, quizzes, progress, notes }
router.post('/', async (req, res) => {
  try {
    const { lessons = [], quizzes = [], progress = [], notes = [] } = req.body || {};

    for (const raw of lessons) {
      const l = ensureLesson(raw);
      if (!l.id) throw new Error('lesson.id missing');
      await query(
        `INSERT INTO lessons (id, title, content, video_url, version, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           (title, content, video_url, version, updated_at) =
           (CASE WHEN lessons.updated_at <= EXCLUDED.updated_at THEN EXCLUDED.title ELSE lessons.title END,
            CASE WHEN lessons.updated_at <= EXCLUDED.updated_at THEN EXCLUDED.content ELSE lessons.content END,
            CASE WHEN lessons.updated_at <= EXCLUDED.updated_at THEN EXCLUDED.video_url ELSE lessons.video_url END,
            CASE WHEN lessons.updated_at <= EXCLUDED.updated_at THEN EXCLUDED.version ELSE lessons.version END,
            GREATEST(lessons.updated_at, EXCLUDED.updated_at))`,
        [l.id, l.title, l.content, l.videoUrl, l.version, l.updatedAt]
      );
    }

    for (const raw of quizzes) {
      const qz = ensureQuiz(raw);
      if (!qz.id) throw new Error('quiz.id missing');
      await query(
        `INSERT INTO quizzes (id, lesson_id, data, version, updated_at)
         VALUES ($1, $2, $3::jsonb, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           (lesson_id, data, version, updated_at) =
           (CASE WHEN quizzes.updated_at <= EXCLUDED.updated_at THEN EXCLUDED.lesson_id ELSE quizzes.lesson_id END,
            CASE WHEN quizzes.updated_at <= EXCLUDED.updated_at THEN EXCLUDED.data ELSE quizzes.data END,
            CASE WHEN quizzes.updated_at <= EXCLUDED.updated_at THEN EXCLUDED.version ELSE quizzes.version END,
            GREATEST(quizzes.updated_at, EXCLUDED.updated_at))`,
        [qz.id, qz.lessonId, JSON.stringify(qz.data ?? {}), qz.version, qz.updatedAt]
      );
    }

    for (const raw of progress) {
      const pr = ensureProgress(raw);
      if (!pr.id) throw new Error('progress.id missing');
      if (!pr.studentId) throw new Error(`progress.studentId missing for progress ${pr.id}. Raw data: ${JSON.stringify(raw)}`);
      if (!pr.quizId) throw new Error(`progress.quizId missing for progress ${pr.id}. Raw data: ${JSON.stringify(raw)}`);
      console.log('Syncing progress:', { id: pr.id, studentId: pr.studentId, quizId: pr.quizId });
      await query(
        `INSERT INTO progress (id, student_id, quiz_id, score, attempts, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         ON CONFLICT (id) DO UPDATE SET
           score = GREATEST(progress.score, EXCLUDED.score),
           attempts = EXCLUDED.attempts,
           updated_at = GREATEST(progress.updated_at, EXCLUDED.updated_at)` ,
        [pr.id, pr.studentId, pr.quizId, pr.score, JSON.stringify(pr.attempts ?? []), pr.updatedAt]
      );
    }

    for (const raw of notes) {
      const n = ensureNote(raw);
      if (!n.id) throw new Error('note.id missing');
      await query(
        `INSERT INTO lesson_notes (id, lesson_id, text, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           text = CASE WHEN lesson_notes.updated_at <= EXCLUDED.updated_at THEN EXCLUDED.text ELSE lesson_notes.text END,
           updated_at = GREATEST(lesson_notes.updated_at, EXCLUDED.updated_at)` ,
        [n.id, n.lessonId, n.text, n.updatedAt]
      );
    }

    res.json({ status: 'ok' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'sync_failed', message: e?.message });
  }
});

export default router;
