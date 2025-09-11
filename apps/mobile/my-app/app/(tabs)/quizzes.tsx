import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db, Quiz, Lesson } from '@/src/db/dexie';
import { SyncService } from '@/src/services/syncService';

export default function QuizzesScreen() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const syncService = new SyncService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setQuizzes(await db.quizzes.toArray());
      setLessons(await db.lessons.toArray());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getLessonTitle = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson?.title || 'on';
  };

  const getQuestions = (quiz: Quiz) => {
    return (quiz.data?.questions || []) as Array<{ id: string; text: string; options: string[]; answer: number }>;
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setAnswers({});
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;
    
    setSubmitting(true);
    try {
      await syncService.submitQuizAnswer(selectedQuiz.id, answers);
      Alert.alert('Success', 'Quiz submitted successfully!');
      setSelectedQuiz(null);
      setAnswers({});
      await loadData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelQuiz = () => {
    setSelectedQuiz(null);
    setAnswers({});
  };

  if (selectedQuiz) {
    const questions = getQuestions(selectedQuiz);
    
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Quiz: {getLessonTitle(selectedQuiz.lessonId)}</ThemedText>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelQuiz}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {questions.map((question, questionIndex) => (
          <ThemedView key={question.id} style={styles.questionContainer}>
            <ThemedText type="subtitle" style={styles.questionText}>
              {questionIndex + 1}. {question.text}
            </ThemedText>
            
            {question.options.map((option, optionIndex) => (
              <TouchableOpacity
                key={optionIndex}
                style={[
                  styles.optionButton,
                  answers[question.id] === optionIndex && styles.selectedOption
                ]}
                onPress={() => handleAnswerSelect(question.id, optionIndex)}
              >
                <ThemedText style={[
                  styles.optionText,
                  answers[question.id] === optionIndex && styles.selectedOptionText
                ]}>
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        ))}

        <ThemedView style={styles.submitContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.disabledButton]} 
            onPress={handleSubmitQuiz}
            disabled={submitting}
          >
            <ThemedText style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Available Quizzes</ThemedText>
      </ThemedView>

      {quizzes.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>No quizzes available. Sync with backend to load quizzes.</ThemedText>
        </ThemedView>
      ) : (
        quizzes.map((quiz) => (
          <ThemedView key={quiz.id} style={styles.quizCard}>
            <ThemedText type="subtitle">{getLessonTitle(quiz.lessonId)}</ThemedText>
            <ThemedText style={styles.quizInfo}>
              Questions: {getQuestions(quiz).length}
            </ThemedText>
            <ThemedText style={styles.quizInfo}>
              Updated: {new Date(quiz.updatedAt).toLocaleDateString()}
            </ThemedText>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => handleStartQuiz(quiz)}
            >
              <ThemedText style={styles.startButtonText}>Start Quiz</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  quizCard: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  quizInfo: {
    color: '#6b7280',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  questionContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  questionText: {
    marginBottom: 12,
  },
  optionButton: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  optionText: {
    color: '#374151',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  submitContainer: {
    padding: 16,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
