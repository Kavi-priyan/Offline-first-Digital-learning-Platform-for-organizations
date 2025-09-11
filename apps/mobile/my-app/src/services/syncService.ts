import { db, Lesson, Quiz, Progress, Note } from '../db/dexie';

const BACKEND_BASE_URL = 'http://localhost:4000/api';

export class SyncService {
  async fetchFromBackend(): Promise<{ lessons: Lesson[]; quizzes: Quiz[]; progress: Progress[]; notes: Note[] }> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/sync`);
      if (!response.ok) {
        throw new Error(`Failed to fetch from backend: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching from backend:', error);
      throw error;
    }
  }

  async pushToBackend(): Promise<void> {
    try {
      const lessons = await db.lessons.toArray();
      const quizzes = await db.quizzes.toArray();
      const progress = await db.progress.toArray();
      const notes = await db.notes.toArray();

      const response = await fetch(`${BACKEND_BASE_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons, quizzes, progress, notes })
      });

      if (!response.ok) {
        throw new Error(`Failed to push to backend: ${response.status}`);
      }
    } catch (error) {
      console.error('Error pushing to backend:', error);
      throw error;
    }
  }

  async syncWithBackend(): Promise<void> {
    try {
      // First push local data to backend
      await this.pushToBackend();
      
      // Then fetch updated data from backend
      const backendData = await this.fetchFromBackend();
      
      // Update local database
      await db.lessons.clear();
      await db.lessons.bulkAdd(backendData.lessons);
      
      await db.quizzes.clear();
      await db.quizzes.bulkAdd(backendData.quizzes);
      
      await db.progress.clear();
      await db.progress.bulkAdd(backendData.progress);
      
      await db.notes.clear();
      await db.notes.bulkAdd(backendData.notes);
    } catch (error) {
      console.error('Error syncing with backend:', error);
      throw error;
    }
  }

  async submitQuizAnswer(quizId: string, answers: Record<string, number>, studentId: string = 'student-mobile'): Promise<void> {
    try {
      const quiz = await db.quizzes.get(quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      const questions = (quiz.data?.questions || []) as Array<{ id: string; answer: number }>;
      let score = 0;
      
      for (const question of questions) {
        const selectedAnswer = answers[question.id];
        if (typeof selectedAnswer === 'number' && selectedAnswer === question.answer) {
          score += 1;
        }
      }

      const attempt = { at: new Date().toISOString(), answers };
      const progress: Progress = {
        id: `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        studentId,
        quizId,
        score,
        attempts: [attempt],
        updatedAt: new Date().toISOString()
      };

      await db.progress.put(progress);
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      throw error;
    }
  }

  async startVideoSession(lessonId: string, studentId: string = 'student-mobile', device: string = 'mobile'): Promise<{ id: string } | null> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/video-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, studentId, device })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('startVideoSession error', e);
      return null;
    }
  }

  async stopVideoSession(sessionId: string, durationSeconds?: number): Promise<void> {
    try {
      await fetch(`${BACKEND_BASE_URL}/video-sessions/${sessionId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSeconds })
      });
    } catch (e) {
      console.error('stopVideoSession error', e);
    }
  }
}
