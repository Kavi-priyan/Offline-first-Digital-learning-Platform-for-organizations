import type { SyncEnvelope, Lesson, Quiz, Progress } from '@sih/db';

type QueueItem = { kind: 'lesson' | 'quiz' | 'progress'; payload: Lesson | Quiz | Progress };

export interface StorageAdapter {
	getQueued(): Promise<QueueItem[]>;
	enqueue(item: QueueItem): Promise<void>;
	clearQueue(): Promise<void>;
	applyLessons(lessons: Lesson[]): Promise<void>;
	applyQuizzes(quizzes: Quiz[]): Promise<void>;
	applyProgress(progress: Progress[]): Promise<void>;
	getAllLessons(): Promise<Lesson[]>;
}

export class SyncManager {
	private backendBaseUrl: string;
	private storage: StorageAdapter;

	constructor(opts: { backendBaseUrl: string; storage: StorageAdapter }) {
		this.backendBaseUrl = opts.backendBaseUrl;
		this.storage = opts.storage;
	}

	async queueUpdate(item: QueueItem): Promise<void> {
		await this.storage.enqueue(item);
	}

	async exportLessons(): Promise<Lesson[]> {
		return this.storage.getAllLessons();
	}

	async importLessons(bundle: Lesson[]): Promise<void> {
		await this.storage.applyLessons(bundle);
	}

	async pushIfOnline(): Promise<boolean> {
		if (!this.isOnline()) return false;
		const queued = await this.storage.getQueued();
		const envelope: SyncEnvelope = {
			lessons: queued.filter(q => q.kind === 'lesson').map(q => q.payload as Lesson),
			quizzes: queued.filter(q => q.kind === 'quiz').map(q => q.payload as Quiz),
			progress: queued.filter(q => q.kind === 'progress').map(q => q.payload as Progress)
		};
		if (!envelope.lessons.length && !envelope.quizzes.length && !envelope.progress.length) return true;
		const res = await fetch(`${this.backendBaseUrl}/sync`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(envelope)
		});
		if (!res.ok) return false;
		await this.storage.clearQueue();
		return true;
	}

	isOnline(): boolean {
		if (typeof navigator !== 'undefined' && 'onLine' in navigator) return navigator.onLine;
		return true;
	}
}
