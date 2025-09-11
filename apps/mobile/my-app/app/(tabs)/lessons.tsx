import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db, Lesson } from '@/src/db/dexie';
import { SyncService } from '@/src/services/syncService';

export default function LessonsScreen() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [activeVideoSessionId, setActiveVideoSessionId] = useState<string | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const videoRef = useRef<Video | null>(null);
  const syncService = new SyncService();

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      setLessons(await db.lessons.toArray());
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncService.syncWithBackend();
      await loadLessons();
      Alert.alert('Success', 'Lessons synced successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync lessons. Please try again.');
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
      
      await loadLessons();
      Alert.alert('Success', 'Lessons fetched from backend successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch lessons from backend.');
      console.error('Fetch error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleStartSession = async (lesson: Lesson) => {
    const res = await syncService.startVideoSession(lesson.id);
    if (res?.id) {
      setActiveVideoSessionId(res.id);
      sessionStartTimeRef.current = Date.now();
    }
  };

  const handleStopSession = async () => {
    if (activeVideoSessionId) {
      const startedAtMs = sessionStartTimeRef.current || Date.now();
      const durationSeconds = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));
      await syncService.stopVideoSession(activeVideoSessionId, durationSeconds);
    }
    setActiveVideoSessionId(null);
    sessionStartTimeRef.current = null;
  };

  // Keep selectedLesson fresh if lessons update (e.g., videoUrl changed after sync)
  useEffect(() => {
    if (!selectedLesson) return;
    const updated = lessons.find(l => l.id === selectedLesson.id);
    if (updated && (updated.videoUrl !== selectedLesson.videoUrl || updated.updatedAt !== selectedLesson.updatedAt)) {
      setSelectedLesson(updated);
    }
  }, [lessons, selectedLesson?.id]);

  // Reload video when URL changes
  useEffect(() => {
    if (!selectedLesson?.videoUrl) return;
    const reload = async () => {
      try {
        if (videoRef.current) {
          const uri = selectedLesson.videoUrl as string;
          await videoRef.current.loadAsync({ uri }, {}, true);
        }
      } catch (e) {
        // noop
      }
    };
    reload();
  }, [selectedLesson?.videoUrl]);

  const getSubjectColor = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('math') || lowerTitle.includes('addition') || lowerTitle.includes('multiplication') || lowerTitle.includes('algebra') || lowerTitle.includes('fraction')) {
      return '#3b82f6'; // Blue for Math
    } else if (lowerTitle.includes('science') || lowerTitle.includes('photosynthesis') || lowerTitle.includes('solar') || lowerTitle.includes('plant')) {
      return '#10b981'; // Green for Science
    } else if (lowerTitle.includes('english') || lowerTitle.includes('writing') || lowerTitle.includes('speech') || lowerTitle.includes('creative')) {
      return '#f59e0b'; // Orange for English
    } else {
      return '#6b7280'; // Gray for others
    }
  };

  if (selectedLesson) {
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">{selectedLesson.title}</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedLesson(null)}>
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.lessonContent}>
          <ThemedText style={styles.contentText}>{selectedLesson.content}</ThemedText>
          
          {selectedLesson.videoUrl && (
            <>
              {!activeVideoSessionId ? (
                <TouchableOpacity 
                  style={styles.videoButton} 
                  onPress={() => handleStartSession(selectedLesson)}
                >
                  <ThemedText style={styles.videoButtonText}>Watch Video</ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.videoStopButton} 
                  onPress={handleStopSession}
                >
                  <ThemedText style={styles.videoButtonText}>Stop Session</ThemedText>
                </TouchableOpacity>
              )}
              {activeVideoSessionId && (
                <ThemedView style={{ borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
                  <Video
                    ref={(r) => { videoRef.current = r as any; }}
                    source={{ uri: selectedLesson.videoUrl! }}
                    key={selectedLesson.videoUrl || 'video'}
                    style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    onError={() => Alert.alert('Error', 'Failed to load video')}
                    onPlaybackStatusUpdate={(status) => {
                      if ('didJustFinish' in status && status.didJustFinish) {
                        handleStopSession();
                      }
                    }}
                  />
                </ThemedView>
              )}
            </>
          )}
          
          <ThemedView style={styles.lessonInfo}>
            <ThemedText style={styles.infoText}>
              Last Updated: {new Date(selectedLesson.updatedAt).toLocaleDateString()}
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Version: {selectedLesson.version}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Available Lessons</ThemedText>
        <ThemedView style={styles.syncButtons}>
          <TouchableOpacity style={styles.syncButton} onPress={handleFetchFromBackend} disabled={syncing}>
            <ThemedText style={styles.syncButtonText}>Fetch</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.syncButton} onPress={handleSync} disabled={syncing}>
            <ThemedText style={styles.syncButtonText}>{syncing ? 'Syncing...' : 'Sync'}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {lessons.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>No lessons available. Sync with backend to load lessons.</ThemedText>
        </ThemedView>
      ) : (
        lessons.map((lesson) => (
          <TouchableOpacity 
            key={lesson.id} 
            style={[styles.lessonCard, { borderLeftColor: getSubjectColor(lesson.title) }]}
            onPress={() => setSelectedLesson(lesson)}
          >
            <ThemedView style={styles.lessonHeader}>
              <ThemedText type="subtitle" style={styles.lessonTitle}>{lesson.title}</ThemedText>
              <ThemedView style={[styles.subjectBadge, { backgroundColor: getSubjectColor(lesson.title) }]}>
                <ThemedText style={styles.subjectBadgeText}>
                  {lesson.title.toLowerCase().includes('math') || lesson.title.toLowerCase().includes('addition') || lesson.title.toLowerCase().includes('multiplication') || lesson.title.toLowerCase().includes('algebra') || lesson.title.toLowerCase().includes('fraction') ? 'Math' :
                   lesson.title.toLowerCase().includes('science') || lesson.title.toLowerCase().includes('photosynthesis') || lesson.title.toLowerCase().includes('solar') || lesson.title.toLowerCase().includes('plant') ? 'Science' :
                   lesson.title.toLowerCase().includes('english') || lesson.title.toLowerCase().includes('writing') || lesson.title.toLowerCase().includes('speech') || lesson.title.toLowerCase().includes('creative') ? 'English' : 'Other'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            
            <ThemedText style={styles.lessonPreview} numberOfLines={2}>
              {lesson.content}
            </ThemedText>
            
            <ThemedView style={styles.lessonFooter}>
              <ThemedText style={styles.lessonDate}>
                {new Date(lesson.updatedAt).toLocaleDateString()}
              </ThemedText>
              {lesson.videoUrl && (
                <ThemedText style={styles.videoIndicator}>📹 Video Available</ThemedText>
              )}
            </ThemedView>
          </TouchableOpacity>
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
  syncButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  backButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  lessonCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6b7280',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lessonTitle: {
    flex: 1,
    marginRight: 8,
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  lessonPreview: {
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  videoIndicator: {
    fontSize: 12,
    color: '#3b82f6',
  },
  lessonContent: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  contentText: {
    lineHeight: 24,
    marginBottom: 16,
  },
  videoButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  videoStopButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  videoButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  lessonInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});
