import Dexie, { Table } from 'dexie';

export interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  version: number;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  data: any;
  version: number;
  updatedAt: string;
}

export interface Progress {
  id: string;
  studentId: string;
  quizId: string;
  score: number;
  attempts: any[];
  updatedAt: string;
}

export interface Note {
  id: string;
  lessonId: string;
  text: string;
  updatedAt: string;
}

class AppDB extends Dexie {
  lessons!: Table<Lesson, string>;
  quizzes!: Table<Quiz, string>;
  progress!: Table<Progress, string>;
  notes!: Table<Note, string>;

  constructor() {
    super('nabha_mobile');
    this.version(1).stores({
      lessons: 'id, updatedAt',
      quizzes: 'id, lessonId, updatedAt',
      progress: 'id, studentId, quizId, updatedAt',
      notes: 'id, lessonId, updatedAt'
    });
  }
}

export const db = new AppDB();
