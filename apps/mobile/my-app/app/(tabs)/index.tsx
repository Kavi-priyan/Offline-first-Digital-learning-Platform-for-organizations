import { Image } from 'expo-image';
import { Platform, StyleSheet, ScrollView, TouchableOpacity, Alert, View ,Text} from 'react-native';
import { useEffect, useState } from 'react';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db, Lesson, Quiz, Progress, Note } from '@/src/db/dexie';
import { SyncService } from '@/src/services/syncService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [syncing, setSyncing] = useState(false);
  const syncService = new SyncService();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

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

  const totalAttempts = progress.length;
  const avgScore = progress.length
    ? (
        progress.reduce((acc, p) => acc + Number(p.score || 0), 0) / progress.length
      ).toFixed(1)
    : '0.0';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <View style={[styles.gradientHeader, { backgroundColor: theme.primary }]}>
          <Image
            source={require('@/assets/images/0l0w.jpg')}
            style={styles.reactLogo}
          />
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Continue Learning</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.cardRow}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ThemedText type="subtitle">Your Progress</ThemedText>
          <ThemedText style={{ color: theme.icon, marginTop: 4 }}>Avg Score</ThemedText>
          <ThemedText style={styles.kpiText}>{avgScore}</ThemedText>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, Number(avgScore) * 10)}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ThemedText type="subtitle">Streak</ThemedText>
          <ThemedText style={{ color: theme.icon, marginTop: 4 }}>Days Active</ThemedText>
          <ThemedText style={styles.kpiText}>3 🔥</ThemedText>
          <ThemedText style={{ color: theme.icon, fontSize: 12 }}>Keep it going!</ThemedText>
        </View>
      </ThemedView>

      {lessons.length > 0 && (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Recommended Lessons</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {lessons.slice(0, 10).map((lesson) => (
              <View key={lesson.id} style={[styles.lessonCard, { backgroundColor: theme.card }]}>
                <View style={[styles.lessonThumb, { backgroundColor: theme.primary }]} />
                <ThemedText style={styles.lessonTitle}>{lesson.title}</ThemedText>
                <ThemedText style={styles.lessonContent} numberOfLines={2}>
                  {lesson.content}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
        </ThemedView>
      )}

      <ThemedView style={styles.cardRow}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ThemedText type="subtitle">XP</ThemedText>
          <ThemedText style={{ color: theme.icon, marginTop: 4 }}>Current</ThemedText>
          <ThemedText style={styles.kpiText}>1200 ✨</ThemedText>
          <ThemedText style={{ color: theme.icon, fontSize: 12 }}>Earn XP from quizzes</ThemedText>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ThemedText type="subtitle">Badges</ThemedText>
          <ThemedText style={{ color: theme.icon, marginTop: 4 }}>Unlocked</ThemedText>
          <ThemedText style={styles.kpiText}>3 🏅</ThemedText>
          <ThemedText style={{ color: theme.icon, fontSize: 12 }}>More coming soon</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>
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

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => Alert.alert('Quick Note', 'Open note composer')}
        style={[styles.fab, { backgroundColor: theme.accent }]}
      >
        <ThemedText style={styles.fabText}>＋</ThemedText>
      </TouchableOpacity>
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
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  kpiText: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 6,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#1f2937',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
  lessonCard: {
    width: 220,
    borderRadius: 12,
    padding: 12,
  },
  lessonThumb: {
    height: 96,
    borderRadius: 10,
    marginBottom: 8,
  },
  lessonTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  lessonContent: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  moreText: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  gradientHeader: {
    height: 178,
    width: '100%',
    bottom: 0,
    left: 0,
    position: 'absolute',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  reactLogo: {
    height: 178,
    width:'auto',
    bottom: 0,
    left: 0,
    position: 'relative',
    opacity: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: {
    color: 'white',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '800',
  },
});
