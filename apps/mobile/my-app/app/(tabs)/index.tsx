import { Image } from 'expo-image';
import { Platform, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db, Lesson, Quiz, Progress, Note } from '@/src/db/dexie';
import { SyncService } from '@/src/services/syncService';

export default function HomeScreen() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [syncing, setSyncing] = useState(false);
  const syncService = new SyncService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLessons(await db.lessons.toArray());
      setQuizzes(await db.quizzes.toArray());
      setProgress(await db.progress.toArray());
      setNotes(await db.notes.toArray());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncService.syncWithBackend();
      await loadData();
      Alert.alert('Success', 'Data synced successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data. Please try again.');
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchFromBackend = async () => {
    setSyncing(true);
    try {
      const backendData = await syncService.fetchFromBackend();
      
      await db.lessons.clear();
      await db.lessons.bulkAdd(backendData.lessons);
      
      await db.quizzes.clear();
      await db.quizzes.bulkAdd(backendData.quizzes);
      
      await db.progress.clear();
      await db.progress.bulkAdd(backendData.progress);
      
      await db.notes.clear();
      await db.notes.bulkAdd(backendData.notes);
      
      await loadData();
      Alert.alert('Success', 'Data fetched from backend successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data from backend.');
      console.error('Fetch error:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Student Dashboard</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Sync Data</ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={handleSync}
            disabled={syncing}
          >
            <ThemedText style={styles.buttonText}>
              {syncing ? 'Syncing...' : 'Sync Now'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleFetchFromBackend}
            disabled={syncing}
          >
            <ThemedText style={styles.buttonText}>Fetch from Backend</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Quick Stats</ThemedText>
        <ThemedText>Lessons: {lessons.length}</ThemedText>
        <ThemedText>Quizzes: {quizzes.length}</ThemedText>
        <ThemedText>Notes: {notes.length}</ThemedText>
        <ThemedText>Quiz Attempts: {progress.length}</ThemedText>
      </ThemedView>

      {lessons.length > 0 && (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Recent Lessons</ThemedText>
          {lessons.slice(0, 3).map((lesson) => (
            <ThemedView key={lesson.id} style={styles.lessonItem}>
              <ThemedText style={styles.lessonTitle}>{lesson.title}</ThemedText>
              <ThemedText style={styles.lessonContent} numberOfLines={2}>
                {lesson.content}
              </ThemedText>
            </ThemedView>
          ))}
          {lessons.length > 3 && (
            <ThemedText style={styles.moreText}>+{lessons.length - 3} more lessons available</ThemedText>
          )}
        </ThemedView>
      )}

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Navigation</ThemedText>
        <ThemedText>
          Use the tabs below to navigate between lessons, quizzes, and notes.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  lessonItem: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  lessonTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  lessonContent: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 18,
  },
  moreText: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
