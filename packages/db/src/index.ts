export type Lesson = {
	id: string;
	title: string;
	content: string;
	videoUrl?: string;
	version: number;
	updatedAt: string; // ISO
};

export type Quiz = {
	id: string;
	lessonId: string;
	data: unknown;
	version: number;
	updatedAt: string;
};

export type Progress = {
	id: string;
	studentId: string;
	quizId: string;
	score: number;
	attempts: unknown[];
	updatedAt: string;
};

export type SyncEnvelope = {
	lessons: Lesson[];
	quizzes: Quiz[];
	progress: Progress[];
};
