CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Lessons with LWW conflict policy (by updated_at)
CREATE TABLE IF NOT EXISTS lessons (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	title TEXT NOT NULL,
	content TEXT NOT NULL,
	video_url TEXT,
	version INTEGER NOT NULL DEFAULT 1,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quizzes linked to lessons, LWW on data
CREATE TABLE IF NOT EXISTS quizzes (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
	data JSONB NOT NULL,
	version INTEGER NOT NULL DEFAULT 1,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Progress: merge policy (max score, append attempts)
CREATE TABLE IF NOT EXISTS progress (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	student_id TEXT NOT NULL,
	quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
	score INTEGER NOT NULL DEFAULT 0,
	attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes per lesson (text)
CREATE TABLE IF NOT EXISTS lesson_notes (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
	text TEXT NOT NULL,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_quiz_id ON progress(quiz_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_lesson_id ON lesson_notes(lesson_id);
