import React, { useEffect, useState } from 'react';
import { db } from './db/dexie';

const colors = {
  bg: '#0f172a',
  panel: '#111827',
  panelAlt: '#0b1220',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  border: '#1f2937',
  success: '#10b981',
  danger: '#ef4444'
};

const container: React.CSSProperties = {
  minHeight: '100vh',
  background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.panelAlt} 100%)`,
  color: colors.text
};

const shell: React.CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  padding: 24,
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16
};

const title: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: 0.2
};

const nav: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };

const buttonBase: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: '#0b1220',
  color: colors.text,
  cursor: 'pointer'
};

const primaryButton: React.CSSProperties = {
  ...buttonBase,
  background: colors.primary,
  borderColor: colors.primary,
  color: 'white'
};

const section: React.CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: 16,
  marginTop: 16
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: colors.text
};

const list: React.CSSProperties = { marginTop: 8, lineHeight: 1.6, color: colors.textMuted };

const tableWrap: React.CSSProperties = { marginTop: 12, overflowX: 'auto' };

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontSize: 14
};

const thtd: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: `1px solid ${colors.border}`,
  padding: '10px 8px'
};

type Lesson = {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  version: number;
  updatedAt: string;
};

type Quiz = {
  id: string;
  lessonId: string;
  data: any;
  version: number;
  updatedAt: string;
};

type Progress = {
  id: string;
  studentId: string;
  quizId: string;
  score: number;
  attempts: any[];
  updatedAt: string;
};

type Note = {
  id: string;
  lessonId: string;
  text: string;
  updatedAt: string;
};

export default function App() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState<'home' | 'dashboard'>('home');
  const [report, setReport] = useState<any[]>([]);
  const [quizBuilder, setQuizBuilder] = useState<{ lessonId?: string; question?: string; options?: string; answerIndex?: number }>({});
  const [noteDraft, setNoteDraft] = useState<{ lessonId?: string; text?: string }>({});
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [takeQuizAnswers, setTakeQuizAnswers] = useState<Record<string, number>>({});
  const backendBaseUrl = 'http://localhost:4000';

  useEffect(() => {
    (async () => {
      // Load from local database first
      setLessons(await db.lessons.toArray() as Lesson[]);
      setQuizzes(await db.quizzes.toArray() as Quiz[]);
      setProgress(await db.progress.toArray() as Progress[]);
      // @ts-ignore - notes table exists in v2
      setNotes(await (db as any).notes.toArray() as Note[]);
      
      // Then try to fetch latest data from backend
      try {
        const res = await fetch(`${backendBaseUrl}/sync`);
        if (res.ok) {
          const backendData = await res.json();
          
          // Update local database with backend data
          await db.lessons.clear();
          await db.lessons.bulkAdd(backendData.lessons);
          
          await db.quizzes.clear();
          await db.quizzes.bulkAdd(backendData.quizzes);
          
          await db.progress.clear();
          await db.progress.bulkAdd(backendData.progress);
          
          // @ts-ignore
          await (db as any).notes.clear();
          // @ts-ignore
          await (db as any).notes.bulkAdd(backendData.notes);

          // Update UI state with fresh data
          setLessons(backendData.lessons);
          setQuizzes(backendData.quizzes);
          setProgress(backendData.progress);
          setNotes(backendData.notes);
        }
      } catch (e) {
        console.log('Could not fetch from backend on startup, using local data');
      }
    })();
  }, []);

  async function addSampleLesson() {
    const l: Lesson = {
      id: crypto.randomUUID(),
      title: 'Fractions Lesson',
      content: 'Intro to Fractions',
      version: 1,
      updatedAt: new Date().toISOString()
    };
    await db.lessons.put(l);
    setLessons(await db.lessons.toArray() as Lesson[]);
  }

  async function addCustomQuiz() {
    const lessonId = quizBuilder.lessonId || lessons[0]?.id;
    if (!lessonId) return alert('Create a lesson first');
    const question = (quizBuilder.question || '').trim();
    const options = (quizBuilder.options || '').split('|').map(s => s.trim()).filter(Boolean);
    const answerIndex = Number.isFinite(quizBuilder.answerIndex as number) ? (quizBuilder.answerIndex as number) : 0;
    if (!question || options.length < 2) return alert('Enter a question and at least 2 options (separated by |)');
    const q: Quiz = {
      id: crypto.randomUUID(),
      lessonId,
      data: { questions: [{ id: 'q1', text: question, options, answer: answerIndex }] },
      version: 1,
      updatedAt: new Date().toISOString()
    };
    await db.quizzes.put(q);
    setQuizzes(await db.quizzes.toArray() as Quiz[]);
    setQuizBuilder({});
  }

  async function submitAttemptForActiveQuiz() {
    if (!activeQuizId) return;
    const q = quizzes.find(qz => qz.id === activeQuizId);
    if (!q) return;
    const questions = (q.data?.questions || []) as Array<{ id: string; answer: number }>;
    let score = 0;
    const answers: Record<string, number> = {};
    for (const ques of questions) {
      const sel = takeQuizAnswers[ques.id];
      answers[ques.id] = sel;
      if (typeof sel === 'number' && sel === ques.answer) score += 1;
    }
    const attempt = { at: new Date().toISOString(), answers };
    const p: Progress = {
      id: crypto.randomUUID(),
      studentId: 'student-001',
      quizId: q.id,
      score,
      attempts: [attempt],
      updatedAt: new Date().toISOString()
    };
    await db.progress.put(p);
    setProgress(await db.progress.toArray() as Progress[]);
    setActiveQuizId(null);
    setTakeQuizAnswers({});
    alert(`Submitted. Score: ${score}/${questions.length}`);
  }

  async function addNote() {
    const lessonId = noteDraft.lessonId || lessons[0]?.id;
    const text = (noteDraft.text || '').trim();
    if (!lessonId || !text) return alert('Select a lesson and enter note text');
    const n: Note = { id: crypto.randomUUID(), lessonId, text, updatedAt: new Date().toISOString() };
    // @ts-ignore
    await (db as any).notes.put(n);
    // @ts-ignore
    setNotes(await (db as any).notes.toArray() as Note[]);
    setNoteDraft({});
  }

  async function fetchFromBackend() {
    setSyncing(true);
    try {
      const res = await fetch(`${backendBaseUrl}/sync`);
      if (!res.ok) {
        const text = await res.text();
        console.error('Fetch failed', res.status, text);
        alert(`Fetch failed: ${res.status} ${text}`);
        return;
      }

      const backendData = await res.json();
      
      // Update local database with backend data
      await db.lessons.clear();
      await db.lessons.bulkAdd(backendData.lessons);
      
      await db.quizzes.clear();
      await db.quizzes.bulkAdd(backendData.quizzes);
      
      await db.progress.clear();
      await db.progress.bulkAdd(backendData.progress);
      
      // @ts-ignore
      await (db as any).notes.clear();
      // @ts-ignore
      await (db as any).notes.bulkAdd(backendData.notes);

      // Update UI state
      setLessons(backendData.lessons);
      setQuizzes(backendData.quizzes);
      setProgress(backendData.progress);
      setNotes(backendData.notes);

      alert('Successfully fetched latest data from backend!');
    } catch (e: any) {
      console.error('Fetch error', e);
      alert(`Fetch error: ${e?.message ?? 'unknown'}`);
    } finally {
      setSyncing(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    try {
      // Step 1: Push local data to backend
      const toSyncLessons = await db.lessons.toArray();
      const toSyncQuizzes = await db.quizzes.toArray();
      const toSyncProgress = await db.progress.toArray();
      // @ts-ignore
      const toSyncNotes = await (db as any).notes.toArray();
      
      console.log('Syncing progress data:', toSyncProgress);
      
      const pushRes = await fetch(`${backendBaseUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: toSyncLessons, quizzes: toSyncQuizzes, progress: toSyncProgress, notes: toSyncNotes })
      });
      
      if (!pushRes.ok) {
        const text = await pushRes.text();
        console.error('Push sync failed', pushRes.status, text);
        alert(`Push sync failed: ${pushRes.status} ${text}`);
        return;
      }

      // Step 2: Fetch updated data from backend
      const fetchRes = await fetch(`${backendBaseUrl}/sync`);
      if (!fetchRes.ok) {
        const text = await fetchRes.text();
        console.error('Fetch sync failed', fetchRes.status, text);
        alert(`Fetch sync failed: ${fetchRes.status} ${text}`);
        return;
      }

      const backendData = await fetchRes.json();
      
      // Step 3: Update local database with backend data
      await db.lessons.clear();
      await db.lessons.bulkAdd(backendData.lessons);
      
      await db.quizzes.clear();
      await db.quizzes.bulkAdd(backendData.quizzes);
      
      await db.progress.clear();
      await db.progress.bulkAdd(backendData.progress);
      
      // @ts-ignore
      await (db as any).notes.clear();
      // @ts-ignore
      await (db as any).notes.bulkAdd(backendData.notes);

      // Step 4: Update UI state
      setLessons(backendData.lessons);
      setQuizzes(backendData.quizzes);
      setProgress(backendData.progress);
      setNotes(backendData.notes);

      alert('Successfully synced with backend - data updated!');
    } catch (e: any) {
      console.error('Sync error', e);
      alert(`Sync error: ${e?.message ?? 'unknown'}`);
    } finally {
      setSyncing(false);
    }
  }

  async function loadReport() {
    const res = await fetch(`${backendBaseUrl}/progress/report`);
    const data = await res.json();
    setReport(data);
  }

  const avgScore = report.length ? (report.reduce((a, r) => a + Number(r.max_score || 0), 0) / report.length).toFixed(2) : '0.00';
  const totalAttempts = report.reduce((a, r) => a + Number(r.attempts_count || 0), 0);

  const activeQuiz = activeQuizId ? quizzes.find(q => q.id === activeQuizId) : null;
  const activeQuestions: Array<{ id: string; text: string; options: string[]; answer: number }>
    = (activeQuiz?.data?.questions || []) as any;

  return (
    <div style={container}>
      <div style={shell}>
        <header style={header}>
          <div style={title}>Nabha Learning</div>
          <div style={nav}>
            <button style={buttonBase} onClick={() => setView('home')}>Home</button>
            <button style={primaryButton} onClick={async () => { setView('dashboard'); await loadReport(); }}>Teacher Dashboard</button>
          </div>
        </header>

        {view === 'home' && (
          <>
            <div style={{ ...section, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={buttonBase} onClick={addSampleLesson}>Add Lesson (Offline)</button>
              <button style={buttonBase} onClick={fetchFromBackend} disabled={syncing}>Fetch from Backend</button>
              <button style={primaryButton} onClick={syncNow} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync Now'}</button>
            </div>

            <div style={section}>
              <div style={sectionTitle}>Custom Quiz Builder</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <select style={{ padding: 8, borderRadius: 8, background: colors.panelAlt, color: colors.text, border: `1px solid ${colors.border}` }}
                  value={quizBuilder.lessonId || ''}
                  onChange={e => setQuizBuilder({ ...quizBuilder, lessonId: e.target.value })}
                >
                  <option value="">Select Lesson</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
                <input style={{ padding: 8, borderRadius: 8, background: colors.panelAlt, color: colors.text, border: `1px solid ${colors.border}` }}
                  placeholder="Question"
                  value={quizBuilder.question || ''}
                  onChange={e => setQuizBuilder({ ...quizBuilder, question: e.target.value })}
                />
                <input style={{ padding: 8, borderRadius: 8, background: colors.panelAlt, color: colors.text, border: `1px solid ${colors.border}`, gridColumn: 'span 2' }}
                  placeholder="Options (separate with |)"
                  value={quizBuilder.options || ''}
                  onChange={e => setQuizBuilder({ ...quizBuilder, options: e.target.value })}
                />
                <input style={{ padding: 8, borderRadius: 8, background: colors.panelAlt, color: colors.text, border: `1px solid ${colors.border}` }}
                  type="number"
                  placeholder="Answer index (0-based)"
                  value={quizBuilder.answerIndex ?? ''}
                  onChange={e => setQuizBuilder({ ...quizBuilder, answerIndex: Number(e.target.value) })}
                />
                <button style={buttonBase} onClick={addCustomQuiz}>Save Quiz (Offline)</button>
              </div>
            </div>

            <div style={section}>
              <div style={sectionTitle}>Lesson Notes</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 8 }}>
                <select style={{ padding: 8, borderRadius: 8, background: colors.panelAlt, color: colors.text, border: `1px solid ${colors.border}` }}
                  value={noteDraft.lessonId || ''}
                  onChange={e => setNoteDraft({ ...noteDraft, lessonId: e.target.value })}
                >
                  <option value="">Select Lesson</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
                <textarea style={{ padding: 8, borderRadius: 8, background: colors.panelAlt, color: colors.text, border: `1px solid ${colors.border}`, minHeight: 100 }}
                  placeholder="Type notes here..."
                  value={noteDraft.text || ''}
                  onChange={e => setNoteDraft({ ...noteDraft, text: e.target.value })}
                />
                <button style={buttonBase} onClick={addNote}>Save Note (Offline)</button>
              </div>

              <ul style={list}>
                {notes.map(n => (
                  <li key={n.id}>[{new Date(n.updatedAt).toLocaleString()}] {n.text.slice(0, 80)}</li>
                ))}
              </ul>
            </div>

            <div style={section}>
              <div style={sectionTitle}>Quizzes</div>
              <ul style={list}>
                {quizzes.map(q => (
                  <li key={q.id}>
                    Quiz for lesson {q.lessonId} · {new Date(q.updatedAt).toLocaleString()}
                    <button style={{ ...buttonBase, marginLeft: 8 }} onClick={() => setActiveQuizId(q.id)}>Open</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quiz Viewer Panel */}
            {activeQuiz && (
              <div style={{ ...section, borderColor: colors.primary }}>
                <div style={{ ...sectionTitle, marginBottom: 8 }}>Quiz Viewer</div>
                {activeQuestions.length === 0 && (
                  <div style={{ color: colors.textMuted }}>No questions in this quiz.</div>
                )}
                <div style={{ display: 'grid', gap: 12 }}>
                  {activeQuestions.map((q) => (
                    <div key={q.id}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{q.text}</div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {q.options.map((opt, idx) => (
                          <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="radio"
                              name={q.id}
                              checked={takeQuizAnswers[q.id] === idx}
                              onChange={() => setTakeQuizAnswers(prev => ({ ...prev, [q.id]: idx }))}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={buttonBase} onClick={() => { setActiveQuizId(null); setTakeQuizAnswers({}); }}>Close</button>
                  <button style={primaryButton} onClick={submitAttemptForActiveQuiz}>Submit Attempt</button>
                </div>
              </div>
            )}

            <div style={section}>
              <div style={sectionTitle}>Progress</div>
              <ul style={list}>
                {progress.map(p => (
                  <li key={p.id}>{p.studentId} · quiz {p.quizId} · score {p.score} · attempts {p.attempts.length}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        {view === 'dashboard' && (
          <div style={section}>
            <div style={{ ...sectionTitle, marginBottom: 8 }}>Teacher Dashboard</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: colors.textMuted, fontSize: 12 }}>Average Score</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{avgScore}</div>
              </div>
              <div style={{ background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: colors.textMuted, fontSize: 12 }}>Total Attempts</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{totalAttempts}</div>
              </div>
            </div>

            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thtd}>Student</th>
                    <th style={thtd}>Quiz</th>
                    <th style={thtd}>Attempts</th>
                    <th style={thtd}>Max Score</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((r, i) => (
                    <tr key={i}>
                      <td style={thtd}>{r.studentId}</td>
                      <td style={thtd}>{r.quizId}</td>
                      <td style={thtd}>{r.attempts_count}</td>
                      <td style={thtd}>{r.max_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
